import psycopg2
import json
from datetime import date

conn = psycopg2.connect(
    dbname="ss",
    user="postgres",
    password="LeartPee1138?",
    host="localhost",
    port="5432"
)
cur = conn.cursor()

# Clear old data
cur.execute("DELETE FROM ss.site_graph")
cur.execute("DELETE FROM ss.monitors")
cur.execute("DELETE FROM ss.panels")
cur.execute("DELETE FROM ss.inverters")
cur.execute("DELETE FROM ss.strings")
cur.execute("DELETE FROM ss.gateways")
cur.execute("DELETE FROM ss.site_array")
cur.execute("DELETE FROM ss.site")

# Create site
cur.execute("INSERT INTO ss.site (sitename) VALUES (%s) RETURNING id", ('TEST',))
site_id = cur.fetchone()[0]

# Create site array
cur.execute("INSERT INTO ss.site_array (site_id, label, timezone, commission_date) VALUES (%s, %s, %s, %s) RETURNING id",
            (site_id, 'Main Array', 'America/Chicago', date.today()))
sitearray_id = cur.fetchone()[0]

# Create gateway
cur.execute("INSERT INTO ss.gateways (macaddr, ip_address) VALUES (%s, %s) RETURNING id",
            ('aa:bb:cc:dd:ee:ff', '192.168.1.1'))
gateway_id = cur.fetchone()[0]

# Create string
cur.execute("INSERT INTO ss.strings (name) VALUES (%s) RETURNING id", ('String 1',))
string_id = cur.fetchone()[0]

# Create inverter
cur.execute("INSERT INTO ss.inverters (serial_number, string_id, gateway_id) VALUES (%s, %s, %s) RETURNING id",
            ('INV-7281-9321', string_id, gateway_id))
inverter_id = cur.fetchone()[0]

# Create 4 panels
panels = [
    ('PNL-1-SN', 'PNL-1', 0),
    ('PNL-2-SN', 'PNL-2', 1),
    ('PNL-3-SN', 'PNL-3', 2),
    ('PNL-4-SN', 'PNL-4', 3),
]
cur.executemany(
    "INSERT INTO ss.panels (serial_number, label, string_id, string_position) VALUES (%s, %s, %s, %s)",
    [(sn, lbl, string_id, pos) for sn, lbl, pos in panels]
)
cur.execute("SELECT id FROM ss.panels WHERE string_id = %s ORDER BY string_position", (string_id,))
panel_ids = [row[0] for row in cur.fetchall()]

# Add monitors
monitors = [
    ('fa:29:eb:6d:87:01', 'M-000001', panel_ids[0], 50, 50),
    ('fa:29:eb:6d:87:02', 'M-000002', panel_ids[1], 150, 50),
    ('fa:29:eb:6d:87:03', 'M-000003', panel_ids[2], 50, 120),
    ('fa:29:eb:6d:87:04', 'M-000004', panel_ids[3], 150, 120),
]
cur.executemany(
    "INSERT INTO ss.monitors (macaddr, node_id, panel_id, x, y) VALUES (%s, %s, %s, %s, %s)",
    monitors
)

# Build site graph
site_graph = {
    "sitearray": {
        "id": f"SA-{sitearray_id:06d}",
        "devtype": "SA",
        "label": "Site Array TEST",
        "timezone": "America/Chicago",
        "inputs": [{
            "id": f"I-{inverter_id:06d}",
            "devtype": "I",
            "label": "Inverter 1",
            "serial": "INV-7281-9321",
            "inputs": [{
                "id": f"S-{string_id:06d}",
                "devtype": "S",
                "label": "String 1",
                "inputs": [{
                    "id": f"P-{i+1:06d}",
                    "devtype": "P",
                    "label": f"PNL-{i+1}",
                    "x": x,
                    "y": y,
                    "inputs": [{
                        "id": node_id,
                        "devtype": "M",
                        "macaddr": mac
                    }]
                } for i, (mac, node_id, _, x, y) in enumerate(monitors)]
            }]
        }]
    }
}
cur.execute("INSERT INTO ss.site_graph (site_array_id, json) VALUES (%s, %s)", (sitearray_id, json.dumps(site_graph)))

conn.commit()
cur.close()
conn.close()
print("Commissioning complete.")
