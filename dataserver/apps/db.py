from apps.sitearray.models import Site
from apps.sitearray.models import SiteArray
from apps.sitearray.models import SiteGraph
from apps.database import Base, SessionLocal, engine  # ✅ Correct Imports

# ✅ Ensure all tables are created
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

# ✅ Example: Perform database operations
db = SessionLocal()
try:
    # Example query (modify as needed)
    site = Site(integrator="Test Integrator", owner="Test Owner", sitename="Test Site")
    db.add(site)
    db.commit()
    print("Data inserted successfully!")
finally:
    db.close()
