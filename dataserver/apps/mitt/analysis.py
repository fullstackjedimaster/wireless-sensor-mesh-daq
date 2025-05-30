import json
from clarity_util.metakit import MetakitManager
from dataserver.apps.util.config import load_config
import asyncpg
import argparse

config = load_config()

PG_USER = config["database"]["user"]
PG_PASS = config["database"]["password"]
PG_DB = config["database"]["name"]
PG_HOST = config["database"]["host"]

mk_manager = MetakitManager("/data/rollups/")  # ✅ Legacy Metakit path

async def run_fault_analysis(use_postgres=False):
    """Perform fault analysis based on Metakit rollups."""
    rollups = mk_manager.read_rollup("rollups_15min")

    faults = []
    for record in rollups:
        node_id = record["node_id"]
        power = float(record["avg_power"])
        voltage = float(record["avg_voltage"])

        if power < 10 or voltage < 20:
            faults.append({
                "node_id": node_id,
                "fault": "LOW_POWER" if power < 10 else "LOW_VOLTAGE",
                "timestamp": record["timestamp"]
            })

    if use_postgres:
        pg_conn = await asyncpg.connect(user=PG_USER, password=PG_PASS, database=PG_DB, host=PG_HOST)
        for fault in faults:
            await pg_conn.execute('''
                INSERT INTO fault_summary (node_id, fault_type, timestamp)
                VALUES ($1, $2, $3)
            ''', fault["node_id"], fault["fault"], fault["timestamp"])
        print("[✅] Fault summary inserted into PostgreSQL.")
        await pg_conn.close()

    # ✅ Also save faults to Metakit
    mk_manager.insert_rollup("faults_summary", faults)
    print(f"[📂] Fault summary saved to Metakit. {len(faults)} records.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run fault analysis.")
    parser.add_argument("--pg", action="store_true", help="Store results in PostgreSQL")
    args = parser.parse_args()

    import asyncio
    asyncio.run(run_fault_analysis(use_postgres=args.pg))
