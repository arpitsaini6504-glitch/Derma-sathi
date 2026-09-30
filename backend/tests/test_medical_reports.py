import io
import json
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.medical_report import MedicalReportAnalysisResponse, AbnormalValue

client = TestClient(app)

def test_reports_status():
    response = client.get("/api/v1/reports/status")
    assert response.status_code == 200
    data = response.json()
    assert "gemini_configured" in data
    assert "supported_formats" in data
    assert ".pdf" in data["supported_formats"]
    assert ".png" in data["supported_formats"]

def test_analyze_unsupported_format():
    file_content = b"fake binary data"
    files = {"file": ("malicious.exe", file_content, "application/octet-stream")}
    response = client.post("/api/v1/reports/analyze", files=files, data={"language": "en"})
    assert response.status_code == 400
    assert "Unsupported document format" in response.json()["detail"]

def test_analyze_empty_file():
    files = {"file": ("empty_report.pdf", b"", "application/pdf")}
    response = client.post("/api/v1/reports/analyze", files=files, data={"language": "en"})
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_analyze_missing_api_key():
    with patch("app.core.config.settings.GEMINI_API_KEY", ""):
        with patch.dict("os.environ", {}, clear=True):
            file_content = b"%PDF-1.4 test dummy pdf content"
            files = {"file": ("sample_biopsy.pdf", file_content, "application/pdf")}
            response = client.post("/api/v1/reports/analyze", files=files, data={"language": "en"})
            assert response.status_code == 400
            assert "Gemini API Key is required" in response.json()["detail"]

def test_analyze_with_mocked_gemini_success():
    mock_response = MedicalReportAnalysisResponse(
        success=True,
        report_title="Skin Biopsy Pathology Report",
        report_type="Histopathology",
        test_date="2026-09-20",
        patient_summary="The biopsy demonstrates mild epidermal hyperkeratosis without cellular atypia.",
        key_findings=["Negative for malignant melanoma", "Mild chronic perivascular dermatitis"],
        abnormal_values=[
            AbnormalValue(
                parameter="Serum IgE",
                value="240 IU/mL",
                reference_range="0-100 IU/mL",
                status="high",
                clinical_significance="Associated with atopic dermatitis or allergic hypersensitivity."
            )
        ],
        normal_values=["Basal layer intact", "No fungal hyphae seen on PAS stain"],
        doctor_questions=["Would topical barrier repair moisturizers be sufficient?", "Should we consider a patch test?"],
        urgency_level="routine",
        conclusion="Benign perivascular dermatitis consistent with allergic eczema. No malignancy detected.",
        clinical_notes="Schedule routine follow-up with your dermatologist.",
        timestamp="2026-09-29T22:00:00Z"
    )

    with patch("app.services.gemini_service.gemini_service.analyze_report", new=AsyncMock(return_value=mock_response)):
        file_content = b"%PDF-1.4 test report content"
        files = {"file": ("biopsy_report.pdf", file_content, "application/pdf")}
        response = client.post(
            "/api/v1/reports/analyze",
            files=files,
            data={"language": "en", "gemini_api_key": "AIzaSyTestMockKey123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["report_title"] == "Skin Biopsy Pathology Report"
        assert len(data["abnormal_values"]) == 1
        assert data["abnormal_values"][0]["parameter"] == "Serum IgE"
        assert len(data["doctor_questions"]) == 2
        assert "conclusion" in data
        assert "Benign" in data["conclusion"]
