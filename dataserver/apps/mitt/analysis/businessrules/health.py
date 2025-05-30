"""
Business rules for health analysis and triggering.

Author: Rock Howard
Converted to HDF5 by [Your Name]

Copyright (c) 2011-2025 Solar Power Technologies Inc.
"""

import json
import datetime
from mitt.analysis.businessrules.util import *
from apps import db
from apps.alerts.models.alerts import Alert, create_or_update_alert, resolve_alert
from apps.alerts.models.faults import Fault
from dataserver.apps.util.redis.access_utils import set_prop
from apps.sitedata.models import SiteDailySummary, SiteData
from dataserver.apps.util.utctime import day_duration
from mitt.cubesets import CubeBase
from mitt.analysis.faults import *

# Default messages for health alerts
DEFAULT_ALERT_TITLE = "Maintenance Recommended."
DEFAULT_WARNING_TITLE = "Maintenance may be required soon."
DEFAULT_ALERT_MSG = "Health at %(health)s%%."
DEFAULT_WARNING_MSG = "Health at %(health)s%%."


def set_health_messages(ctx, params, org):
    """
    Set health messages in the context.
    """
    ctx["wb"][org]["AlertTitle"] = params.get("AlertTitle", DEFAULT_ALERT_TITLE)
    ctx["wb"][org]["WarningTitle"] = params.get("WarningTitle", DEFAULT_WARNING_TITLE)
    ctx["wb"][org]["AlertMsg"] = params.get("AlertMsg", DEFAULT_ALERT_MSG)
    ctx["wb"][org]["WarningMsg"] = params.get("WarningMsg", DEFAULT_WARNING_MSG)


def set_health_thresholds(sitedata, alert_threshold, warning_threshold, client=None):
    """
    Set the health thresholds in Redis.
    """
    set_prop(sitedata.sa_node_id, "HealthProblemThreshold", alert_threshold, client=client)
    set_prop(sitedata.sa_node_id, "HealthWarningThreshold", warning_threshold, client=client)


class HealthFilterRedisRule(CubeBase):
    def process(self, dt, day, mgr, ctx, params, verbose=False):
        """
        Set the shade filter and such for the site.
        """
        if verbose:
            self.logger.info("In HealthFilterRedisRule")

        org = params["org"]

        if "ShadeFilter" in params:
            try:
                shade_filter = get_percentage(params["ShadeFilter"])
                ctx["wb"][org]["ShadeFilter"] = shade_filter
            except ValueError:
                self.logger.error("ShadeFilter failed %s" % params["ShadeFilter"])
                return False


class TruckRollCostRedisRule(CubeBase):
    def process(self, dt, day, mgr, ctx, params, verbose=False):
        """
        Calculate truck roll cost for health checking.
        Place the value in the whiteboard.
        """
        if verbose:
            self.logger.info("In TruckRollCostRedisRule")

        org = params["org"]
        currency_symbol = get_currency_symbol(ctx, org, mgr) or mgr.property("CurrencySymbol")
        if not currency_symbol:
            return False

        cost_value = None

        if "HourlyRate" in params:
            try:
                hourly_rate = float(params["HourlyRate"].lstrip(currency_symbol))
                min_hours = float(params.get("MinHours", 1.0))
                cost_value = hourly_rate * min_hours
            except ValueError:
                return False

        elif "DailyRate" in params:
            try:
                cost_value = float(params["DailyRate"].lstrip(currency_symbol))
            except ValueError:
                return False

        if cost_value is not None:
            ctx["wb"][org]["TruckRollCost"] = cost_value
            return True

        return False


class HealthBase(CubeBase):
    verbose = False

    def check_thresholds(self, sitedata, dt, day, ctx, mgr):
        """
        Function to check impairments against health thresholds.
        """
        sa_node = mgr.current_sitearray()
        alert_threshold = float(sa_node.property("HealthProblemThreshold"))
        warning_threshold = float(sa_node.property("HealthWarningThreshold"))

        currency_symbol = get_currency_symbol(ctx, self.org, mgr)
        kwh_value = wb_get(ctx, "KWhValue", self.org, 0.10)
        shade_filter = wb_get(ctx, "ShadeFilter", self.org, 0.50)

        daily_financial_loss = 0.0
        watthrs_lost = 0.0

        secs_today = day_duration(day, sa_node.property("latitude"), sa_node.property("longitude")).total_seconds()

        faults = db.session.query(Fault).filter_by(sitedata_id=sitedata.id, status_code=FAULT_STATUS_OPEN).all()

        for fault in faults:
            last_stch = fault.last_stch()
            if not last_stch:
                continue

            if (last_stch.duration().total_seconds() / secs_today) < shade_filter:
                continue

            this_fault_loss = last_stch.energy_loss
            if this_fault_loss > 0.0:
                watthrs_lost += this_fault_loss

        daily_financial_loss = (watthrs_lost / 1000.0) * kwh_value
        loss_string = f"{currency_symbol}{daily_financial_loss:.2f}"

        daily_summary = db.session.query(SiteDailySummary).filter_by(sitedata_id=sitedata.id, summary_date=day).first()
        if not daily_summary:
            daily_summary = SiteDailySummary(sitedata.id, day, array_energy=0.0)
            db.session.add(daily_summary)

        max_watthrs = daily_summary.array_energy + watthrs_lost
        array_health = (100.0 * (daily_summary.array_energy / max_watthrs)) if max_watthrs > 0 else 100.0

        daily_summary.array_health = array_health
        db.session.commit()

        label = "Health"

        if array_health < 100.0 - warning_threshold:
            is_alert = array_health < 100.0 - alert_threshold
            title = wb_get_title(ctx, is_alert, self.org)

            msg_dict = {
                "impairment": str(round(100.0 - array_health, 1)),
                "health_threshold": str(round(alert_threshold, 1)),
                "KWhours": str(round(watthrs_lost / 1000.0, 2)),
                "currencysymbol": currency_symbol,
                "finunits": str(round(daily_financial_loss, 2)),
                "description": [wb_get_message(ctx, is_alert, self.org)],
            }

            create_or_update_alert(
                label,
                title,
                sitedata.id,
                org=self.org,
                is_alert=is_alert,
                created_at=dt,
                extra_data=json.dumps(msg_dict),
            )
        else:
            resolve_alert(label, sitedata.id, resolved_at=dt)


class HealthPaybackRedisRule(HealthBase):
    def process(self, dt, day, mgr, ctx, params, verbose):
        """
        Sets Redis thresholds.
        """
        self.verbose = verbose
        if verbose:
            self.logger.info("In HealthPaybackRedisRule")

        sitedata_id = ctx["sitedata_id"]
        self.org = params["org"]

        days = int(params.get("Days", 180))  # Default 6 months

        set_health_messages(ctx, params, self.org)

        self.cost = wb_get(ctx, "TruckRollCost", self.org, 100.0)
        self.kwh_value = wb_get(ctx, "KWhValue", self.org, 0.10)

        threshold_watts_loss = loss_threshold(self.cost, self.kwh_value, days, dt, mgr, ctx)

        sitedata = db.session.query(SiteData).get(sitedata_id)
        area, kWp, _ = sitedata.basic_array_info(mgr=mgr)

        alert_threshold = round(threshold_watts_loss / (kWp * 1000.0) * 100.0, 1)
        warning_threshold = round(alert_threshold * (1.0 - get_percentage(params.get("GuardBand", "20%"))), 1)

        set_health_thresholds(sitedata, alert_threshold, warning_threshold, client=mgr.rdb)
        self.check_thresholds(sitedata, dt, day, ctx, mgr)

        return True
