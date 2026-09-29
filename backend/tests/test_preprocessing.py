import io
import pytest
import numpy as np
from PIL import Image, ImageFilter

from app.ml.preprocessing.validator import FileValidator
from app.ml.preprocessing.decoder import ImageDecoder
from app.ml.preprocessing.quality import ImageQualityEvaluator, QualityAssessmentResult
from app.ml.preprocessing.normalizer import ImageNormalizer, NormalizationConfig
from app.ml.preprocessing.pipeline import ImagePreprocessingPipeline, PreprocessedOutput
from app.ml.inference_service import SkinInferenceService
from app.ml.exceptions import ModelNotAvailableError, InvalidImagePayloadError


# ==============================================================================
# Helper functions to synthesize test images
# ==============================================================================

def make_test_image_bytes(
    width: int = 300,
    height: int = 300,
    color_rgb: tuple = (120, 90, 70),
    add_texture: bool = True,
    fmt: str = "JPEG"
) -> bytes:
    """Creates synthetic valid image bytes with optional texture and skin tones."""
    img = Image.new("RGB", (width, height), color=color_rgb)
    if add_texture:
        # Add high-frequency gradient/lines to avoid flat uniform frame and simulate lesion texture
        arr = np.array(img, dtype=np.uint8)
        # Add grid pattern for sharp edges
        arr[::10, :, :] = 200
        arr[:, ::10, :] = 50
        img = Image.fromarray(arr)

    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def make_blurry_image_bytes(width: int = 300, height: int = 300) -> bytes:
    """Creates a heavily blurred image to trigger blur detection."""
    img = Image.new("RGB", (width, height), color=(150, 100, 80))
    arr = np.array(img, dtype=np.uint8)
    arr[50:250, 50:250] = (160, 110, 90)
    blurred = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(radius=20))
    buf = io.BytesIO()
    blurred.save(buf, format="JPEG")
    return buf.getvalue()


# ==============================================================================
# 1. File Validation Tests
# ==============================================================================

def test_file_validator_valid_images():
    validator = FileValidator()
    
    jpeg_bytes = make_test_image_bytes(fmt="JPEG")
    png_bytes = make_test_image_bytes(fmt="PNG")
    webp_bytes = make_test_image_bytes(fmt="WEBP")

    valid, err = validator.validate(jpeg_bytes, "test.jpg")
    assert valid is True
    assert err is None

    valid, err = validator.validate(png_bytes, "test.png")
    assert valid is True
    assert err is None

    valid, err = validator.validate(webp_bytes, "test.webp")
    assert valid is True
    assert err is None


def test_file_validator_rejections():
    validator = FileValidator(max_size_bytes=1000, min_size_bytes=10)

    # Empty payload
    valid, err = validator.validate(b"")
    assert valid is False
    assert "empty" in err.lower()

    # Payload under minimum bounds
    valid, err = validator.validate(b"abc")
    assert valid is False
    assert "too small" in err.lower()

    # Payload exceeding bounds
    valid, err = validator.validate(b"X" * 1500)
    assert valid is False
    assert "exceeds" in err.lower()

    # Disallowed extension (using standard validator with 10MB limit)
    standard_validator = FileValidator()
    jpeg_bytes = make_test_image_bytes(fmt="JPEG")
    valid, err = standard_validator.validate(jpeg_bytes, "exploit.exe")
    assert valid is False
    assert "unsupported file extension" in err.lower()

    # Corrupt / spoofed header (payload must exceed min_size_bytes of 100)
    fake_payload = b"GIF89a Fake Image Payload Header " + (b"X" * 120)
    valid, err = standard_validator.validate(fake_payload, "fake.jpg")
    assert valid is False
    assert "header does not match" in err.lower()


# ==============================================================================
# 2. Image Decoding Tests
# ==============================================================================

def test_image_decoder_rgb_conversion():
    decoder = ImageDecoder()

    # Test JPEG
    jpeg_bytes = make_test_image_bytes(width=240, height=200)
    rgb, err = decoder.decode(jpeg_bytes)
    assert err is None
    assert rgb is not None
    assert rgb.shape == (200, 240, 3)
    assert rgb.dtype == np.uint8

    # Test RGBA PNG cleanly converted to RGB (strips alpha without corruption)
    rgba_img = Image.new("RGBA", (220, 180), color=(100, 150, 200, 128))
    buf = io.BytesIO()
    rgba_img.save(buf, format="PNG")
    rgb, err = decoder.decode(buf.getvalue())
    assert err is None
    assert rgb is not None
    assert rgb.shape == (180, 220, 3)

    # Test Grayscale converted to 3-channel RGB
    gray_img = Image.new("L", (200, 200), color=128)
    buf = io.BytesIO()
    gray_img.save(buf, format="PNG")
    rgb, err = decoder.decode(buf.getvalue())
    assert err is None
    assert rgb.shape == (200, 200, 3)

    # Corrupt bytes handling
    rgb, err = decoder.decode(b"\xFF\xD8\xFFcorrupt_stream_data_that_fails_decoding")
    assert rgb is None
    assert "decoding failed" in err.lower()


# ==============================================================================
# 3. Image Quality Evaluator Tests (Equity & Sensor Bounds)
# ==============================================================================

def test_quality_evaluator_low_resolution():
    evaluator = ImageQualityEvaluator(min_dimension=180)
    # Tiny 100x100 image
    tiny_arr = np.random.randint(50, 200, (100, 100, 3), dtype=np.uint8)
    result = evaluator.evaluate(tiny_arr)
    assert result.quality_status == "reject"
    assert "low_resolution" in result.issues


def test_quality_evaluator_extreme_aspect_ratio():
    evaluator = ImageQualityEvaluator(max_aspect_ratio=3.5)
    # Extremely narrow image: 800x150 -> aspect ratio 5.33
    narrow_arr = np.random.randint(50, 200, (150, 800, 3), dtype=np.uint8)
    result = evaluator.evaluate(narrow_arr)
    assert result.quality_status == "reject"
    assert "extreme_aspect_ratio" in result.issues


def test_quality_evaluator_blur_detection():
    evaluator = ImageQualityEvaluator(blur_threshold=45.0)

    # Heavily blurred image
    blurry_bytes = make_blurry_image_bytes(300, 300)
    rgb, _ = ImageDecoder.decode(blurry_bytes)
    result = evaluator.evaluate(rgb)
    assert result.quality_status == "reject"
    assert "excessive_blur" in result.issues
    assert result.metrics["blur_score"] < 45.0


def test_quality_evaluator_underexposure_pitch_dark():
    evaluator = ImageQualityEvaluator()
    # Simulated pitch-black lens cover (sensor intensity < 10)
    black_img = np.zeros((250, 250, 3), dtype=np.uint8)
    result = evaluator.evaluate(black_img)
    assert result.quality_status == "reject"
    assert "insufficient_lighting" in result.issues


def test_quality_evaluator_severe_glare():
    evaluator = ImageQualityEvaluator()
    # Simulated blinding flash reflection (more than 25% blown out pure white at 255)
    glare_img = np.full((250, 250, 3), 100, dtype=np.uint8)
    glare_img[0:150, 0:150] = 255  # Over 30% blown out pure white
    result = evaluator.evaluate(glare_img)
    assert result.quality_status == "reject"
    assert "severe_glare" in result.issues


def test_quality_evaluator_skin_tone_equity():
    """
    CRITICAL FAIRNESS TEST:
    Darker Fitzpatrick skin types (IV, V, VI prevalent in India) have lower mean luminance.
    The evaluator MUST NOT reject naturally darker skin as 'underexposed' when adequate ambient light exists.
    """
    evaluator = ImageQualityEvaluator()

    # Darker skin tone RGB ~ (65, 42, 28) - Fitzpatrick Type V/VI
    # With distinct texture and sharp lesion boundaries
    skin_arr = np.full((250, 250, 3), (65, 42, 28), dtype=np.uint8)
    # Add clear lesion in the center with contrast
    skin_arr[90:160, 90:160] = (110, 60, 45)
    # Add skin texture / lines
    skin_arr[::12, :, 0] += 15
    skin_arr[:, ::12, 1] += 15

    result = evaluator.evaluate(skin_arr)
    # Must PASS quality checks!
    assert "insufficient_lighting" not in result.issues
    assert result.quality_status == "pass"


def test_quality_evaluator_uniform_occlusion():
    evaluator = ImageQualityEvaluator(min_contrast_std=4.0)
    # Completely uniform flat gray image (e.g. lens pressed against a surface)
    flat_arr = np.full((250, 250, 3), 128, dtype=np.uint8)
    result = evaluator.evaluate(flat_arr)
    assert result.quality_status == "reject"
    assert "poor_framing_or_occlusion" in result.issues


# ==============================================================================
# 4. Normalizer Tests
# ==============================================================================

def test_normalizer_shapes_and_schemes():
    config_nchw = NormalizationConfig(
        target_size=(224, 224),
        scheme="imagenet",
        layout="NCHW"
    )
    normalizer = ImageNormalizer(config_nchw)
    
    test_img = np.random.randint(0, 255, (300, 400, 3), dtype=np.uint8)
    tensor = normalizer.normalize(test_img)

    assert tensor.shape == (1, 3, 224, 224)
    assert tensor.dtype == np.float32

    # Test NHWC layout (TensorFlow)
    config_nhwc = NormalizationConfig(
        target_size=(256, 256),
        scheme="zero_to_one",
        layout="NHWC"
    )
    norm_nhwc = ImageNormalizer(config_nhwc)
    tensor_nhwc = norm_nhwc.normalize(test_img)
    assert tensor_nhwc.shape == (1, 256, 256, 3)
    assert float(np.min(tensor_nhwc)) >= 0.0
    assert float(np.max(tensor_nhwc)) <= 1.0


# ==============================================================================
# 5. Pipeline End-to-End & Short-Circuit Tests
# ==============================================================================

def test_pipeline_quality_rejection_short_circuit():
    pipeline = ImagePreprocessingPipeline()

    blurry_bytes = make_blurry_image_bytes(250, 250)
    output: PreprocessedOutput = pipeline.process(blurry_bytes, "blurry_lesion.jpg")

    assert output.quality_status == "reject"
    assert "excessive_blur" in output.issues
    # Downstream model tensor generation MUST NOT occur on reject
    assert output.processed_tensor is None

    # Check dict representation matches user contract
    q_dict = output.to_quality_dict()
    assert q_dict["quality_status"] == "reject"
    assert "excessive_blur" in q_dict["issues"]


def test_pipeline_clean_pass():
    pipeline = ImagePreprocessingPipeline()

    valid_bytes = make_test_image_bytes(width=280, height=280, add_texture=True)
    output: PreprocessedOutput = pipeline.process(valid_bytes, "valid_lesion.jpg")

    assert output.quality_status == "pass"
    assert output.issues == []
    assert output.processed_tensor is not None
    assert output.processed_tensor.shape == (1, 3, 224, 224)
    assert output.original_dimensions == [280, 280]

    q_dict = output.to_quality_dict()
    assert q_dict == {"quality_status": "pass", "issues": []}


# ==============================================================================
# 6. Inference Service Gating Tests
# ==============================================================================

def test_inference_service_rejects_blurry_without_calling_model():
    service = SkinInferenceService()
    blurry_bytes = make_blurry_image_bytes(250, 250)

    # Calling predict with poor quality image:
    response = service.predict(blurry_bytes)

    # Must NOT call the model or raise ModelNotAvailableError!
    assert response.status == "QUALITY_REJECTED"
    assert response.prediction is None
    assert response.quality_assessment is not None
    assert response.quality_assessment.quality_status == "reject"
    assert "excessive_blur" in response.quality_assessment.issues


def test_inference_service_passes_quality_then_signals_model_absence():
    service = SkinInferenceService()
    valid_bytes = make_test_image_bytes(width=280, height=280, add_texture=True)

    # Because model weights are not in model_store/, it will safely raise ModelNotAvailableError
    # but the quality assessment MUST be attached and show 'pass'!
    with pytest.raises(ModelNotAvailableError) as exc_info:
        service.predict(valid_bytes)

    err = exc_info.value
    assert err.error_code == "MODEL_NOT_AVAILABLE"
    assert err.quality_assessment is not None
    assert err.quality_assessment.quality_status == "pass"
    assert err.quality_assessment.issues == []
