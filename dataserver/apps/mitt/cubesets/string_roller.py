from dataserver.apps.util.hdf5 import HDF5Manager
import datetime

# ✅ Correct `HDF5Manager` Instantiation
mk_monitor = HDF5Manager(db_dir="h5_files")
mk_env = HDF5Manager(db_dir="h5_files")
mk_string = HDF5Manager(db_dir="h5_files")

def generate_string_rollup():
    """Generate string-level rollups from monitor .h5 files."""
    monitor_data = mk_monitor.query("opt_raw")
    env_data = mk_env.query("env")

    env_temp = {record["timestamp"]: record["temperature"] for record in env_data}

    string_rollup = {}

    for record in monitor_data:
        string_id = record["node_id"][:6]  # e.g., use first 6 chars for string grouping
        timestamp = record["timestamp"]
        if string_id not in string_rollup:
            string_rollup[string_id] = {
                "total_power": 0,
                "count": 0,
                "temperature": env_temp.get(timestamp, None),
            }
        string_rollup[string_id]["total_power"] += record["power"]
        string_rollup[string_id]["count"] += 1

    for string_id, result in list(string_rollup.items()):
        avg_power = result["total_power"] / result["count"]
        mk_string.insert("strcalc_5min", {
            "string_id": string_id,
            "avg_power": round(avg_power, 2),
            "temperature": result["temperature"],
        })

    print("[✅] String-Level Rollups Generated.")

if __name__ == "__main__":
    generate_string_rollup()
