import datetime
import gzip
import os
import time
import math
from collections import defaultdict
from apps.issue.models import *
from apps.issue.report_util import *
from apps.sitedata.access_utils import all_graphkey_parents
from apps.sitedata.models import SiteBaselinePeak, SiteDailySummary, SiteData
from dataserver.apps.util.data_file_processing import detokenize_groupdict, fpath_as, tokenize_fpath
from dataserver.apps.util.hdf5_util import HDF5Manager
from mitt.cubesets import AtEndOfDay, CubeBase
from mitt.cubesets.build_logical_array import ArrayCube
from .threshholds import *
from .watchlist import wrap_fault_funcs


class BasicEnergySummary(CubeBase):
    filenames = ['arraycalc_300.h5$']  # ✅ Updated for HDF5
    requires = [ArrayCube]

    def generic_summary(self, start, stop, fname, rec_col, apply_func=None):
        """
        Extracts summed values from an HDF5 file within a time range.
        """
        result = 0.0
        h5db = HDF5Manager(fname)
        h5db.open_ro()
        data = h5db.query("data")

        stop_mtime = start

        for row in data:
            if start <= row["freezetime"] <= stop:
                stop_mtime = max(stop_mtime, row["freezetime"])

                if row[rec_col] is not None and not math.isnan(row[rec_col]):
                    value = row[rec_col]
                    if callable(apply_func):
                        value = apply_func(value)
                    result += value

        h5db.close()
        return result, stop_mtime

    def process(self, ctx, fpath, start, stop):
        fault_clear_for, fault_ok, fault_watch = wrap_fault_funcs(ctx)

        finfo = tokenize_fpath(fpath)

        try:
            rollup_period = float(finfo['rollup_period'])
        except:
            rollup_period = None

        day = datetime.date(int(finfo['year']), int(finfo['month']), int(finfo['day']))

        daily_summary = SiteDailySummary.query.filter_by(
            sitedata_id=ctx['sitedata_id'], summary_date=day).first()

        if daily_summary is None:
            daily_summary = SiteDailySummary(ctx['sitedata_id'], day)
            db.session.add(daily_summary)

        stop_mtime = self.perform_calculation(daily_summary, rollup_period, fpath, day, start, stop)

        db.session.commit()

        return stop_mtime, []


class ArrayEnergySummaryAnalysis(BasicEnergySummary):
    def perform_calculation(self, daily_summary, rollup_period, fpath, day, start, stop):
        array_energy = 0.0

        arr_file = fpath_as(fpath, 'device_type', 'arraycalc')

        if os.path.exists(arr_file):
            array_energy, stop_mtime = self.generic_summary(start, stop, arr_file, 'Eo')
        else:
            array_energy, stop_mtime = (None, start)

        if array_energy:
            daily_summary.array_energy = (daily_summary.array_energy or 0) + array_energy

        return stop_mtime


class IrradianceEnergySummaryAnalysis(BasicEnergySummary):
    def perform_calculation(self, daily_summary, rollup_period, fpath, day, start, stop):
        irradiance_energy = 0.0

        env_file = fpath_as(fpath, 'device_type', 'env')

        if os.path.exists(env_file):
            irradiance_energy, stop_mtime = self.generic_summary(
                start, stop, env_file, 'irradiance_mean',
                lambda x: x * rollup_period / 3600
            )
        else:
            irradiance_energy, stop_mtime = (None, start)

        if irradiance_energy:
            daily_summary.irradiance_energy = (daily_summary.irradiance_energy or 0) + irradiance_energy

        return stop_mtime


class ACEnergySummaryAnalysis(BasicEnergySummary):
    def perform_calculation(self, daily_summary, rollup_period, fpath, day, start, stop):
        acm_file = fpath_as(fpath, 'device_type', 'acm')
        inv_file = fpath_as(fpath, 'device_type', 'inv')

        ac_energy = 0.0

        if os.path.exists(acm_file):
            ac_energy, stop_mtime = self.generic_summary(start, stop, acm_file, 'ACEo_net_diff')
        elif os.path.exists(inv_file):
            ac_energy, stop_mtime = self.generic_summary(start, stop, inv_file, 'ACEo_diff')
        else:
            ac_energy, stop_mtime = (None, start)

        if ac_energy:
            daily_summary.ac_energy = (daily_summary.ac_energy or 0) + ac_energy

        return stop_mtime


class SetPeaksBusinessRule(AtEndOfDay):
    order = 0

    def process_rule(self, dt, day, mgr, ctx, verbose=False):
        """
        Evaluates efficiency confidence levels and sets baseline peaks.
        """
        daily_summary = SiteDailySummary.query.filter_by(
            sitedata_id=ctx['sitedata_id'], summary_date=day).first()

        if daily_summary and daily_summary.eff_total and daily_summary.eff_confidence:
            if daily_summary.eff_confidence > EFF_CONFIDENT_THRESHHOLD:
                action, msg = SiteBaselinePeak.set_peak(ctx['sitedata_id'], day, daily_summary.eff_total)

                for m in msg:
                    self.logger.info("%s" % (m))

                db.session.commit()


def gzip_file(fpath):
    """
    Compresses a file using gzip.
    """
    fpath_out = fpath + '.gz'

    with open(fpath, 'rb') as f_in, gzip.open(fpath_out, 'wb') as f_out:
        f_out.writelines(f_in)

    os.unlink(fpath)  # Remove original after compression


class ArchiveDataAnalysis(AtEndOfDay):
    order = 0

    def process_rule(self, dt, day, mgr, ctx, verbose=False):
        """
        Archives old HDF5 data by compressing it.
        """
        sd = SiteData.query.filter_by(id=ctx['sitedata_id']).first()

        if sd:
            fourteen_days_ago = day - datetime.timedelta(days=14)

            opt_finfo = {
                'root': '/data',
                'integrator_id': sd.integrator,
                'cust_id': sd.owner,
                'site_id': sd.sitename,
                'year': str(fourteen_days_ago.year),
                'month': str(fourteen_days_ago.month),
                'day': str(fourteen_days_ago.day),
                'fdate': f"{fourteen_days_ago.year}-{fourteen_days_ago.month}-{fourteen_days_ago.day}",
                'device_type': 'opt',
                'rollup_period': 'raw'
            }
            env_finfo = opt_finfo.copy()
            env_finfo['device_type'] = 'env'

            opt_fpath = detokenize_groupdict(opt_finfo)
            env_fpath = detokenize_groupdict(env_finfo)

            for fpath in [opt_fpath, env_fpath]:
                if os.path.exists(fpath):
                    self.logger.info(f"GZIPPING {fpath}")
                    gzip_file(fpath)

