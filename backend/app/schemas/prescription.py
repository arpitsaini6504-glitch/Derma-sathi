from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

class PrescriptionMedicineItem(BaseModel):
    id: Optional[int] = None
    medicine_name: str = Field(..., description="Trade name or generic name of prescribed medicine")
    strength: Optional[str] = Field(None, description="Strength, e.g. 500mg, 1%")
    dosage: Optional[str] = Field(None, description="Dose form, e.g. 1 tablet, apply thin film")
    dosage_unit: Optional[str] = Field(None, description="Unit, e.g. tablet, capsule, ml, cream")
    frequency: Optional[str] = Field(None, description="Frequency, e.g. twice daily, once daily, TDS, SOS")
    route: Optional[str] = Field(None, description="Route, e.g. oral, topical")
    timing: List[str] = Field(default_factory=list, description="Timing list, e.g. ['morning', 'night']")
    duration: Optional[str] = Field(None, description="Duration, e.g. 5 days, 1 month")
    quantity: Optional[str] = Field(None, description="Total dispensed quantity")
    special_instructions: Optional[str] = Field(None, description="Instructions, e.g. after food, at bedtime")
    is_verified: bool = Field(False, description="Whether the user has checked and confirmed this item")
    is_unclear: bool = Field(False, description="True if any dosage/frequency was illegible or missing")
    unclear_reason: Optional[str] = Field(None, description="Detail on what was unclear or missing")

class PrescriptionAnalysisResponse(BaseModel):
    status: str = Field("verification_required", description="State of prescription analysis")
    prescription_id: int = Field(..., description="ID of stored prescription")
    filename: str = Field(..., description="Name of uploaded document")
    requires_user_confirmation: bool = Field(True, description="Strict rule: extracted details require user verification")
    doctor_name: Optional[str] = Field(None, description="Doctor name if legible")
    clinic_or_hospital: Optional[str] = Field(None, description="Hospital or clinic header")
    prescription_date: Optional[str] = Field(None, description="Date on prescription slip")
    patient_name: Optional[str] = Field(None, description="Patient name if noted")
    diagnosis_or_symptoms: Optional[str] = Field(None, description="Provisional diagnosis or complaints")
    medicines: List[PrescriptionMedicineItem] = Field(default_factory=list, description="Extracted medications")
    general_advice: Optional[str] = Field(None, description="General non-pharmacological advice")
    confidence_notes: Optional[str] = Field(None, description="Readability and confidence observations")
    clinical_safety_notice: str = (
        "Prescription analysis is an assistive OCR tool and strictly NOT a medical consultation. "
        "Never modify dosages or start new medications without verifying against the doctor's original written slip."
    )
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PrescriptionVerificationRequest(BaseModel):
    medicines: List[PrescriptionMedicineItem]
    doctor_name: Optional[str] = None
    prescription_date: Optional[str] = None
    general_advice: Optional[str] = None

class PrescriptionVerificationResponse(BaseModel):
    success: bool = True
    prescription_id: int
    status: str  # "verified" or "partially_verified"
    message: str
    verified_medicines: List[PrescriptionMedicineItem]

class ScheduleCreateItem(BaseModel):
    medicine_id: Optional[int] = None
    medicine_name: str
    dosage: str
    frequency: str
    times_of_day: List[str] = Field(..., description="e.g. ['08:00 AM', '08:00 PM']")
    start_date: str = Field(..., description="YYYY-MM-DD")
    duration_days: Optional[int] = None
    special_instructions: Optional[str] = None

class CreateSchedulesRequest(BaseModel):
    schedules: List[ScheduleCreateItem]

class MedicationScheduleResponse(BaseModel):
    id: int
    prescription_id: Optional[int]
    medicine_name: str
    dosage: str
    frequency: str
    times_of_day: List[str]
    start_date: str
    end_date: Optional[str]
    duration_days: Optional[int]
    special_instructions: Optional[str]
    is_active: bool
    created_at: str

class MedicationReminderItem(BaseModel):
    id: int
    schedule_id: Optional[int] = None
    prescription_id: Optional[int] = None
    medicine_name: str
    dosage: str
    scheduled_time: str
    scheduled_date: str
    status: str  # "scheduled", "taken", "skipped", "snoozed", "missed"
    action_timestamp: Optional[str] = None
    special_instructions: Optional[str] = None

class CreateCustomReminderRequest(BaseModel):
    medicine_name: str = Field(..., min_length=1)
    dosage: str = "1 dose"
    scheduled_time: str = "08:00 AM"
    scheduled_date: Optional[str] = None
    notes: Optional[str] = None

class ReminderActionRequest(BaseModel):
    action: str = Field(..., description="'taken', 'skipped', 'snooze'")
    snooze_minutes: Optional[int] = 15
    notes: Optional[str] = None

class ReminderActionResponse(BaseModel):
    success: bool = True
    reminder_id: int
    status: str
    safety_message: str
    action_timestamp: str
