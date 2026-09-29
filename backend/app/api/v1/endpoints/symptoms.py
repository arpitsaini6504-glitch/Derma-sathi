from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.symptom_service import SymptomService
from app.schemas.symptoms import SymptomCheckRequest, SymptomCheckResponse
from app.models.consultation import ConsultationRecord
from app.core.logging import logger

router = APIRouter()

@router.post("/check", response_model=SymptomCheckResponse)
def check_symptoms(req: SymptomCheckRequest, db: Session = Depends(get_db)):
    result = SymptomService.evaluate(req)

    # Persist anonymized audit record
    try:
        record = ConsultationRecord(
            session_type="symptom_triage",
            quality_passed=True,
            triage_urgency=result.triage_level,
            referral_needed=result.triage_level != "routine",
            clinical_flags=result.red_flags,
            language=req.language
        )
        db.add(record)
        db.commit()
    except Exception as e:
        logger.error(f"Audit record persistence failed: {e}")
        db.rollback()

    return result
