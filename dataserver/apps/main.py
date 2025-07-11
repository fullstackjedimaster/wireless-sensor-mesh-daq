import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ✅ Add this
from .routes import router as main_router

app = FastAPI(
    title="Data Server API",
    description="Backend API for mesh dashboard and visualization",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ✅ CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OR use ["http://localhost:3001"] for stricter control
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include main routes
app.include_router(main_router, prefix="/daq-demo")

@app.get("/", tags=["System"])
async def root():
    return {"message": "Data Server is running!"}

if __name__ == "__main__":
    uvicorn.run("dataserver.main:app", host="0.0.0.0", port=8000)
