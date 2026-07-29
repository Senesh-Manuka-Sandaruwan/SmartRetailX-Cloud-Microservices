from fastapi import FastAPI
from sqlalchemy import text

from app.database.database import engine

app = FastAPI(
    title="Product Service",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Product Service Running"
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

from app.models.product import Product
from app.database.database import Base, engine

Base.metadata.create_all(bind=engine)

from app.routers.product_router import router as product_router
app.include_router(product_router)