import subprocess
import os

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    mesh_path = os.path.join(root, "meshserver", "run_meshserver.py")
    data_path = os.path.join(root, "dataserver", "run_dataserver.py")

    print("Launching meshserver...")
    subprocess.Popen(["python3", mesh_path])

    print("Launching dataserver...")
    subprocess.Popen(["python3", data_path])

if __name__ == "__main__":
    main()
