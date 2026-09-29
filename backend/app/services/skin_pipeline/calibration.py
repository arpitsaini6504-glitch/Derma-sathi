import numpy as np
from typing import Dict

class ConfidenceCalibrator:
    """
    Stage 5 in Skin Analysis Pipeline:
    Calibrates raw neural network softmax outputs into reliable empirical risk estimates
    using temperature scaling.
    """
    def __init__(self, temperature: float = 1.35):
        # Temperature > 1 prevents overconfident, poorly calibrated modern neural nets
        self.temperature = max(0.1, temperature)

    def calibrate(self, raw_probs: Dict[str, float]) -> Dict[str, float]:
        """
        Applies temperature scaling to raw softmax probabilities.
        """
        labels = list(raw_probs.keys())
        p = np.array([raw_probs[k] for k in labels], dtype=np.float64)
        p = np.clip(p, 1e-12, 1.0)
        
        # Convert to approximate logits, scale by temperature, then softmax
        logits = np.log(p)
        scaled_logits = logits / self.temperature
        exp_scaled = np.exp(scaled_logits - np.max(scaled_logits))
        calibrated_probs = exp_scaled / np.sum(exp_scaled)

        return {labels[i]: round(float(calibrated_probs[i]), 4) for i in range(len(labels))}
