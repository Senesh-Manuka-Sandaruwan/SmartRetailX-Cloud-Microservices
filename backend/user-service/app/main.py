from fastapi import FastAPI
from sqlalchemy import text

from app.database.database import engine

app = FastAPI(
    title="User Service",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "User Service Running"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "Database Connected"
        }
    except Exception as e:
        return {
            "status": "Database Connection Failed",
            "error": str(e)
        }

from app.models.user import User
from app.database.database import Base, engine

Base.metadata.create_all(bind=engine)