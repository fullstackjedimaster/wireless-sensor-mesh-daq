import subprocess
import os

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    catcher = os.path.join(root, "run_catcher.py")

    print("Running run_catcher.py...")
    subprocess.Popen(["python3", catcher])

    print("Running FastAPI app...")
    subprocess.Popen(
        ["uvicorn", "dataserver.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=os.path.dirname(root)  # one level up → project root
    )

if __name__ == "__main__":
    main()
