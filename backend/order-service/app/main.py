from fastapi import FastAPI

from app.database.database import Base, engine
from app.routers.order_router import router as order_router


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="SmartRetailX Order Service",
    description=(
        "Order management microservice for SmartRetailX. "
        "This service creates orders, validates product stock, "
        "calculates totals, manages order statuses, and communicates "
        "with the Product Service."
    ),
    version="1.0.0"
)


# =========================================================
# REGISTER ROUTERS
# =========================================================

app.include_router(order_router)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():
    return {
        "service": "SmartRetailX Order Service",
        "status": "running",
        "version": "1.0.0"
    }


# =========================================================
# HEALTH CHECK ENDPOINT
# =========================================================

@app.get("/health")
def health_check():
    return {
        "service": "order-service",
        "status": "healthy"
    }

from fastapi.middleware.cors import CORSMiddleware

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