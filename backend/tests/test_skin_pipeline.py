from app.services.skin_pipeline import skin_pipeline
from app.services.skin_pipeline.uncertainty import UncertaintyDetector
from app.services.skin_pipeline.calibration import ConfidenceCalibrator
from app.services.skin_pipeline.abstention import AbstentionGate

def test_pipeline_fails_safely_when_model_absent(clear_synthetic_image_bytes, monkeypatch):
    # Pipeline should not crash, should not invent fake predictions, should set status to MODEL_PENDING_INTEGRATION
    monkeypatch.setattr(skin_pipeline.model, "is_available", lambda: False)
    response = skin_pipeline.process_image(clear_synthetic_image_bytes)
    assert response.status == "MODEL_PENDING_INTEGRATION"
    assert response.abstained is True
    assert "pending deployment" in response.abstention_reason.lower()
    assert response.quality_gate.is_acceptable is True
    assert len(response.findings) == 0
    assert "strictly not a replacement" in response.clinical_disclaimer.lower()

def test_uncertainty_entropy_calculation():
    detector = UncertaintyDetector(uncertainty_threshold=0.65)
    # Uniform distribution = highest entropy (uncertain)
    uniform_probs = {"A": 0.25, "B": 0.25, "C": 0.25, "D": 0.25}
    norm_entropy, is_ood = detector.calculate_entropy(uniform_probs)
    assert norm_entropy > 0.9
    assert is_ood is True

    # Highly peaked distribution = low entropy (certain)
    peaked_probs = {"A": 0.95, "B": 0.02, "C": 0.02, "D": 0.01}
    norm_entropy_peaked, is_ood_peaked = detector.calculate_entropy(peaked_probs)
    assert norm_entropy_peaked < 0.4
    assert is_ood_peaked is False

def test_confidence_calibration():
    calibrator = ConfidenceCalibrator(temperature=1.5)
    raw_probs = {"Eczema": 0.90, "Psoriasis": 0.10}
    calibrated = calibrator.calibrate(raw_probs)
    # Scaled probabilities with T > 1 should soften the extreme confidence
    assert calibrated["Eczema"] < 0.90
    assert calibrated["Eczema"] > 0.70
    assert round(sum(calibrated.values()), 2) == 1.0

def test_abstention_gate_thresholds():
    gate = AbstentionGate(confidence_threshold=0.70)
    
    # Low confidence should abstain
    abstained, reason = gate.should_abstain(
        quality_passed=True,
        model_available=True,
        is_ood=False,
        calibrated_probs={"A": 0.55, "B": 0.45}
    )
    assert abstained is True
    assert "below clinical safety threshold" in reason

    # High confidence on in-distribution should pass
    abstained_pass, _ = gate.should_abstain(
        quality_passed=True,
        model_available=True,
        is_ood=False,
        calibrated_probs={"A": 0.85, "B": 0.15}
    )
    assert abstained_pass is False
