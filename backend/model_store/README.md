# DERMASATHIAI — Model Store (`backend/model_store/`)

This directory is the dedicated deployment location for trained deep-learning skin disease models in **DERMASATHIAI**.

---

## 1. Where the Trained Model Should Be Placed

Place the trained model artifact(s) directly in this directory or in its versioned subdirectories:

### A. Primary Single-Model Deployment (Recommended)
Place the primary 14-class disease classifier model directly at:
```
backend/model_store/model.keras
```

### B. Two-Stage Dual-Model Deployment (Full Pipeline)
If deploying the friend's two-stage gating + disease pipeline:
```
backend/model_store/
├── v1_disease/
│   ├── model.keras              <-- Stage 2: 14-class disease classifier
│   └── class_mapping.json       <-- Class mapping dictionary
├── v2_open_set/
│   ├── model.keras              <-- Stage 1: 15-class out-of-distribution gate
│   └── class_mapping.json       <-- Class mapping dictionary
├── skin_ai_policy.json          <-- Calibration & confidence thresholds
├── recommendations/
│   └── skin_disease_profiles.json
├── README.md                    <-- This documentation
└── .gitkeep
```

---

## 2. Supported Model Format

Based on the audit of the trained model repository ([`Primordial-Creater/DermaSathiAI`](https://github.com/Primordial-Creater/DermaSathiAI)):

- **Framework:** **TensorFlow / Keras 3** (`keras>=3.0.0`, `tensorflow>=2.15.0`)
- **Format:** Modern Keras zip archive format (**`.keras`**)
  - Internal archive contents:
    - `config.json` (Layer hyperparameters and computational graph)
    - `metadata.json` (Keras version `3.15.1`)
    - `model.weights.h5` (HDF5 weight tensors)
- **Model Architecture:** **Fine-tuned ResNet50**
  - **Backbone:** ResNet50 (ImageNet pre-trained, fine-tuned from `conv4_block1_1_conv` onward; 175 layers total)
  - **Classification Head:**
    - `GlobalAveragePooling2D()` (pooled output shape: `2048`)
    - `Dropout(rate=0.30)`
    - `Dense(units=256, activation='relu')`
    - `Dropout(rate=0.30)`
    - `Dense(units=num_classes, activation='softmax')`
- **Trained Artifact Sizes:**
  - `v1_disease/model.keras`: **277,735,550 bytes** (~264.87 MiB)
  - `v2_open_set/model.keras`: **277,738,634 bytes** (~264.87 MiB)

---

## 3. Expected Model Filename

| Deployment Mode | Component | Expected Relative Path | Expected Filename |
|---|---|---|---|
| **Primary / Direct** | 14-Class Disease Model | `backend/model_store/model.keras` | **`model.keras`** |
| **Two-Stage Pipeline** | Stage 1: Open-Set Gating | `backend/model_store/v2_open_set/model.keras` | **`model.keras`** |
| **Two-Stage Pipeline** | Stage 2: Disease Classifier | `backend/model_store/v1_disease/model.keras` | **`model.keras`** |

> [!NOTE]
> The exact filename expected by default by the inference loader is **`model.keras`**.

---

## 4. Expected Input Size & Tensor Layout

All models trained in this pipeline require the following exact input tensor specification:

- **Spatial Resolution:** **224 × 224 pixels** (height = 224, width = 224)
- **Color Channels:** **3 channels** (RGB source converted to BGR during preprocessing)
- **Data Type:** **`float32`**
- **Batch Shape:** **`(1, 224, 224, 3)`** in TensorFlow channel-last (`NHWC`) layout

---

## 5. Preprocessing Requirements

The exact preprocessing pipeline (verified from `backend/app/ml/skin/resnet_preprocess.py`) MUST be applied to all input images before tensor feeding:

1. **Format & Channel Enforcement:**
   - Decode input image using PIL / OpenCV.
   - Convert to 3-channel RGB: `image = image.convert("RGB")`.
2. **Spatial Resizing:**
   - Resize to **224 × 224** using bilinear interpolation: `image.resize((224, 224), Image.Resampling.BILINEAR)`.
3. **Float Array Conversion:**
   - Convert to a NumPy array with `dtype=np.float32`.
   - Dynamic range is **`[0.0, 255.0]`**.
   - > [!WARNING]
     > **DO NOT** divide by 255.0. ResNet50 preprocessing expects unnormalized 0–255 pixel values before mean subtraction.
4. **ResNet50 Channel Swapping & Mean Subtraction:**
   - Apply `tf.keras.applications.resnet50.preprocess_input(arr)` (or the exact equivalent mathematical formula):
     - Transpose channel order from **RGB to BGR**.
     - Subtract ImageNet dataset channel means:
       - $B \leftarrow B - 103.939$
       - $G \leftarrow G - 116.779$
       - $R \leftarrow R - 123.680$
5. **Batch Dimension Expansion:**
   - Add batch axis at index 0: `np.expand_dims(arr, axis=0)`, resulting in shape `(1, 224, 224, 3)`.

### Python Preprocessing Reference Implementation:
```python
import numpy as np
from PIL import Image

def preprocess_skin_image(image_bytes: bytes) -> np.ndarray:
    """Preprocesses a raw skin lesion image for ResNet50 inference."""
    # 1. Decode & convert to RGB
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # 2. Resize to 224x224
    img = img.resize((224, 224), Image.Resampling.BILINEAR)
    
    # 3. Convert to float32 [0.0, 255.0]
    arr = np.array(img, dtype=np.float32)
    
    # 4. RGB to BGR and ImageNet mean subtraction
    arr = arr[..., ::-1]  # RGB -> BGR
    arr[..., 0] -= 103.939  # Blue mean
    arr[..., 1] -= 116.779  # Green mean
    arr[..., 2] -= 123.680  # Red mean
    
    # 5. Expand batch dimension: (1, 224, 224, 3)
    return np.expand_dims(arr, axis=0)
```

---

## 6. Class Mappings & Safety Policies

### 6.1 V1 Disease Classifier (14 Classes)
Used by `backend/model_store/model.keras` (or `v1_disease/model.keras`):

| Index | Canonical Class Name | Category | High-Risk Malignancy Flag |
|:---:|---|---|:---:|
| **0** | `Actinic keratoses` | Precancerous Keratosis | No |
| **1** | `Basal cell carcinoma` | Malignant Skin Cancer | **YES (High Risk)** |
| **2** | `Benign keratosis-like lesions` | Benign Keratosis | No |
| **3** | `Chickenpox` | Infectious Viral Rash | No |
| **4** | `Cowpox` | Infectious Viral Rash | No |
| **5** | `Dermatofibroma` | Benign Fibrous Nodule | No |
| **6** | `HFMD` (Hand-Foot-and-Mouth Disease) | Infectious Viral Rash | No |
| **7** | `Healthy` | Normal Skin | No |
| **8** | `Measles` | Infectious Viral Exanthem | No |
| **9** | `Melanocytic nevi` | Benign Mole | No |
| **10** | `Melanoma` | Malignant Skin Cancer | **YES (High Risk)** |
| **11** | `Monkeypox` | Infectious Viral Rash | No |
| **12** | `Squamous cell carcinoma` | Malignant Skin Cancer | **YES (High Risk)** |
| **13** | `Vascular lesions` | Benign Vascular Lesion | No |

### 6.2 V2 Open-Set Gating Classifier (15 Classes)
Used by `v2_open_set/model.keras` for out-of-distribution (OOD) rejection:

| Index | Class Name | Function |
|:---:|---|---|
| **0** | `Actinic keratoses` | Supported class candidate |
| **1** | `Basal cell carcinoma` | Supported class candidate |
| **2** | `Benign keratosis-like lesions` | Supported class candidate |
| **3** | `Chickenpox` | Supported class candidate |
| **4** | `Cowpox` | Supported class candidate |
| **5** | `Dermatofibroma` | Supported class candidate |
| **6** | `HFMD` | Supported class candidate |
| **7** | `Healthy` | Supported class candidate |
| **8** | `Measles` | Supported class candidate |
| **9** | `Melanocytic nevi` | Supported class candidate |
| **10** | `Melanoma` | Supported class candidate |
| **11** | `Monkeypox` | Supported class candidate |
| **12** | **`OTHER_UNSUPPORTED`** | **Out-of-Distribution Gating Target** |
| **13** | `Squamous cell carcinoma` | Supported class candidate |
| **14** | `Vascular lesions` | Supported class candidate |

### 6.3 Clinical Safety Policy Thresholds
The policy enforced by `skin_ai_policy.json`:
- **Open-Set Rejection (`V2_MIN_ACCEPT_PROBABILITY` = 0.30):** If V2 classifies input as `OTHER_UNSUPPORTED` or top supported probability < 0.30, abstain with `UNSUPPORTED_CONDITION`.
- **Absolute Abstention Threshold (`0.35`):** Any V1 prediction where `max(probability) < 0.35` is rejected as `ASSESSMENT_UNAVAILABLE`.
- **Predictive Entropy Gate (`0.80`):** Normalized Shannon entropy $H > 0.80$ indicates model uncertainty / ambiguous distribution; triggers automatic abstention.
- **High-Risk Cancer Threshold (`0.60`):** Malignant classes (Melanoma, Basal cell carcinoma, Squamous cell carcinoma) require $\ge 60\%$ confidence to present assessment availability.

---

## 7. Version Control & Git Configuration

To prevent repository bloat and Git index corruption, large binary model files (`*.keras`, `*.weights.h5`, `*.safetensors`, `*.pt`, `*.onnx`) are **strictly excluded** from version control in `.gitignore`.

Only directory preservation files (`.gitkeep`), documentation (`README.md`), and lightweight configuration files (`*.json`) are tracked:

```gitignore
# In .gitignore
*.keras
*.weights.h5
backend/model_store/**/*.keras
backend/model_store/**/*.weights.h5
!backend/model_store/README.md
!backend/model_store/.gitkeep
!backend/model_store/**/.gitkeep
!backend/model_store/**/*.json
```

---

## 8. Deployment Workflow Summary

1. Obtain the genuine trained model artifact (`model.keras`) from the trained model repository or storage bucket.
2. Copy `model.keras` into `backend/model_store/model.keras` (or `v1_disease/model.keras`).
3. Ensure `.gitkeep` remains to track the folder structure.
4. Run validation checks to ensure model loading succeeds before serving live traffic.
