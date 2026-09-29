from pydantic import BaseModel, Field
from typing import List, Optional

class SymptomCheckRequest(BaseModel):
    symptoms: List[str] = Field(..., min_length=1, description="List of reported symptoms (e.g. itching, redness, flaking, burning)")
    duration_days: Optional[int] = Field(None, ge=0, description="Duration in days")
    affected_body_locations: List[str] = Field(default=[], description="Locations (e.g. scalp, face, arms, torso, legs)")
    severity: str = Field(default="moderate", description="'mild', 'moderate', 'severe'")
    has_fever: bool = False
    has_rapid_spread: bool = False
    has_pain_or_bleeding: bool = False
    language: str = "en"

class SymptomDifferential(BaseModel):
    condition_name: str
    educational_summary: str
    relevance_level: str  # 'high', 'moderate', 'low'
    common_triggers: List[str]

class SymptomCheckResponse(BaseModel):
    triage_level: str  # 'emergency', 'prompt_consult', 'routine'
    differentials: List[SymptomDifferential]
    red_flags: List[str]
    self_care_precautions: List[str]
    referral_guidance: str
    disclaimer: str = (
        "This symptom assessment is educational and does not constitute a medical diagnosis. "
        "Seek immediate medical attention if you experience severe pain, difficulty breathing, or rapid worsening."
    )
