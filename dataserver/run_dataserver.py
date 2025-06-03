import os
import subprocess
import time

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    catcher = os.path.join(root, "run_catcher.py")
    uvicorn_bin = os.path.join(root, ".venv", "bin", "uvicorn")

    print("Running run_catcher.py...")
    subprocess.Popen(["python3", catcher])

    print("Running FastAPI app...")
    subprocess.Popen(
        [uvicorn_bin, "dataserver.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=os.path.dirname(root)
    )

    # 🧠 Prevent systemd from thinking we're done
    while True:
        time.sleep(3600)

if __name__ == "__main__":
    main()
