import io
import pytest
from fastapi.testclient import TestClient
from app.ml.model_loader import ModelLoader, model_loader
from app.ml.inference_service import SkinInferenceService
from app.ml.exceptions import ModelNotAvailableError, InvalidImagePayloadError

def test_model_loader_fails_safely_when_no_model():
    loader = ModelLoader(model_path="backend/model_store/non_existent.onnx")
    assert loader.is_model_present() is False
    with pytest.raises(ModelNotAvailableError) as exc_info:
        loader.load_model()
    assert "not found" in str(exc_info.value).lower()

def test_model_loader_singleton_cached():
    l1 = ModelLoader()
    l2 = ModelLoader()
    assert l1 is l2

def test_inference_service_predict_returns_controlled_error():
    service = SkinInferenceService()
    # When model is absent, predict must raise ModelNotAvailableError with MODEL_NOT_AVAILABLE code
    with pytest.raises(ModelNotAvailableError) as exc_info:
        service.predict(b"fake_image_bytes")
    assert exc_info.value.error_code == "MODEL_NOT_AVAILABLE"

def test_inference_service_empty_image():
    service = SkinInferenceService()
    with pytest.raises(InvalidImagePayloadError):
        service.predict(b"")

def test_api_skin_analyze_returns_model_unavailable(client: TestClient, clear_synthetic_image_bytes):
    response = client.post(
        "/api/v1/skin/analyze",
        files={"file": ("skin_photo.jpg", clear_synthetic_image_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "MODEL_NOT_AVAILABLE"
    assert data["prediction"] is None
    assert data["raw_probability"] is None
    assert data["calibrated_confidence"] is None
    assert data["uncertainty"] is None
    assert data["requires_professional_review"] is True
    assert "trained skin model is not deployed" in data["message"].lower()

    # Placeholders verification
    assert data["image_quality_gate"]["is_evaluated"] is False
    assert data["ood_detection"]["is_evaluated"] is False
    assert data["confidence_calibration"]["is_calibrated"] is False
    assert data["abstention_policy"]["enforced"] is True
    assert "not a replacement" in data["safety_policy"]["disclaimer"].lower()

def test_api_skin_analyze_rejects_unsupported_media_type(client: TestClient):
    response = client.post(
        "/api/v1/skin/analyze",
        files={"file": ("test.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 415
    assert "unsupported media type" in response.json()["detail"].lower()

def test_api_skin_analyze_rejects_empty_file(client: TestClient):
    response = client.post(
        "/api/v1/skin/analyze",
        files={"file": ("empty.jpg", b"", "image/jpeg")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()
