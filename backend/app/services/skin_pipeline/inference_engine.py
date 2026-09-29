import os
import json
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
import numpy as np
from app.core.config import settings
from app.core.logging import logger

class BaseModelInference(ABC):
    """
    Abstract Base Class for Dermatology ML Inference.
    Enforces unified contract between ML team training workflows and backend serving.
    """
    @abstractmethod
    def is_available(self) -> bool:
        pass

    @abstractmethod
    def predict(self, preprocessed_tensor: np.ndarray) -> Optional[Dict[str, float]]:
        pass


class PlugAndPlaySkinModel(BaseModelInference):
    """
    Production-ready inference wrapper.
    Decoupled to gracefully fail safe when ML team has not yet deployed trained weights to backend/model_store/.
    """
    def __init__(self, model_path: Optional[str] = None, metadata_path: Optional[str] = None):
        self.model_path = model_path or settings.DERMASATHI_MODEL_PATH
        self.metadata_path = metadata_path or settings.DERMASATHI_MODEL_METADATA
        self.session = None
        self.metadata: Dict[str, Any] = {}
        self.classes: List[str] = []
        self._initialize_model()

    def _initialize_model(self):
        """Attempts to load model weights and metadata from model_store."""
        if not os.path.exists(self.model_path):
            logger.info(
                f"[DERMASATHI_MODEL_GATE] No active model artifact found at '{self.model_path}'. "
                "Inference service running in SAFE_PENDING mode. Waiting for trained model delivery."
            )
            return

        # Load metadata if present
        if os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, 'r', encoding='utf-8') as f:
                    self.metadata = json.load(f)
                    self.classes = self.metadata.get("classes", [])
            except Exception as e:
                logger.error(f"Error loading model metadata: {e}")

        # Attempt ONNX runtime load if available and file is .onnx
        if self.model_path.endswith(".onnx"):
            try:
                import onnxruntime as ort
                self.session = ort.InferenceSession(self.model_path)
                logger.info(f"Loaded ONNX model successfully from {self.model_path}")
            except ImportError:
                logger.warning("onnxruntime not installed. Model file present but runtime missing.")
            except Exception as e:
                logger.error(f"Failed to load ONNX model: {e}")

    def is_available(self) -> bool:
        """Returns True only when valid weights and active session are loaded."""
        return self.session is not None

    def predict(self, preprocessed_tensor: np.ndarray) -> Optional[Dict[str, float]]:
        """
        Executes model forward pass.
        Returns dictionary mapping class name to raw output probability.
        If model is unavailable, strictly returns None (fails safely).
        """
        if not self.is_available():
            return None

        try:
            input_name = self.session.get_inputs()[0].name
            raw_outputs = self.session.run(None, {input_name: preprocessed_tensor})
            logits = raw_outputs[0][0]
            # Softmax
            exp_logits = np.exp(logits - np.max(logits))
            probs = exp_logits / np.sum(exp_logits)

            class_labels = self.classes or [f"Condition_{i}" for i in range(len(probs))]
            return {label: float(prob) for label, prob in zip(class_labels, probs)}
        except Exception as e:
            logger.error(f"Inference execution error: {e}")
            return None

# Global Singleton for Inference Service
skin_model_service = PlugAndPlaySkinModel()
