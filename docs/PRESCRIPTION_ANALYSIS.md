# Prescription Reader, Verification & Medication Reminders Architecture

## 1. Overview
The Prescription Reader and Verification Module in **DERMASATHIAI** enables patients to upload doctor's prescriptions (in PDF, PNG, JPG, or WebP formats), extract structured medication details using Google Gemini 3.5 Multimodal AI, verify/edit extracted data, and establish automated medication reminders.

---

## 2. Architecture & Service Pattern

The module strictly reuses the server-side multimodal OCR architecture established by the Medical Report Analysis service:

```
Patient (React Frontend)
        ↓  Multipart File Upload (PDF/Image <= 10MB)
FastAPI Backend (/api/v1/prescriptions/analyze)
        ↓  Base64 Inline Data & Clinical System Instructions
Google Gemini Multimodal REST API (gemini-3.5-flash)
        ↓  Strict JSON Schema Output (without hallucinations)
Database Persistence (SQLite/PostgreSQL)
        ↓  State: "verification_required"
Patient Verification Screen (Edit / Confirm / Add / Remove)
        ↓  Confirmed Medicines List (/api/v1/prescriptions/{id}/verify)
Medication Schedule & Reminders Generator (/api/v1/prescriptions/{id}/create-schedules)
        ↓  Schedule & Daily Reminder Slots
Daily Reminders Timeline (Mark Taken / Skip / Snooze)
```

---

## 3. Extracted Fields & Safety Rules

### Extracted Fields
- `doctor_name`: Prescribing physician and degrees
- `clinic_or_hospital`: Healthcare facility header
- `prescription_date`: Date on prescription slip
- `patient_name`: Patient name (if present)
- `diagnosis_or_symptoms`: Provisional diagnosis or chief complaints
- `medicines`:
  - `medicine_name`: Trade/generic drug name
  - `strength`: e.g. "500 mg", "0.1%"
  - `dosage`: e.g. "1 tablet", "Apply thin layer"
  - `dosage_unit`: tablet, capsule, cream, lotion, drops
  - `frequency`: Once daily, Twice daily, TDS, SOS
  - `route`: oral, topical, ophthalmic
  - `timing`: ["morning", "night"]
  - `duration`: e.g. "5 days", "10 days"
  - `quantity`: Quantity dispensed
  - `special_instructions`: e.g. "After meals", "At bedtime"
  - `is_unclear`: Boolean flag
  - `unclear_reason`: Explanation of ambiguous or missing fields
- `general_advice`: Non-pharmacological lifestyle/diet instructions
- `confidence_notes`: Readability and handwriting assessment

### Critical Medical Safety Rules
1. **Never Invent or Guess Missing Information**: If dosage, frequency, or duration is illegible, cropped, or absent, the model flags `is_unclear: true` with a detailed `unclear_reason`.
2. **Never Create Reminders Without Verification**: Unverified prescriptions are locked in `verification_required` state. The backend rejects attempts to generate reminders before user confirmation.
3. **No Automatic Substitution or Prescription**: DERMASATHIAI never prescribes medication or recommends alternative drugs.
4. **Neutral Missed Dose Advisory**: Missed reminders provide safe, neutral guidance: *"Missed medication reminder: Follow your prescription or healthcare professional's instructions. Never take a double dose."*

---

## 4. Prescription State Machine

Each prescription progresses through strict operational stages:

| State | Description | Next Action Allowed |
| :--- | :--- | :--- |
| `uploaded` | Document received and checked for size & format | AI extraction begins |
| `processing` | Multimodal model processing document | Waiting for inference |
| `verification_required` | Extraction complete; awaiting patient review | Edit, confirm, or delete |
| `partially_verified` | Some items confirmed; some require clarification | Complete remaining items |
| `verified` | All medicines explicitly confirmed by patient | Create medication schedules |
| `failed` | Corrupt or completely unreadable document | Re-upload clearer image |

---

## 5. Security & Privacy

1. **Zero Credential Exposure**: Gemini API keys are configured exclusively on the server (`backend/.env`) and never sent to or stored in client-side code.
2. **Safe Logging**: No raw OCR text, prescription images, or patient identifying info is printed to server application logs.
3. **File Validation**: Strict file type validation (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`) and maximum size restriction (10MB).
4. **Tenant Isolation**: Prescriptions are linked to authenticated users or session IDs to prevent unauthorized access.

---

## 6. API Endpoints

- `POST /api/v1/prescriptions/analyze` — Upload document and receive structured analysis.
- `POST /api/v1/prescriptions/{id}/verify` — Submit patient-verified and edited medicines.
- `POST /api/v1/prescriptions/{id}/create-schedules` — Generate schedules & reminder slots from verified data.
- `GET /api/v1/prescriptions/reminders/today` — Retrieve today's medication timeline.
- `PATCH /api/v1/prescriptions/reminders/{id}/action` — Mark reminder as taken, skipped, or snoozed.
- `GET /api/v1/prescriptions` — List patient's stored prescriptions.
- `GET /api/v1/prescriptions/{id}` — Fetch detailed prescription record.
- `DELETE /api/v1/prescriptions/{id}` — Delete prescription and associated schedules.
