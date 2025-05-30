import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Import all routers
from dataserver.apps.routes import router as main_router

# Initialize FastAPI app
app = FastAPI(
    title="Data Server API",
    description="Backend API for mesh dashboard and visualization",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Mount static files
app.mount("/static", StaticFiles(directory="dataserver/apps/static"), name="static")

# Set up Jinja2 templates (used in routes and partials)
templates = Jinja2Templates(directory="dataserver/apps/templates")

# Include main router
app.include_router(main_router)

# Health check root
@app.get("/", tags=["System"])
async def root():
    return {"message": "Data Server is running!"}


# Entrypoint to run directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
