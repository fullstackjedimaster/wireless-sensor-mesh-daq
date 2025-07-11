#!/usr/bin/env python3
import subprocess
import time
import sys
import os
import signal
from bootstrap_path import add_project_root

# ✅ Ensure all imports resolve from dataserver root
add_project_root()
project_root = os.path.abspath(os.path.dirname(__file__))

child_procs = []

def shutdown(signum, frame):
    print(f"[run_dataserver] Received signal {signum}. Terminating child processes...")
    for proc in child_procs:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
                print(f"[run_dataserver] Terminated PID {proc.pid}")
            except subprocess.TimeoutExpired:
                proc.kill()
                print(f"[run_dataserver] Force-killed PID {proc.pid}")
    sys.exit(0)

def main():
    # Hook signals
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    catcher_path = os.path.join(project_root, "run_catcher.py")
    uvicorn_bin = os.path.join(project_root, ".venv", "bin", "uvicorn")
    python_bin = os.path.join(project_root, ".venv", "bin", "python3")

    print("[run_dataserver] Launching run_catcher.py...")
    catcher_proc = subprocess.Popen([python_bin, catcher_path])
    child_procs.append(catcher_proc)

    print("[run_dataserver] Launching FastAPI app (uvicorn)...")
    uvicorn_proc = subprocess.Popen([
        uvicorn_bin,
        "apps.main:app",
        "--host", "0.0.0.0",
        "--port", "8000"
    ], cwd=project_root)
    child_procs.append(uvicorn_proc)

    print("[run_dataserver] Dataserver is running.")
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        shutdown(signal.SIGINT, None)

if __name__ == "__main__":
    main()
