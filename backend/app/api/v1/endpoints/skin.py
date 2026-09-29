import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.ml.inference_service import skin_inference_service
from app.ml.exceptions import ModelNotAvailableError, InvalidImagePayloadError, MLServiceException
from app.ml.schemas import (
    SkinAnalysisMLResponse,
    ImageQualityGatePlaceholder,
    OODDetectionPlaceholder,
    ConfidenceCalibrationPlaceholder,
    AbstentionPolicyPlaceholder,
    SafetyPolicyPlaceholder
)

router = APIRouter()

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]

def validate_image_upload(file: UploadFile) -> None:
    """Validates MIME type against permitted image formats."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type '{file.content_type}'. Please upload a valid JPEG, PNG, or WebP image."
        )

@router.post(
    "/analyze",
    response_model=SkinAnalysisMLResponse,
    summary="Analyze skin image using ML Inference Service",
    description="Processes an uploaded skin image via the inference service. Fails safely when model weights are not present in model_store/."
)
async def analyze_skin(file: UploadFile = File(...)):
    # 1. Content-Type validation
    validate_image_upload(file)

    # 2. File size enforcement
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded image exceeds maximum permitted size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image file is empty."
        )

    # 3. Create a safe temporary processing path with guaranteed cleanup
    temp_file_path = None
    try:
        suffix = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name

        # 4. Pass temporary image path to the ML inference service
        try:
            result = skin_inference_service.predict(temp_file_path)
            return result

        except ModelNotAvailableError as e:
            # Convert controlled service-level error into structured non-diagnostic response
            logger.info(f"[/skin/analyze] Controlled model absence: {e.message}")
            return SkinAnalysisMLResponse(
                status=e.error_code,  # 'MODEL_NOT_AVAILABLE'
                prediction=None,
                raw_probability=None,
                calibrated_confidence=None,
                uncertainty=None,
                requires_professional_review=True,
                model_version=None,
                message=(
                    "Trained skin model is not deployed in backend/model_store/. "
                    "Clinical fail-safe abstention enforced. Please consult a qualified dermatologist."
                ),
                image_quality_gate=ImageQualityGatePlaceholder(),
                ood_detection=OODDetectionPlaceholder(),
                confidence_calibration=ConfidenceCalibrationPlaceholder(),
                abstention_policy=AbstentionPolicyPlaceholder(
                    enforced=True,
                    reason="Model weights pending in backend/model_store/."
                ),
                safety_policy=SafetyPolicyPlaceholder()
            )

        except InvalidImagePayloadError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=e.message
            )

        except MLServiceException as e:
            logger.error(f"[/skin/analyze] ML service error: {e.message}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="A controlled processing error occurred in the ML subsystem."
            )

    except HTTPException:
        raise

    except Exception as e:
        # Never expose internal stack traces or paths
        logger.error(f"[/skin/analyze] Unhandled processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the skin photo. Please try again."
        )

    finally:
        # Guarantee safe temporary file deletion
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as clean_err:
                logger.warning(f"[/skin/analyze] Temp file cleanup warning: {clean_err}")
