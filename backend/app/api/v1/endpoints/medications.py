from fastapi import APIRouter
from app.services.medication_service import MedicationService
from app.schemas.medications import DrugInteractionRequest, DrugSafetyResponse

router = APIRouter()

@router.post("/check-safety", response_model=DrugSafetyResponse)
def check_medication_safety(req: DrugInteractionRequest):
    return MedicationService.check_safety(req)
