from dataserver.apps.util.hdf5 import HDF5Manager

# ✅ Correct `HDF5Manager` Instantiation
mk_monitor = HDF5Manager(db_dir="h5_files")

class ArrayAvgCube:
    """Computes the mean of the column across the entire array."""

    def process(self):
        monitor_data = mk_monitor.query("opt_raw")

        if not monitor_data:
            return

        total_power = sum(record["power"] for record in monitor_data)
        avg_power = total_power / len(monitor_data)

        print(f"[✅] Array-wide average power: {avg_power}")

if __name__ == "__main__":
    cube = ArrayAvgCube()
    cube.process()
