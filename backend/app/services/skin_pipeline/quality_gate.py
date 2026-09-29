import io
import cv2
import numpy as np
from PIL import Image
from typing import Tuple
from app.core.config import settings
from app.schemas.skin_analysis import ImageQualityMetrics
from app.core.logging import logger

class ImageQualityGate:
    """
    Stage 1 in Skin Analysis Pipeline:
    Evaluates physical suitability of uploaded dermatology images before ML inference.
    Checks blur (Laplacian variance), illumination, and resolution.
    """
    def __init__(self, blur_threshold: float = settings.QUALITY_BLUR_THRESHOLD):
        self.blur_threshold = blur_threshold

    def evaluate(self, image_bytes: bytes) -> Tuple[bool, ImageQualityMetrics, np.ndarray]:
        """
        Processes raw bytes, performs CV checks, returns (is_acceptable, metrics, opencv_image_bgr).
        """
        feedback_messages = []
        is_blurry = False
        is_underexposed = False
        is_overexposed = False

        # Load image via OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            # Fallback attempt via PIL
            try:
                pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception as e:
                logger.error(f"Image decode failed: {str(e)}")
                metrics = ImageQualityMetrics(
                    is_acceptable=False,
                    blur_score=0.0,
                    is_blurry=True,
                    brightness_score=0.0,
                    is_underexposed=True,
                    is_overexposed=False,
                    resolution=[0, 0],
                    feedback_messages=["Unable to decode image file. Please upload a valid JPG, PNG, or WebP."]
                )
                return False, metrics, np.zeros((1, 1, 3), dtype=np.uint8)

        height, width = img_bgr.shape[:2]
        resolution = [width, height]

        # Resolution gate
        if width < 150 or height < 150:
            feedback_messages.append("Resolution is too low. Please upload a clear photo with at least 150x150 pixels.")

        # Convert to Grayscale for Blur & Brightness
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # 1. Blur Detection using Laplacian Variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if laplacian_var < self.blur_threshold:
            is_blurry = True
            feedback_messages.append(
                f"Image appears blurry (clarity score: {laplacian_var:.1f}). Hold the camera steady, ensure proper focus, and retake the photo."
            )

        # 2. Illumination / Brightness Check
        mean_brightness = float(np.mean(gray))
        if mean_brightness < 40.0:
            is_underexposed = True
            feedback_messages.append(
                f"Image is too dark (brightness: {mean_brightness:.1f}/255). Take the photo in a well-lit environment or use indirect natural daylight."
            )
        elif mean_brightness > 225.0:
            is_overexposed = True
            feedback_messages.append(
                f"Image has severe glare/overexposure (brightness: {mean_brightness:.1f}/255). Avoid harsh flash reflection directly onto the skin."
            )

        is_acceptable = len(feedback_messages) == 0

        if is_acceptable:
            feedback_messages.append("Image quality is satisfactory for analysis.")

        metrics = ImageQualityMetrics(
            is_acceptable=is_acceptable,
            blur_score=round(laplacian_var, 2),
            is_blurry=is_blurry,
            brightness_score=round(mean_brightness, 2),
            is_underexposed=is_underexposed,
            is_overexposed=is_overexposed,
            resolution=resolution,
            feedback_messages=feedback_messages
        )

        return is_acceptable, metrics, img_bgr
