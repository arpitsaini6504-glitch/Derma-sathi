import cv2
import numpy as np

class SkinImagePreprocessor:
    """
    Stage 2 in Skin Analysis Pipeline:
    Standardizes image dimensions, color space, and normalization tensors
    for downstream convolutional/transformer inference models.
    """
    def __init__(self, target_size: tuple = (224, 224)):
        self.target_size = target_size
        # Standard ImageNet normalization coefficients
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def preprocess(self, img_bgr: np.ndarray) -> np.ndarray:
        """
        Converts BGR to RGB, resizes with cubic interpolation,
        normalizes channels, and returns NCHW format [1, 3, H, W].
        """
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(img_rgb, self.target_size, interpolation=cv2.INTER_CUBIC)
        
        # Scale to [0, 1]
        normalized = resized.astype(np.float32) / 255.0
        
        # Standardize
        normalized = (normalized - self.mean) / self.std
        
        # Transpose from HWC to CHW and add batch dimension -> [1, C, H, W]
        tensor = np.transpose(normalized, (2, 0, 1))
        tensor_batch = np.expand_dims(tensor, axis=0)
        
        return tensor_batch
