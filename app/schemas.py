from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class VisitorBase(BaseModel):
    ip_address: str
    access_type: str
    user_agent: Optional[str] = None


class VisitorCreate(VisitorBase):
    pass


class VisitorResponse(VisitorBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class ConnectionInfo(BaseModel):
    ip_address: str
    access_type: str
    access_label: str
    is_vpn: bool
    user_agent: Optional[str] = None
    server_time: datetime
    tailscale_headers: dict


class HealthResponse(BaseModel):
    status: str
    database: str
    minio: str
    timestamp: datetime


# Image schemas
class ImageBase(BaseModel):
    original_filename: str
    content_type: str
    file_size: int


class ImageCreate(ImageBase):
    stored_filename: str
    uploaded_by_ip: str


class ImageResponse(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    content_type: str
    file_size: int
    uploaded_by_ip: str
    uploaded_at: datetime
    url: Optional[str] = None

    class Config:
        from_attributes = True


class ImageUploadResponse(BaseModel):
    success: bool
    message: str
    image: Optional[ImageResponse] = None


class ImageListResponse(BaseModel):
    total: int
    images: list[ImageResponse]
