import os
import json
import threading
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger
from app.ml.exceptions import ModelNotAvailableError

class ModelLoader:
    """
    Thread-safe model loader for DERMASATHIAI.
    - Inspects configured model storage directory (backend/model_store/).
    - Validates file presence and format without raising unhandled errors on startup.
    - Caches the loaded model instance to prevent redundant loading on each request.
    - Fails safely with ModelNotAvailableError when weights are not present.
    """
    _instance: Optional['ModelLoader'] = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelLoader, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, model_path: Optional[str] = None, metadata_path: Optional[str] = None):
        if self._initialized:
            return

        self.model_path = model_path or settings.DERMASATHI_MODEL_PATH
        self.metadata_path = metadata_path or settings.DERMASATHI_MODEL_METADATA
        self._model = None
        self._metadata: Dict[str, Any] = {}
        self._load_lock = threading.Lock()
        self._initialized = True

        logger.info(f"[ModelLoader] Initialized. Configured model path: '{self.model_path}'")

    def is_model_present(self) -> bool:
        """Checks whether the configured model artifact exists on disk."""
        return bool(self.model_path and os.path.exists(self.model_path) and os.path.isfile(self.model_path))

    def get_metadata(self) -> Dict[str, Any]:
        """Loads and caches metadata.json if available."""
        if not self._metadata and self.metadata_path and os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, 'r', encoding='utf-8') as f:
                    self._metadata = json.load(f)
            except Exception as e:
                logger.warning(f"[ModelLoader] Could not read metadata at '{self.metadata_path}': {e}")
        return self._metadata

    def get_model_version(self) -> Optional[str]:
        meta = self.get_metadata()
        return meta.get("version", None)

    def load_model(self) -> Any:
        """
        Loads the model into memory once and caches it.
        Thread-safe; avoids reloading for every request.
        Fails safely if model weights are not present.
        """
        with self._load_lock:
            # If already cached, return immediately
            if self._model is not None:
                return self._model

            # Validate model file existence
            if not self.is_model_present():
                logger.info(
                    f"[ModelLoader] Fail-safe check: Model file not found at '{self.model_path}'. "
                    "Inference service operating in safe fallback mode."
                )
                raise ModelNotAvailableError(
                    message=f"Model artifact not found at '{self.model_path}'. Awaiting trained model in model_store/."
                )

            # File is present: Attempt runtime initialization based on format
            logger.info(f"[ModelLoader] Model file detected at '{self.model_path}'. Loading runtime...")
            try:
                if self.model_path.endswith(".onnx"):
                    import onnxruntime as ort
                    self._model = ort.InferenceSession(self.model_path)
                    logger.info("[ModelLoader] Successfully loaded ONNX InferenceSession.")
                elif self.model_path.endswith((".pt", ".pth")):
                    import torch
                    self._model = torch.jit.load(self.model_path) if self.model_path.endswith(".pt") else torch.load(self.model_path, map_location="cpu")
                    self._model.eval()
                    logger.info("[ModelLoader] Successfully loaded PyTorch model.")
                else:
                    raise ModelNotAvailableError(
                        message=f"Unsupported model extension for '{self.model_path}'. Supported: .onnx, .pt, .pth"
                    )
            except Exception as e:
                logger.error(f"[ModelLoader] Error loading model from '{self.model_path}': {e}")
                self._model = None
                raise ModelNotAvailableError(
                    message=f"Model loading failed: {str(e)}"
                ) from e

            return self._model

    def get_model(self) -> Any:
        """Accessor that returns the cached model or attempts lazy load."""
        if self._model is not None:
            return self._model
        return self.load_model()


# Global Singleton ModelLoader instance
model_loader = ModelLoader()

# Global Singleton ModelLoader instance
model_loader = ModelLoader()
