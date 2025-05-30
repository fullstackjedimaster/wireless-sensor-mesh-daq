# scripts/clear_redis_site.py

import asyncio
from dataserver.apps.util.redis.access_utils import get_redis_client

async def clear_site_slot(slot: int):
    client = await get_redis_client(db=slot)
    keys = await client.keys('*')
    if keys:
        await client.delete(*keys)
        print(f"[✓] Cleared {len(keys)} keys from Redis slot {slot}")
    else:
        print(f"[✓] Redis slot {slot} already empty.")

if __name__ == "__main__":
    asyncio.run(clear_site_slot(3))  # Change slot as needed
