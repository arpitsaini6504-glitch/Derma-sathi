import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.logging import logger
from app.services.skin_pipeline import skin_pipeline
from app.schemas.skin_analysis import SkinAnalysisResponse, ImageQualityMetrics
from app.models.consultation import ConsultationRecord

router = APIRouter()

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]

def validate_image_upload(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '{file.content_type}'. Please upload JPEG, PNG, or WebP images."
        )

@router.post("/analyze-image", response_model=SkinAnalysisResponse)
async def analyze_skin_image(
    file: UploadFile = File(...),
    language: str = "en",
    db: Session = Depends(get_db)
):
    validate_image_upload(file)
    contents = await file.read()

    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds maximum permitted size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image file is empty."
        )

    # Execute 8-Stage Skin Analysis Pipeline
    response = skin_pipeline.process_image(contents)

    # Persist anonymized audit record (No raw image bytes stored)
    try:
        record = ConsultationRecord(
            session_type="skin_photo",
            quality_passed=response.quality_gate.is_acceptable,
            quality_metrics=response.quality_gate.model_dump(),
            suspected_categories=[f.model_dump() for f in response.findings] if response.findings else None,
            calibrated_confidence=response.findings[0].calibrated_probability if response.findings else None,
            abstained=response.abstained,
            abstention_reason=response.abstention_reason,
            triage_urgency=response.referral.urgency,
            referral_needed=True,
            clinical_flags=response.referral.red_flags_present,
            language=language
        )
        db.add(record)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to persist consultation audit record: {e}")
        db.rollback()

    return response

@router.post("/quality-check", response_model=ImageQualityMetrics)
async def quick_quality_check(file: UploadFile = File(...)):
    """Pre-flight quality gate check to provide instant feedback before full analysis."""
    validate_image_upload(file)
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds maximum permitted file size."
        )
    _, metrics, _ = skin_pipeline.quality_gate.evaluate(contents)
    return metrics
