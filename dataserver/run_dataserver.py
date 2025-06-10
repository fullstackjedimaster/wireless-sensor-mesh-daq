# run_dataserver.py
import subprocess
import time
import sys
import os

project_root = os.path.abspath(os.path.dirname(__file__))
dataserver_path = os.path.join(project_root, "apps")

# Fix module resolution
sys.path.insert(0, project_root)
sys.path.insert(0, dataserver_path)

def main():
    catcher = os.path.join(project_root, "run_catcher.py")
    uvicorn_bin = os.path.join(project_root, ".venv", "bin", "uvicorn")

    print("Running run_catcher.py...")
    subprocess.Popen([os.path.join(project_root, ".venv", "bin", "python3"), catcher])


    print("Running FastAPI app...")
    subprocess.Popen([
        uvicorn_bin, "apps.main:app", "--host", "0.0.0.0", "--port", "8000"
    ], cwd=project_root)

    # 🧠 Prevent systemd from thinking we're done
    while True:
        time.sleep(3600)

if __name__ == "__main__":
    main()
