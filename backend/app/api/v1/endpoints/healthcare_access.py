from fastapi import APIRouter
from typing import List, Dict
from app.services.triage_service import TriageService

router = APIRouter()

@router.get("/facilities", response_model=List[Dict])
def list_healthcare_facilities():
    return TriageService.get_healthcare_access()
