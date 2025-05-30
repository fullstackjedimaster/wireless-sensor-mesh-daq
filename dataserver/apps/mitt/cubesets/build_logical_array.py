"""
Creates cubes that define the "logical array". Meaning string, inverter, etc
rollups.

Author: Thadeus Burgess

Copyright (c) 2011 Solar Power Technologies Inc.
"""

import math
import os
from collections import defaultdict

from analysis.threshholds import *
from apps.issue.report_util import *
from apps.sitedata.access_utils import graphkey_devtype
from dataserver.apps.util.data_file_processing import fpath_as
from dataserver.apps.util.data_file_processing import tokenize_fpath
from clarity_util.handler.rollup import StatsCol
from clarity_util.metakit import MetakitManager
from clarity_util.metakit import metakit_record_to_dict
from clarity_util.metakit.view import DoubleCol
from clarity_util.metakit.view import IntegerCol
from clarity_util.metakit.view import MetaKitView
from clarity_util.metakit.view import StringCol
from clarity_util.stats import LowPassFloat
from cubesets import CubeBase
from cubesets.string_roller import StringCube


class InverterCalcView(MetaKitView):
    __viewname__ = 'data'

    freezetime          = IntegerCol()
    graph_key           = StringCol()
    reported_strings    = IntegerCol()
    total_strings       = IntegerCol()
    is_open_circuit     = IntegerCol()

    V                   = DoubleCol()
    I                   = DoubleCol()
    P                   = DoubleCol()
    Eo                  = DoubleCol()

    P_projected         = DoubleCol()
    I_projected         = DoubleCol()

    #: Average values for strings underneath the device
    #: Average(Inverter.Strings[])
    V_mean             = DoubleCol()
    I_mean             = DoubleCol()
    P_mean             = DoubleCol()
    V_stdev             = DoubleCol()
    I_stdev             = DoubleCol()
    P_stdev             = DoubleCol()

    Eo_mean             = DoubleCol()
    Eo_stdev            = DoubleCol()

    #: Average(Average(String.Panels[]))
    #: average of the strings panel average
    Vi_mean             = DoubleCol()
    Ii_mean             = DoubleCol()
    Pi_mean             = DoubleCol()
    Vo_mean             = DoubleCol()
    Io_mean             = DoubleCol()
    Po_mean             = DoubleCol()

    #: stdev of the average of of the strings panel avg
    #: Stdev(Average(String.Panels[]))
    Vi_stdev             = DoubleCol()
    Ii_stdev             = DoubleCol()
    Pi_stdev             = DoubleCol()
    Vo_stdev             = DoubleCol()
    Io_stdev             = DoubleCol()
    Po_stdev             = DoubleCol()

class ArrayCalcView(MetaKitView):
    __viewname__ = 'data'

    freezetime          = IntegerCol()
    reported_inverters  = IntegerCol()
    total_inverters     = IntegerCol()

    P                   = DoubleCol()
    Eo                  = DoubleCol()

    #: Average(Array.Inverters[])
    V_mean             = DoubleCol()
    I_mean             = DoubleCol()
    P_mean             = DoubleCol()
    V_stdev             = DoubleCol()
    I_stdev             = DoubleCol()
    P_stdev             = DoubleCol()

    Eo_mean             = DoubleCol()
    Eo_stdev            = DoubleCol()

class InverterCube(CubeBase):
    """
    Takes all of the strings in an inverter and rolls them up
    to the inverter level. Sum of the current and power and energy, average of
    the voltage.

    Input
        strcalc 300
    Requires
        StringCube
    Output
        invcalc 300
    """

    filenames = ['strcalc_[0-9].+.mk$']
    requires = [StringCube]
    cube_id = 'invcalc'

    def get_output_filepaths(self, filepath):
        return [fpath_as(filepath, 'device_type', self.cube_id)]

    def process(self, ctx, fpath, start, stop):
        finfo = tokenize_fpath(fpath)
        rollup_period = int(finfo['rollup_period'])

        cube_fpath = fpath_as(fpath, 'device_type', 'invcalc')

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


        env_fpath = fpath_as(fpath, 'device_type', 'env')
        cpi_fpath = fpath_as(fpath, 'device_type', 'cpi')

        cubedb = MetakitManager(cube_fpath)
        cubedb.open_we()
        cube = cubedb.getas(InverterCalcView())

        string_inverterid = ctx['string_graphkey_inverter_combiner_graphkey']
        inverterid_string = defaultdict(set)
        #: inverterid: freezetime: string set
        inverterid_reported = defaultdict(lambda: defaultdict(set))

        for string, inverterids in list(string_inverterid.items()):
            for inverterid in inverterids:
                inverterid_string[inverterid].add(string)

        timeslots = raw.project(raw.freezetime).unique()

        if os.path.exists(env_fpath):
            envdb = MetakitManager(env_fpath)
            envdb.open_ro()
            envvw = envdb.view('data')
            envvw = envvw.select({'freezetime': start},
                                 {'freezetime': stop})

            has_env = len(envvw) > 0
        else:
            envdb = None
            envvw = None
            has_env = False

        if os.path.exists(cpi_fpath):
            cpidb = MetakitManager(cpi_fpath)
            cpidb.open_ro()
            cpivw = cpidb.view('data')

            #: 1/6 filter, 1/4 filter... select last 6 periods.
            cpistart = start - (rollup_period * 6)

            cpivw = cpivw.select({'freezetime': cpistart},
                                 {'freezetime': stop})

            has_cpi = len(cpivw) > 0
        else:
            cpidb = None
            cpivw = None
            has_cpi = False

        #: str gk, freezetime, eff_instants
        string_current_cpi = defaultdict(lambda: defaultdict(list))

        if has_env \
        and has_cpi:
            for cpirow in cpivw:
                if cpirow.graph_key in string_inverterid:
                    if not cpirow.eff_instant:
                        continue

                    sgk = cpirow.graph_key

                    ctimes = [cpirow.freezetime]

                    for i in range(5):
                        ctime = cpirow.freezetime + (rollup_period * (i+1))
                        ctimes.append(ctime)

                    for ctime in ctimes:
                        string_current_cpi[sgk][ctime].append(cpirow.eff_instant)

            for str_gkey in string_current_cpi:
                for freezetime in string_current_cpi[str_gkey]:
                    effs = string_current_cpi[str_gkey][freezetime]

                    if effs:
#                        str_cpi = sum(effs) / len(effs)
                        lpf = LowPassFloat(effs[0], frequency=6)
                        for eff in effs[1:]:
                            lpf += eff

                        str_cpi = lpf.value
                    else:
                        str_cpi = None

                    str_cpi = str_cpi * int(ctx['graphkey_npanels'][str_gkey])
                    string_current_cpi[str_gkey][freezetime] = str_cpi

        # tfz = 1380189300
        # tgk = "A:ALCONERA.I:5-2.C:1-1.S:3dn"

        # print string_current_cpi[tgk][tfz]
        # print envvw.select(freezetime=tfz)[0].irradiance_mean * string_current_cpi[tgk][tfz]

        # import pdb
        # pdb.set_trace()

        total_processed = 0
        total = len(timeslots)

        records_processed = 0
        stop_mtime = 0
        break_early = False

        for timeslot in timeslots:
            if records_processed > 50000:
                break_early = True
                break

            stop_mtime = max(stop_mtime, timeslot.freezetime)

            records = raw.select(freezetime=timeslot.freezetime)
            envrecord = envvw.select(freezetime=timeslot.freezetime)

            if len(envrecord):
                envrecord = envrecord[0]
                current_irradiance = envrecord.irradiance_mean
            else:
                current_irradiance = None

            avgs = dict()
            avgs_open = dict()

            for record in records:
                records_processed += 1
                avgs_pointer = avgs

                record = metakit_record_to_dict(raw, record, convert_freezetime=False)

                if record['graph_key'] not in string_inverterid:
                    continue

                for id_inverter in string_inverterid[record['graph_key']]:
                    inverterid_reported[id_inverter][record['freezetime']].add(record['graph_key'])

                    # open circuit strings do not get included in inverter level rollup.
                    if record['is_open_circuit']:
                    #if is_open_circuit(record['I'], record['V']):
                        avgs_pointer = avgs_open

                    if id_inverter not in avgs_pointer:
                        avgs_pointer[id_inverter] = dict()

                        for x in ['V', 'I', 'P', 'Eo']:
                            avgs_pointer[id_inverter][x] = StatsCol(x, do_filter=False)

                        for x in ['V', 'I', 'P']:
                            for y in ['i', 'o']:
                                xyz = x+y+'_mean'
                                avgs_pointer[id_inverter][xyz] = StatsCol(xyz, do_filter=False)

                    for x in ['V', 'I', 'P', 'Eo']:
                        avgs_pointer[id_inverter][x].append(record[x])

                    for x in ['V', 'I', 'P']:
                        for y in ['i', 'o']:
                            xyz = x+y+'_mean'
                            avgs_pointer[id_inverter][xyz].append(record[xyz])

            id_inverters = set(avgs.keys())
            id_inverters.update(set(avgs_open.keys()))

            for id_inverter in id_inverters:
                if id_inverter in avgs:
                    for k in avgs[id_inverter]:
                        avgs[id_inverter][k].calc()
                if id_inverter in avgs_open:
                    for k in avgs_open[id_inverter]:
                        avgs_open[id_inverter][k].calc()

                if id_inverter in avgs:
                    avgs_pointer = avgs
                else:
                    avgs_pointer = avgs_open

                record = {'freezetime': timeslot.freezetime,
                          'graph_key': id_inverter,
                          'reported_strings': len(inverterid_reported[id_inverter][timeslot.freezetime]),
                          'total_strings': len(inverterid_string[id_inverter]),
                          'is_open_circuit': avgs_pointer is avgs_open}

                record['V'] = avgs_pointer[id_inverter]['V']['mean']
                record['I'] = avgs_pointer[id_inverter]['I']['sum']

                try:
                    P = record['V'] * record['I']
                except:
                    P = float('nan')

                project_power = 0.0
                project_current = 0.0

                if current_irradiance:
                    nonreporting_strings = inverterid_string[id_inverter] - inverterid_reported[id_inverter][timeslot.freezetime]

                    for nstrgk in nonreporting_strings:
                        str_cpi_freezetimes = string_current_cpi.get(nstrgk)

                        if str_cpi_freezetimes:
                            str_cpi = str_cpi_freezetimes.get(timeslot.freezetime)

                            if str_cpi:
                                project_power += str_cpi * current_irradiance

                if project_power:
                    project_current = project_power / record['V']

                record['P'] = P + project_power
                record['I'] += project_current

                record['P_projected'] = project_power
                record['I_projected'] = project_current

                try:
                    record['Eo'] = record['P'] * int(finfo['rollup_period']) / 3600
                except:
                    record['Eo'] = float('nan')

                for x in ['V', 'I', 'P', 'Eo']:
                    for y in ['mean', 'stdev']:
                        record[x+'_'+y] = avgs_pointer[id_inverter][x][y]

                for x in ['V', 'I', 'P']:
                    for y in ['i', 'o']:
                        xyz = x+y+'_mean'
                        xyz_std = x+y+'_stdev'
                        record[xyz] = avgs_pointer[id_inverter][xyz]['mean']
                        record[xyz_std] = avgs_pointer[id_inverter][xyz]['stdev']

                cube.append(**record)

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

class ArrayCube(CubeBase):
    """
    Takes all of the inverters in the array and rolls them up to a farce "array" level.

    Input
        invcalc 300
    Requires
        InverterCube
    Output
        arraycalc 300
    """

    filenames = ['invcalc_[0-9].+.mk$']
    requires = [InverterCube]
    cube_id = 'arraycalc'

    def get_output_filepaths(self, filepath):
        return [fpath_as(filepath, 'device_type', self.cube_id)]

    def process(self, ctx, fpath, start, stop):
        finfo = tokenize_fpath(fpath)

        cube_fpath = fpath_as(fpath, 'device_type', 'arraycalc')

        rawdb = MetakitManager(fpath)
        rawdb.open_ro()
        raw = rawdb.view('data')

        try:
            raw = raw.select({'freezetime': start},
                             {'freezetime': stop}) \
                     .sort()
        except:
            rawdb.close()
            return start, []

        if len(raw) == 0:
            self.logger.info("No records for timerange %s to %s" % (start, stop))
            rawdb.close()
            return start, []

        cubedb = MetakitManager(cube_fpath)
        cubedb.open_we()
        cube = cubedb.getas(ArrayCalcView())

        inverters = set()
        inverters_reported = set()

        for graph_key,inv_id in list(ctx['inverter_graphkey'].items()):
            inverters.add(graph_key)

        timeslots = raw.project(raw.freezetime).unique()

        total_processed = 0
        total = len(timeslots)

        records_processed = 0

        stop_mtime = 0
        break_early = False

        for timeslot in timeslots:
            if records_processed > 50000:
                break_early = True
                break

            stop_mtime = max(stop_mtime, timeslot.freezetime)

            records = raw.select(freezetime=timeslot.freezetime)

            avgs = dict()

            for x in ['V', 'I', 'P', 'Eo']:
                avgs[x] = StatsCol(x, do_filter=False)

            for record in records:
                records_processed += 1
                devtype = graphkey_devtype(record.graph_key)

                if devtype in ['I', 'IC']:
                    record = metakit_record_to_dict(raw, record, convert_freezetime=False)

                    inverters_reported.add(record['graph_key'])

                    for x in ['V', 'I', 'P', 'Eo']:
                        if not math.isnan(record[x]):
                            avgs[x].append(record[x])

            for key in avgs:
                avgs[key].calc()

            record = {'freezetime': timeslot.freezetime,
                      'reported_inverters': len(inverters_reported),
                      'total_inverters': len(inverters),
                      'P': avgs['P']['sum'],
                      'Eo': avgs['Eo']['sum']}

            for x in['V', 'I', 'P', 'Eo']:
                for y in ['mean', 'stdev']:
                    record[x+'_'+y] = avgs[x][y]

            cube.append(**record)

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
