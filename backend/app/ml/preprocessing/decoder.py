import io
from typing import Tuple, Optional
import numpy as np
from PIL import Image, ImageOps

class ImageDecoder:
    """
    Safely decodes image byte streams into pristine NumPy/PIL RGB structures.
    Preserves original pixel data without destructive compression.
    Handles EXIF orientation tags cleanly to prevent rotated lesion analyses.
    Strips private patient EXIF metadata (e.g., GPS coordinates).
    """
    @staticmethod
    def decode(image_bytes: bytes) -> Tuple[Optional[np.ndarray], Optional[str]]:
        """
        Decodes raw bytes into an RGB NumPy array [H, W, 3] uint8.
        Returns (rgb_array, error_message).
        """
        try:
            pil_image = Image.open(io.BytesIO(image_bytes))

            # Auto-orient based on EXIF tags (e.g., phone held sideways)
            try:
                pil_image = ImageOps.exif_transpose(pil_image)
            except Exception:
                # If EXIF parsing fails, continue with raw orientation
                pass

            # Ensure pure RGB color space (converting RGBA, grayscale, or CMYK cleanly)
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")

            # Convert to NumPy array [H, W, 3] without destructive filtering
            rgb_array = np.array(pil_image, dtype=np.uint8)

            if rgb_array.size == 0 or rgb_array.ndim != 3 or rgb_array.shape[2] != 3:
                return None, "Decoded image array is invalid or has improper channel dimensions."

            return rgb_array, None

        except Exception as e:
            return None, f"Image decoding failed: {str(e)}"
