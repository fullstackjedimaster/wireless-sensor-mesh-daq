from apps.sitedata.models import SiteData
from apps.sitedata.restore import restore_to_redis_from_json
from redis import Redis
from sqlalchemy.orm import Session


class SiteManager:
    """
    A FastAPI and PostgreSQL-aware interface to manage the Redis database for site arrays.
    """

    def __init__(self, redis_url: str, session: Session):
        self.redis_url = redis_url
        self.rdb_mgr = {}
        self.session = session

    def get_redis_client(self, db: int) -> Redis:
        """
        Return a Redis client connected to the specified database.
        """
        return Redis.from_url(self.redis_url, db=db)

    def load(self, sitename: str, overwrite: bool = True) -> bool:
        """
        Load or reload the site array into Redis from PostgreSQL.
        """
        if self.is_loaded(sitename):
            if overwrite:
                self.clear(sitename)
            else:
                return True

        slot_id = self.next_slot()
        self.rdb_mgr[sitename] = slot_id
        rdb = self.get_redis_client(db=slot_id)

        sitedata = self.session.query(SiteData).filter_by(sitename=sitename).first()
        if not sitedata:
            return False

        return restore_to_redis_from_json(sitedata.json, client=rdb)

    def is_loaded(self, sitename: str) -> bool:
        """
        Check if a site is loaded in Redis.
        """
        return sitename in self.rdb_mgr

    def clear(self, sitename: str):
        """
        Clear the Redis database for the specified site.
        """
        slot_id = self.rdb_mgr.pop(sitename, None)
        if slot_id:
            client = self.get_redis_client(db=slot_id)
            client.flushdb()

    def next_slot(self) -> int:
        """
        Find the next available Redis database slot.
        """
        used_slots = set(self.rdb_mgr.values())
        for slot in range(1, 16):
            if slot not in used_slots:
                return slot
        raise Exception("No Redis slots available.")
