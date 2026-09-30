import os
import json
import base64
import datetime
import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.core.config import settings
from app.schemas.medical_report import MedicalReportAnalysisResponse, AbnormalValue

LANGUAGE_MAP = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "mr": "Marathi (मराठी)",
    "bn": "Bengali (বাংলা)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "ml": "Malayalam (മലയാളം)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "gu": "Gujarati (ગુજરાતી)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "as": "Assamese (অসমীয়া)",
    "or": "Odia (ଓଡ଼ିଆ)"
}

class GeminiReportService:
    def __init__(self):
        self.default_model = getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash") or "gemini-3.5-flash"

    def _get_api_key(self, client_key: Optional[str] = None) -> str:
        if client_key and client_key.strip():
            return client_key.strip()
        env_key = getattr(settings, "GEMINI_API_KEY", "")
        if env_key and env_key.strip():
            return env_key.strip()
        os_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if os_key:
            return os_key
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Google Gemini API Key is required for medical report analysis. "
                "Please configure GEMINI_API_KEY in the backend .env file. "
                "Get a free API key at https://aistudio.google.com/app/apikey"
            )
        )

    def _resolve_mime_type(self, filename: str, content_type: Optional[str] = None) -> str:
        lower_name = filename.lower()
        if lower_name.endswith(".pdf") or content_type == "application/pdf":
            return "application/pdf"
        elif lower_name.endswith(".png") or content_type == "image/png":
            return "image/png"
        elif lower_name.endswith(".webp") or content_type == "image/webp":
            return "image/webp"
        else:
            return "image/jpeg"

    async def analyze_report(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str] = None,
        language: str = "en",
        api_key: Optional[str] = None
    ) -> MedicalReportAnalysisResponse:
        key = self._get_api_key(api_key)
        mime_type = self._resolve_mime_type(filename, content_type)
        b64_data = base64.b64encode(file_bytes).decode("utf-8")
        target_lang = LANGUAGE_MAP.get(language, "English")

        prompt = f"""You are a specialized clinical AI assistant in DERMASATHIAI.
Analyze the attached medical diagnostic report (pathology, biopsy, blood test, fungal examination, or allergy report).

Language Requirement:
Provide all descriptions, explanations, and summaries in {target_lang}. Keep formal clinical terminology/test names clear.

Output valid JSON only with this schema:
{{
  "report_title": "Clear descriptive name of the test or report",
  "report_type": "Pathology / Biopsy / Fungal Smear / Blood Test / Allergy Panel / General Diagnostic",
  "test_date": "Date printed on the report (or null if not found)",
  "patient_summary": "2-3 empathetic, plain-language sentences in {target_lang} explaining the main takeaway of this report.",
  "key_findings": [
    "Key observation or clinical takeaway 1",
    "Key observation or clinical takeaway 2"
  ],
  "abnormal_values": [
    {{
      "parameter": "Parameter name (e.g., Total IgE, Eosinophil count, KOH Fungal Hyphae)",
      "value": "Observed value with units",
      "reference_range": "Normal range if stated on report",
      "status": "abnormal" | "high" | "low" | "critical",
      "clinical_significance": "Brief context on what this out-of-range value usually signifies in {target_lang}"
    }}
  ],
  "normal_values": [
    "Test parameter that fell within normal reference limits"
  ],
  "doctor_questions": [
    "Thoughtful, actionable question the patient can ask their doctor during follow-up",
    "Another relevant question for the treating physician"
  ],
  "urgency_level": "routine" | "monitor" | "consult_doctor" | "emergency",
  "conclusion": "A comprehensive, actionable clinical conclusion in {target_lang} summarizing what this report ultimately indicates and the clearest path forward for the patient.",
  "clinical_notes": "Helpful supportive health or lifestyle context related to these test findings in {target_lang}"
}}

Rules:
1. Do not hallucinate or make assumptions beyond what is legible on the document.
2. If certain sections are unreadable or blurry, note that in key_findings.
3. Strictly non-diagnostic: provide educational interpretation and always advise consulting their qualified doctor.
4. Output strict JSON matching the schema without markdown fences.
"""

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_data
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }

        models_to_try = [self.default_model, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"]
        # Remove duplicates while preserving order
        seen = set()
        models = [m for m in models_to_try if not (m in seen or seen.add(m))]

        last_error = None
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    response = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                    if response.status_code == 200:
                        data = response.json()
                        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                        raw_text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
                        if raw_text:
                            # Strip potential markdown wrapping if present
                            clean_json = raw_text.strip()
                            if clean_json.startswith("```json"):
                                clean_json = clean_json[7:]
                            if clean_json.startswith("```"):
                                clean_json = clean_json[3:]
                            if clean_json.endswith("```"):
                                clean_json = clean_json[:-3]
                            clean_json = clean_json.strip()

                            parsed = json.loads(clean_json)
                            abnormals = []
                            for item in parsed.get("abnormal_values", []):
                                abnormals.append(AbnormalValue(
                                    parameter=item.get("parameter", "Test Value"),
                                    value=str(item.get("value", "See report")),
                                    reference_range=item.get("reference_range"),
                                    status=item.get("status", "abnormal"),
                                    clinical_significance=item.get("clinical_significance")
                                ))

                            return MedicalReportAnalysisResponse(
                                success=True,
                                report_title=parsed.get("report_title") or f"Analysis of {filename}",
                                report_type=parsed.get("report_type") or "Diagnostic Report",
                                test_date=parsed.get("test_date"),
                                patient_summary=parsed.get("patient_summary") or "Report processed successfully by DERMASATHIAI.",
                                key_findings=parsed.get("key_findings", []),
                                abnormal_values=abnormals,
                                normal_values=parsed.get("normal_values", []),
                                doctor_questions=parsed.get("doctor_questions", []),
                                urgency_level=parsed.get("urgency_level", "monitor"),
                                conclusion=parsed.get("conclusion"),
                                clinical_notes=parsed.get("clinical_notes"),
                                timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
                            )
                    else:
                        error_detail = response.text
                        try:
                            err_json = response.json()
                            error_detail = err_json.get("error", {}).get("message", response.text)
                        except Exception:
                            pass
                        last_error = f"Gemini API returned status {response.status_code}: {error_detail}"
            except Exception as ex:
                last_error = str(ex)

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to analyze medical report with Gemini AI: {last_error}"
        )

    async def analyze_prescription(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str] = None,
        language: str = "en",
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        key = self._get_api_key(api_key)
        mime_type = self._resolve_mime_type(filename, content_type)
        b64_data = base64.b64encode(file_bytes).decode("utf-8")
        target_lang = LANGUAGE_MAP.get(language, "English")

        prompt = f"""You are a specialized clinical pharmacy & prescription OCR assistant in DERMASATHIAI.
Analyze the attached doctor's medical prescription slip or document.

CRITICAL MEDICAL SAFETY RULES:
1. NEVER INVENT OR GUESS MEDICINES, DOSAGES, FREQUENCIES, OR DURATIONS.
2. If handwriting or text is illegible, partially cropped, or missing for any medicine:
   - set "is_unclear": true
   - state the exact issue in "unclear_reason" (e.g., "Dosage illegible", "Frequency not specified", "Duration unclear")
3. If an entire section cannot be read, report that clearly.
4. Output valid JSON only matching this schema:
{{
  "doctor_name": "Doctor name with qualifications if legible, or null",
  "clinic_or_hospital": "Clinic, hospital name or header if legible, or null",
  "prescription_date": "Date on prescription slip (YYYY-MM-DD or as written), or null",
  "patient_name": "Patient name or null",
  "diagnosis_or_symptoms": "Provisional diagnosis, complaints, or null",
  "medicines": [
    {{
      "medicine_name": "Exact brand or generic drug name as written",
      "strength": "Drug strength (e.g., 500mg, 10mg, 1%), or null",
      "dosage": "Amount per dose (e.g., 1 tablet, 5ml, apply thin layer), or null",
      "dosage_unit": "tablet / capsule / cream / syrup / ointment / drops, or null",
      "frequency": "Frequency (e.g., Once daily, Twice daily, Thrice daily, SOS / as needed), or null",
      "route": "oral / topical / ophthalmic / etc., or null",
      "timing": ["morning", "night"],
      "duration": "Duration (e.g., 5 days, 1 week, 1 month), or null",
      "quantity": "Quantity dispensed/prescribed, or null",
      "special_instructions": "e.g., After food, Before breakfast, Avoid sun exposure, or null",
      "is_unclear": false,
      "unclear_reason": null
    }}
  ],
  "general_advice": "General non-drug advice written on the prescription (e.g. drink plenty of water, avoid spicy food), or null",
  "confidence_notes": "Brief note on handwriting clarity and overall readability"
}}

Language requirement for explanations and general advice: {target_lang}.
Output strict JSON matching the schema without markdown fences.
"""

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_data
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        models_to_try = [self.default_model, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"]
        seen = set()
        models = [m for m in models_to_try if not (m in seen or seen.add(m))]

        last_error = None
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    response = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                    if response.status_code == 200:
                        data = response.json()
                        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                        raw_text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
                        if raw_text:
                            clean_json = raw_text.strip()
                            if clean_json.startswith("```json"):
                                clean_json = clean_json[7:]
                            if clean_json.startswith("```"):
                                clean_json = clean_json[3:]
                            if clean_json.endswith("```"):
                                clean_json = clean_json[:-3]
                            clean_json = clean_json.strip()

                            parsed = json.loads(clean_json)
                            return parsed
                    else:
                        error_detail = response.text
                        try:
                            err_json = response.json()
                            error_detail = err_json.get("error", {}).get("message", response.text)
                        except Exception:
                            pass
                        last_error = f"Gemini API returned status {response.status_code}: {error_detail}"
            except Exception as ex:
                last_error = str(ex)

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to analyze prescription with Gemini AI: {last_error}"
        )

gemini_service = GeminiReportService()

