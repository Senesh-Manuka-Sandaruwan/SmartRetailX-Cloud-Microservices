from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine
from app.models.notification import Notification
from app.routers.notification_router import router as notification_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SmartRetailX Notification Service",
    description=(
        "Notification microservice for creating, retrieving, "
        "updating and deleting customer order notifications."
    ),
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(notification_router)


@app.get("/")
def root():
    return {
        "service": "SmartRetailX Notification Service",
        "status": "running",
        "version": "1.0.0",
        "documentation": "/docs"
    }


@app.get("/health")
def health_check():
    return {
        "service": "notification-service",
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