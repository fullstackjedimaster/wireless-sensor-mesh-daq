from os import abort

from apps.mkdata.models import MkFile
from apps.mkdata.views.frontend import daily_env
from apps.sitearray.models import SiteArray
from fastapi import Request
from fastapi import Response
from fastapi.templating import Jinja2Templates
from sqlalchemy import desc
from sqlalchemy import or_

templates = Jinja2Templates(directory="templates")


def array( request: Request, site_id ):
    """
    Shows the specified array.
    """
    sitearray = SiteArray.query.filter_by( site_id=site_id ).one()
    request.state.sitearray_id = sitearray.id
    request.state.sitearray = sitearray
    mkfiles = sitearray.site.mkfiles.order_by(desc(MkFile.date))
    return templates.TemplateResponse("admin/sitearray/array.html", sitearray = sitearray, mkfiles=mkfiles)


def recent_mkfiles(param, param1):
    pass


def daily_string(id, string_id, param, param1):
    pass


def latest_daily_vi_strint( string_id ):
    """
    Get the latest 'strint' file with 5 min data and show the V_mean column.
    """
    mkfiles = recent_mkfiles( 3, "strint" )
    for mkfile in mkfiles:
        if mkfile.period == "300":
            return daily_string( mkfile.id, string_id, "V_mean", "admin" )
    abort()


def daily_strcalc(id, string_id, param, param1):
    pass


def latest_daily_vi_strcalc( string_id ):
    """
    Get the latest 'strcalc' file with 5 min data and show the Vi_mean column.
    """
    mkfiles = recent_mkfiles( 3, "strcalc" )
    for mkfile in mkfiles:
        if mkfile.period == "300":
            return daily_strcalc( mkfile.id, string_id, "Vi_mean", "admin" )
    abort()


def daily_panel(id, panel_id, param, param1):
    pass


def latest_daily_vi_panel( panel_id ):
    """
    Get the latest 'opt' file with 5 min data and show the Vi_mean column.
    """
    mkfiles = recent_mkfiles( 3, "opt" )
    for mkfile in mkfiles:
        if mkfile.period == "300":
            return daily_panel( mkfile.id, panel_id, "Vi_mean", "admin" )
    abort()



def latest_daily_env( mkfileid=None):
    """
    Get the latest 'env' file with 5 min data and show the irradiance_avg column.
    """
    if mkfileid is None:
        mkfiles = recent_mkfiles( 3, "env" )
        for mkfile in mkfiles:
            if mkfile.period == "300":
                return daily_env( mkfile.id, "irradiance_mean", "admin" )
        abort()
    return daily_env( mkfileid, "irradiance_mean", "admin" )



def alert_files(request: Request):
    """
    Get the "alert" cube files. Return them segregated by day.
    dtypes: detectprob, cleanadv, watchlist, cleanwatchlist
    Only go for 5 minutes rollups for now.
    """
    # alert_files = MkFile.query.filter_by(dtype="detectprob").filter_by(site_id=request.state.sitearray.site_id).order_by('date')
    alert_files = MkFile.query.filter(or_(MkFile.dtype=="cleanadv", MkFile.dtype=="detectprob", MkFile.dtype=="watchlist", MkFile.dtype=="cleanwatchlist")).filter_by(site_id=request.state.sitearray.site_id).order_by('date')
    # alert_files = MkFile.query.filter(MkFile.dtype.endswith("list")).filter_by(site_id=request.state.sitearray.site_id).order_by('date')
    return templates.TemplateResponse("admin/sitearray/related_files.html", related_files=alert_files, filetype="alert")


def solarnoon_files(request: Request):
    """
    Get the "solar noon" cube files. Return them segregated by day.
    """
    solarnoon_files = MkFile.query.filter(MkFile.dtype.endswith("slrnoon")).filter_by(site_id=request.state.sitearray.site_id).order_by('date')
    return templates.TemplateResponse("admin/sitearray/related_files.html", related_files=solarnoon_files, filetype="solarnoon")



def ambienttemp_files(request: Request):
    """
    Get the "ambient temperature" cube files. Return them segregated by day.
    """
    ambienttemp_files = MkFile.query.filter(MkFile.dtype.endswith("ambtmp")).filter_by(site_id=request.state.sitearray.site_id).order_by('date')
    return templates.TemplateResponse("admin/sitearray/related_files.html", related_files=ambienttemp_files, filetype="ambient_temperature")



def paneltemp_files(request: Request):
    """
    Get the "panel temperature" cube files. Return them segregated by day.
    """
    paneltemp_files = MkFile.query.filter(MkFile.dtype.endswith("pnltmp")).filter_by(site_id=request.state.sitearray.site_id).order_by('date')
    return templates.TemplateResponse("admin/sitearray/related_files.html", related_files=paneltemp_files, filetype="panel_temperature")



def irradiance_files(request: Request):
    """
    Get the "irradiance" cube files. Return them segregated by day.
    """
    irradiance_files = MkFile.query.filter(MkFile.dtype.endswith("irrad")).filter_by(site_id=request.state.sitearray.site_id).order_by('date')
    return templates.TemplateResponse("admin/sitearray/related_files.html", related_files=irradiance_files, filetype="irradiance")


def sum_files(request: Request):
    """
    Get the "sum" cube files. Return them segregated by day.
    """
    sum_files = MkFile.query.filter(MkFile.dtype.endswith("sum")).filter_by(site_id=request.state.sitearray.site_id).order_by('date')
    return templates.TemplateResponse("admin/sitearray/related_files.html", related_files=sum_files, filetype="sum")


def avg_files(request: Request):
    """
    Get the "sum" cube files. Return them segregated by day.
    """
    avg_files = MkFile.query.filter(MkFile.dtype.endswith("arrayavg")).filter_by(site_id=request.state.sitearray.site_id).order_by('date')
    return templates.TemplateResponse("admin/sitearray/related_files.html", related_files=avg_files, filetype="array_average")

