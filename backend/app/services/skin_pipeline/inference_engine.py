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
        # Locate model candidate
        candidates = [
            self.model_path,
            "model_store/model.keras",
            "backend/model_store/model.keras",
            "model_store/v1_disease/model.keras",
            "backend/model_store/v1_disease/model.keras",
            "../model_source_repo/backend/models/skin_ai/v1_disease/model.keras",
            "model_source_repo/backend/models/skin_ai/v1_disease/model.keras",
        ]
        found_model = None
        for cand in candidates:
            if cand and os.path.exists(cand) and os.path.isfile(cand):
                found_model = cand
                break

        if not found_model:
            logger.info(
                f"[DERMASATHI_MODEL_GATE] No active model artifact found at '{self.model_path}'. "
                "Inference service running in SAFE_PENDING mode. Waiting for trained model delivery."
            )
            return

        self.model_path = found_model

        # Load class mapping
        mapping_candidates = [
            getattr(settings, "DERMASATHI_CLASS_MAPPING_PATH", None),
            "model_store/class_mapping.json",
            "backend/model_store/class_mapping.json",
            "model_store/v1_disease/class_mapping.json",
            "backend/model_store/v1_disease/class_mapping.json",
            "../model_source_repo/backend/models/skin_ai/v1_disease/class_mapping.json",
            "model_source_repo/backend/models/skin_ai/v1_disease/class_mapping.json",
        ]
        for m_path in mapping_candidates:
            if m_path and os.path.exists(m_path):
                try:
                    with open(m_path, 'r', encoding='utf-8') as f:
                        raw = json.load(f)
                    if isinstance(raw, dict):
                        sorted_items = sorted(raw.items(), key=lambda x: int(x[0]) if str(x[0]).isdigit() else str(x[0]))
                        self.classes = [item[1] if isinstance(item[1], str) else item[0] for item in sorted_items]
                        logger.info(f"Loaded {len(self.classes)} classes from {m_path}")
                        break
                except Exception as e:
                    logger.error(f"Error loading class mapping from {m_path}: {e}")

        # Attempt Keras 3 runtime load for .keras format
        if self.model_path.endswith(".keras"):
            try:
                os.environ.setdefault("KERAS_BACKEND", "torch")
                import keras
                self.session = keras.models.load_model(self.model_path, compile=False)
                logger.info(f"Loaded Keras model successfully from {self.model_path}")
            except Exception as e:
                logger.error(f"Failed to load Keras model from {self.model_path}: {e}")
        # Attempt ONNX runtime load if available and file is .onnx
        elif self.model_path.endswith(".onnx"):
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
            # Handle tensor shape layout: ResNet50 .keras expects (None, 224, 224, 3) NHWC
            tensor = preprocessed_tensor
            if tensor.ndim == 4 and tensor.shape[1] == 3 and tensor.shape[2] == 224 and tensor.shape[3] == 224:
                # Transpose NCHW -> NHWC
                tensor = np.transpose(tensor, (0, 2, 3, 1))

            if hasattr(self.session, "predict"):
                probs = self.session.predict(tensor, verbose=0)
            elif callable(self.session):
                probs = self.session(tensor, training=False)
                if hasattr(probs, "numpy"):
                    probs = probs.numpy()
            elif hasattr(self.session, "run"):
                input_name = self.session.get_inputs()[0].name
                raw_outputs = self.session.run(None, {input_name: preprocessed_tensor})
                probs = raw_outputs[0]
            else:
                return None

            probs = np.asarray(probs, dtype=np.float32)
            if probs.ndim == 2:
                probs = probs[0]

            # Apply softmax if logits
            if np.min(probs) < 0 or not np.isclose(float(np.sum(probs)), 1.0, atol=1e-2):
                exp_logits = np.exp(probs - np.max(probs))
                probs = exp_logits / np.sum(exp_logits)

            class_labels = self.classes or [f"Condition_{i}" for i in range(len(probs))]
            return {label: float(prob) for label, prob in zip(class_labels, probs)}
        except Exception as e:
            logger.error(f"Inference execution error: {e}")
            return None

# Global Singleton for Inference Service
skin_model_service = PlugAndPlaySkinModel()
