import datetime
import glob
import os
from typing import Any
from typing import Dict
from typing import List
import pytz
from arraytools.util import naturalsorted
from fastapi import HTTPException
from fastapi import Request
from util.hdf5 import HDF5Manager


def mkfile_full_path(h5filename, request):
    """Get the full path for an HDF5 file."""
    if not h5filename.endswith(".h5"):
        h5filename += ".h5"
    return f"/data/{h5filename}"

def daily_h5files(sitename):
    """Return the list of daily HDF5 files for a site."""
    import glob
    pattern = f"/data/{sitename}_*.h5"
    return glob.glob(pattern)


# Utility functions for paths and files
def data_path(request: Request) -> str:
    """Get the data path from the app state or default to '/data'."""
    return getattr(request.app.state, "DATA_PATH", "/data")


def graph_data_path(request: Request) -> str:
    """Get the graph data path from the app state or default path."""
    return getattr(request.app.state, "GRAPH_DATA_PATH", "../../test_data/redisSiteArrays")


def mkfile_site_path(operator: str, administrator: str, sitename: str, request: Request) -> str:
    """Construct the path for a site."""
    path_tuple = (data_path(request), administrator, operator, sitename)
    return os.path.join(*path_tuple)


def mkfile_daily_path(operator: str, administrator: str, sitename: str, date_str: str, request: Request) -> str:
    """Construct the daily path for a site."""
    path_array = [mkfile_site_path(operator, administrator, sitename, request)]
    year_str, month_str, day_str = date_str.split("-")
    path_array.append(year_str)
    path_array.append(month_str.lstrip("0"))
    path_array.append(day_str.lstrip("0"))
    return os.path.join(*path_array)


def daily_mkfiles(operator: str, administrator: str, sitename: str, date_str: str, request: Request) -> List[str]:
    """Return the list of daily metakit files for a specific site and date."""
    path = mkfile_daily_path(operator, administrator, sitename, date_str, request)
    pattern = f"{path}/*.mk"
    print(("daily_mkfiles glob pattern:", pattern))
    return glob.glob(pattern)


# Functions for local time and date
def localtime(request: Request) -> datetime.datetime:
    """Return local time for the current site array."""
    dt = datetime.datetime.now(pytz.timezone("UTC"))
    return dt.astimezone(getattr(request.state, "tz", pytz.UTC))


def localdate(request: Request) -> datetime.date:
    """Return local date for the current site array."""
    return localtime(request).date()


# Whitelists for inputs and devices
input_dev_whitelist = [
    "id", "devtype", "label", "ulabel", "shapes", "bounds", "x", "y", "parent",
    "model_number", "monitors", "attached", "panel-serial", "SentalisId",
]


def input_whitelist(input_array: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Whitelist input devices."""
    new_inputs = []
    for subdict in input_array:
        new_dict = {k: v for k, v in list(subdict.items()) if k in input_dev_whitelist}
        new_inputs.append(new_dict)
    return new_inputs


sitearray_whitelist = [
    "id", "CurrencySymbol", "pref_rotation", "devtypes", "devtype", "label",
    "shapes", "bounds", "location", "address", "city", "state", "country",
    "zipcode", "timezone", "north_offset", "AC_metering", "inverter_metering",
    "inverters", "recombiners", "combiners", "strings", "panels", "monitors",
    "SentalisId",
]

def date_from_mkfilename( mkfilename ):
    """
    Extract the date label from a full path metakit filename.
    """
    filename = mkfilename.split("/")[-1]
    return filename.split("_")[0]


def devices_whitelist(sa_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Whitelist devices for a site array."""
    return {k: v for k, v in list(sa_dict.items()) if k in sitearray_whitelist}


# Sort rows naturally
def sort_row_data(rows: List[List[Any]]) -> List[List[Any]]:
    """Sort rows using naturalsorted."""
    return naturalsorted(rows)


# Decorator replacement for dependency injection
def sitename_required(request: Request):
    """
    Dependency that ensures the sitename exists in the request state.
    """
    sitename = getattr(request.state, "sitename", None)
    if not sitename:
        raise HTTPException(status_code=400, detail="Sitename is required.")
    return sitename
