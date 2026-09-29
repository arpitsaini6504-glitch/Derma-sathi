from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.services.skin_pipeline import skin_pipeline
from app.core.config import settings

router = APIRouter()

@router.get("/status")
def system_health_status(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    model_ready = skin_pipeline.model.is_available()

    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "ml_subsystem": {
            "model_path": settings.DERMASATHI_MODEL_PATH,
            "weights_loaded": model_ready,
            "status_message": "Active Inference" if model_ready else "Pending Model Deployment in backend/model_store/"
        },
        "quality_gate_active": True,
        "safety_layer_active": True
    }
