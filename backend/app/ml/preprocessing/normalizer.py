import cv2
import numpy as np
from typing import Tuple, List, Optional, Union
from pydantic import BaseModel, Field

class NormalizationConfig(BaseModel):
    """
    Configuration specification for model-specific normalization.
    Allows easy customization when external models (EfficientNet, ResNet, ViT, MobileNet) are integrated.
    """
    target_size: Tuple[int, int] = Field(default=(224, 224), description="(width, height)")
    scheme: str = Field(default="imagenet", description="'imagenet', 'zero_to_one', 'minus_one_to_one', 'custom'")
    custom_mean: Optional[List[float]] = None
    custom_std: Optional[List[float]] = None
    layout: str = Field(default="NCHW", description="'NCHW' (channels first for PyTorch/ONNX) or 'NHWC' (TensorFlow)")
    interpolation: str = Field(default="cubic", description="'cubic', 'linear', 'area'")

class ImageNormalizer:
    """
    Applies configurable spatial resizing and numerical channel normalization.
    Preserves original image without altering physical skin tone on source assets.
    """
    # Standard coefficient banks
    IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def __init__(self, config: Optional[NormalizationConfig] = None):
        self.config = config or NormalizationConfig()

    def _get_interpolation(self) -> int:
        mapping = {
            "cubic": cv2.INTER_CUBIC,
            "linear": cv2.INTER_LINEAR,
            "area": cv2.INTER_AREA
        }
        return mapping.get(self.config.interpolation.lower(), cv2.INTER_CUBIC)

    def normalize(self, rgb_image: np.ndarray) -> np.ndarray:
        """
        Takes RGB image array [H, W, 3] uint8 and returns normalized batch tensor.
        """
        # 1. Resize to target dimension
        interp = self._get_interpolation()
        resized = cv2.resize(rgb_image, self.config.target_size, interpolation=interp)

        # 2. Scale pixel values to float32 [0.0, 1.0]
        float_img = resized.astype(np.float32) / 255.0

        # 3. Apply model-specific numerical normalization
        scheme = self.config.scheme.lower()
        if scheme == "imagenet":
            normalized = (float_img - self.IMAGENET_MEAN) / self.IMAGENET_STD
        elif scheme == "minus_one_to_one":
            normalized = (float_img - 0.5) * 2.0
        elif scheme == "zero_to_one":
            normalized = float_img
        elif scheme == "custom" and self.config.custom_mean and self.config.custom_std:
            mean = np.array(self.config.custom_mean, dtype=np.float32)
            std = np.array(self.config.custom_std, dtype=np.float32)
            normalized = (float_img - mean) / std
        else:
            normalized = float_img

        # 4. Format layout (NCHW vs NHWC)
        if self.config.layout.upper() == "NCHW":
            # [H, W, C] -> [C, H, W]
            tensor = np.transpose(normalized, (2, 0, 1))
            # Add batch dimension -> [1, C, H, W]
            batch_tensor = np.expand_dims(tensor, axis=0)
        else:
            # NHWC -> [1, H, W, C]
            batch_tensor = np.expand_dims(normalized, axis=0)

        return batch_tensor
