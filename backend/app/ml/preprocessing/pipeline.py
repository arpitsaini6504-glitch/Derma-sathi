import numpy as np
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.ml.preprocessing.validator import FileValidator
from app.ml.preprocessing.decoder import ImageDecoder
from app.ml.preprocessing.quality import ImageQualityEvaluator, QualityAssessmentResult
from app.ml.preprocessing.normalizer import ImageNormalizer, NormalizationConfig


class PreprocessedOutput(BaseModel):
    """
    Standard output container for the preprocessing and quality-gate pipeline.
    Preserves original image fidelity, presents structured quality findings,
    and supplies a model-ready batch tensor only when all quality criteria pass.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    quality_status: str = Field(..., description="'pass' or 'reject'")
    issues: List[str] = Field(default_factory=list, description="List of quality or acquisition issues detected")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Raw computed clarity, illumination, and dimensional metrics")
    feedback_messages: List[str] = Field(default_factory=list, description="Actionable clinical acquisition instructions for the patient")
    processed_tensor: Optional[Any] = Field(default=None, description="Batch tensor [1, C, H, W] or [1, H, W, C] if quality passes; None if rejected")
    original_dimensions: Optional[List[int]] = Field(default=None, description="[width, height] of the decoded image")
    error_message: Optional[str] = Field(default=None, description="Detailed system error if decoding or validation fails")

    def to_quality_dict(self) -> Dict[str, Any]:
        """
        Returns the standardized quality response format:
        {
            "quality_status": "pass" | "reject",
            "issues": [...]
        }
        """
        return {
            "quality_status": self.quality_status,
            "issues": self.issues
        }


class ImagePreprocessingPipeline:
    """
    Reusable dermatology image preprocessing layer for DERMASATHIAI.
    
    Orchestrates:
      1. File validation (magic bytes, size bounds, extensions)
      2. Safe image decoding (RGB conversion, EXIF orientation correction, metadata stripping)
      3. Resolution checks
      4. Blur detection
      5. Exposure & lighting checks (Skin-tone equitable: no luminance bias)
      6. Framing and occlusion checks
      7. Quality gate evaluation (Short-circuits if acquisition fails)
      8. Spatial resizing to configurable model dimensions
      9. Model-specific normalization (ImageNet, zero-to-one, custom)
      10. Safe preprocessing output (Non-destructive, never alters raw patient pixels)
    """
    def __init__(
        self,
        validator: Optional[FileValidator] = None,
        decoder: Optional[ImageDecoder] = None,
        quality_evaluator: Optional[ImageQualityEvaluator] = None,
        normalizer: Optional[ImageNormalizer] = None
    ):
        self.validator = validator or FileValidator()
        self.decoder = decoder or ImageDecoder()
        self.quality_evaluator = quality_evaluator or ImageQualityEvaluator()
        self.normalizer = normalizer or ImageNormalizer()

    def process(self, image_bytes: bytes, filename: Optional[str] = None) -> PreprocessedOutput:
        """
        Executes the full pipeline safely.
        
        CRITICAL SAFETY RULE:
        If quality evaluation fails ("reject"), downstream model normalization is bypassed
        and processed_tensor remains None to ensure invalid images are never fed to clinical models.
        """
        # Step 1: Validate file magic bytes, payload bounds, and extension
        is_valid, val_error = self.validator.validate(image_bytes, filename=filename)
        if not is_valid:
            return PreprocessedOutput(
                quality_status="reject",
                issues=["invalid_file_format"],
                feedback_messages=[val_error or "Uploaded file is not a valid or supported image format."],
                error_message=val_error,
                processed_tensor=None
            )

        # Step 2 & 7: Safe Image Decoding & Color Space Verification (Strict RGB)
        rgb_image, decode_error = self.decoder.decode(image_bytes)
        if decode_error is not None or rgb_image is None:
            return PreprocessedOutput(
                quality_status="reject",
                issues=["corrupt_image_payload"],
                feedback_messages=["The image could not be decoded. The file may be damaged or truncated."],
                error_message=decode_error,
                processed_tensor=None
            )

        orig_h, orig_w = rgb_image.shape[:2]

        # Step 3, 4, 5, 6: Image Quality Evaluation (Resolution, Blur, Exposure, Framing)
        quality_result: QualityAssessmentResult = self.quality_evaluator.evaluate(rgb_image)

        # Step 10 (Fail-Safe Gate): If quality criteria fail, reject early without generating model tensor
        if quality_result.quality_status == "reject":
            return PreprocessedOutput(
                quality_status="reject",
                issues=quality_result.issues,
                metrics=quality_result.metrics,
                feedback_messages=quality_result.feedback_messages,
                original_dimensions=[orig_w, orig_h],
                processed_tensor=None
            )

        # Step 8 & 9: Spatial Resizing and Model-Specific Normalization (Configurable)
        # Note: This is performed on a separate floating-point array, leaving original data pristine.
        try:
            tensor = self.normalizer.normalize(rgb_image)
        except Exception as e:
            return PreprocessedOutput(
                quality_status="reject",
                issues=["normalization_failure"],
                feedback_messages=["Internal preprocessing error preparing image for model inference."],
                error_message=str(e),
                original_dimensions=[orig_w, orig_h],
                processed_tensor=None
            )

        # Successfully preprocessed with clinical quality clearance
        return PreprocessedOutput(
            quality_status="pass",
            issues=[],
            metrics=quality_result.metrics,
            feedback_messages=quality_result.feedback_messages,
            original_dimensions=[orig_w, orig_h],
            processed_tensor=tensor
        )
