from typing import Optional, Dict, Tuple
from app.core.config import settings

class AbstentionGate:
    """
    Stage 6 in Skin Analysis Pipeline:
    Enforces clinical abstention criteria. Decides whether the AI is justified
    in surfacing candidate findings or must deliberately withhold condition naming.
    """
    def __init__(self, confidence_threshold: float = settings.CONFIDENCE_ABSTENTION_THRESHOLD):
        self.confidence_threshold = confidence_threshold

    def should_abstain(
        self,
        quality_passed: bool,
        model_available: bool,
        is_ood: bool,
        calibrated_probs: Optional[Dict[str, float]]
    ) -> Tuple[bool, str]:
        """
        Returns (abstained: bool, reason: str).
        """
        if not quality_passed:
            return True, "Image quality gate failed. Clarity, illumination, or resolution is insufficient for safe analysis."

        if not model_available:
            return True, (
                "Skin CV model is pending deployment in backend/model_store/. "
                "The system is currently operating in safe guidance mode."
            )

        if is_ood:
            return True, "Predictive uncertainty is high (potential out-of-distribution condition). Clinical review advised."

        if not calibrated_probs:
            return True, "Inference outputs are unavailable."

        top_score = max(calibrated_probs.values()) if calibrated_probs else 0.0
        if top_score < self.confidence_threshold:
            return True, (
                f"Calibrated confidence ({top_score*100:.1f}%) is below clinical safety threshold "
                f"({self.confidence_threshold*100:.1f}%). Safe abstention enforced."
            )

        return False, "Quality and confidence thresholds met for exploratory analysis."
