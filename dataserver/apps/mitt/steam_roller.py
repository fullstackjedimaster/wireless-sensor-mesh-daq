import os
from clarity_util.metakit import MetakitManager
from dataserver.apps.util.config import load_config
import asyncpg
import argparse

config = load_config()

PG_USER = config["database"]["user"]
PG_PASS = config["database"]["password"]
PG_DB = config["database"]["name"]
PG_HOST = config["database"]["host"]

mk_manager = MetakitManager("/data/rollups/")  # ✅ Restore legacy Metakit path

async def generate_rollups(use_postgres=False):
    """Generate rollups from Metakit and optionally store to PostgreSQL."""
    # Legacy 5-minute rollup
    five_minute_rollup = mk_manager.generate_rollup(
        table_name="real_time_data",
        interval="5min"
    )
    print(f"[📂] 5-min rollup: {five_minute_rollup}")

    # Legacy 15-minute rollup
    fifteen_minute_rollup = mk_manager.generate_rollup(
        table_name="real_time_data",
        interval="15min"
    )
    print(f"[📂] 15-min rollup: {fifteen_minute_rollup}")

    if use_postgres:
        pg_conn = await asyncpg.connect(user=PG_USER, password=PG_PASS, database=PG_DB, host=PG_HOST)
        for record in five_minute_rollup:
            await pg_conn.execute('''
                INSERT INTO rollups_5min (node_id, avg_power, avg_voltage, avg_current, timestamp)
                VALUES ($1, $2, $3, $4, $5)
            ''', record["node_id"], record["avg_power"], record["avg_voltage"], record["avg_current"], record["timestamp"])
        print("[✅] 5-min rollups inserted into PostgreSQL.")

        for record in fifteen_minute_rollup:
            await pg_conn.execute('''
                INSERT INTO rollups_15min (node_id, avg_power, avg_voltage, avg_current, timestamp)
                VALUES ($1, $2, $3, $4, $5)
            ''', record["node_id"], record["avg_power"], record["avg_voltage"], record["avg_current"], record["timestamp"])
        print("[✅] 15-min rollups inserted into PostgreSQL.")
        await pg_conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate rollups with Metakit and optionally store to PostgreSQL.")
    parser.add_argument("--pg", action="store_true", help="Store rollups in PostgreSQL")
    args = parser.parse_args()

    import asyncio
    asyncio.run(generate_rollups(use_postgres=args.pg))
