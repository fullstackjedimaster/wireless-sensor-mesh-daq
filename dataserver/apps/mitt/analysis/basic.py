import datetime
import math
import os
import time
from collections import defaultdict
from sqlalchemy.orm import Session
from apps import db
from apps.issue.models import *
from apps.issue.report_util import *
from apps.mitt.cubesets import CubeBase
from apps.mitt.cubesets.build_logical_array import ArrayCube
from apps.sitedata.access_utils import graphkey_parent
from apps.sitedata.models import SiteDailySummary
from dataserver.apps.util.data_file_processing import fpath_as
from dataserver.apps.util.data_file_processing import tokenize_fpath
from dataserver.apps.util.hdf5_util import HDF5Manager
from dataserver.apps.util.solarstuff import as_energy
from .threshholds import *
from .watchlist import wrap_fault_funcs


class PanelPerformanceAnalysis(CubeBase):
    filenames = ['arraycalc_300.h5']
    requires = [ArrayCube]

    def process(self, ctx, fpath, start, stop, db_session: Session):
        fault_clear_for, fault_ok, fault_watch = wrap_fault_funcs(ctx)

        finfo = tokenize_fpath(fpath)

        global kickoff
        kickoff = time.time()

        env_file = fpath_as(fpath, 'device_type', 'env')
        opt_file = fpath_as(fpath, 'device_type', 'opt')
        inv_file = fpath_as(fpath, 'device_type', 'invcalc')

        if not all(os.path.exists(file) for file in [env_file, opt_file, inv_file]):
            self.logger.debug("No Data Files Existing")
            return start, []

        # Load HDF5 files
        envh5db = HDF5Manager(env_file)
        envh5db.open_ro()
        env_data = envh5db.query("data", start, stop)

        oph5db = HDF5Manager(opt_file)
        oph5db.open_ro()
        opt_data = oph5db.query("data", start, stop)

        invh5db = HDF5Manager(inv_file)
        invh5db.open_ro()
        inv_data = invh5db.query("data", start, stop)

        panel_types = ctx['panel_types']
        std_panel_type = ctx['std_panel_type']

        if not std_panel_type:
            self.logger.debug("No std_panel_type")
            envh5db.close()
            oph5db.close()
            invh5db.close()
            return start, []

        if len(opt_data):
            stop_mtime = max(opt_data["freezetime"])
        else:
            stop_mtime = start

        day = datetime.datetime.strptime(finfo['fdate'], '%Y-%m-%d') - datetime.timedelta(days=1)

        summary = db_session.query(SiteDailySummary) \
                            .filter(SiteDailySummary.sitedata_id == ctx['sitedata_id']) \
                            .filter(SiteDailySummary.summary_date <= day) \
                            .filter(SiteDailySummary.eff_total.isnot(None)) \
                            .order_by(SiteDailySummary.summary_date.desc()) \
                            .limit(1) \
                            .first()

        CPI = summary.eff_total if summary else ctx['std_panel_type']['nominal_power'] / 1000

        monitor_graphkey = ctx['monitor_graphkey']
        graphkey_numreports = defaultdict(int)

        kickoffdict = defaultdict(float)
        timedict = defaultdict(float)

        def timeit(stuff):
            global kickoff
            elapsed = time.time() - kickoff
            kickoff = time.time()
            timedict[stuff] += elapsed

        timeit('loading')

        for graph_key in list(monitor_graphkey.values()):
            snapped_diode_percentage = 100.0 / ctx['graphkey_diodes'][graph_key]

            gkvw = opt_data[opt_data["graph_key"] == graph_key]
            if len(gkvw):
                graphkey_numreports[graph_key] = len(gkvw)

            timeit('graphkey_select')

            for record in gkvw:
                envrecord = env_data[env_data["freezetime"] == record["freezetime"]]
                if not len(envrecord) or envrecord["irradiance_mean"].values[0] < IRRADIANCE_NOANALYSIS_THRESHHOLD:
                    continue

                P_proj = envrecord["irradiance_mean"].values[0] * CPI

                parent_graph_key = graphkey_parent(record["graph_key"], devtype='I')
                avgrecord = inv_data[inv_data["freezetime"] == record["freezetime"]]
                if not len(avgrecord):
                    continue

                avgrecord = avgrecord.iloc[0]
                vo_percentage = get_percentage("Vo_mean", record, avgrecord)
                po_percentage = get_percentage("Po_mean", record, avgrecord)

                if po_percentage < 0.1:
                    percent_loss = 1 - (po_percentage / 100.0)
                else:
                    percent_loss = 0.0

                watt_loss = avgrecord["Po_mean"] - record["Po_mean"]
                watthr_loss = as_energy(watt_loss, finfo["rollup_period"])

                timeit('percentage_calculations')

                if is_projected_open_circuit(record["Po_mean"], P_proj):
                    watthr_loss = as_energy(P_proj, finfo["rollup_period"])
                    fault_watch(record["graph_key"], record["freezetime"], OPEN_CIRCUIT, watthr_loss=watthr_loss)
                    fault_clear_for(record["graph_key"], record["freezetime"], POWER_DROP, SNAPPED_DIODE)
                    continue
                else:
                    fault_ok(record["graph_key"], record["freezetime"], OPEN_CIRCUIT)

                timeit('open_circuit_flag')

                snap_indicated = False

                for i in reversed(list(range(ctx['graphkey_diodes'][graph_key]))):
                    percent_down = 100 - (snapped_diode_percentage * (i+1))
                    if percent_down - THRESHHOLD_SNAPPED_DIODE <= vo_percentage <= percent_down + THRESHHOLD_SNAPPED_DIODE:
                        fault_watch(record["graph_key"], record["freezetime"], SNAPPED_DIODE, watthr_loss=watthr_loss, percent_loss=percent_loss, num_snapped=i+1)
                        snap_indicated = True
                        break

                timeit('snapped_diode_flag')

                if not snap_indicated and po_percentage > 0.1:
                    if po_percentage <= THRESHHOLD_POWER_DROP:
                        fault_watch(record["graph_key"], record["freezetime"], POWER_DROP, watt_loss=watt_loss, watthr_loss=watthr_loss, percent_loss=percent_loss)
                        fault_clear_for(record["graph_key"], record["freezetime"], SNAPPED_DIODE)
                    else:
                        fault_ok(record["graph_key"], record["freezetime"], POWER_DROP, SNAPPED_DIODE, OPEN_CIRCUIT)

                timeit('calc_records_for_graphkey')

        envh5db.close()
        oph5db.close()
        invh5db.close()

        for key, value in list(timedict.items()):
            self.logger.info("TIMEDATA: %s -> %s" % (key, value))

        return stop_mtime, []
