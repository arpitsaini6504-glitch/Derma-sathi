import os
from typing import Tuple, Optional, List

# Standard magic bytes signatures
MAGIC_NUMBERS = {
    "jpeg": [b"\xFF\xD8\xFF"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "webp": [b"RIFF"]  # and second chunk contains 'WEBP'
}

DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
DEFAULT_MIN_FILE_SIZE = 100  # 100 bytes minimum to reject trivial empty stubs

class FileValidator:
    """
    Validates uploaded dermatology image files before reading them into memory.
    Inspects magic byte headers, extensions, and byte payload bounds.
    """
    def __init__(
        self,
        max_size_bytes: int = DEFAULT_MAX_FILE_SIZE,
        min_size_bytes: int = DEFAULT_MIN_FILE_SIZE,
        allowed_extensions: Optional[List[str]] = None
    ):
        self.max_size_bytes = max_size_bytes
        self.min_size_bytes = min_size_bytes
        self.allowed_extensions = allowed_extensions or [".jpg", ".jpeg", ".png", ".webp"]

    def validate(self, file_bytes: bytes, filename: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        if not file_bytes:
            return False, "File is empty (0 bytes)."

        size = len(file_bytes)
        if size < self.min_size_bytes:
            return False, f"File payload too small ({size} bytes). Corrupt or incomplete file."

        if size > self.max_size_bytes:
            max_mb = self.max_size_bytes // (1024 * 1024)
            return False, f"File size exceeds maximum allowed limit of {max_mb}MB."

        # Validate filename extension if filename is provided
        if filename:
            _, ext = os.path.splitext(filename)
            if ext.lower() not in self.allowed_extensions:
                return False, f"Unsupported file extension '{ext}'. Allowed: {', '.join(self.allowed_extensions)}"

        # Validate magic bytes to prevent MIME-spoofing
        header = file_bytes[:16]
        is_jpeg = header.startswith(b"\xFF\xD8\xFF")
        is_png = header.startswith(b"\x89PNG\r\n\x1a\n")
        is_webp = header.startswith(b"RIFF") and b"WEBP" in header

        if not (is_jpeg or is_png or is_webp):
            return False, "File header does not match valid JPEG, PNG, or WebP image signatures."

        return True, None
