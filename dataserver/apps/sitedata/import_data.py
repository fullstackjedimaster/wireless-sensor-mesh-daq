import csv
import logging

from apps.sitedata.access import DeviceNode
from apps.sitedata.access_utils import update_extents
from fastapi import Depends
from fastapi import FastAPI
from fastapi import HTTPException

app = FastAPI()

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

SPTI_prefix = "F4E6D700"
OLD_SPTI_prefix = "0050C2468FFF"


def import_panel_data_from_csv(filename: str):
    """
    Import panel and monitor device data from a CSV file.
    """
    try:
        with open(filename, mode='r') as file:
            reader = csv.reader(file)
            have_headers = False
            data = []
            for row in reader:
                if have_headers:
                    datum = {
                        "x": row[0],
                        "y": row[1],
                        "serial": row[2],
                        "string": row[3],
                        "panel": row[4],
                        "inverter": row[5],
                        "macaddr": row[6],
                    }
                    data.append(
                        ("%04s-%04s_%04s" % (datum["inverter"], datum["string"], datum["panel"]), datum)
                    )
                else:
                    # Confirm the expected pattern
                    assert row[0].lower() == "x"
                    assert row[1].lower() == "y"
                    assert "serial" in row[2].lower()
                    assert "string" in row[3].lower()
                    assert "panel" in row[4].lower()
                    assert "inverter" in row[5].lower()
                    assert "macaddr" in row[6].lower()
                    have_headers = True
            data.sort()
            result = [datum for _, datum in data]
            return result
    except Exception as e:
        logger.error(f"Error importing panel data from CSV: {e}")
        raise HTTPException(status_code=500, detail="Failed to import panel data")


def add_devices(mgr, sitearray_node, panel_data, extents, expected_panels=None):
    inverter_count = 0
    string_count = 0
    panel_count = 0
    unknown_count = 0
    macaddrs = {}
    for device in panel_data:
        panel_count += 1
        if device["inverter"] != "":
            inverter_node_id = f"I-{device['inverter']}"
            if mgr.has_node(inverter_node_id):
                inv_node = mgr.get_node(inverter_node_id)
                inverter_label = inv_node.property("label")
            else:
                inverter_label = f"Inv{int(device['inverter']):02d}"
                inverter_count += 1
                inv_node = DeviceNode(
                    inverter_node_id, client=mgr.rdb, label=inverter_label
                )
                inv_node.hook_into(sitearray_node)

            string_node_id = f"S-{device['string']}"
            if mgr.has_node(string_node_id):
                string_node = mgr.get_node(string_node_id)
                string_label = string_node.property("label")
            else:
                string_label = f"S{int(device['string']):02d}"
                string_count += 1
                string_node = DeviceNode(
                    string_node_id, client=mgr.rdb, label=string_label
                )
                string_node.hook_into(inv_node)

            # Create and position this panel node (hard-wired for TPW1 for now)
            panel_node_id = f"P-{panel_count}"
            panel_label = f"P{int(device['panel']):02d}"
            ulabel = f"{string_label}|{panel_label}"
            devx = int(device["x"]) - 1
            x = float(devx) * 1.5
            devy = 9 - int(device["y"])
            y = float(devy) * 1.85
            update_extents(extents, x, y, 1.2, 1.8)
            panel_node = DeviceNode(
                panel_node_id,
                client=mgr.rdb,
                label=panel_label,
                ulabel=ulabel,
                x=x,
                y=y,
                serial=device["serial"],
            )
            panel_node.hook_into(string_node)

            plm_node_id = f"PLM-{panel_count}"
            macaddr = device["macaddr"]
            if macaddr == "":
                macaddr = "0000000000000000"
            elif len(macaddr) == 4:
                macaddr = OLD_SPTI_prefix + macaddr
            elif len(macaddr) == 6:
                macaddr = macaddr[1:5]
                macaddr = OLD_SPTI_prefix + macaddr
            elif len(macaddr) == 8:
                macaddr = SPTI_prefix + macaddr
            elif len(macaddr) == 10:
                macaddr = macaddr[1:9]
                macaddr = SPTI_prefix + macaddr
            elif len(macaddr) == 16:
                pass
            elif len(macaddr) == 18:
                macaddr = macaddr[1:17]
            else:
                logger.error(f"Error: Bad macaddr encountered: {macaddr}")
                continue

            if macaddr in macaddrs:
                logger.warning(f"Warning: Duplicate macaddr: {macaddr}")
                macaddrs[macaddr] += 1
            else:
                macaddrs[macaddr] = 1

            plm_node = DeviceNode(
                plm_node_id, client=mgr.rdb, ulabel=ulabel, macaddr=macaddr
            )
            plm_node.hook_into(panel_node)
        else:
            # Create an uncommissioned panel
            uncom_panel_node_id = f"UP-{panel_count}"
            panel_label = "Unknown"
            y = (0.00 - (float(device["x"]) * 20.0)) - 590.0
            x = (0.00 - (float(device["y"]) * 20.0)) + 100.0
            update_extents(extents, x, y, 0.0, 0.0)
            panel_node = DeviceNode(
                uncom_panel_node_id,
                client=mgr.rdb,
                label=panel_label,
                x=x,
                y=y,
                serial=device["serial"],
            )
            panel_node.hook_into(sitearray_node)
            unknown_count += 1

    logger.info(f"panel/monitors with macaddrs: {len(macaddrs)}")
    logger.info(f"unknown panels: {unknown_count}")
    logger.info(f"panel/monitors without macaddrs: {panel_count - unknown_count - len(macaddrs)}")
    logger.info(f"inverters: {inverter_count}")
    logger.info(f"strings: {string_count}")

    if expected_panels is not None:
        # Check that each string has the correct number of panels
        sa_node = mgr.current_sitearray()
        str_node_ids = sa_node.strings()
        for str_node_id in str_node_ids:
            str_node = mgr.get_node(str_node_id)
            panels = str_node.panels()
            if len(panels) != expected_panels:
                logger.warning(f"String {str_node.property('label')} has {len(panels)} panels.")

    # Additional checks for commissioning errors (if needed)
