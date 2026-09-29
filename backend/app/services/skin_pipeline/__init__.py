from app.services.skin_pipeline.quality_gate import ImageQualityGate
from app.services.skin_pipeline.preprocessor import SkinImagePreprocessor
from app.services.skin_pipeline.inference_engine import skin_model_service
from app.services.skin_pipeline.uncertainty import UncertaintyDetector
from app.services.skin_pipeline.calibration import ConfidenceCalibrator
from app.services.skin_pipeline.abstention import AbstentionGate
from app.services.skin_pipeline.safety_layer import ClinicalSafetyLayer
from app.schemas.skin_analysis import SkinAnalysisResponse

class SkinPipelineOrchestrator:
    """
    Coordinates the 8-Stage Skin Analysis Pipeline:
    1. Image Quality Gate (Blur, Illumination, Resolution)
    2. Preprocessing & Tensor Normalization
    3. Model Inference (Fail-Safe against missing model weights)
    4. Uncertainty & Out-Of-Distribution (OOD) Detection
    5. Confidence Calibration (Temperature Scaling)
    6. Clinical Abstention Evaluation
    7. Clinical Safety Filtering
    8. Referral & Care Recommendations
    """
    def __init__(self):
        self.quality_gate = ImageQualityGate()
        self.preprocessor = SkinImagePreprocessor()
        self.model = skin_model_service
        self.uncertainty_detector = UncertaintyDetector()
        self.calibrator = ConfidenceCalibrator()
        self.abstention_gate = AbstentionGate()
        self.safety_layer = ClinicalSafetyLayer()

    def process_image(self, image_bytes: bytes) -> SkinAnalysisResponse:
        # Stage 1: Quality Gate
        passed_quality, quality_metrics, img_bgr = self.quality_gate.evaluate(image_bytes)
        if not passed_quality:
            abstained, reason = self.abstention_gate.should_abstain(
                quality_passed=False,
                model_available=self.model.is_available(),
                is_ood=False,
                calibrated_probs=None
            )
            return self.safety_layer.synthesize_response(
                status="ABSTAINED_LOW_QUALITY",
                quality_metrics=quality_metrics,
                abstained=True,
                abstention_reason=reason,
                uncertainty_score=None,
                calibrated_probs=None
            )

        # Stage 2: Preprocessing
        tensor = self.preprocessor.preprocess(img_bgr)

        # Stage 3: Model Inference (Fail-Safe check)
        if not self.model.is_available():
            abstained, reason = self.abstention_gate.should_abstain(
                quality_passed=True,
                model_available=False,
                is_ood=False,
                calibrated_probs=None
            )
            return self.safety_layer.synthesize_response(
                status="MODEL_PENDING_INTEGRATION",
                quality_metrics=quality_metrics,
                abstained=True,
                abstention_reason=reason,
                uncertainty_score=None,
                calibrated_probs=None
            )

        raw_predictions = self.model.predict(tensor)
        if not raw_predictions:
            return self.safety_layer.synthesize_response(
                status="INFERENCE_FAILED",
                quality_metrics=quality_metrics,
                abstained=True,
                abstention_reason="Model inference could not be completed safely.",
                uncertainty_score=None,
                calibrated_probs=None
            )

        # Stage 4: Uncertainty & OOD Detection
        entropy, is_ood = self.uncertainty_detector.calculate_entropy(raw_predictions)

        # Stage 5: Confidence Calibration
        calibrated_predictions = self.calibrator.calibrate(raw_predictions)

        # Stage 6: Clinical Abstention Gate
        should_abstain, abstention_reason = self.abstention_gate.should_abstain(
            quality_passed=True,
            model_available=True,
            is_ood=is_ood,
            calibrated_probs=calibrated_predictions
        )

        status = "ABSTAINED_HIGH_UNCERTAINTY" if should_abstain else "SUCCESS"

        # Stages 7 & 8: Safety Layer & Referral
        return self.safety_layer.synthesize_response(
            status=status,
            quality_metrics=quality_metrics,
            abstained=should_abstain,
            abstention_reason=abstention_reason if should_abstain else None,
            uncertainty_score=entropy,
            calibrated_probs=calibrated_predictions
        )

skin_pipeline = SkinPipelineOrchestrator()
