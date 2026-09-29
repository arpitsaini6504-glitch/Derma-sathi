from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, JSON
from datetime import datetime, timezone
from app.db.base import Base

class ConsultationRecord(Base):
    __tablename__ = "consultation_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    session_type = Column(String(50), nullable=False)  # 'skin_photo', 'symptom_triage', 'medication_safety', 'wellness'
    
    # Quality & Model metrics
    quality_passed = Column(Boolean, default=False, nullable=False)
    quality_metrics = Column(JSON, nullable=True)
    
    # Decision Layer
    suspected_categories = Column(JSON, nullable=True)
    calibrated_confidence = Column(Float, nullable=True)
    abstained = Column(Boolean, default=True, nullable=False)
    abstention_reason = Column(String(255), nullable=True)
    
    # Clinical Safety & Triage
    triage_urgency = Column(String(50), default="routine", nullable=False)  # 'routine', 'prompt_consult', 'emergency'
    referral_needed = Column(Boolean, default=True, nullable=False)
    clinical_flags = Column(JSON, nullable=True)
    
    language = Column(String(10), default="en", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
