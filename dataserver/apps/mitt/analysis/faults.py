import json
from apps.alerts.models.faults import *
from apps.issue.models import *
from apps.issue.report_util import *
from apps.mitt.cubesets import CubeBase
from apps.mitt.cubesets.build_logical_array import ArrayCube
from dataserver.apps.util.data_file_processing import fpath_as
from dataserver.apps.util.data_file_processing import tokenize_fpath
from dataserver.apps.util.hdf5 import HDF5Manager
from clarity_util.utctime import add_utc_locale, datetime_to_epoch, epoch_to_datetime
from .watchlist import wrap_fault_funcs


class FaultResolverAnalysis(CubeBase):
    filenames = ['arraycalc_300.h5$']  # ✅ Updated for HDF5
    requires = [ArrayCube]
    order = 8

    def process(self, ctx, fpath, start, stop):
        """
        Analyzes fault data and escalates/resolves issues based on HDF5 records.
        """
        faults = ctx['faults']
        created_faults = []
        resolved_faults = []
        db_faults = faults_to_dict(ctx['sitedata_id'])

        cube_fpath = fpath_as(fpath, device_type='faults')
        h5db = HDF5Manager(cube_fpath)
        h5db.open_we()

        stop_mtime = start

        for freezetime in sorted(faults.keys()):
            stop_mtime = max(stop_mtime, freezetime)
            for graph_key, categories in list(faults[freezetime].items()):
                for category, info in list(categories.items()):
                    rowd = {
                        'freezetime': freezetime,
                        'graph_key': graph_key,
                        'category': category,
                        'flagged': info['flagged'],
                        'watthr_loss': info['extras'].get('watthr_loss', 0.0),
                        'extras': json.dumps(info['extras']),
                    }

                    h5db.append("data", rowd)  # ✅ Replace Metakit `.append()` with HDF5 `.append()`

                    if info['flagged']:
                        if graph_key in db_faults:
                            db_fault = db_faults[graph_key]
                            if category in db_fault:
                                fdc = db_fault[category]
                                fdc['energy_loss'] += info['extras'].get('watthr_loss', 0.0)
                                fdc['extra_data'] = info['extras']

                                if 'starttime' not in fdc:
                                    fdc['starttime'] = freezetime
                                    fdc['endtime'] = freezetime
                                else:
                                    diff_since_last = freezetime - fdc['endtime']
                                    if diff_since_last >= 60 * 30:
                                        fdc['starttime'] = freezetime
                                        fdc['energy_loss'] = info['extras'].get('watthr_loss', 0.0)
                                    fdc['endtime'] = freezetime
                            else:
                                fdc = create_fault(db_fault, graph_key, category, info, freezetime)
                        else:
                            db_faults[graph_key] = {}
                            db_fault = db_faults[graph_key]
                            fdc = create_fault(db_fault, graph_key, category, info, freezetime)

                        escalate_time = Fault_time_to_escalate.get(category, Fault_time_to_escalate['default'])

                        if duration(fdc) >= escalate_time:
                            if escalate(fdc):
                                created_faults.append(fdc)
                    else:
                        if graph_key in db_faults:
                            db_fault = db_faults[graph_key]
                            if category in db_fault:
                                fdc = db_fault[category]

                                if 'starttime' not in fdc:
                                    fdc['starttime'] = freezetime
                                    fdc['endtime'] = freezetime
                                    fdc['resolve_start'] = freezetime
                                    fdc['resolve_stop'] = freezetime
                                else:
                                    if 'resolve_start' in fdc:
                                        diff_since_last = freezetime - fdc['resolve_stop']
                                        if diff_since_last >= 60 * 30:
                                            fdc['resolve_start'] = freezetime
                                    else:
                                        fdc['resolve_start'] = freezetime

                                    fdc['resolve_start'] = max(fdc['endtime'], fdc['resolve_start'])
                                    fdc['resolve_stop'] = max(fdc['resolve_start'], freezetime)

                                resolve_time = Fault_time_to_resolve.get(category, Fault_time_to_resolve['default'])

                                if rduration(fdc) >= resolve_time:
                                    if resolve(fdc):
                                        resolved_faults.append(fdc)

                    if 'resolve' in info and graph_key in db_faults:
                        db_fault = db_faults[graph_key]
                        if category in db_fault:
                            fdc = db_fault[category]
                            if resolve(fdc):
                                resolved_faults.append(fdc)

        h5db.commit()
        h5db.close()

        dict_to_faults(ctx['sitedata_id'], db_faults)

        ctx['faults'] = {}
        ctx['closed_faults'] = resolved_faults
        ctx['opened_faults'] = created_faults

        return stop_mtime, [cube_fpath]
