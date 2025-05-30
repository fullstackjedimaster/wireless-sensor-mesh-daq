import json
import random
import time

TEST_DATA_PATH = "//apps/static/test_data.json"

# 🗺️ Fixed Panel Positions
PANEL_POSITIONS = [
    {"id": "1", "x": 100, "y": 150},
    {"id": "2", "x": 250, "y": 150},
    {"id": "3", "x": 400, "y": 150},
    {"id": "4", "x": 550, "y": 150}
]

def generate_fixed_data():
    """Generate data with fixed positions but dynamic statuses & metrics."""
    panels = []

    for panel in PANEL_POSITIONS:
        panels.append({
            "id": panel["id"],
            "x": str(panel["x"]),
            "y": str(panel["y"]),
            "status": random.choice(["OK", "WARNING", "FAULT"]),
            "voltage": f"{random.uniform(35.0, 45.0):.2f}",
            "current": f"{random.uniform(4.0, 6.0):.2f}",
            "power": f"{random.uniform(150.0, 300.0):.2f}"
        })

    # Save to JSON
    with open(TEST_DATA_PATH, "w") as f:
        json.dump({"live_sitearray": panels}, f, indent=4)

def run():
    """Continuously update panel statuses without moving positions."""
    print("[🔧] Generating fake sitearray data every 2s...")
    while True:
        generate_fixed_data()
        print("[⚙️] Updated panel statuses.")
        time.sleep(2)

if __name__ == "__main__":
    run()
