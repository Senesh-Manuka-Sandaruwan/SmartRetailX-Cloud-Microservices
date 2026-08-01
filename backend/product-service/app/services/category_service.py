from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category_schema import (
    CategoryCreate,
    CategoryUpdate
)


class CategoryService:

    @staticmethod
    def get_all_categories(db: Session):
        return (
            db.query(Category)
            .order_by(Category.name.asc())
            .all()
        )

    @staticmethod
    def get_category_by_id(
        db: Session,
        category_id: int
    ):
        return (
            db.query(Category)
            .filter(Category.id == category_id)
            .first()
        )

    @staticmethod
    def get_category_by_name(
        db: Session,
        name: str
    ):
        return (
            db.query(Category)
            .filter(Category.name == name)
            .first()
        )

    @staticmethod
    def create_category(
        db: Session,
        category: CategoryCreate
    ):
        existing_category = (
            CategoryService.get_category_by_name(
                db,
                category.name
            )
        )

        if existing_category:
            raise ValueError(
                "Category already exists."
            )

        db_category = Category(
            name=category.name,
            description=category.description
        )

        db.add(db_category)
        db.commit()
        db.refresh(db_category)

        return db_category

    @staticmethod
    def update_category(
        db: Session,
        category_id: int,
        category: CategoryUpdate
    ):
        db_category = (
            CategoryService.get_category_by_id(
                db,
                category_id
            )
        )

        if not db_category:
            return None

        update_data = (
            category.model_dump(
                exclude_unset=True
            )
        )

        if (
            "name" in update_data
            and update_data["name"] != db_category.name
        ):
            existing_category = (
                CategoryService.get_category_by_name(
                    db,
                    update_data["name"]
                )
            )

            if existing_category:
                raise ValueError(
                    "Category already exists."
                )

        for key, value in update_data.items():
            setattr(
                db_category,
                key,
                value
            )

        db.commit()
        db.refresh(db_category)

        return db_category

    @staticmethod
    def delete_category(
        db: Session,
        category_id: int
    ):
        db_category = (
            CategoryService.get_category_by_id(
                db,
                category_id
            )
        )

        if not db_category:
            return None

        db.delete(db_category)
        db.commit()

        return db_category