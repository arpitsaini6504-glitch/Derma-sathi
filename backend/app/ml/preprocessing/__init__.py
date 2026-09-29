"""
DERMASATHIAI Image Preprocessing & Quality Assurance Layer.

Provides reusable, non-destructive, skin-tone-equitable preprocessing components:
- FileValidator: Magic-bytes and size bounds check
- ImageDecoder: Lossless RGB conversion and EXIF sanitization
- ImageQualityEvaluator: Resolution, blur, exposure (sensor-collapse/glare), and framing checks
- ImageNormalizer: Configurable model tensor resizing & normalization
- ImagePreprocessingPipeline: End-to-end quality-gated orchestrator
"""

from app.ml.preprocessing.validator import FileValidator
from app.ml.preprocessing.decoder import ImageDecoder
from app.ml.preprocessing.quality import ImageQualityEvaluator, QualityAssessmentResult
from app.ml.preprocessing.normalizer import ImageNormalizer, NormalizationConfig
from app.ml.preprocessing.pipeline import ImagePreprocessingPipeline, PreprocessedOutput

__all__ = [
    "FileValidator",
    "ImageDecoder",
    "ImageQualityEvaluator",
    "QualityAssessmentResult",
    "ImageNormalizer",
    "NormalizationConfig",
    "ImagePreprocessingPipeline",
    "PreprocessedOutput",
]
