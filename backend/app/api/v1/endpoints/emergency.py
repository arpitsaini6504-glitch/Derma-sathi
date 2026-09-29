from fastapi import APIRouter
from app.services.triage_service import TriageService
from app.schemas.emergency import EmergencyAssessmentRequest, EmergencyAssessmentResponse

router = APIRouter()

@router.post("/assess", response_model=EmergencyAssessmentResponse)
def assess_emergency_risk(req: EmergencyAssessmentRequest):
    return TriageService.assess_emergency(req)
