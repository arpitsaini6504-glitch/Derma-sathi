from fastapi import APIRouter
from app.services.wellness_service import WellnessService
from app.schemas.wellness import WellnessGuidanceRequest, LifestyleGuidanceResponse

router = APIRouter()

@router.post("/guidance", response_model=LifestyleGuidanceResponse)
def get_wellness_guidance(req: WellnessGuidanceRequest):
    return WellnessService.get_guidance(req)
