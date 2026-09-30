"""
Clinical & ML Service Exceptions for DERMASATHIAI.
Controlled error definitions to prevent raw system tracebacks from leaking to users.
"""
from typing import Optional, Any, List

class MLServiceException(Exception):
    """Base exception for all ML subsystem operations."""
    def __init__(self, message: str, error_code: str = "ML_SERVICE_ERROR"):
        super().__init__(message)
        self.message = message
        self.error_code = error_code


class ModelNotAvailableError(MLServiceException):
    """
    Raised when the trained machine learning model artifact cannot be found
    or loaded from backend/model_store/.
    Enforces clinical fail-safe protocol: never invent fake weights or synthetic predictions.
    """
    def __init__(
        self,
        message: str = "Trained skin model is not deployed in model_store/. Clinical fail-safe abstention enforced.",
        error_code: str = "MODEL_NOT_AVAILABLE",
        quality_assessment: Optional[Any] = None
    ):
        super().__init__(message, error_code)
        self.quality_assessment = quality_assessment


class ModelNotFoundError(ModelNotAvailableError):
    """Raised when the specified model file does not exist on disk."""
    def __init__(
        self,
        model_path: str,
        message: Optional[str] = None,
        error_code: str = "MODEL_NOT_FOUND"
    ):
        msg = message or f"Trained model artifact not found at configured path: '{model_path}'."
        super().__init__(message=msg, error_code=error_code)
        self.model_path = model_path


class ModelFormatError(MLServiceException):
    """Raised when the model file is not a valid or expected model archive/format."""
    def __init__(
        self,
        message: str = "Model artifact format is invalid or corrupted.",
        error_code: str = "MODEL_FORMAT_ERROR"
    ):
        super().__init__(message, error_code)


class ModelInputShapeMismatchError(MLServiceException):
    """Raised when model input tensor shape does not match documented input shape."""
    def __init__(
        self,
        expected_shape: List[Any],
        actual_shape: List[Any],
        message: Optional[str] = None,
        error_code: str = "MODEL_INPUT_SHAPE_MISMATCH"
    ):
        msg = message or f"Model input shape mismatch. Expected {expected_shape}, found {actual_shape}."
        super().__init__(msg, error_code)
        self.expected_shape = expected_shape
        self.actual_shape = actual_shape


class ModelClassMappingError(MLServiceException):
    """Raised when class mapping file is missing, invalid, or length mismatches model output units."""
    def __init__(
        self,
        message: str = "Model class mapping is missing or inconsistent with output dimension.",
        error_code: str = "MODEL_CLASS_MAPPING_ERROR"
    ):
        super().__init__(message, error_code)


class ModelRuntimeDependencyError(MLServiceException):
    """Raised when the required deep-learning framework runtime (e.g. TensorFlow/Keras) is missing."""
    def __init__(
        self,
        framework: str = "TensorFlow / Keras 3",
        message: Optional[str] = None,
        error_code: str = "MODEL_RUNTIME_DEPENDENCY_MISSING"
    ):
        msg = message or f"Required runtime framework '{framework}' is not installed in the active environment."
        super().__init__(msg, error_code)
        self.framework = framework


class InvalidImagePayloadError(MLServiceException):
    """Raised when the uploaded file fails MIME verification or cannot be read."""
    def __init__(
        self,
        message: str = "Uploaded file is not a valid or readable image payload.",
        error_code: str = "INVALID_IMAGE_PAYLOAD"
    ):
        super().__init__(message, error_code)


class InferenceExecutionError(MLServiceException):
    """Raised when runtime execution encounters a failure during forward pass."""
    def __init__(
        self,
        message: str = "Error executing forward pass on the trained model.",
        error_code: str = "INFERENCE_EXECUTION_ERROR"
    ):
        super().__init__(message, error_code)
