import numpy as np
from typing import Dict, Tuple
from app.core.config import settings

class UncertaintyDetector:
    """
    Stage 4 in Skin Analysis Pipeline:
    Quantifies predictive uncertainty and flags potential Out-Of-Distribution (OOD) cases.
    """
    def __init__(self, uncertainty_threshold: float = settings.OOD_UNCERTAINTY_THRESHOLD):
        self.uncertainty_threshold = uncertainty_threshold

    def calculate_entropy(self, probabilities: Dict[str, float]) -> Tuple[float, bool]:
        """
        Calculates normalized Shannon entropy across class probabilities.
        Returns (normalized_entropy, is_uncertain_or_ood).
        """
        probs = np.array(list(probabilities.values()), dtype=np.float64)
        probs = np.clip(probs, 1e-12, 1.0)
        probs = probs / np.sum(probs)

        num_classes = len(probs)
        if num_classes <= 1:
            return 0.0, False

        # Shannon entropy in bits
        entropy = -float(np.sum(probs * np.log2(probs)))
        max_possible_entropy = float(np.log2(num_classes))
        normalized_entropy = entropy / max_possible_entropy

        is_ood = normalized_entropy > self.uncertainty_threshold

        return round(normalized_entropy, 3), is_ood
