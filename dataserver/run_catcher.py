import asyncio
from apps.mitt.catcher import Catcher
from apps.util.logger import make_logger
from apps.util.managers.nats_manager import nats_manager

logger = make_logger("run_catcher")

async def main():
    logger.info("Starting Catcher process...")

    # Optional: override NATS server if needed
    # nats_manager.set_server("nats://localhost:4222")

    await nats_manager.connect()

    catcher = Catcher()
    await catcher.start()

    try:
        # Run indefinitely
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("Shutting down Catcher...")
        await nats_manager.disconnect()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        logger.exception(f"Fatal error in run_catcher: {e}")
