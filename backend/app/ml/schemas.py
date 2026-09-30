from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

# ==============================================================================
# Quality Gate Schemas
# ==============================================================================

class QualityGateResult(BaseModel):
    """
    Standardized image acquisition quality result for clinical safety validation.
    """
    quality_status: str = Field(..., description="'pass' or 'reject'")
    issues: List[str] = Field(default_factory=list, description="Specific acquisition failures: 'excessive_blur', 'insufficient_lighting', etc.")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Raw computed clarity, dynamic range, and resolution numbers")
    feedback_messages: List[str] = Field(default_factory=list, description="Patient-facing guidance on how to retake the photo")


# ==============================================================================
# Future ML Pipeline Placeholders / Interfaces
# NOTE: These represent architectural contracts for features to be implemented
# after the ML team (Arpit) delivers the trained model artifacts.
# ==============================================================================

class ImageQualityGatePlaceholder(BaseModel):
    """
    Placeholder contract for Stage 1 Quality Gate:
    Will evaluate blur (Laplacian variance), illumination, glare, and resolution.
    Status: Awaiting trained model pipeline calibration.
    """
    is_evaluated: bool = Field(False, description="Flag indicating if quality gate has been activated")
    blur_score: Optional[float] = Field(None, description="Future Laplacian variance clarity score")
    illumination_score: Optional[float] = Field(None, description="Future mean pixel brightness (0-255)")
    feedback: Optional[str] = Field("Quality gate interface placeholder - awaiting model integration", description="Retake guidance")


class OODDetectionPlaceholder(BaseModel):
    """
    Placeholder contract for Stage 4 Out-Of-Distribution (OOD) Detection:
    Will compute predictive entropy or Mahalanobis distance to identify unfamiliar conditions.
    Status: Awaiting trained model feature distributions.
    """
    is_evaluated: bool = Field(False, description="Flag indicating if OOD detection has been activated")
    entropy_score: Optional[float] = Field(None, description="Future normalized Shannon entropy")
    is_out_of_distribution: Optional[bool] = Field(None, description="Future OOD decision flag")


class ConfidenceCalibrationPlaceholder(BaseModel):
    """
    Placeholder contract for Stage 5 Confidence Calibration:
    Will apply temperature scaling or Platt scaling to raw model logits.
    Status: Awaiting trained model temperature parameter optimization.
    """
    is_calibrated: bool = Field(False, description="Flag indicating if temperature scaling was applied")
    temperature_parameter: Optional[float] = Field(None, description="Future temperature T scaling factor")


class AbstentionPolicyPlaceholder(BaseModel):
    """
    Placeholder contract for Stage 6 Clinical Abstention Policy:
    Will withhold specific condition naming if calibrated confidence is under safety threshold.
    Status: Awaiting clinical validation threshold alignment.
    """
    enforced: bool = Field(True, description="Safety default: abstention enforced when model is unavailable")
    reason: Optional[str] = Field("Awaiting trained model integration in backend/model_store/", description="Abstention rationale")


class SafetyPolicyPlaceholder(BaseModel):
    """
    Placeholder contract for Stage 7 Clinical Safety & Referral Policy:
    Will map findings to clinical urgency, red-flag checklists, and referral timeframes.
    Status: Active in default referral mode.
    """
    disclaimer: str = Field(
        "DERMASATHIAI is an informational AI companion and strictly NOT a replacement for qualified doctors. "
        "Raw model probabilities reflect statistical pattern similarity, NOT clinical certainty.",
        description="Mandatory clinical safety disclaimer"
    )
    referral_urgency: str = Field("routine", description="'routine', 'prompt_consult', 'emergency'")


# ==============================================================================
# Endpoint Response Schema: POST /api/v1/skin/analyze
# ==============================================================================

class SkinAnalysisMLResponse(BaseModel):
    """
    Standardized response contract for POST /api/v1/skin/analyze.
    Enforces clear non-diagnostic status while the trained model is unavailable.
    """
    status: str = Field(
        ...,
        description="Operational status: 'MODEL_NOT_AVAILABLE', 'ABSTAINED', 'SUCCESS', 'QUALITY_REJECTED'"
    )
    prediction: Optional[str] = Field(
        None,
        description="Name of the candidate dermatological pattern (None when model is unavailable)"
    )
    raw_probability: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Raw neural network softmax output. WARNING: Does NOT represent medical certainty or diagnosis."
    )
    calibrated_confidence: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Empirically calibrated probability after temperature scaling."
    )
    uncertainty: Optional[float] = Field(
        None,
        ge=0.0,
        description="Estimated predictive uncertainty / entropy metric."
    )
    requires_professional_review: bool = Field(
        True,
        description="Always True. Mandatory in-person physician evaluation requirement."
    )
    model_version: Optional[str] = Field(
        None,
        description="Semantic version of the active model in model_store/ (e.g. 'v1.0.0')"
    )
    message: str = Field(
        ...,
        description="Human-readable status or clinical guidance message."
    )
    quality_assessment: Optional[QualityGateResult] = Field(
        None,
        description="Image acquisition quality assessment: {quality_status: 'pass'|'reject', issues: [...]}"
    )

    # Future Pipeline Placeholders
    image_quality_gate: ImageQualityGatePlaceholder = Field(
        default_factory=ImageQualityGatePlaceholder,
        description="Interface placeholder for future image quality gate"
    )
    ood_detection: OODDetectionPlaceholder = Field(
        default_factory=OODDetectionPlaceholder,
        description="Interface placeholder for future out-of-distribution detection"
    )
    confidence_calibration: ConfidenceCalibrationPlaceholder = Field(
        default_factory=ConfidenceCalibrationPlaceholder,
        description="Interface placeholder for future confidence calibration"
    )
    abstention_policy: AbstentionPolicyPlaceholder = Field(
        default_factory=AbstentionPolicyPlaceholder,
        description="Interface placeholder for future clinical abstention policy"
    )
    safety_policy: SafetyPolicyPlaceholder = Field(
        default_factory=SafetyPolicyPlaceholder,
        description="Interface placeholder for future clinical safety & referral policy"
    )

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "status": "success",
                "prediction": {
                    "class": "Melanocytic nevi",
                    "score": 0.9320
                },
                "model": {
                    "name": "ResNet50-SkinDisease-Classifier",
                    "version": "1.0.0"
                },
                "quality": {
                    "passed": True,
                    "flags": []
                },
                "requires_professional_review": True
            }
        }
    }
