from pydantic import BaseModel, Field
from typing import List, Optional

class EmergencyAssessmentRequest(BaseModel):
    symptoms_description: str
    has_facial_swelling: bool = False
    has_breathing_difficulty: bool = False
    has_peeling_or_mucosal_involvement: bool = False  # Critical red flag for SJS/TEN
    has_high_fever: bool = False
    has_rapid_blistering: bool = False
    has_severe_uncontrollable_pain: bool = False
    language: str = "en"

class EmergencyFacilityContact(BaseModel):
    name: str
    contact_number: str
    description: str

class EmergencyAssessmentResponse(BaseModel):
    is_emergency: bool
    triage_priority: str  # 'IMMEDIATE_EMERGENCY', 'URGENT_EVALUATION', 'ROUTINE'
    clinical_rationale: str
    immediate_actions: List[str]
    emergency_contacts: List[EmergencyFacilityContact]
    do_not_do_list: List[str]
    disclaimer: str = (
        "EMERGENCY PROTOCOL: If you are experiencing difficulty breathing, swelling of the mouth/throat, "
        "or extensive skin blistering, call local emergency services (112 / 108 in India) or go to the nearest emergency room immediately."
    )
