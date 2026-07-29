from fastapi import FastAPI
from sqlalchemy import text

from app.database.database import Base, engine
from app.models.product import Product
from app.routers.product_router import router as product_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartRetailX Product Service",
    description="Product Management Microservice",
    version="1.0.0"
)

# Register Product Router
app.include_router(product_router)


# ==========================================
# ROOT ENDPOINT
# ==========================================
@app.get("/")
def root():
    return {
        "service": "Product Service",
        "status": "Running",
        "version": "1.0.0"
    }


# ==========================================
# HEALTH CHECK
# ==========================================
@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "Healthy",
            "database": "Connected"
        }

    except Exception as e:
        return {
            "status": "Unhealthy",
            "database": "Disconnected",
            "error": str(e)
        }