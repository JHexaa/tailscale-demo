from sqlalchemy.orm import Session
from . import models, schemas


# Visitor CRUD operations
def create_visitor(db: Session, visitor: schemas.VisitorCreate) -> models.Visitor:
    db_visitor = models.Visitor(
        ip_address=visitor.ip_address,
        access_type=visitor.access_type,
        user_agent=visitor.user_agent
    )
    db.add(db_visitor)
    db.commit()
    db.refresh(db_visitor)
    return db_visitor


def get_visitors(db: Session, skip: int = 0, limit: int = 50) -> list[models.Visitor]:
    return db.query(models.Visitor).order_by(models.Visitor.timestamp.desc()).offset(skip).limit(limit).all()


def get_visitor_count(db: Session) -> int:
    return db.query(models.Visitor).count()


def get_vpn_count(db: Session) -> int:
    return db.query(models.Visitor).filter(models.Visitor.access_type == "vpn").count()


def get_public_count(db: Session) -> int:
    return db.query(models.Visitor).filter(models.Visitor.access_type == "public").count()


# Image CRUD operations
def create_image(db: Session, image: schemas.ImageCreate) -> models.Image:
    db_image = models.Image(
        original_filename=image.original_filename,
        stored_filename=image.stored_filename,
        content_type=image.content_type,
        file_size=image.file_size,
        uploaded_by_ip=image.uploaded_by_ip
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


def get_images(db: Session, skip: int = 0, limit: int = 50) -> list[models.Image]:
    return db.query(models.Image).order_by(models.Image.uploaded_at.desc()).offset(skip).limit(limit).all()


def get_image_by_id(db: Session, image_id: int) -> models.Image | None:
    return db.query(models.Image).filter(models.Image.id == image_id).first()


def get_image_by_filename(db: Session, stored_filename: str) -> models.Image | None:
    return db.query(models.Image).filter(models.Image.stored_filename == stored_filename).first()


def get_image_count(db: Session) -> int:
    return db.query(models.Image).count()


def delete_image(db: Session, image_id: int) -> bool:
    db_image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if db_image:
        db.delete(db_image)
        db.commit()
        return True
    return False
