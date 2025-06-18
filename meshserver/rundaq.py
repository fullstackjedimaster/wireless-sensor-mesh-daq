#!/usr/bin/env python3
"""
rundaq.py - Launches the DAQ system:
- Starts internal and external NATS servers
- Launches DAQProcess
- Ensures singleton execution and graceful shutdown
"""

import asyncio
import subprocess
import logging
import os
import atexit
import signal
import sys
import fcntl

from DAQ.util.logger import make_logger
from DAQ.lib.process import DAQProcess

logger = make_logger("rundaq")

nats_procs = []

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] %(levelname)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def acquire_lock():
    lockfile_path = '/tmp/rundaq.lock'
    lockfile = open(lockfile_path, 'w')
    try:
        fcntl.lockf(lockfile, fcntl.LOCK_EX | fcntl.LOCK_NB)
        logger.info(f"[rundaq] Acquired singleton lock: {lockfile_path}")
    except IOError:
        logger.error("[rundaq] Another instance is already running.")
        sys.exit(1)

async def start_nats_servers():
    logger.info("[NATSManager] Launching local NATS servers (4222 + 5222)...")

    p1 = subprocess.Popen(["nats-server", "-p", "4222"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    p2 = subprocess.Popen(["nats-server", "-p", "5222"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    nats_procs.extend([p1, p2])
    await asyncio.sleep(1)  # Give servers time to start

def shutdown():
    logger.info("[rundaq] Shutting down NATS servers...")
    for proc in nats_procs:
        if proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=3)
                logger.info(f"[rundaq] Terminated NATS process PID={proc.pid}")
            except subprocess.TimeoutExpired:
                proc.kill()
                logger.warning(f"[rundaq] Force-killed unresponsive NATS PID={proc.pid}")

async def run_daq():
    logger.info(f"[rundaq] Running with PID={os.getpid()} UID={os.getuid()} CWD={os.getcwd()}")
    await start_nats_servers()

    logger.info("[rundaq] Launching DAQProcess...")
    daq = DAQProcess()
    await daq.run()

def main():
    setup_logging()
    acquire_lock()
    atexit.register(shutdown)

    # Also trap TERM/INT signals to shut down properly
    signal.signal(signal.SIGTERM, lambda sig, frame: sys.exit(0))
    signal.signal(signal.SIGINT, lambda sig, frame: sys.exit(0))

    try:
        asyncio.run(run_daq())
    except KeyboardInterrupt:
        logger.info("[rundaq] KeyboardInterrupt caught. Exiting.")

if __name__ == "__main__":
    main()
