from pydantic import BaseModel, Field
from typing import List, Optional

class WellnessGuidanceRequest(BaseModel):
    skin_concern: str = Field(..., description="e.g. dryness, redness/heat, acne/oiliness, pigmentation")
    season: Optional[str] = Field("autumn", description="spring, summer, monsoon, autumn, winter")
    dosha_predominance: Optional[str] = Field(None, description="vata, pitta, kapha or mixed")
    dietary_preference: Optional[str] = Field("vegetarian", description="vegetarian, non-vegetarian, vegan")
    language: str = "en"

class HerbGuidance(BaseModel):
    herb_name: str
    sanskrit_name: str
    skin_benefits: str
    usage_guidance: str
    safety_precautions: str

class LifestyleGuidanceResponse(BaseModel):
    concern_analysis: str
    ayurvedic_perspective: str
    dietary_recommendations: List[str]
    lifestyle_practices: List[str]
    traditional_topical_care: List[HerbGuidance]
    evidence_based_prevention: List[str]
    cautionary_note: str = (
        "Ayurvedic and traditional wellness recommendations serve as supportive lifestyle practices. "
        "They do not replace medical management for active infections, severe dermatitis, or systemic conditions."
    )
