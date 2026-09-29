import cv2
import numpy as np
from typing import Dict, Any, List, Tuple
from pydantic import BaseModel, Field

class QualityAssessmentResult(BaseModel):
    quality_status: str = Field(..., description="'pass' or 'reject'")
    issues: List[str] = Field(default_factory=list, description="Specific acquisition failures: 'excessive_blur', 'insufficient_lighting', etc.")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Raw computed clarity, dynamic range, and resolution numbers")
    feedback_messages: List[str] = Field(default_factory=list, description="Patient-facing guidance on how to retake the photo")


class ImageQualityEvaluator:
    """
    Evaluates physical acquisition conditions of dermatology images before ML ingestion.
    
    IMPORTANT EQUITY & CLINICAL BIAS DIRECTIVE:
    - Does NOT use mean luminance or global average brightness thresholds to avoid penalizing 
      darker Fitzpatrick skin types (Types IV, V, VI prevalent across Indian populations).
    - Exposure checks evaluate histogram dynamic range collapse (near-total sensor darkness < 10)
      and specular highlight clipping (> 25% blown out pure white at 255 from camera flash).
    - Blur checks evaluate high-frequency Laplacian variance.
    - Framing checks confirm scene contrast and absence of blank/occluded frames.
    """
    def __init__(
        self,
        min_dimension: int = 180,
        max_aspect_ratio: float = 3.5,
        blur_threshold: float = 45.0,
        underexposure_pixel_cutoff: int = 10,
        underexposure_area_ratio: float = 0.85,
        overexposure_pixel_cutoff: int = 250,
        overexposure_area_ratio: float = 0.25,
        min_contrast_std: float = 4.0
    ):
        self.min_dimension = min_dimension
        self.max_aspect_ratio = max_aspect_ratio
        self.blur_threshold = blur_threshold
        self.underexposure_pixel_cutoff = underexposure_pixel_cutoff
        self.underexposure_area_ratio = underexposure_area_ratio
        self.overexposure_pixel_cutoff = overexposure_pixel_cutoff
        self.overexposure_area_ratio = overexposure_area_ratio
        self.min_contrast_std = min_contrast_std

    def evaluate(self, rgb_image: np.ndarray) -> QualityAssessmentResult:
        issues: List[str] = []
        feedback_messages: List[str] = []
        metrics: Dict[str, Any] = {}

        height, width = rgb_image.shape[:2]
        aspect_ratio = max(width, height) / max(min(width, height), 1)
        metrics["resolution"] = [width, height]
        metrics["aspect_ratio"] = round(aspect_ratio, 2)

        # 1. Resolution & Dimension Checks
        if width < self.min_dimension or height < self.min_dimension:
            issues.append("low_resolution")
            feedback_messages.append(
                f"Image resolution ({width}x{height}) is too small. Minimum required is {self.min_dimension}x{self.min_dimension} pixels."
            )

        if aspect_ratio > self.max_aspect_ratio:
            issues.append("extreme_aspect_ratio")
            feedback_messages.append(
                f"Image is excessively narrow or cropped (aspect ratio: {aspect_ratio:.1f}:1). Please center the lesion in a standard photo frame."
            )

        # Convert to Grayscale for Edge & Illumination analysis
        gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)

        # 2. Blur Detection (Laplacian Variance)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        metrics["blur_score"] = round(laplacian_var, 2)
        if laplacian_var < self.blur_threshold:
            issues.append("excessive_blur")
            feedback_messages.append(
                f"Image is out of focus or blurry (score: {laplacian_var:.1f}). Hold camera steady and tap the screen on the lesion to focus."
            )

        # 3. Exposure Checks (Skin-Tone Equitable)
        total_pixels = float(gray.size)
        dark_pixels_ratio = float(np.sum(gray <= self.underexposure_pixel_cutoff)) / total_pixels
        metrics["underexposed_pixel_ratio"] = round(dark_pixels_ratio, 3)

        # Only flag if almost the entire sensor is pitch-black (room without light / covered lens)
        if dark_pixels_ratio > self.underexposure_area_ratio:
            issues.append("insufficient_lighting")
            feedback_messages.append(
                "Image appears to have been taken in pitch darkness. Please take the photo under bright ambient or indirect daylight."
            )

        bright_pixels_ratio = float(np.sum(gray >= self.overexposure_pixel_cutoff)) / total_pixels
        metrics["overexposed_pixel_ratio"] = round(bright_pixels_ratio, 3)

        # Flag harsh direct flash reflection blinding lesion texture
        if bright_pixels_ratio > self.overexposure_area_ratio:
            issues.append("severe_glare")
            feedback_messages.append(
                "Severe camera flash reflection or glare is blinding the lesion texture. Disable direct flash or diffuse the light."
            )

        # 4. Framing & Occlusion Check
        std_dev = float(np.std(gray))
        metrics["contrast_std"] = round(std_dev, 2)
        if std_dev < self.min_contrast_std:
            issues.append("poor_framing_or_occlusion")
            feedback_messages.append(
                "Image appears completely blank, uniform, or occluded. Please ensure the camera lens is unobstructed."
            )

        quality_status = "reject" if len(issues) > 0 else "pass"
        if quality_status == "pass":
            feedback_messages.append("Image acquisition quality satisfies clinical safety criteria.")

        return QualityAssessmentResult(
            quality_status=quality_status,
            issues=issues,
            metrics=metrics,
            feedback_messages=feedback_messages
        )
