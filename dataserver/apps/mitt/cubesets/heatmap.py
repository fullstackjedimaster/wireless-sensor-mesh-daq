"""
Creates a heatmap cube so the user interface can be snappier

Author: Thadeus Burgess

Copyright (c) 2011 Solar Power Technologies Inc.
"""

from dataserver.apps.util.data_file_processing import fpath_as
from dataserver.apps.util.data_file_processing import tokenize_fpath
from clarity_util.metakit import MetakitManager
from clarity_util.metakit.view import DoubleCol
from clarity_util.metakit.view import IntegerCol
from clarity_util.metakit.view import MetaKitView
from clarity_util.metakit.view import StringCol
from cubesets import CubeBase
from cubesets.build_logical_array import InverterCube


class HeatMapView(MetaKitView):
    __viewname__ = 'data'

    freezetime          = IntegerCol()
    heat_map_type       = StringCol()
    graph_key           = StringCol()
    data_point          = DoubleCol()
    real_data_point     = DoubleCol()
    nominal_data_point  = DoubleCol()

class HeatMapCube(CubeBase):
    """
    Creates pre-computed heatmaps for faster access from the web server.

    Input
        opt 300
    Requires
        None
    Output
        heatmap 300
    """

    filenames = ['(opt|strcalc|invcalc)_[0-9].+.mk$']
    requires = [InverterCube]
    cube_id = 'heatmap'

    def get_output_filepaths(self, filepath):
        return [fpath_as(filepath, 'device_type', self.cube_id)]

    def process(self, ctx, fpath, start, stop):
        finfo = tokenize_fpath(fpath)

        cube_fpath = fpath_as(fpath, 'device_type', 'heatmap')

        rawdb = MetakitManager(fpath)
        rawdb.open_ro()
        raw = rawdb.view('data')

        try:
            raw = raw.select({'freezetime': start},
                             {'freezetime': stop}) \
                     .sort(raw.freezetime)
        except:
            rawdb.close()
            return start, []

        if len(raw) == 0:
            self.logger.info("No records for timerange %s to %s" % (start, stop))
            rawdb.close()
            return start, []

        stop_mtime = 0

        cubedb = MetakitManager(cube_fpath)
        cubedb.open_we()
        cube = cubedb.getas(HeatMapView())

        graphkey_nodeid = ctx['graphkey_nodeid']
        std_panel_type = ctx['std_panel_type']

        if not std_panel_type:
            rawdb.close()
            cubedb.close()
            return start, []

        timeslots = raw.project(raw.freezetime).unique()

        total_processed = 0
        total = len(timeslots)

        if finfo['device_type'] == 'opt':
            p_col = 'Po_mean'
            r_col = 'Vo_count'
            #: Vi is the number of responses from this actual unit
            #: since current is integrated across all panels within
            #: a string.
        elif finfo['device_type'] == 'strcalc':
            p_col = 'P'
            r_col = 'reported_monitors'
        elif finfo['device_type'] == 'invcalc':
            p_col = 'p'
            r_col = 'reported_strings'

        records_processed = 0
        break_early = False

        for timeslot in timeslots:
            if records_processed > 50000:
                break_early = True
                break

            stop_mtime = max(stop_mtime, timeslot.freezetime)

            records = raw.select(freezetime=timeslot.freezetime)

            records_processed += len(records)

            if finfo['device_type'] == 'invcalc':
                total_max_power = [0.0,0.0]
            else:
                total_max_power = 0.0

            max_reports = 0

            for record in records:
                if finfo['device_type'] == 'invcalc':
                    #: Keep combiner and inverters separate entities
                    #: alternatively, this could be graph key count `.` of two
                    if 'C:' in record.graph_key:
                        total_max_power[1] = max(total_max_power[1], getattr(record, p_col))
                    else:
                        total_max_power[0] = max(total_max_power[0], getattr(record, p_col))
                else:
                    total_max_power = max(total_max_power, getattr(record, p_col))

                max_reports = max(max_reports, getattr(record, r_col))

            for record in records:
                if record.graph_key not in graphkey_nodeid:
                    continue

                watt_rating = ctx['graphkey_nominal_power'][record.graph_key]

                if finfo['device_type'] == 'invcalc':
                    if 'C:' in record.graph_key:
                        max_power = total_max_power[1]
                    else:
                        max_power = total_max_power[0]
                else:
                    max_power = total_max_power

                P = getattr(record, p_col)
                R = getattr(record, r_col)

                # N
                data = {'freezetime': timeslot.freezetime,
                        'heat_map_type': 'N'}
                data['graph_key'] = record.graph_key

                try:
                    data['data_point'] = ((P / max_power) * 100.0)
                    data['real_data_point'] = P
                    data['nominal_data_point'] = max_power
                except:
                    data['data_point'] = 0.0

                cube.append(**data)

                # A
                data = {'freezetime': timeslot.freezetime,
                        'heat_map_type': 'A'}
                data['graph_key'] = record.graph_key

                try:
                    data['data_point'] = ((P / watt_rating) * 100.0)
                    data['real_data_point'] = P
                    data['nominal_data_point'] = watt_rating
                except:
                    data['data_point'] = 0.0

                cube.append(**data)

                # R
                data = {'freezetime': timeslot.freezetime,
                        'heat_map_type': 'R'}
                data['graph_key'] = record.graph_key

                try:
                    data['data_point'] = R
                except:
                    data['data_point'] = 0.0

                cube.append(**data)

            total_processed += 1

            if total_processed % 25 == 0:
                self.logger.info("[%s] Calculated %d/%d" % (fpath, total_processed, total))

        cubedb.commit()
        cubedb.close()
        rawdb.close()

        nde = [cube_fpath]

        if break_early:
            nde.append(fpath)

        return stop_mtime, nde
