"""
Contains the business rules analysis and triggering

Author: Rock Howard

Converted for HDF5 by: Your Assistant
"""

import datetime
import json

from mitt.analysis.businessrules.util import *
from apps.alerts.models.alerts import *
from apps.issue.models import *
from apps.issue.report_util import *
from apps.sitedata.models import SiteDailySummary, SiteData
from apps.sitedata.models import array_perf_baseline_chart
from dataserver.apps.util.hdf5 import HDF5Manager
from mitt.cubesets import CubeBase

defaultAlertTitle = "Cleaning Recommended."
defaultWarningTitle = "Cleaning may be required soon."
defaultAlertMsg = "Soiling at %(soiling)s%%."
defaultWarningMsg = "Soiling at %(soiling)s%%."


def setCleaningMessages(ctx, params, org):
    """
    Set the cleaning messages in the context.
    """
    ctx["wb"][org]["AlertTitle"] = params.get("AlertTitle", defaultAlertTitle)
    ctx["wb"][org]["WarningTitle"] = params.get("WarningTitle", defaultWarningTitle)
    ctx["wb"][org]["AlertMsg"] = params.get("AlertMsg", defaultAlertMsg)
    ctx["wb"][org]["WarningMsg"] = params.get("WarningMsg", defaultWarningMsg)


def setCleaningThresholds(sitedata, alert_threshold, warning_threshold):
    """
    Set the cleaning thresholds in HDF5.
    """
    h5file = f"/data/{sitedata.id}_thresholds.h5"
    h5db = HDF5Manager(h5file)
    h5db.open_we()
    h5db.write("cleaning_thresholds", {
        "alert_threshold": alert_threshold,
        "warning_threshold": warning_threshold
    })
    h5db.close()


class CleaningCostHDF5Rule(CubeBase):
    """
    Calculate cleaning cost and store in HDF5.
    """

    def process(self, dt, day, mgr, ctx, params, verbose):
        self.verbose = verbose
        self.org = params["org"]
        currency_symbol = get_currency_symbol(ctx, self.org, mgr)

        if "PerPanel" in params:
            try:
                per_panel_cost = float(params["PerPanel"].lstrip(currency_symbol))
                total_panels = float(mgr.property("panels"))
                panels_to_clean = min(total_panels, int(params.get("MinPanels", total_panels)))
                cleaning_cost = per_panel_cost * panels_to_clean
            except ValueError:
                return False

            ctx["wb"][self.org]["CleaningCost"] = cleaning_cost

        if wb_get(ctx, "CleaningCost", self.org) is None:
            return False

        return True


class CleaningBase(CubeBase):
    """
    Base class for checking thresholds and triggering alerts.
    """

    def checkThresholds(self, sitedata, dt, day, ctx, mgr):
        """
        Check soiling against thresholds and trigger alerts.
        """
        h5file = f"/data/{sitedata.id}_thresholds.h5"
        h5db = HDF5Manager(h5file)
        h5db.open_ro()
        thresholds = h5db.read("cleaning_thresholds")
        h5db.close()

        alert_threshold = float(thresholds["alert_threshold"])
        warning_threshold = float(thresholds["warning_threshold"])

        currency_symbol = get_currency_symbol(ctx, self.org, mgr)
        kwh_value = wb_get(ctx, "KWhValue", self.org, 0.10)
        daily_financial_loss = 0.0
        updated = False
        label = "Soiling"

        last_dt = datetime.date(dt.year, dt.month, dt.day)
        chart = array_perf_baseline_chart(sitename=ctx["sitename"], last_dt=last_dt, mgr=mgr)
        data = chart.flattened_data()

        if data:
            cleanliness = abs(data[-1][4])  # Ensure cleanliness is positive

            if cleanliness > 0.01:
                daily_summary = SiteDailySummary.query.filter_by(
                    sitedata_id=sitedata.id, summary_date=day
                ).first()

                adj_fac = 1.0 + (cleanliness / 100.0)
                potential_energy = daily_summary.array_energy * adj_fac
                watthr_lost = potential_energy - daily_summary.array_energy
                daily_financial_loss = (watthr_lost / 1000.0) * kwh_value

                if cleanliness >= warning_threshold:
                    is_alert = cleanliness >= alert_threshold
                    title = wb_get_title(ctx, is_alert, self.org)
                    msg_dict = {
                        "soiling": str(round(cleanliness, 1)),
                        "cleaning_threshold": str(round(alert_threshold, 1)),
                        "KWhours": str(round(watthr_lost / 1000.0, 2)),
                        "currencysymbol": currency_symbol,
                        "finunits": str(round(daily_financial_loss, 2)),
                        "description": [wb_get_message(ctx, is_alert, self.org)]
                    }
                    extra_message = wb_get(ctx, "EnergyLossMsg", self.org)
                    if extra_message:
                        msg_dict["description"].append(extra_message)

                    create_or_update_alert(
                        label, title, sitedata.id, org=self.org,
                        is_alert=is_alert, created_at=dt, extra_data=json.dumps(msg_dict)
                    )
                    updated = True

        if not updated:
            resolve_alert(label, sitedata.id, resolved_at=dt)


class CleaningPaybackHDF5Rule(CleaningBase):
    """
    Determine whether cleaning payback period is acceptable.
    """

    def process(self, dt, day, mgr, ctx, params, verbose):
        self.verbose = verbose
        self.org = params["org"]
        days = int(params.get("Days", 180))  # Default to 6 months payback period

        cost = wb_get(ctx, "CleaningCost", self.org, 100.0)
        kwh_value = wb_get(ctx, "KWhValue", self.org, 0.10)

        threshold_watts_loss = loss_threshold(cost, kwh_value, days, dt, mgr, ctx)
        sitedata = SiteData.query.get(ctx["sitedata_id"])
        area, kWp, eff = sitedata.basic_array_info(mgr=mgr)

        alert_threshold = (threshold_watts_loss / (kWp * 1000.0)) * 100.0
        warning_threshold = alert_threshold * (1.0 - get_percentage(params.get("GuardBand", "20%")))

        setCleaningThresholds(sitedata, alert_threshold, warning_threshold)
        self.checkThresholds(sitedata, dt, day, ctx, mgr)
        return True


class SoilingThresholdHDF5Rule(CleaningBase):
    """
    Set soiling thresholds and trigger alerts if exceeded.
    """

    def process(self, dt, day, mgr, ctx, params, verbose):
        self.verbose = verbose
        self.org = params["org"]

        alert_threshold = get_percentage(params.get("AlertPercentage", "15%")) * 100.0
        warning_threshold = alert_threshold * (1.0 - get_percentage(params.get("GuardBand", "20%")))

        setCleaningMessages(ctx, params, self.org)
        sitedata = SiteData.query.get(ctx["sitedata_id"])
        setCleaningThresholds(sitedata, alert_threshold, warning_threshold)

        self.checkThresholds(sitedata, dt, day, ctx, mgr)
        return True
