import os
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, status
from app.core.config import settings
from app.schemas.medical_report import MedicalReportAnalysisResponse
from app.services.gemini_service import gemini_service

router = APIRouter()

ALLOWED_REPORT_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"]

@router.get("/status", summary="Check Gemini Report Analyzer Status")
async def get_report_analyzer_status():
    """
    Returns the availability status of the Gemini Report Analyzer.
    """
    has_key = bool(getattr(settings, "GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY"))
    return {
        "gemini_configured": has_key,
        "model": getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash"),
        "supported_formats": ALLOWED_REPORT_EXTENSIONS,
        "max_upload_size_mb": 10
    }

@router.post(
    "/analyze",
    response_model=MedicalReportAnalysisResponse,
    summary="Analyze Medical Report (Biopsy, Lab Test, Pathology) with Gemini AI"
)
async def analyze_medical_report(
    file: UploadFile = File(..., description="Uploaded medical report document (PDF, PNG, JPEG, WebP)"),
    language: str = Form("en", description="Output language code (e.g., 'en', 'hi', 'mr', 'ta')"),
    gemini_api_key: Optional[str] = Form(None, description="Optional Gemini API key passed from client UI"),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key", description="Optional Gemini API key in header")
):
    """
    Analyzes an uploaded medical diagnostic report (PDF or image) using Google Gemini AI.
    Extracts key findings, identifies out-of-range clinical values, generates patient-friendly
    summaries, and suggests questions for the treating physician.
    """
    # 1. Validate file extension
    filename = file.filename or "medical_report"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_REPORT_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document format '{ext}'. Please upload a PDF or clear image ({', '.join(ALLOWED_REPORT_EXTENSIONS)})."
        )

    # 2. Read and validate file size
    try:
        content = await file.read()
    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read uploaded file: {str(ex)}"
        )

    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds size limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    # 3. Resolve API key
    effective_key = (gemini_api_key or x_gemini_api_key or "").strip() or None

    # 4. Invoke Gemini analysis
    result = await gemini_service.analyze_report(
        file_bytes=content,
        filename=filename,
        content_type=file.content_type,
        language=language,
        api_key=effective_key
    )

    return result
