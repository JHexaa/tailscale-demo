from fastapi import FastAPI, Request, Depends, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from datetime import datetime
import re
import os

from . import models, schemas, crud
from .database import engine, get_db
from . import minio_client

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tailscale Demo API",
    description="API demo para probar acceso VPN (Tailscale) vs Público (Funnel)",
    version="2.0.0"
)

# Determine frontend path (React build or fallback to old static)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")

# Mount React assets if available, otherwise fallback to static
if os.path.exists(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")
else:
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, considering proxy headers."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip

    return request.client.host if request.client else "unknown"


def detect_access_type(ip: str, request: Request) -> tuple[str, str, bool]:
    """
    Detect if the connection is via Tailscale VPN or public Funnel.
    Returns: (access_type, label, is_vpn)
    """
    tailscale_pattern = r"^100\.\d{1,3}\.\d{1,3}\.\d{1,3}$"

    tailscale_user = request.headers.get("tailscale-user-login")
    tailscale_name = request.headers.get("tailscale-user-name")

    if re.match(tailscale_pattern, ip):
        return "vpn", "VPN (Tailscale Direct)", True
    elif tailscale_user or tailscale_name:
        return "vpn", "VPN (Tailscale Authenticated)", True
    else:
        return "public", "Publico (Funnel)", False


def get_tailscale_headers(request: Request) -> dict:
    """Extract Tailscale-related headers from request."""
    tailscale_headers = {}
    for key, value in request.headers.items():
        if key.lower().startswith("tailscale-"):
            tailscale_headers[key] = value
    return tailscale_headers


# ============== PAGES ==============

@app.get("/", response_class=FileResponse)
async def root():
    """Serve the main HTML page (React build or fallback)."""
    if os.path.exists(FRONTEND_DIR):
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# ============== CONNECTION INFO ==============

@app.get("/api/info", response_model=schemas.ConnectionInfo)
async def get_connection_info(request: Request):
    """Get information about the current connection."""
    client_ip = get_client_ip(request)
    access_type, access_label, is_vpn = detect_access_type(client_ip, request)
    user_agent = request.headers.get("user-agent", "Unknown")

    return schemas.ConnectionInfo(
        ip_address=client_ip,
        access_type=access_type,
        access_label=access_label,
        is_vpn=is_vpn,
        user_agent=user_agent,
        server_time=datetime.now(),
        tailscale_headers=get_tailscale_headers(request)
    )


# ============== HEALTH ==============

@app.get("/api/health", response_model=schemas.HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    try:
        db.execute(models.Visitor.__table__.select().limit(1))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    minio_ok, minio_status = minio_client.check_minio_health()

    return schemas.HealthResponse(
        status="healthy" if db_status == "connected" and minio_ok else "degraded",
        database=db_status,
        minio=minio_status,
        timestamp=datetime.now()
    )


# ============== VISITORS ==============

@app.get("/api/visitors", response_model=list[schemas.VisitorResponse])
async def get_visitors(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Get list of recent visitors."""
    return crud.get_visitors(db, skip=skip, limit=limit)


@app.post("/api/visitors", response_model=schemas.VisitorResponse)
async def register_visitor(request: Request, db: Session = Depends(get_db)):
    """Register a new visitor (auto-detects connection type)."""
    client_ip = get_client_ip(request)
    access_type, _, _ = detect_access_type(client_ip, request)
    user_agent = request.headers.get("user-agent", "Unknown")

    visitor_data = schemas.VisitorCreate(
        ip_address=client_ip,
        access_type=access_type,
        user_agent=user_agent[:500] if user_agent else None
    )

    return crud.create_visitor(db, visitor_data)


@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get visitor and image statistics."""
    return {
        "total_visitors": crud.get_visitor_count(db),
        "vpn_visitors": crud.get_vpn_count(db),
        "public_visitors": crud.get_public_count(db),
        "total_images": crud.get_image_count(db),
        "timestamp": datetime.now()
    }


# ============== IMAGES ==============

@app.post("/api/images", response_model=schemas.ImageUploadResponse)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload an image to MinIO.
    - Maximum file size: 5MB
    - Allowed types: JPEG, PNG, GIF, WebP
    """
    # Read file content
    content = await file.read()
    file_size = len(content)

    # Validate file
    is_valid, message = minio_client.validate_file(
        file.filename or "unknown",
        file.content_type or "application/octet-stream",
        file_size
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail=message)

    # Upload to MinIO
    success, msg, stored_filename = minio_client.upload_image(
        content,
        file.filename or "unknown",
        file.content_type or "image/jpeg"
    )

    if not success:
        raise HTTPException(status_code=500, detail=msg)

    # Save metadata to database
    client_ip = get_client_ip(request)
    image_data = schemas.ImageCreate(
        original_filename=file.filename or "unknown",
        stored_filename=stored_filename,
        content_type=file.content_type or "image/jpeg",
        file_size=file_size,
        uploaded_by_ip=client_ip
    )

    db_image = crud.create_image(db, image_data)

    # Use proxy URL for universal access
    url = f"/api/images/{db_image.id}/file"

    return schemas.ImageUploadResponse(
        success=True,
        message="Image uploaded successfully",
        image=schemas.ImageResponse(
            id=db_image.id,
            original_filename=db_image.original_filename,
            stored_filename=db_image.stored_filename,
            content_type=db_image.content_type,
            file_size=db_image.file_size,
            uploaded_by_ip=db_image.uploaded_by_ip,
            uploaded_at=db_image.uploaded_at,
            url=url
        )
    )


@app.get("/api/images", response_model=schemas.ImageListResponse)
async def get_images(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Get list of uploaded images with proxy URLs (works for VPN and public)."""
    images = crud.get_images(db, skip=skip, limit=limit)
    total = crud.get_image_count(db)

    # Use proxy URLs instead of presigned URLs for universal access
    image_responses = []
    for img in images:
        # Proxy URL works for both VPN and public Funnel access
        url = f"/api/images/{img.id}/file"
        image_responses.append(schemas.ImageResponse(
            id=img.id,
            original_filename=img.original_filename,
            stored_filename=img.stored_filename,
            content_type=img.content_type,
            file_size=img.file_size,
            uploaded_by_ip=img.uploaded_by_ip,
            uploaded_at=img.uploaded_at,
            url=url
        ))

    return schemas.ImageListResponse(total=total, images=image_responses)


@app.get("/api/images/{image_id}", response_model=schemas.ImageResponse)
async def get_image(image_id: int, db: Session = Depends(get_db)):
    """Get a specific image by ID with proxy URL."""
    db_image = crud.get_image_by_id(db, image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")

    url = f"/api/images/{db_image.id}/file"

    return schemas.ImageResponse(
        id=db_image.id,
        original_filename=db_image.original_filename,
        stored_filename=db_image.stored_filename,
        content_type=db_image.content_type,
        file_size=db_image.file_size,
        uploaded_by_ip=db_image.uploaded_by_ip,
        uploaded_at=db_image.uploaded_at,
        url=url
    )


@app.delete("/api/images/{image_id}")
async def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Delete an image from MinIO and database."""
    db_image = crud.get_image_by_id(db, image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete from MinIO
    success, msg = minio_client.delete_image(db_image.stored_filename)
    if not success:
        raise HTTPException(status_code=500, detail=msg)

    # Delete from database
    crud.delete_image(db, image_id)

    return {"success": True, "message": "Image deleted successfully"}


@app.get("/api/images/{image_id}/file")
async def get_image_file(image_id: int, db: Session = Depends(get_db)):
    """
    Proxy endpoint to serve images directly.
    This allows public access via Funnel without exposing MinIO.
    """
    db_image = crud.get_image_by_id(db, image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")

    data, content_type = minio_client.get_image_data(db_image.stored_filename)
    if data is None:
        raise HTTPException(status_code=404, detail="Image file not found")

    # Sanitize filename for Content-Disposition header (ASCII only)
    safe_filename = db_image.original_filename.encode("ascii", "ignore").decode("ascii")
    if not safe_filename:
        safe_filename = db_image.stored_filename

    return Response(
        content=data,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": f"inline; filename=\"{safe_filename}\""
        }
    )
