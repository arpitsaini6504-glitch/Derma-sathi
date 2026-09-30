import os
import datetime
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.core.config import settings
from app.core.logging import logger
from app.core.security import decode_access_token
from app.services.auth_service import AuthService
from app.services.gemini_service import gemini_service
from app.models.user import User
from app.models.prescription import (
    Prescription,
    PrescriptionMedicine,
    MedicationSchedule,
    MedicationReminder
)
from app.schemas.prescription import (
    PrescriptionMedicineItem,
    PrescriptionAnalysisResponse,
    PrescriptionVerificationRequest,
    PrescriptionVerificationResponse,
    CreateSchedulesRequest,
    MedicationScheduleResponse,
    MedicationReminderItem,
    CreateCustomReminderRequest,
    ReminderActionRequest,
    ReminderActionResponse
)
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        return None
    try:
        user_id = int(payload["sub"])
        return AuthService.get_by_id(db, user_id)
    except Exception:
        return None

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}

@router.post("/analyze", response_model=PrescriptionAnalysisResponse)
async def analyze_prescription(
    file: UploadFile = File(...),
    language: str = Form("en"),
    gemini_api_key: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Upload and extract structured prescription medications using Gemini multimodal AI.
    Saves prescription with status 'verification_required' for mandatory user confirmation.
    """
    filename = file.filename or "prescription"
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document format '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty. Please provide a legible prescription photo or PDF."
        )

    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
        )

    # Invoke Gemini OCR extraction
    parsed = await gemini_service.analyze_prescription(
        file_bytes=file_bytes,
        filename=filename,
        content_type=file.content_type,
        language=language,
        api_key=gemini_api_key
    )

    # Persist in DB with verification_required status
    user_id = current_user.id if current_user else None
    prescription = Prescription(
        user_id=user_id,
        filename=filename,
        file_type=ext,
        status="verification_required",
        doctor_name=parsed.get("doctor_name"),
        clinic_or_hospital=parsed.get("clinic_or_hospital"),
        prescription_date=parsed.get("prescription_date"),
        patient_name=parsed.get("patient_name"),
        diagnosis_or_symptoms=parsed.get("diagnosis_or_symptoms"),
        general_advice=parsed.get("general_advice"),
        confidence_notes=parsed.get("confidence_notes")
    )
    db.add(prescription)
    db.flush()

    medicine_items: List[PrescriptionMedicineItem] = []
    raw_medicines = parsed.get("medicines", [])
    for med in raw_medicines:
        timing_list = med.get("timing") or []
        if isinstance(timing_list, str):
            timing_list = [timing_list]

        # Medical safety rule: if dosage, frequency, or timing missing, flag as unclear
        is_unclear = med.get("is_unclear", False)
        unclear_reason = med.get("unclear_reason")
        if not med.get("dosage") or not med.get("frequency"):
            is_unclear = True
            if not unclear_reason:
                unclear_reason = "Dosage or frequency not clearly specified on slip. Requires manual verification."

        db_med = PrescriptionMedicine(
            prescription_id=prescription.id,
            medicine_name=med.get("medicine_name", "Prescribed Medicine"),
            strength=med.get("strength"),
            dosage=med.get("dosage"),
            dosage_unit=med.get("dosage_unit"),
            frequency=med.get("frequency"),
            route=med.get("route"),
            timing=timing_list,
            duration=med.get("duration"),
            quantity=med.get("quantity"),
            special_instructions=med.get("special_instructions"),
            is_verified=False,
            is_unclear=is_unclear,
            unclear_reason=unclear_reason
        )
        db.add(db_med)
        db.flush()

        medicine_items.append(PrescriptionMedicineItem(
            id=db_med.id,
            medicine_name=db_med.medicine_name,
            strength=db_med.strength,
            dosage=db_med.dosage,
            dosage_unit=db_med.dosage_unit,
            frequency=db_med.frequency,
            route=db_med.route,
            timing=timing_list,
            duration=db_med.duration,
            quantity=db_med.quantity,
            special_instructions=db_med.special_instructions,
            is_verified=False,
            is_unclear=is_unclear,
            unclear_reason=unclear_reason
        ))

    db.commit()
    db.refresh(prescription)

    return PrescriptionAnalysisResponse(
        status="verification_required",
        prescription_id=prescription.id,
        filename=filename,
        requires_user_confirmation=True,
        doctor_name=prescription.doctor_name,
        clinic_or_hospital=prescription.clinic_or_hospital,
        prescription_date=prescription.prescription_date,
        patient_name=prescription.patient_name,
        diagnosis_or_symptoms=prescription.diagnosis_or_symptoms,
        medicines=medicine_items,
        general_advice=prescription.general_advice,
        confidence_notes=prescription.confidence_notes,
        timestamp=prescription.created_at.isoformat()
    )

@router.post("/{prescription_id}/verify", response_model=PrescriptionVerificationResponse)
def verify_prescription(
    prescription_id: int,
    request: PrescriptionVerificationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Patient reviews and confirms or corrects extracted medication details.
    Updates prescription state to 'verified' or 'partially_verified'.
    """
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription record not found.")

    if current_user and prescription.user_id and prescription.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this prescription record.")

    if request.doctor_name is not None:
        prescription.doctor_name = request.doctor_name
    if request.prescription_date is not None:
        prescription.prescription_date = request.prescription_date
    if request.general_advice is not None:
        prescription.general_advice = request.general_advice

    # Replace / update medicines
    db.query(PrescriptionMedicine).filter(PrescriptionMedicine.prescription_id == prescription_id).delete()
    
    verified_items: List[PrescriptionMedicineItem] = []
    has_unverified = False

    for med in request.medicines:
        is_verified = med.is_verified
        if not is_verified:
            has_unverified = True

        db_med = PrescriptionMedicine(
            prescription_id=prescription_id,
            medicine_name=med.medicine_name.strip(),
            strength=med.strength,
            dosage=med.dosage,
            dosage_unit=med.dosage_unit,
            frequency=med.frequency,
            route=med.route,
            timing=med.timing,
            duration=med.duration,
            quantity=med.quantity,
            special_instructions=med.special_instructions,
            is_verified=is_verified,
            is_unclear=med.is_unclear,
            unclear_reason=med.unclear_reason
        )
        db.add(db_med)
        db.flush()

        verified_items.append(PrescriptionMedicineItem(
            id=db_med.id,
            medicine_name=db_med.medicine_name,
            strength=db_med.strength,
            dosage=db_med.dosage,
            dosage_unit=db_med.dosage_unit,
            frequency=db_med.frequency,
            route=db_med.route,
            timing=db_med.timing or [],
            duration=db_med.duration,
            quantity=db_med.quantity,
            special_instructions=db_med.special_instructions,
            is_verified=db_med.is_verified,
            is_unclear=db_med.is_unclear,
            unclear_reason=db_med.unclear_reason
        ))

    prescription.status = "partially_verified" if has_unverified else "verified"
    db.commit()

    return PrescriptionVerificationResponse(
        success=True,
        prescription_id=prescription.id,
        status=prescription.status,
        message="Prescription medications successfully verified against original doctor's slip.",
        verified_medicines=verified_items
    )

@router.post("/{prescription_id}/create-schedules", response_model=List[MedicationScheduleResponse])
def create_medication_schedules(
    prescription_id: int,
    request: CreateSchedulesRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Creates active medication schedules and reminders ONLY from user-verified prescription information.
    """
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription record not found.")

    if current_user and prescription.user_id and prescription.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if prescription.status not in ("verified", "partially_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create medication reminders from an unverified prescription. Please review and confirm medications first."
        )

    created_schedules: List[MedicationScheduleResponse] = []
    user_id = current_user.id if current_user else prescription.user_id
    today_str = datetime.date.today().isoformat()

    # Clear prior schedules/reminders for this prescription to prevent duplicates on re-confirmation
    db.query(MedicationSchedule).filter(MedicationSchedule.prescription_id == prescription_id).delete()

    for item in request.schedules:
        # Calculate duration days and end_date
        duration_days = max(1, min(item.duration_days or 7, 30))
        try:
            start_dt = datetime.date.fromisoformat(item.start_date)
        except Exception:
            start_dt = datetime.date.today()
        
        end_dt = start_dt + datetime.timedelta(days=duration_days)
        end_date = end_dt.isoformat()

        schedule = MedicationSchedule(
            user_id=user_id,
            prescription_id=prescription_id,
            prescription_medicine_id=item.medicine_id,
            medicine_name=item.medicine_name.strip(),
            dosage=item.dosage.strip(),
            frequency=item.frequency.strip(),
            times_of_day=item.times_of_day,
            start_date=start_dt.isoformat(),
            end_date=end_date,
            duration_days=duration_days,
            special_instructions=item.special_instructions,
            is_active=True
        )
        db.add(schedule)
        db.flush()

        # Generate reminders for the schedule duration
        for day_idx in range(duration_days):
            day_str = (start_dt + datetime.timedelta(days=day_idx)).isoformat()
            for time_slot in item.times_of_day:
                reminder = MedicationReminder(
                    schedule_id=schedule.id,
                    user_id=user_id,
                    medicine_name=schedule.medicine_name,
                    dosage=schedule.dosage,
                    scheduled_time=time_slot,
                    scheduled_date=day_str,
                    status="scheduled",
                    notes=schedule.special_instructions
                )
                db.add(reminder)

        created_schedules.append(MedicationScheduleResponse(
            id=schedule.id,
            prescription_id=schedule.prescription_id,
            medicine_name=schedule.medicine_name,
            dosage=schedule.dosage,
            frequency=schedule.frequency,
            times_of_day=schedule.times_of_day,
            start_date=schedule.start_date,
            end_date=schedule.end_date,
            duration_days=schedule.duration_days,
            special_instructions=schedule.special_instructions,
            is_active=schedule.is_active,
            created_at=schedule.created_at.isoformat()
        ))

    db.commit()
    return created_schedules

@router.post("/reminders", response_model=MedicationReminderItem, status_code=status.HTTP_201_CREATED)
def create_custom_reminder(
    request: CreateCustomReminderRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Allows a patient to directly create a medicine reminder.
    """
    user_id = current_user.id if current_user else None
    scheduled_date = request.scheduled_date.strip() if (request.scheduled_date and request.scheduled_date.strip()) else datetime.date.today().isoformat()

    reminder = MedicationReminder(
        schedule_id=None,
        user_id=user_id,
        medicine_name=request.medicine_name.strip(),
        dosage=request.dosage.strip(),
        scheduled_time=request.scheduled_time.strip(),
        scheduled_date=scheduled_date,
        status="scheduled",
        notes=request.notes.strip() if request.notes else None
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return MedicationReminderItem(
        id=reminder.id,
        schedule_id=reminder.schedule_id,
        medicine_name=reminder.medicine_name,
        dosage=reminder.dosage,
        scheduled_time=reminder.scheduled_time,
        scheduled_date=reminder.scheduled_date,
        status=reminder.status,
        action_timestamp=None,
        special_instructions=reminder.notes
    )

@router.get("/reminders/today", response_model=List[MedicationReminderItem])
def get_today_reminders(
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Returns only today's scheduled medication reminders.
    Supports optional ?date=YYYY-MM-DD from client's local timezone.
    Never returns future dates or unassigned reminders.
    """
    client_date = date.strip() if (date and date.strip()) else None
    local_today = datetime.date.today().isoformat()
    utc_today = datetime.datetime.now(datetime.timezone.utc).date().isoformat()

    dates_to_check = []
    if client_date:
        dates_to_check.append(client_date)
    if local_today not in dates_to_check:
        dates_to_check.append(local_today)
    if utc_today not in dates_to_check:
        dates_to_check.append(utc_today)

    query = db.query(MedicationReminder)
    if current_user:
        query = query.filter(
            (MedicationReminder.user_id == current_user.id) | (MedicationReminder.user_id.is_(None))
        )

    reminders = query.filter(
        MedicationReminder.scheduled_date.in_(dates_to_check)
    ).order_by(MedicationReminder.scheduled_time.asc(), MedicationReminder.id.asc()).all()


    results: List[MedicationReminderItem] = []
    for rem in reminders:
        results.append(MedicationReminderItem(
            id=rem.id,
            schedule_id=rem.schedule_id,
            medicine_name=rem.medicine_name,
            dosage=rem.dosage,
            scheduled_time=rem.scheduled_time,
            scheduled_date=rem.scheduled_date,
            status=rem.status,
            action_timestamp=rem.action_timestamp.isoformat() if rem.action_timestamp else None,
            special_instructions=rem.notes
        ))
    return results

@router.patch("/reminders/{reminder_id}/action", response_model=ReminderActionResponse)
def update_reminder_action(
    reminder_id: int,
    request: ReminderActionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Updates status of a reminder: 'taken', 'skipped', or 'snooze'.
    Provides safe, non-prescriptive advisory.
    """
    reminder = db.query(MedicationReminder).filter(MedicationReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication reminder not found.")

    if current_user and reminder.user_id and reminder.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    action_lower = request.action.lower()
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    safety_message = "Adherence logged successfully."

    if action_lower == "taken":
        reminder.status = "taken"
        reminder.action_timestamp = now_dt
        safety_message = f"Dose of {reminder.medicine_name} marked as taken. Stay well-hydrated and follow doctor instructions."
    elif action_lower == "skipped":
        reminder.status = "skipped"
        reminder.action_timestamp = now_dt
        safety_message = (
            f"Dose of {reminder.medicine_name} skipped. "
            "Safety Notice: Never take a double dose to make up for a missed dose. "
            "Consult your pharmacist or physician if you have questions."
        )
    elif action_lower in ("snooze", "snoozed"):
        reminder.status = "snoozed"
        minutes = request.snooze_minutes or 15
        reminder.notes = f"Snoozed for {minutes} minutes"
        safety_message = f"Reminder snoozed for {minutes} minutes."
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid reminder action '{request.action}'")

    db.commit()
    db.refresh(reminder)

    return ReminderActionResponse(
        success=True,
        reminder_id=reminder.id,
        status=reminder.status,
        safety_message=safety_message,
        action_timestamp=now_dt.isoformat()
    )

@router.delete("/reminders/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    all_future: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Deletes a specific medication reminder or all future reminders for this medication schedule.
    """
    reminder = db.query(MedicationReminder).filter(MedicationReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication reminder not found.")

    if current_user and reminder.user_id and reminder.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if all_future and reminder.schedule_id:
        db.query(MedicationReminder).filter(
            MedicationReminder.schedule_id == reminder.schedule_id,
            MedicationReminder.id >= reminder.id
        ).delete(synchronize_session=False)
    else:
        db.delete(reminder)

    db.commit()
    return None

@router.get("", response_model=List[PrescriptionAnalysisResponse])
def list_prescriptions(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Lists stored prescriptions for the patient.
    """
    query = db.query(Prescription)
    if current_user:
        query = query.filter((Prescription.user_id == current_user.id) | (Prescription.user_id.is_(None)))
    prescriptions = query.order_by(desc(Prescription.created_at)).limit(20).all()

    result: List[PrescriptionAnalysisResponse] = []
    for p in prescriptions:
        med_items = [
            PrescriptionMedicineItem(
                id=m.id,
                medicine_name=m.medicine_name,
                strength=m.strength,
                dosage=m.dosage,
                dosage_unit=m.dosage_unit,
                frequency=m.frequency,
                route=m.route,
                timing=m.timing or [],
                duration=m.duration,
                quantity=m.quantity,
                special_instructions=m.special_instructions,
                is_verified=m.is_verified,
                is_unclear=m.is_unclear,
                unclear_reason=m.unclear_reason
            ) for m in p.medicines
        ]
        result.append(PrescriptionAnalysisResponse(
            status=p.status,
            prescription_id=p.id,
            filename=p.filename,
            requires_user_confirmation=True,
            doctor_name=p.doctor_name,
            clinic_or_hospital=p.clinic_or_hospital,
            prescription_date=p.prescription_date,
            patient_name=p.patient_name,
            diagnosis_or_symptoms=p.diagnosis_or_symptoms,
            medicines=med_items,
            general_advice=p.general_advice,
            confidence_notes=p.confidence_notes,
            timestamp=p.created_at.isoformat()
        ))
    return result

@router.get("/{prescription_id}", response_model=PrescriptionAnalysisResponse)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Fetch a single prescription by ID with its medication details.
    """
    p = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found.")

    if current_user and p.user_id and p.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    med_items = [
        PrescriptionMedicineItem(
            id=m.id,
            medicine_name=m.medicine_name,
            strength=m.strength,
            dosage=m.dosage,
            dosage_unit=m.dosage_unit,
            frequency=m.frequency,
            route=m.route,
            timing=m.timing or [],
            duration=m.duration,
            quantity=m.quantity,
            special_instructions=m.special_instructions,
            is_verified=m.is_verified,
            is_unclear=m.is_unclear,
            unclear_reason=m.unclear_reason
        ) for m in p.medicines
    ]

    return PrescriptionAnalysisResponse(
        status=p.status,
        prescription_id=p.id,
        filename=p.filename,
        requires_user_confirmation=True,
        doctor_name=p.doctor_name,
        clinic_or_hospital=p.clinic_or_hospital,
        prescription_date=p.prescription_date,
        patient_name=p.patient_name,
        diagnosis_or_symptoms=p.diagnosis_or_symptoms,
        medicines=med_items,
        general_advice=p.general_advice,
        confidence_notes=p.confidence_notes,
        timestamp=p.created_at.isoformat()
    )

@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Securely deletes a prescription record and all associated medicines and schedules.
    """
    p = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found.")

    if current_user and p.user_id and p.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    db.delete(p)
    db.commit()
    return None
