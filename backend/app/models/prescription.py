from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    status = Column(String(50), default="verification_required", nullable=False, index=True)
    
    doctor_name = Column(String(255), nullable=True)
    clinic_or_hospital = Column(String(255), nullable=True)
    prescription_date = Column(String(50), nullable=True)
    patient_name = Column(String(255), nullable=True)
    diagnosis_or_symptoms = Column(String(255), nullable=True)
    general_advice = Column(Text, nullable=True)
    confidence_notes = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    medicines = relationship("PrescriptionMedicine", back_populates="prescription", cascade="all, delete-orphan")
    schedules = relationship("MedicationSchedule", back_populates="prescription", cascade="all, delete-orphan")

class PrescriptionMedicine(Base):
    __tablename__ = "prescription_medicines"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_name = Column(String(255), nullable=False)
    strength = Column(String(100), nullable=True)
    dosage = Column(String(100), nullable=True)
    dosage_unit = Column(String(50), nullable=True)
    frequency = Column(String(100), nullable=True)
    route = Column(String(50), nullable=True)
    timing = Column(JSON, nullable=True)  # List[str], e.g., ["morning", "night"]
    duration = Column(String(100), nullable=True)
    quantity = Column(String(100), nullable=True)
    special_instructions = Column(Text, nullable=True)
    
    is_verified = Column(Boolean, default=False, nullable=False)
    is_unclear = Column(Boolean, default=False, nullable=False)
    unclear_reason = Column(String(255), nullable=True)

    prescription = relationship("Prescription", back_populates="medicines")
    schedules = relationship("MedicationSchedule", back_populates="prescription_medicine")

class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=True, index=True)
    prescription_medicine_id = Column(Integer, ForeignKey("prescription_medicines.id", ondelete="SET NULL"), nullable=True)
    
    medicine_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    times_of_day = Column(JSON, nullable=False)  # List[str], e.g., ["08:00 AM", "08:00 PM"]
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=True)
    duration_days = Column(Integer, nullable=True)
    special_instructions = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    prescription = relationship("Prescription", back_populates="schedules")
    prescription_medicine = relationship("PrescriptionMedicine", back_populates="schedules")
    reminders = relationship("MedicationReminder", back_populates="schedule", cascade="all, delete-orphan")

class MedicationReminder(Base):
    __tablename__ = "medication_reminders"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("medication_schedules.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    
    medicine_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)
    scheduled_time = Column(String(50), nullable=False)  # e.g., "08:00 AM"
    scheduled_date = Column(String(50), nullable=False)  # e.g., "2026-09-30"
    status = Column(String(50), default="scheduled", nullable=False)  # "scheduled", "taken", "skipped", "snoozed", "missed"
    action_timestamp = Column(DateTime, nullable=True)
    notes = Column(String(255), nullable=True)

    schedule = relationship("MedicationSchedule", back_populates="reminders")
