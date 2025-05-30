from clarity_util.hdf5_util import HDF5Manager

def create_simulated_data(sitename):
    """Generate simulated HDF5 data for a site."""
    h5file = f"/data/{sitename}_simulated.h5"
    h5db = HDF5Manager(h5file)
    h5db.open_we()

    simulated_data = [
        {"timestamp": "2025-02-19T12:00:00", "power": 500.0, "temperature": 25.0},
        {"timestamp": "2025-02-19T12:05:00", "power": 520.0, "temperature": 26.0},
    ]

    for row in simulated_data:
        h5db.insert("data", row)

    h5db.commit()
    h5db.close()

if __name__ == "__main__":
    create_simulated_data("test_site")
