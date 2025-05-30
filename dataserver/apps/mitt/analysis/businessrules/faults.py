"""
Business rules for fault analysis and triggering.

Author: Thadeus Burgess
Converted to HDF5 by [Your Name]

Copyright (c) 2011-2025 Solar Power Technologies Inc.
"""

from mitt.analysis.businessrules.util import *
from apps import db
from apps.alerts.models.alerts import Alert, create_or_update_alert
from apps.alerts.models.faults import *
from apps.issue.models import *
from apps.issue.report_util import *
from apps.sitedata.access_utils import *
from mitt.cubesets import CubeBase


class GenericOffline(CubeBase):
    """
    Base class for handling offline faults for different device types.
    """
    devtype = ""
    alert_label = ""



    def process(self, dt, day, mgr, ctx, params, verbose=False):
        """
        Process fault alerts and resolve previous open alerts.
        """
        if verbose:
            self.logger.info(f"Processing {self.alert_label} faults")

        # Find open alerts linked with a fault change
        open_alerts = (
            db.session.query(Alert)
            .filter_by(sitedata_id=ctx["sitedata_id"])
            .filter(Alert.resolved == False, Alert.fault_change_id != None)
            .all()
        )

        # Resolve previously open alerts if conditions match
        for alert in open_alerts:
            fault_change = alert.fault_change
            fault = fault_change.fault

            if (
                fault.category == OPEN_CIRCUIT
                and fault.status_code in [FAULT_STATUS_CLOSED, FAULT_STATUS_UNWATCH]
                and graphkey_devtype(fault.graph_key) == self.devtype
            ):
                alert.resolve(resolved_at=dt)


        # Handle new faults that were detected
        for fdc in ctx["opened_faults"]:
            if fdc["category"] == OPEN_CIRCUIT and graphkey_devtype(fdc["graph_key"]) == self.devtype:
                # Create alert
                fault_change_id = fdc["fault_change_id"]
                label = self.alert_label
                is_alert = params.get("IssueAlert") == "true"
                title = params.get("AlertTitle") if is_alert else params.get("WarningTitle")

                extra_data = {
                    "graph_key": fdc["graph_key"],
                    "device_label": graphkey_device_hierarchy_label(fdc["graph_key"]),
                    "description": [f"{graphkey_device_hierarchy_label(fdc['graph_key'])} is Offline."],
                    "starttime": str(fdc["starttime"]),
                    "endtime": str(fdc["endtime"]),
                    "KWhours": str(round(fdc["energy_loss"] / 1000.0, 2)),
                    "fault_data": fdc["extra_data"],
                }

                try:
                    title = title % extra_data
                except KeyError:
                    pass  # Keep original title if formatting fails

                alert = create_or_update_alert(
                    label,
                    title,
                    ctx["sitedata_id"],
                    org=params.get("org"),
                    is_alert=is_alert,
                    created_at=dt,
                    fault_change_id=fault_change_id,
                    extra_data=extra_data,
                )

        db.session.commit()
        return True


class OfflineInverterRedisRule(GenericOffline):
    devtype = "I"
    alert_label = "inverter_offline"


class OfflineStringRedisRule(GenericOffline):
    devtype = "S"
    alert_label = "string_offline"
