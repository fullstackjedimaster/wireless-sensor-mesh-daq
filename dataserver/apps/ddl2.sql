BEGIN;

CREATE SCHEMA IF NOT EXISTS ss;

CREATE TABLE IF NOT EXISTS ss.site (
    id SERIAL PRIMARY KEY,
    integrator VARCHAR(32) NOT NULL,
    owner VARCHAR(32) NOT NULL,
    sitename VARCHAR(32) NOT NULL UNIQUE,
    UNIQUE (integrator, owner, sitename)
);

CREATE TABLE IF NOT EXISTS ss.site_array (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES ss.site(id) ON DELETE CASCADE,
    label VARCHAR(32),
    version VARCHAR(8),
    status VARCHAR(32),
    timezone VARCHAR(24),
    commission_date DATE,
    decommission_date DATE,
    last_service_date TIMESTAMP,
    last_cleaning_date TIMESTAMP,
    center_lat DOUBLE PRECISION,
    center_lon DOUBLE PRECISION,
    offset_dir DOUBLE PRECISION,
    extent_hi_x INTEGER,
    extent_hi_y INTEGER,
    extent_lo_x INTEGER,
    extent_lo_y INTEGER,
    preferred_rotation INTEGER
);

CREATE TABLE IF NOT EXISTS ss.inverters (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ss.strings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    inverter_id INTEGER NOT NULL REFERENCES ss.inverters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ss.equipment (
    id SERIAL PRIMARY KEY,
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS ss.monitors (
    id SERIAL PRIMARY KEY,
    mac_address VARCHAR(17) NOT NULL UNIQUE,
    node_id VARCHAR(50) NOT NULL UNIQUE,
    string_id INTEGER NOT NULL REFERENCES ss.strings(id) ON DELETE CASCADE,
    string_position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ss.panels (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    monitor_id INTEGER NOT NULL UNIQUE REFERENCES ss.monitors(id) ON DELETE CASCADE,
    inverter_id INTEGER NOT NULL REFERENCES ss.inverters(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES ss.equipment(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ss.gateways (
    id SERIAL PRIMARY KEY,
    mac_address VARCHAR(17) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ss.site_data (
    id SERIAL PRIMARY KEY,
    integrator VARCHAR(12),
    owner VARCHAR(16),
    sitename VARCHAR(12) UNIQUE,
    location VARCHAR(32),
    version VARCHAR(8),
    timezone VARCHAR(32),
    json TEXT,
    sa_node_id VARCHAR(12)
);

CREATE TABLE IF NOT EXISTS ss.site_graph (
    id SERIAL PRIMARY KEY,
    sitearray_id INTEGER NOT NULL REFERENCES ss.site_array(id) ON DELETE CASCADE,
    r_graph_id VARCHAR(12),
    json TEXT
);

CREATE TABLE IF NOT EXISTS ss.device_data (
    id SERIAL PRIMARY KEY,
    node_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    voltage REAL,
    current REAL,
    power REAL,
    status TEXT
);

END;
