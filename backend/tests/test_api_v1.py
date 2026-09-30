import io
from fastapi.testclient import TestClient

def test_api_health_status(client: TestClient):
    response = client.get("/api/v1/health/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "ml_subsystem" in data
    assert isinstance(data["ml_subsystem"]["weights_loaded"], bool)
    assert "model_path" in data["ml_subsystem"]

def test_api_auth_lifecycle(client: TestClient):
    # Register
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "testpatient@example.com",
        "password": "SecurePassword123!",
        "full_name": "Rohan Sharma",
        "preferred_language": "hi"
    })
    assert reg_res.status_code == 201
    token_data = reg_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "testpatient@example.com",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Get Profile with token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    user = me_res.json()
    assert user["email"] == "testpatient@example.com"
    assert user["preferred_language"] == "hi"

def test_api_skin_image_upload(client: TestClient, clear_synthetic_image_bytes):
    response = client.post(
        "/api/v1/skin-analysis/analyze-image",
        files={"file": ("test_skin.jpg", clear_synthetic_image_bytes, "image/jpeg")},
        data={"language": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("SUCCESS", "ABSTAINED_HIGH_UNCERTAINTY", "MODEL_PENDING_INTEGRATION")
    assert data["quality_gate"]["is_acceptable"] is True
    assert "strictly not a replacement" in data["clinical_disclaimer"].lower()

def test_api_symptom_check(client: TestClient):
    res = client.post("/api/v1/symptoms/check", json={
        "symptoms": ["itching", "red rash on forearm"],
        "severity": "mild",
        "has_fever": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["triage_level"] == "routine"
    assert len(data["differentials"]) > 0

def test_api_medication_check(client: TestClient):
    res = client.post("/api/v1/medications/check-safety", json={
        "medications": ["isotretinoin", "doxycycline"],
        "allergies": []
    })
    assert res.status_code == 200
    data = res.json()
    assert data["safe_to_combine"] is False
    assert len(data["interaction_alerts"]) > 0

def test_api_wellness_guidance(client: TestClient):
    res = client.post("/api/v1/wellness/guidance", json={
        "skin_concern": "excessive dryness in winter",
        "season": "winter"
    })
    assert res.status_code == 200
    data = res.json()
    assert "Vata" in data["ayurvedic_perspective"]
    assert len(data["traditional_topical_care"]) > 0

def test_api_emergency_assess(client: TestClient):
    res = client.post("/api/v1/emergency/assess", json={
        "symptoms_description": "Skin peeling and mouth sores with fever",
        "has_peeling_or_mucosal_involvement": True,
        "has_high_fever": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_emergency"] is True
    assert data["triage_priority"] == "IMMEDIATE_EMERGENCY"
    assert len(data["emergency_contacts"]) > 0

def test_api_healthcare_facilities(client: TestClient):
    res = client.get("/api/v1/healthcare-access/facilities")
    assert res.status_code == 200
    facilities = res.json()
    assert len(facilities) > 0
    assert any(f["teleconsult_available"] for f in facilities)
