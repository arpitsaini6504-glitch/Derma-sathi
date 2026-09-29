"""
Clinical & ML Service Exceptions for DERMASATHIAI.
Controlled error definitions to prevent raw system tracebacks from leaking to users.
"""
from typing import Optional, Any

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
