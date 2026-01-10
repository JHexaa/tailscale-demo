import os
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
import uuid
from datetime import datetime

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin123secure")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "images")

# URL expiration time in seconds (1 hour)
URL_EXPIRATION = 3600

# Maximum file size (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024

# Allowed image types
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def get_minio_client():
    """Create and return a MinIO client using boto3."""
    return boto3.client(
        "s3",
        endpoint_url=f"http://{MINIO_ENDPOINT}",
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def ensure_bucket_exists():
    """Create the bucket if it doesn't exist."""
    client = get_minio_client()
    try:
        client.head_bucket(Bucket=MINIO_BUCKET)
    except ClientError:
        client.create_bucket(Bucket=MINIO_BUCKET)


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename to avoid collisions."""
    ext = os.path.splitext(original_filename)[1].lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    return f"{timestamp}_{unique_id}{ext}"


def validate_file(filename: str, content_type: str, file_size: int) -> tuple[bool, str]:
    """Validate file before upload."""
    # Check file size
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"

    # Check content type
    if content_type not in ALLOWED_TYPES:
        return False, f"Invalid file type. Allowed types: {', '.join(ALLOWED_TYPES)}"

    # Check extension
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"

    return True, "OK"


def upload_image(file_content: bytes, original_filename: str, content_type: str) -> tuple[bool, str, str]:
    """
    Upload an image to MinIO.
    Returns: (success, message, object_key)
    """
    try:
        ensure_bucket_exists()
        client = get_minio_client()

        # Generate unique filename
        object_key = generate_unique_filename(original_filename)

        # Upload file
        client.put_object(
            Bucket=MINIO_BUCKET,
            Key=object_key,
            Body=file_content,
            ContentType=content_type,
        )

        return True, "Image uploaded successfully", object_key
    except Exception as e:
        return False, f"Upload failed: {str(e)}", ""


def get_presigned_url(object_key: str, expiration: int = URL_EXPIRATION) -> str:
    """
    Generate a presigned URL for accessing an image.
    The URL will expire after the specified time.
    """
    client = get_minio_client()
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": MINIO_BUCKET, "Key": object_key},
            ExpiresIn=expiration,
        )
        # Replace internal Docker hostname with localhost for browser access
        # This will be adjusted based on actual deployment
        return url
    except Exception:
        return ""


def delete_image(object_key: str) -> tuple[bool, str]:
    """Delete an image from MinIO."""
    client = get_minio_client()
    try:
        client.delete_object(Bucket=MINIO_BUCKET, Key=object_key)
        return True, "Image deleted successfully"
    except Exception as e:
        return False, f"Delete failed: {str(e)}"


def check_minio_health() -> tuple[bool, str]:
    """Check if MinIO is accessible."""
    try:
        client = get_minio_client()
        client.list_buckets()
        return True, "connected"
    except Exception as e:
        return False, f"error: {str(e)}"
