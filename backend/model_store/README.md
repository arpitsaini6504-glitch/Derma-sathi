# DERMASATHIAI - Model Store (`backend/model_store/`)

## 1. Purpose of this Directory
This directory is the dedicated storage location for **trained machine learning model artifacts** (e.g., PyTorch `.pt`/`.pth`, ONNX `.onnx`, TensorFlow SavedModel, or Scikit-Learn `.joblib`/`.pkl`).

> **CRITICAL ARCHITECTURAL MANDATES:**
> 1. **Trained model files belong here only.**
> 2. **Never commit large binary model files directly to Git.** Model weights (`*.pth`, `*.pt`, `*.onnx`, `*.bin`, `*.h5`) are excluded in `.gitignore`. Use artifact registries (e.g., DVC, AWS S3, HuggingFace Hub, or MLflow) for model storage in production.
> 3. **Fail-Safe Operation:** The backend inference service (`backend/app/services/skin_pipeline/inference_engine.py`) is architected to **fail safely** when no model weights are present. It gracefully abstains, reports status `MODEL_PENDING_INTEGRATION`, and never generates synthetic or fake diagnoses.
> 4. **Do NOT generate mock weights or pretend a model exists.** The platform strictly acknowledges whether active weights are loaded or if inference is awaiting deployment.

---

## 2. Model Versioning Protocol

To ensure reproducible clinical evaluation and safety audits, models placed in this directory must adhere to semantic model versioning:

```
backend/model_store/
├── v1.0.0/
│   ├── model.onnx (or model.pt)
│   ├── class_indices.json
│   ├── metadata.json
│   └── calibration_params.json
├── active_model -> v1.0.0/ (symlink or configured via MODEL_VERSION env var)
└── README.md
```

### Required `metadata.json` Schema:
```json
{
  "model_name": "dermasathi_skin_classifier",
  "version": "1.0.0",
  "architecture": "efficientnet_b4",
  "trained_by": "ML Team (Arpit)",
  "training_date": "2026-10-01",
  "input_resolution": [224, 224, 3],
  "classes": [
    "Eczema",
    "Psoriasis",
    "Tinea Ringworm",
    "Acne Vulgaris",
    "Melanocytic Nevi",
    "Urticaria",
    "Normal / Benign"
  ],
  "metrics": {
    "validation_accuracy": 0.892,
    "top_2_accuracy": 0.954,
    "expected_calibration_error": 0.042
  },
  "ood_threshold": 0.65,
  "abstention_threshold": 0.70
}
```

---

## 3. How to Plug In the Trained Model
When the ML team (Arpit) delivers the trained model:
1. Place the weights inside `backend/model_store/<version>/` (e.g., `model.onnx` or `model.pt`).
2. Add the corresponding `metadata.json` and `class_indices.json`.
3. Set the environment variable in `.env`:
   ```bash
   DERMASATHI_MODEL_PATH=backend/model_store/v1.0.0/model.onnx
   DERMASATHI_MODEL_METADATA=backend/model_store/v1.0.0/metadata.json
   ```
4. The inference engine (`app.services.skin_pipeline.inference_engine`) automatically loads the model and executes the full 8-stage safety pipeline without requiring any API or route code modifications.

---

## 4. Safety and Clinical Boundaries
- Model predictions represent statistical association on training distribution; they are **never** definitive medical diagnoses.
- Low-confidence or out-of-distribution inputs trigger automatic abstention and direct the user to a professional dermatologist or primary health center.
