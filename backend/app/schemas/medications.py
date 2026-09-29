from pydantic import BaseModel, Field
from typing import List, Optional

class DrugInteractionRequest(BaseModel):
    medications: List[str] = Field(..., min_length=1, description="List of medications or topical creams")
    allergies: List[str] = Field(default=[], description="Known drug allergies")
    patient_conditions: List[str] = Field(default=[], description="Existing conditions e.g. pregnancy, kidney disease")
    language: str = "en"

class InteractionAlert(BaseModel):
    drugs_involved: List[str]
    severity: str  # 'high', 'moderate', 'low'
    clinical_effect: str
    recommendation: str

class DrugProfile(BaseModel):
    name: str
    category: str
    common_skin_uses: str
    general_safety_precautions: List[str]
    potential_side_effects: List[str]

class DrugSafetyResponse(BaseModel):
    safe_to_combine: bool
    interaction_alerts: List[InteractionAlert]
    allergy_warnings: List[str]
    condition_precautions: List[str]
    identified_drugs: List[DrugProfile]
    clinical_disclaimer: str = (
        "Medication information is for educational harm-reduction purposes only. "
        "Never discontinue, start, or alter prescription medications without consulting your prescribing physician."
    )
