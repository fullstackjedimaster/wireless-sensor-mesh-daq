#!/usr/bin/env python3
import subprocess
import os
import time
import signal
import sys

# Global to store child PIDs
child_procs = []

def shutdown(signum, frame):
    print(f"[run_meshserver] Received signal {signum}. Shutting down children...")
    for proc in child_procs:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
                print(f"[run_meshserver] Terminated PID {proc.pid}")
            except subprocess.TimeoutExpired:
                proc.kill()
                print(f"[run_meshserver] Force-killed PID {proc.pid}")
    sys.exit(0)

def main():
    base = os.path.dirname(os.path.abspath(__file__))

    # Trap TERM and INT for clean shutdown
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    print("[run_meshserver] Launching rundaq.py...")
    rundaq_proc = subprocess.Popen(["python3", os.path.join(base, "rundaq.py")])
    child_procs.append(rundaq_proc)

    print("[run_meshserver] Launching emulator.py...")
    emulator_proc = subprocess.Popen(["python3", os.path.join(base, "emulator.py")])
    child_procs.append(emulator_proc)

    print("[run_meshserver] Meshserver is running.")
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        shutdown(signal.SIGINT, None)

if __name__ == "__main__":
    main()
