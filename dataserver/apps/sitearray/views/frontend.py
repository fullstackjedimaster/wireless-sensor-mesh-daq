import string
from typing import List
from urllib.parse import unquote_plus

import pytz
from apps.issue.util import top_issues
from apps.sitearray.models import SiteArray
from dataserver.apps.util import init_session
from database import get_db  # Replace with your database setup
from fastapi import APIRouter
from fastapi import Depends
from fastapi import Form
from fastapi import HTTPException
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

# FastAPI router
router = APIRouter()

# Jinja2 templates
templates = Jinja2Templates(directory="templates")


class BadRequestDataTypeException(Exception):
    """Exception to raise if the Request is poorly formed."""
    def __init__(self, label):
        self.label = label

    def __repr__(self):
        return f"Request |{self.label}| not handled"


class SiteArrayMissingException(Exception):
    """Exception to raise if the Site Array is not found."""
    def __init__(self, sitename, arrayname):
        self.sitename = sitename
        self.arrayname = arrayname

    def __repr__(self):
        return f"Site |{self.sitename}|{self.arrayname}| not found"


def _check_request_type(label: str, csv_allowed: bool = False):
    """
    See if a specific datatype has been requested.
    """
    label = unquote_plus(label)
    if "." not in label:
        return "html", label
    if label.endswith(".json"):
        return "json", label[:-5]
    if csv_allowed and label.endswith(".csv"):
        return "csv", label[:-4]
    if label.endswith(".html"):
        return "html", label[:-5]
    raise BadRequestDataTypeException(label)


# Dependencies
async def get_sitearray(db: Session = Depends(get_db)) -> SiteArray:
    sitearray_id = 1  # Replace with logic to fetch the current sitearray ID
    sitearray = db.query(SiteArray).get(sitearray_id)
    if not sitearray:
        raise HTTPException(status_code=404, detail="SiteArray not found")
    return sitearray


@router.get("/")
async def index(sitearray: SiteArray = Depends(get_sitearray)):
    """
    Shows the available site arrays in the database.
    """
    if sitearray:
        return RedirectResponse(url="/ss/array/")
    return templates.TemplateResponse("sitearray/index.html", {"request": {}})


async def _setarray(array_id: int, db: Session = Depends(get_db)) -> SiteArray:
    """
    Set the current array.
    """
    sitearray = db.query(SiteArray).get(array_id)
    if sitearray:
        init_session()  # Replace with your session initialization logic
        # Simulate session handling (e.g., storing sitearray info)
    else:
        raise HTTPException(status_code=404, detail="SiteArray not found")
    return sitearray


@router.get("/setarray/{array_id}")
async def setarray(array_id: int = 0, db: Session = Depends(get_db)):
    """
    Set the current or specified array.
    """
    if array_id != 0:
        sitearray = await _setarray(array_id, db)
        return RedirectResponse(url="/ss/summary/")
    return RedirectResponse(url="/ss/")


@router.get("/array")
async def array(sitearray: SiteArray = Depends(get_sitearray)):
    """
    Shows the current array.
    """
    return templates.TemplateResponse("sitearray/array.html", {"request": {}, "sitearray": sitearray})


@router.get("/summary")
async def summary(sitearray: SiteArray = Depends(get_sitearray)):
    issues = top_issues()
    return templates.TemplateResponse(
        "sitearray/summary.html",
        {"request": {}, "sitearray": sitearray, "issues": issues},
    )


@router.get("/dashboard")
async def dashboard(sitearray: SiteArray = Depends(get_sitearray)):
    issues = top_issues()
    zones = sitearray.zones  # Assuming zones are accessible via relationship

    return templates.TemplateResponse(
        "sitearray/dashboard3.html",
        {"request": {}, "sitearray": sitearray, "issues": issues, "zones": zones},
    )


@router.get("/devices")
async def devices(sitearray: SiteArray = Depends(get_sitearray)):
    """
    Show the device hierarchy for the current sitearray.
    """
    devices_data = {
        "id": sitearray.id,
        "sitename": sitearray.site.sitename,
        "label": sitearray.label,
        "owner": sitearray.site.owner,
        "integrator": sitearray.site.integrator,
        "inverters": [],
    }

    for inverter in sitearray.inverters:
        inverter_dict = {
            "id": inverter.id,
            "label": inverter.label,
            "combiners": [],
        }
        for combiner in inverter.combiners:
            combiner_dict = {
                "id": combiner.id,
                "label": combiner.label,
                "strings": [],
            }
            for pstring in combiner.strings:
                pstring_dict = {
                    "id": pstring.id,
                    "label": pstring.label,
                    "panels": [
                        {"id": panel.id, "label": panel.label} for panel in pstring.panels
                    ],
                }
                combiner_dict["strings"].append(pstring_dict)
            inverter_dict["combiners"].append(combiner_dict)
        devices_data["inverters"].append(inverter_dict)

    return JSONResponse(content={"sitearray": devices_data})


@router.get("/zones")
async def zones(sitearray: SiteArray = Depends(get_sitearray)):
    """
    Show the zones for the current sitearray.
    """
    zones_data = {
        "id": sitearray.id,
        "sitename": sitearray.site.sitename,
        "label": sitearray.label,
        "owner": sitearray.site.owner,
        "integrator": sitearray.site.integrator,
        "zones": [
            {
                "id": zone.id,
                "label": zone.label,
                "panels": [
                    {"id": panel.id, "label": panel.label} for panel in zone.panels
                ],
            }
            for zone in sitearray.zones
        ],
    }

    return JSONResponse(content={"sitearray": zones_data})
