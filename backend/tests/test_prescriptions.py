from unittest.mock import patch, AsyncMock
from app.models.prescription import Prescription, PrescriptionMedicine, MedicationSchedule, MedicationReminder

SAMPLE_PARSED_PRESCRIPTION = {
    "doctor_name": "Dr. Ramesh Sharma, MD (Dermatology)",
    "clinic_or_hospital": "Apollo Skin Care Clinic",
    "prescription_date": "2026-09-28",
    "patient_name": "Arpit",
    "diagnosis_or_symptoms": "Atopic Dermatitis & Eczema",
    "medicines": [
        {
            "medicine_name": "Mometasone Furoate 0.1% Cream",
            "strength": "0.1%",
            "dosage": "Apply thin layer",
            "dosage_unit": "cream",
            "frequency": "Once daily",
            "route": "topical",
            "timing": ["night"],
            "duration": "7 days",
            "quantity": "1 tube",
            "special_instructions": "Apply after evening bath. Do not apply near eyes.",
            "is_unclear": False,
            "unclear_reason": None
        },
        {
            "medicine_name": "Levocetirizine 5mg",
            "strength": "5mg",
            "dosage": "1 tablet",
            "dosage_unit": "tablet",
            "frequency": "Once daily",
            "route": "oral",
            "timing": ["night"],
            "duration": "10 days",
            "quantity": "10 tablets",
            "special_instructions": "At bedtime with water",
            "is_unclear": False,
            "unclear_reason": None
        }
    ],
    "general_advice": "Avoid hot showers and scented soaps. Keep skin well hydrated.",
    "confidence_notes": "Prescription printed clearly on clinic letterhead."
}

SAMPLE_UNCLEAR_PRESCRIPTION = {
    "doctor_name": "Dr. K. Patel",
    "clinic_or_hospital": "City Skin Center",
    "prescription_date": "2026-09-25",
    "patient_name": None,
    "diagnosis_or_symptoms": None,
    "medicines": [
        {
            "medicine_name": "Antibiotic Ointment",
            "strength": None,
            "dosage": None,
            "dosage_unit": None,
            "frequency": None,
            "route": "topical",
            "timing": [],
            "duration": None,
            "quantity": None,
            "special_instructions": None,
            "is_unclear": True,
            "unclear_reason": "Dosage and frequency illegible on handwritten note."
        }
    ],
    "general_advice": None,
    "confidence_notes": "Handwriting partially faded."
}

def test_analyze_unsupported_extension(client):
    files = {"file": ("prescription.exe", b"malicious", "application/octet-stream")}
    response = client.post("/api/v1/prescriptions/analyze", files=files, data={"language": "en"})
    assert response.status_code == 400
    assert "Unsupported document format" in response.json()["detail"]

def test_analyze_empty_file(client):
    files = {"file": ("prescription.pdf", b"", "application/pdf")}
    response = client.post("/api/v1/prescriptions/analyze", files=files, data={"language": "en"})
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_analyze_prescription_success(client):
    with patch("app.services.gemini_service.gemini_service.analyze_prescription", new=AsyncMock(return_value=SAMPLE_PARSED_PRESCRIPTION)):
        dummy_pdf = b"%PDF-1.4 dummy prescription content"
        files = {"file": ("rx_apollo.pdf", dummy_pdf, "application/pdf")}
        response = client.post("/api/v1/prescriptions/analyze", files=files, data={"language": "en"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "verification_required"
        assert data["requires_user_confirmation"] is True
        assert data["doctor_name"] == "Dr. Ramesh Sharma, MD (Dermatology)"
        assert len(data["medicines"]) == 2
        assert data["medicines"][0]["medicine_name"] == "Mometasone Furoate 0.1% Cream"

def test_analyze_unclear_prescription_flags_verification(client):
    with patch("app.services.gemini_service.gemini_service.analyze_prescription", new=AsyncMock(return_value=SAMPLE_UNCLEAR_PRESCRIPTION)):
        dummy_img = b"\x89PNG\r\n\x1a\nfakeimage"
        files = {"file": ("rx_unclear.png", dummy_img, "image/png")}
        response = client.post("/api/v1/prescriptions/analyze", files=files, data={"language": "en"})
        assert response.status_code == 200
        data = response.json()
        assert data["medicines"][0]["is_unclear"] is True
        assert "illegible" in data["medicines"][0]["unclear_reason"].lower()

def test_cannot_create_schedule_before_verification(client):
    # First analyze
    with patch("app.services.gemini_service.gemini_service.analyze_prescription", new=AsyncMock(return_value=SAMPLE_PARSED_PRESCRIPTION)):
        files = {"file": ("rx_sample.pdf", b"%PDF-1.4 test", "application/pdf")}
        res = client.post("/api/v1/prescriptions/analyze", files=files, data={"language": "en"})
        prescription_id = res.json()["prescription_id"]

    # Try creating schedule without verifying
    schedule_payload = {
        "schedules": [
            {
                "medicine_name": "Mometasone Furoate",
                "dosage": "Apply thin layer",
                "frequency": "Once daily",
                "times_of_day": ["09:00 PM"],
                "start_date": "2026-09-30",
                "duration_days": 7
            }
        ]
    }
    response = client.post(f"/api/v1/prescriptions/{prescription_id}/create-schedules", json=schedule_payload)
    assert response.status_code == 400
    assert "unverified prescription" in response.json()["detail"].lower()

def test_full_verification_and_reminders_flow(client):
    # 1. Analyze
    with patch("app.services.gemini_service.gemini_service.analyze_prescription", new=AsyncMock(return_value=SAMPLE_PARSED_PRESCRIPTION)):
        files = {"file": ("rx_verified_flow.pdf", b"%PDF-1.4 test", "application/pdf")}
        analyze_res = client.post("/api/v1/prescriptions/analyze", files=files, data={"language": "en"})
        p_data = analyze_res.json()
        prescription_id = p_data["prescription_id"]
        meds = p_data["medicines"]

    # 2. Patient verifies medicines (mark as verified)
    for m in meds:
        m["is_verified"] = True
    verify_payload = {
        "medicines": meds,
        "doctor_name": p_data["doctor_name"],
        "prescription_date": p_data["prescription_date"]
    }
    verify_res = client.post(f"/api/v1/prescriptions/{prescription_id}/verify", json=verify_payload)
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "verified"
    assert len(verify_res.json()["verified_medicines"]) == 2

    # 3. Create schedule & reminders from verified information
    schedule_payload = {
        "schedules": [
            {
                "medicine_id": meds[0]["id"],
                "medicine_name": meds[0]["medicine_name"],
                "dosage": meds[0]["dosage"],
                "frequency": meds[0]["frequency"],
                "times_of_day": ["09:00 PM"],
                "start_date": "2026-09-30",
                "duration_days": 7,
                "special_instructions": meds[0]["special_instructions"]
            },
            {
                "medicine_id": meds[1]["id"],
                "medicine_name": meds[1]["medicine_name"],
                "dosage": meds[1]["dosage"],
                "frequency": meds[1]["frequency"],
                "times_of_day": ["10:00 PM"],
                "start_date": "2026-09-30",
                "duration_days": 10,
                "special_instructions": meds[1]["special_instructions"]
            }
        ]
    }
    sched_res = client.post(f"/api/v1/prescriptions/{prescription_id}/create-schedules", json=schedule_payload)
    assert sched_res.status_code == 200
    created_schedules = sched_res.json()
    assert len(created_schedules) == 2
    assert created_schedules[0]["medicine_name"] == meds[0]["medicine_name"]

    # 4. Check today's reminders endpoint
    reminders_res = client.get("/api/v1/prescriptions/reminders/today")
    assert reminders_res.status_code == 200
    today_rems = reminders_res.json()
    assert isinstance(today_rems, list)
    if today_rems:
        first_rem_id = today_rems[0]["id"]

        # 5. Take action: Taken
        action_res = client.patch(
            f"/api/v1/prescriptions/reminders/{first_rem_id}/action",
            json={"action": "taken"}
        )
        assert action_res.status_code == 200
        assert action_res.json()["status"] == "taken"

        # 6. Take action: Skipped
        skip_res = client.patch(
            f"/api/v1/prescriptions/reminders/{first_rem_id}/action",
            json={"action": "skipped"}
        )
        assert skip_res.status_code == 200
        assert skip_res.json()["status"] == "skipped"
        assert "double dose" in skip_res.json()["safety_message"].lower()

        # 7. Take action: Snooze
        snooze_res = client.patch(
            f"/api/v1/prescriptions/reminders/{first_rem_id}/action",
            json={"action": "snooze", "snooze_minutes": 20}
        )
        assert snooze_res.status_code == 200
        assert snooze_res.json()["status"] == "snoozed"

def test_get_and_delete_prescription(client):
    with patch("app.services.gemini_service.gemini_service.analyze_prescription", new=AsyncMock(return_value=SAMPLE_PARSED_PRESCRIPTION)):
        files = {"file": ("rx_delete_test.pdf", b"%PDF-1.4 test", "application/pdf")}
        analyze_res = client.post("/api/v1/prescriptions/analyze", files=files, data={"language": "en"})
        p_id = analyze_res.json()["prescription_id"]

    # Get single
    get_res = client.get(f"/api/v1/prescriptions/{p_id}")
    assert get_res.status_code == 200
    assert get_res.json()["prescription_id"] == p_id

    # List
    list_res = client.get("/api/v1/prescriptions")
    assert list_res.status_code == 200
    assert any(p["prescription_id"] == p_id for p in list_res.json())

    # Delete
    del_res = client.delete(f"/api/v1/prescriptions/{p_id}")
    assert del_res.status_code == 204

    # Verify 404
    get_after_del = client.get(f"/api/v1/prescriptions/{p_id}")
    assert get_after_del.status_code == 404

def test_delete_reminder(client):
    # 1. Analyze and verify
    with patch("app.services.gemini_service.gemini_service.analyze_prescription", new=AsyncMock(return_value=SAMPLE_PARSED_PRESCRIPTION)):
        files = {"file": ("rx_reminder_del.pdf", b"%PDF-1.4 test", "application/pdf")}
        analyze_res = client.post("/api/v1/prescriptions/analyze", files=files, data={"language": "en"})
        p_data = analyze_res.json()
        p_id = p_data["prescription_id"]
        meds = p_data["medicines"]

    for m in meds:
        m["is_verified"] = True
    client.post(f"/api/v1/prescriptions/{p_id}/verify", json={"medicines": meds})

    # 2. Create schedule
    client.post(f"/api/v1/prescriptions/{p_id}/create-schedules", json={
        "schedules": [{
            "medicine_id": meds[0]["id"],
            "medicine_name": meds[0]["medicine_name"],
            "dosage": meds[0]["dosage"],
            "frequency": meds[0]["frequency"],
            "times_of_day": ["09:00 PM"],
            "start_date": "2026-09-30",
            "duration_days": 3
        }]
    })

    # 3. Retrieve reminders
    rems = client.get("/api/v1/prescriptions/reminders/today").json()
    assert len(rems) > 0
    rem_id = rems[0]["id"]

    # 4. Delete single reminder
    del_res = client.delete(f"/api/v1/prescriptions/reminders/{rem_id}")
    assert del_res.status_code == 204

    # 5. Verify deleting non-existent returns 404
    del_res_404 = client.delete(f"/api/v1/prescriptions/reminders/{rem_id}")
    assert del_res_404.status_code == 404

