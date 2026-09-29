from app.services.skin_pipeline.quality_gate import ImageQualityGate

def test_quality_gate_accepts_clear_image(clear_synthetic_image_bytes):
    gate = ImageQualityGate()
    is_acceptable, metrics, img_bgr = gate.evaluate(clear_synthetic_image_bytes)
    assert is_acceptable is True
    assert metrics.is_acceptable is True
    assert metrics.is_blurry is False
    assert metrics.is_underexposed is False
    assert metrics.blur_score > 60.0

def test_quality_gate_rejects_dark_image(dark_image_bytes):
    gate = ImageQualityGate()
    is_acceptable, metrics, _ = gate.evaluate(dark_image_bytes)
    assert is_acceptable is False
    assert metrics.is_underexposed is True
    assert any("too dark" in msg.lower() for msg in metrics.feedback_messages)

def test_quality_gate_rejects_blurry_image(blurry_image_bytes):
    gate = ImageQualityGate()
    is_acceptable, metrics, _ = gate.evaluate(blurry_image_bytes)
    assert is_acceptable is False
    assert metrics.is_blurry is True
    assert metrics.blur_score < 60.0

def test_quality_gate_handles_corrupt_bytes():
    gate = ImageQualityGate()
    is_acceptable, metrics, _ = gate.evaluate(b"corrupt_invalid_bytes")
    assert is_acceptable is False
    assert any("unable to decode" in msg.lower() for msg in metrics.feedback_messages)
