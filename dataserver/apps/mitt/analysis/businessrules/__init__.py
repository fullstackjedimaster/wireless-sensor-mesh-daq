import datetime
import os
from apps.sitedata.access import BusinessRulesDict
from apps.sitedata.access import GraphManager
from apps.sitedata.models import SiteBusinessRule
from dataserver.apps.util.data_file_processing import tokenize_fpath
from dataserver.apps.util.hdf5_util import HDF5Manager
from mitt.cubesets import AtEndOfDay, CubeBase, cubes_redisrules
from mitt.cubesets.build_logical_array import ArrayCube
from .energy import *
from .faults import *
from .health import *
from .soiling import *


def check_run_cycle(cycle, dt):
    """
    Determine if a rule should run today based on its run cycle.

    - `D`: Daily
    - `L`: Live analysis (ignored here)
    - `W`: Weekly (Sundays)
    - `B`: Bi-monthly (1st and 15th)
    - `M`: Monthly (1st)
    - `Q`: Quarterly (1st of Jan, Apr, Jul, Oct)
    - `Y`: Yearly (1st of Jan)
    """
    if cycle == "D":
        return True
    if cycle == "L":
        return False
    if cycle == "W":
        return dt.isoweekday() == 7
    if cycle == "B":
        return dt.day in [1, 15]
    if cycle == "M":
        return dt.day == 1
    if cycle == "Q":
        return dt.day == 1 and dt.month in [1, 4, 7, 10]
    if cycle == "Y":
        return dt.day == 1 and dt.month == 1
    print(f"Unexpected run cycle encountered: {cycle}")
    return False


class ExamineRedisBusinessRule(AtEndOfDay):
    """
    Scans Redis for scheduled business rules and processes them.
    """

    order = 2

    def process_rule(self, dt, day, mgr, ctx, verbose=True):
        if verbose:
            self.logger.info("ExamineRedisBusinessRule invoked")

        brd = BusinessRulesDict(client=mgr.rdb)
        rules = brd.as_dict()
        org_callsigns = set()
        ordered_rules = []

        for label in list(rules.keys()):
            try:
                klassname, org_callsign, numberstr, cycle = label.split("-")
                org_callsign = org_callsign.upper()
                order_number = int(numberstr)

                if klassname == "TruckRollPayback":
                    klassname = "HealthPayback"

                if check_run_cycle(cycle, day):
                    ordered_rules.append((order_number, klassname, org_callsign, label, cycle))
                    org_callsigns.add(org_callsign)

            except ValueError:
                self.logger.warning(f"Skipping malformed business rule label: {label}")
                continue

        ordered_rules.sort()

        whiteboard = {callsign: {} for callsign in org_callsigns}
        whiteboard["ALL"] = {}  # Temporary hack to unify all rules under "ALL"
        ctx["wb"] = whiteboard

        for order, klassname, org_callsign, label, cycle in ordered_rules:
            if verbose:
                self.logger.debug(f"{order}: {klassname} {org_callsign}")

            param_dict = rules.get(label, {})
            param_dict["org"] = org_callsign

            rule_classname = f"{klassname}RedisRule"

            try:
                rule_inst = cubes_redisrules[rule_classname]()
            except KeyError:
                self.logger.error(f"{rule_classname} is not a registered RedisRule class")
                continue
            except Exception:
                self.logger.error(f"{rule_classname} failed to instantiate")
                continue

            if not rule_inst.process(dt, day, mgr, ctx, param_dict, verbose=verbose):
                self.logger.error(f"{rule_classname} aborted rule processing")
                break


class LiveRedisBusinessRule(CubeBase):
    """
    Runs real-time business rule analysis.
    """

    filenames = ["arraycalc_300.h5"]
    requires = [ArrayCube]
    order = 1

    def process(self, ctx, fpath, start, stop):
        finfo = tokenize_fpath(fpath)

        dt = datetime.datetime.utcnow()
        day = datetime.date(int(finfo["year"]), int(finfo["month"]), int(finfo["day"]))

        mgr = GraphManager(ctx["site_id"])

        # Fetch business rules from SiteBusinessRule model
        busnrules = mgr.business_rules_as_dict()
        ordering = [[x] + x.split("-") for x in busnrules if x.endswith("-L")]
        ordering.sort(key=lambda x: int(x[3]))

        for rule, klassname, org_callsign, label, cycle in ordering:
            params = busnrules[rule]
            params["org"] = org_callsign

            rule_classname = f"{klassname}RedisRule"

            try:
                rule_inst = cubes_redisrules[rule_classname]()
            except KeyError:
                self.logger.error(f"{rule_classname} is not a registered RedisRule class")
                continue
            except Exception:
                self.logger.error(f"{rule_classname} failed to instantiate")
                continue

            if not rule_inst.process(dt, day, mgr, ctx, params):
                self.logger.error(f"{rule_classname} aborted rule processing")
                continue

        return stop, []
