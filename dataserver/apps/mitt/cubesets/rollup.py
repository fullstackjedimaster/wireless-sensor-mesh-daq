import datetime
from dataserver.apps.util.hdf5 import HDF5Manager

# ✅ Instantiate HDF5Manager only once
hdf5_manager = HDF5Manager(db_dir="h5_files")

def generate_5min_rollup():
    """Generate 5-minute rollups from monitor raw .h5 files."""
    monitor_data = hdf5_manager.query("opt_raw")

    rollup_results = {}

    for record in monitor_data:
        node_id = record["node_id"]
        timestamp = datetime.datetime.fromisoformat(record["timestamp"])
        period = timestamp.replace(second=0, microsecond=0, minute=(timestamp.minute // 5) * 5)

        if period not in rollup_results:
            rollup_results[period] = {
                "node_id": node_id,
                "total_power": 0,
                "count": 0,
            }

        rollup_results[period]["total_power"] += record["power"]
        rollup_results[period]["count"] += 1

    # ✅ Create the rollup table if it doesn’t exist
    hdf5_manager.create_table("rollup_period_5min", schema={
        "timestamp": "S19",
        "node_id": "S10",
        "avg_power": "f8"
    })

    for period, result in list(rollup_results.items()):
        avg_power = result["total_power"] / result["count"]
        hdf5_manager.insert("rollup_period_5min", {
            "timestamp": period.isoformat(),
            "node_id": result["node_id"],
            "avg_power": round(avg_power, 2),
        })

    print("[✅] 5-Minute Rollups Generated.")

if __name__ == "__main__":
    generate_5min_rollup()
