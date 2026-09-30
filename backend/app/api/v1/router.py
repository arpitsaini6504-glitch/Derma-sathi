from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    skin_analysis,
    symptoms,
    medications,
    wellness,
    emergency,
    healthcare_access,
    health_check,
    skin,
    reports,
    prescriptions
)

api_router = APIRouter()

api_router.include_router(health_check.router, prefix="/health", tags=["System Health"])
api_router.include_router(skin.router, prefix="/skin", tags=["ML Skin Analysis"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profile"])
api_router.include_router(skin_analysis.router, prefix="/skin-analysis", tags=["Skin Analysis & Quality Gate"])
api_router.include_router(reports.router, prefix="/reports", tags=["Medical Reports & Gemini Analysis"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["Prescription Reader & Medication Reminders"])
api_router.include_router(symptoms.router, prefix="/symptoms", tags=["Symptom Analysis"])
api_router.include_router(medications.router, prefix="/medications", tags=["Medication Safety & Drug Interactions"])
api_router.include_router(wellness.router, prefix="/wellness", tags=["Traditional & Ayurvedic Wellness"])
api_router.include_router(emergency.router, prefix="/emergency", tags=["Emergency & Risk Triage"])
api_router.include_router(healthcare_access.router, prefix="/healthcare-access", tags=["Healthcare Facilities Access"])
