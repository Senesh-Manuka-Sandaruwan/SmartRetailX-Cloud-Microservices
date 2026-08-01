from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.database import Base, engine

from app.models.product import Product
from app.models.category import Category

from app.routers.product_router import router as product_router
from app.routers.category_router import router as category_router


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SmartRetailX Product Service",
    description=(
        "Product and Category Management "
        "Microservice"
    ),
    version="1.0.0"
)


# ==========================================
# CORS CONFIGURATION
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ==========================================
# REGISTER ROUTERS
# ==========================================
app.include_router(product_router)
app.include_router(category_router)


# ==========================================
# ROOT ENDPOINT
# ==========================================
@app.get(
    "/",
    tags=["Root"]
)
def root():
    return {
        "service": "Product Service",
        "status": "Running",
        "version": "1.0.0",
        "features": [
            "Product Management",
            "Category Management",
            "Product Image URLs"
        ]
    }


# ==========================================
# HEALTH CHECK
# ==========================================
@app.get(
    "/health",
    tags=["Health"]
)
def health():
    try:
        with engine.connect() as connection:
            connection.execute(
                text("SELECT 1")
            )

        return {
            "status": "Healthy",
            "database": "Connected",
            "service": "product-service"
        }

    except Exception as error:
        return {
            "status": "Unhealthy",
            "database": "Disconnected",
            "service": "product-service",
            "error": str(error)
        }