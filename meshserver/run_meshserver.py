import subprocess
import os
import time

def main():
    base = os.path.dirname(os.path.abspath(__file__))

    print("Running rundaq.py...")
    subprocess.Popen(["python3", os.path.join(base, "rundaq.py")])

    print("Running emulator.py...")
    subprocess.Popen(["python3", os.path.join(base, "emulator.py")])

    # ✅ Keep this process alive so systemd doesn't exit
    while True:
        time.sleep(3600)

if __name__ == "__main__":
    main()
