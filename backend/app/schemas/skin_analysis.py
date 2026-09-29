from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ImageQualityMetrics(BaseModel):
    is_acceptable: bool
    blur_score: float = Field(..., description="Laplacian variance score")
    is_blurry: bool
    brightness_score: float = Field(..., description="Mean pixel intensity (0-255)")
    is_underexposed: bool
    is_overexposed: bool
    resolution: List[int] = Field(..., description="[width, height]")
    feedback_messages: List[str]

class CandidateFinding(BaseModel):
    category_name: str
    calibrated_probability: float = Field(..., ge=0.0, le=1.0)
    general_information: str
    typical_clinical_features: List[str]

class ReferralRecommendation(BaseModel):
    urgency: str = Field(..., description="'routine', 'prompt_consult', 'emergency'")
    recommended_timeframe: str
    recommended_specialist: str = "Qualified Dermatologist / Medical Practitioner"
    actionable_instructions: List[str]
    red_flags_present: List[str]

class SkinAnalysisResponse(BaseModel):
    status: str = Field(..., description="'SUCCESS', 'ABSTAINED_LOW_QUALITY', 'ABSTAINED_HIGH_UNCERTAINTY', 'MODEL_PENDING_INTEGRATION'")
    quality_gate: ImageQualityMetrics
    findings: List[CandidateFinding] = []
    uncertainty_score: Optional[float] = None
    abstained: bool = True
    abstention_reason: Optional[str] = None
    referral: ReferralRecommendation
    clinical_disclaimer: str = (
        "DERMASATHIAI is an informational AI companion and strictly NOT a replacement "
        "for a qualified doctor or clinical diagnosis. Model assessments represent statistical "
        "patterns and cannot guarantee clinical accuracy. Consult a registered medical "
        "practitioner or dermatologist for formal evaluation."
    )
    timestamp: str
