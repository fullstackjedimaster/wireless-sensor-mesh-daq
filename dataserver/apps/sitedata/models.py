"""
FastAPI-compatible Site Data Models for PostgreSQL, Redis, and HDF5.

Converted from Flask to FastAPI by: Your Assistant
"""

import datetime
import redis
from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Float, ForeignKey
)
from sqlalchemy.orm import relationship, backref
from apps.database import Base, SessionLocal
from apps.account.models import Organization
from apps.sitedata.util import data_path, graph_data_path
from dataserver.apps.util.hdf5 import HDF5Manager

# Redis Connection
redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

# class SiteDailySummaryQuery(BaseQuery):
#     def eff_confident(self, threshhold=None):
#         if threshhold is None:
#             threshhold = SiteDailySummary.EFF_CONFIDENT_THRESHHOLD
#
#         return self.filter(SiteDailySummary.eff_confidence > threshhold)

def array_perf_baseline_chart(sitename=None, last_dt=None, last_date=None, mgr=None, num_days=30):
    if sitename == None:
        sitename = g.sitename
    td = datetime.timedelta(days=1)
    if last_dt == None:
        if last_date != None:
            last_dt = date_from_str(last_date)
        else:
            last_dt = localdate()
            last_dt = last_dt - td
    if mgr == None:
        mgr = g.mgr

    sitedata = SiteData.query.filter_by(sitename=sitename).one()
    system_area, system_kWp, system_eff = sitedata.basic_array_info( mgr=mgr )

    first_dt = last_dt - (td * (num_days-1))

    summaries = SiteDailySummary.query.filter_by(sitedata_id=sitedata.id) \
                    .filter(between(SiteDailySummary.summary_date, first_dt, last_dt))\
                    .order_by("summary_date")

    chart = TimeLineChart("baseline",
                          ["Health","Cleanliness"],
                          find_mkfiles=False)

    lpf = LowPassFloat(frequency=4)

    current_dt = last_dt - datetime.timedelta(days=num_days)
    cleanliness = None
    health = None
    system_area, system_kWp, system_eff = sitedata.basic_array_info( mgr=mgr )
    value = 0.0

    for summary in summaries:
        difference = (summary.summary_date - current_dt).days

        if difference:
            while current_dt < summary.summary_date:
                chart.add_db_data(current_dt, [("00:00", health, cleanliness)])
                current_dt += datetime.timedelta(days=1)
        current_dt += datetime.timedelta(days=1)

        if summary.eff_total:#summary.eff_adjusted and summary.eff_total:
            if summary.eff_confident:
                value = summary.eff_total
            #else:
            #    value = summary.eff_adjusted

            if value > lpf.value:
                lpf.value = value
            elif lpf.value > 0 and (value / lpf.value) < .9:
                lpf.value = value
            else:
                lpf += value

        eff_percentage = summary.eff_total_percentage_from_peak(lpf.value)

        if eff_percentage != None:
            cleanliness = 0.0 - (100.0 - eff_percentage)

        if summary.array_health:
            health = 0.0 - (100.0 - summary.array_health)

        #print summary.summary_date,summary.SMA_perf_ratio(system_area, system_eff, dc=dc), perf_ratio

        chart.add_db_data(summary.summary_date, [("00:00", health, cleanliness)])

    return chart


class SiteDailySummary(db.Model):
    """
    Status info for the sitearray.

    The dates help us manage the sitearray in various ways.
    """
    EFF_CONFIDENT_THRESHHOLD = .55

    __tablename__ = 'site_daily_summary'

    # query_class = SiteDailySummaryQuery

    id          = db.Column(db.Integer, primary_key=True)
    sitedata_id = db.Column(db.Integer, db.ForeignKey('site_data.id'))
    sitedata    = db.relationship('SiteData', backref=db.backref('summaries', lazy='dynamic', cascade='all'))
    summary_date = db.Column(db.Date())

    #: Daily Sums
    array_energy = db.Column(db.Float())
    irradiance_energy = db.Column(db.Float())
    ac_energy = db.Column(db.Float())
    inv_ac_energy = db.Column(db.Float())
    inv_dc_energy = db.Column(db.Float())

    cloud_signal = db.Column(db.Float())
    cloud_noise = db.Column(db.Float())

    #: Array Efficiency
    eff_array_energy = db.Column(db.Float())
    eff_irradiance_energy = db.Column(db.Float())
    eff_adjusted_array_energy = db.Column(db.Float())
    eff_total = db.Column(db.Float()) # efficiency factor
    eff_adjusted = db.Column(db.Float()) # filtered efficiency factor
    eff_confidence = db.Column(db.Float())
    eff_confidence_curve = db.Column(db.Float())
    eff_iconfident = db.Column(db.Float())
    eff_cloud_snr = db.Column(db.Float()) # signal to noise ratio
    eff_vi_snr = db.Column(db.Float())
    eff_energy_loss = db.Column(db.Float())

    #: Array Damage
    array_health = db.Column(db.Float()) # 100.0 means no operational damage.

    def __init__( self, sitedata_id, summary_date ):
        self.sitedata_id  = sitedata_id
        self.summary_date = summary_date

    def __repr__(self):
        return "DailySummary for %s on %s" % (self.sitedata.sitename, self.summary_date.isoformat())

    @property
    def eff_confident(self):
        return self.eff_confidence > SiteDailySummary.EFF_CONFIDENT_THRESHHOLD

    def eff_peak(self):
        peak = SiteBaselinePeak.query.filter_by(sitedata_id=self.sitedata_id) \
                                     .get_peak_for_season(self.summary_date)

        return peak

    def is_peak(self):
        return self.eff_total_percentage_from_peak(self.eff_adjusted) == 100.0

    def eff_total_percentage_from_peak(self, eff_total=None):
        percentage = None

        if eff_total is None:
            eff_total = self.eff_total

        peak = self.eff_peak()

        if peak \
        and eff_total:
            percentage = eff_total / peak * 100.0

        return percentage

    def NREL_perf_ratio(self, system_kWp, num_days=None, reference_irradiance=1000.0, dc=True):
        if dc:
            energy_name = 'array_energy'
        else:
            energy_name = 'ac_energy'

        energy = getattr(self, energy_name)

        if not energy or not self.irradiance_energy:
            return 0,0,0

        E = energy / 1000
        P0 = system_kWp
        I = self.irradiance_energy
        refI = reference_irradiance

        if num_days:
            start_dt = self.summary_date - datetime.timedelta(days=num_days)
            end_dt = self.summary_date

            summaries = self.query.filter_by(sitedata_id=self.sitedata_id) \
                                  .filter((SiteDailySummary.summary_date >= start_dt)
                                         &(SiteDailySummary.summary_date < end_dt)) \
                                  .all()

            for summary in summaries:
                if getattr(summary, energy_name):
                    E += getattr(summary, energy_name) / 1000

                if summary.irradiance_energy:
                    I += summary.irradiance_energy

        Yf = E / P0
        Yr = I / refI

        PR = Yf/Yr

        return Yf,Yr,PR

    def SMA_perf_ratio(self, system_area, system_eff, num_days=None, dc=True):
        if dc:
            energy_name = 'array_energy'
        else:
            energy_name = 'ac_energy'

        energy = getattr(self, energy_name)

        if not self.irradiance_energy \
        or not energy:
            return None,None,None

        irradiation = (self.irradiance_energy / 1000) * system_area

        kWh = energy / 1000

        if num_days:
            start_dt = self.summary_date - datetime.timedelta(days=num_days)
            end_dt = self.summary_date

            summaries = self.query.filter_by(sitedata_id=self.sitedata_id) \
                                  .filter((SiteDailySummary.summary_date >= start_dt)
                                         &(SiteDailySummary.summary_date < end_dt)) \
                                  .all()

            for summary in summaries:
                if getattr(summary, energy_name):
                    kWh += getattr(summary, energy_name) / 1000
                if summary.irradiance_energy:
                    irradiation += (summary.irradiance_energy / 1000) * system_area

        nom_kWh = irradiation * system_eff

        PR = kWh / nom_kWh

        return kWh,nom_kWh,PR

class Oversight(Base):
    """
    Relates organizations to SiteData.
    """
    __tablename__ = "oversight"

    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, ForeignKey("organization.id"))
    site_data_id = Column(Integer, ForeignKey("site_data.id"))
    relationship = Column(String(2), default="OO")

    org = relationship("Organization", backref=backref("ownerships", lazy="dynamic", cascade="all"))
    site_data = relationship("SiteData", backref=backref("oversights", lazy="dynamic", cascade="all"))


class SiteData(Base):
    """
    The management data for the semi-fixed portion of the Site Array.
    """
    __tablename__ = "site_data"

    id = Column(Integer, primary_key=True)
    integrator = Column(String(12))
    owner = Column(String(16))
    sitename = Column(String(12), unique=True)
    location = Column(String(32))
    version = Column(String(8))
    timezone = Column(String(32))

    # Graph data stored as JSON
    json = Column(String)
    sa_node_id = Column(String(12))

    def __repr__(self):
        return f"<SiteData {self.sitename}>"

    def datadir(self):
        """
        Get the site array's base directory for storing HDF5 files.
        """
        return f"/data/{self.integrator.strip()}/{self.owner.strip()}/{self.sitename.strip()}/"

    def graph_backup_file(self):
        """
        Get the site array-specific filename for backup JSON data.
        """
        return f"{graph_data_path()}/{self.sitename.strip()}_{self.sa_node_id}.json"


class Macaddr(Base):
    """
    Device MAC Address Registry for Solar Arrays.
    """
    __tablename__ = "macaddr"

    id = Column(Integer, primary_key=True)
    macaddr = Column(String(16))
    sitedata_id = Column(Integer, ForeignKey("site_data.id"))
    target = Column(String(8))
    devtype = Column(String(3))
    comm_date = Column(Date)
    decomm_date = Column(Date)

    sitedata = relationship("SiteData", backref=backref("macaddrs", lazy="dynamic", cascade="all"))

    def __repr__(self):
        return f"<Macaddr {self.macaddr}> at {self.target} for {self.sitedata.sitename}"


class SiteStatus(Base):
    """
    Status info for the site array.
    """
    __tablename__ = "site_status"

    id = Column(Integer, primary_key=True)
    sitedata_id = Column(Integer, ForeignKey("site_data.id"))
    status = Column(String(64))
    commission_date = Column(Date)
    decommission_date = Column(Date)
    last_service_date = Column(DateTime)
    last_cleaning_date = Column(DateTime)

    sitedata = relationship("SiteData", backref=backref("status", lazy="dynamic", cascade="all"))

    def __repr__(self):
        return f"<SiteStatus {self.sitedata.sitename} is {self.status}>"


class SiteManager:
    """
    FastAPI-compatible Site Manager for PostgreSQL, Redis, and HDF5.
    """

    def __init__(self):
        self.db = SessionLocal()

    def __repr__(self):
        return f"SiteManager: {self.current_site()}"

    def site_prop(self, sitename, propname):
        """
        Retrieve a site property from Redis.
        """
        site_data = self.db.query(SiteData).filter_by(sitename=sitename).first()
        if site_data:
            redis_key = f"site:{site_data.sa_node_id}:{propname}"
            return redis_client.get(redis_key) or "(null)"
        return "(null)"

    def site_id(self, sitename=None):
        """
        Return the SiteData ID corresponding to the sitename.
        """
        if sitename is None:
            return None
        site_data = self.db.query(SiteData).filter_by(sitename=sitename).first()
        return site_data.id if site_data else None

    def load(self, sitename):
        """
        Load or reload the site array into Redis from PostgreSQL.
        """
        site_data = self.db.query(SiteData).filter_by(sitename=sitename).first()
        if site_data is None:
            return False

        redis_client.set(f"site:{site_data.sa_node_id}:json", site_data.json)
        return True

    def has_device_type(self, sitename, device_name):
        """
        Check if a site has a particular device type.
        """
        site_data = self.db.query(SiteData).filter_by(sitename=sitename).first()
        if site_data:
            redis_key = f"site:{site_data.sa_node_id}:devtypes"
            devtypes = redis_client.get(redis_key)
            if devtypes:
                return device_name in devtypes.split(",")
        return False

    def has_inverters(self, sitename):
        return self.has_device_type(sitename, "Inverter")

    def has_recombiners(self, sitename):
        return self.has_device_type(sitename, "Recombiner")

    def has_combiners(self, sitename):
        return self.has_device_type(sitename, "Combiner")

    def has_strings(self, sitename):
        return self.has_device_type(sitename, "String")

    def has_panels(self, sitename):
        return self.has_device_type(sitename, "Panel")
