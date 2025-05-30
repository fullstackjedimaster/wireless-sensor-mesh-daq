-- Insert base site
INSERT INTO ss.site (id, integrator, owner, sitename)
VALUES (1, 'SPT', 'DemoOwner', 'TEST');

-- Insert equipment type
INSERT INTO ss.equipment (id, manufacturer, model)
VALUES (1, 'DemoPVCo', 'DemoPanel-X100');

-- Insert inverter
INSERT INTO ss.inverters (id, serial_number)
VALUES (1, 'INV-7281-9321');

-- Insert site array
INSERT INTO ss.site_array (
    id, site_id, label, version, status, timezone, commission_date,
    center_lat, center_lon, preferred_rotation
) VALUES (
    1, 1, 'TEST-ARRAY', '1.0', 'OK', 'America/Chicago', CURRENT_DATE,
    30.2672, -97.7431, 180
);

-- Insert string
INSERT INTO ss.strings (id, name, inverter_id)
VALUES (1, 'String 1', 1);

-- Insert 4 monitors
INSERT INTO ss.monitors (id, mac_address, node_id, string_id, string_position)
VALUES 
  (1, 'FA:29:EB:6D:87:01', 'P-000001', 1, 1),
  (2, 'FA:29:EB:6D:87:02', 'P-000002', 1, 2),
  (3, 'FA:29:EB:6D:87:03', 'P-000003', 1, 3),
  (4, 'FA:29:EB:6D:87:04', 'P-000004', 1, 4);

-- Insert 4 panels, each linked to monitor/inverter/equipment
INSERT INTO ss.panels (id, serial_number, name, monitor_id, inverter_id, equipment_id)
VALUES
  (1, 'PNL-1', 'PNL-1', 1, 1, 1),
  (2, 'PNL-2', 'PNL-2', 2, 1, 1),
  (3, 'PNL-3', 'PNL-3', 3, 1, 1),
  (4, 'PNL-4', 'PNL-4', 4, 1, 1);

-- Insert site_data with sa_node_id = root node from graph
INSERT INTO ss.site_data (
    id, integrator, owner, sitename, location, version, timezone, sa_node_id, json
) VALUES (
    1, 'SPT', 'DemoOwner', 'TEST', 'Austin, TX', '1.0', 'America/Chicago', 'SA-000001',
    '{
        "id": "SA-000001",
        "devtype": "SA",
        "label": "Site Array TEST",
        "timezone": "America/Chicago",
        "inputs": [
            {
                "id": "I-000001",
                "devtype": "I",
                "label": "Inverter 1",
                "serial": "INV-7281-9321",
                "inputs": [
                    {
                        "id": "S-000001",
                        "devtype": "S",
                        "label": "String 1",
                        "inputs": [
                            {
                                "id": "P-000001",
                                "devtype": "P",
                                "label": "PNL-1",
                                "macaddr": "FA:29:EB:6D:87:01",
                                "voltage": "0.0",
                                "current": "0.0",
                                "power": "0.0",
                                "temperature": "0.0"
                            },
                            {
                                "id": "P-000002",
                                "devtype": "P",
                                "label": "PNL-2",
                                "macaddr": "FA:29:EB:6D:87:02",
                                "voltage": "0.0",
                                "current": "0.0",
                                "power": "0.0",
                                "temperature": "0.0"
                            },
                            {
                                "id": "P-000003",
                                "devtype": "P",
                                "label": "PNL-3",
                                "macaddr": "FA:29:EB:6D:87:03",
                                "voltage": "0.0",
                                "current": "0.0",
                                "power": "0.0",
                                "temperature": "0.0"
                            },
                            {
                                "id": "P-000004",
                                "devtype": "P",
                                "label": "PNL-4",
                                "macaddr": "FA:29:EB:6D:87:04",
                                "voltage": "0.0",
                                "current": "0.0",
                                "power": "0.0",
                                "temperature": "0.0"
                            }
                        ]
                    }
                ]
            }
        ]
    }'
);

-- Insert site_graph for this array
INSERT INTO ss.site_graph (sitearray_id, r_graph_id, json)
VALUES (
    1,
    'GRAPH-TEST',
    '{
        "id": "SA-000001",
        "devtype": "SA",
        "label": "Site Array TEST",
        "timezone": "America/Chicago",
        "inputs": [
            {
                "id": "I-000001",
                "devtype": "I",
                "label": "Inverter 1",
                "serial": "INV-7281-9321",
                "inputs": [
                    {
                        "id": "S-000001",
                        "devtype": "S",
                        "label": "String 1",
                        "inputs": [
                            {
                                "id": "P-000001",
                                "devtype": "P",
                                "label": "PNL-1",
                                "macaddr": "FA:29:EB:6D:87:01",
                                "voltage": "0.0",
                                "current": "0.0",
                                "power": "0.0",
                                "temperature": "0.0"
                            },
                            {
                                "id": "P-000002",
                                "devtype": "P",
                                "label": "PNL-2",
                                "macaddr": "FA:29:EB:6D:87:02",
                                "voltage": "0.0",
                                "current": "0.0",
                                "power": "0.0",
                                "temperature": "0.0"
                            },
                            {
                                "id": "P-000003",
                                "devtype": "P",
                                "label": "PNL-3",
                                "macaddr": "FA:29:EB:6D:87:03",
                                "voltage": "0.0",
                                "current": "0.0",
                                "power": "0.0",
                                "temperature": "0.0"
                            },
                            {
                                "id": "P-000004",
                                "devtype": "P",
                                "label": "PNL-4",
                                "macaddr": "FA:29:EB:6D:87:04",
                                "voltage": "0.0",
                                "current": "0.0",
                                "power": "0.0",
                                "temperature": "0.0"
                            }
                        ]
                    }
                ]
            }
        ]
    }'
);
