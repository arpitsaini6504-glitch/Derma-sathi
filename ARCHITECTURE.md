# DERMASATHIAI - System Architecture & Engineering Blueprint

## 1. High-Level Vision & Core Principles
**DERMASATHIAI** is an AI-assisted healthcare companion platform designed initially for Indian populations across linguistic, regional, and connectivity spectra, with architectural provisions for global scalability.

### Strict Healthcare Safety Directives
- **Non-Diagnostic Assistance:** The platform strictly provides clinical triage, differential education, harm-reduction, and referral pathways. It does **not** replace licensed medical practitioners.
- **Forbidden Terminology:** Disclaimers and pipeline code strictly ban language suggesting "definitive diagnosis", "guaranteed accuracy", or "100% certainty".
- **Decoupled Model Serving:** Machine learning model training is decoupled from backend API serving. The inference engine fails safely with a status of `MODEL_PENDING_INTEGRATION` when trained model weights are not present in `backend/model_store/`. Fake predictions and synthetic weights are prohibited.

---

## 2. 8-Stage Skin Analysis Pipeline Architecture

```
User Image Ingestion (MIME & Size Validation)
       ↓
[Stage 1] Image Quality Gate (Laplacian Blur & Illumination Thresholds)
       ↓
[Stage 2] Preprocessing & Tensor Normalization (RGB, Standardization, Scaling)
       ↓
[Stage 3] Model Inference Engine (Abstract Contract, Plug-and-Play)
       ↓
[Stage 4] Predictive Uncertainty & OOD Detection (Shannon Entropy H(p))
       ↓
[Stage 5] Confidence Calibration (Temperature Scaling)
       ↓
[Stage 6] Clinical Abstention Gate (Confidence < 70% or High Entropy)
       ↓
[Stage 7] Clinical Safety & Harm Reduction Layer
       ↓
[Stage 8] Educational Findings OR Professional Dermatology Referral
```

### Component Breakdown
1. **Quality Gate (`quality_gate.py`):** Calculates Laplacian variance ($Var(\nabla^2 I)$). Flags blurry photos below threshold (default: 60.0). Checks illumination to detect underexposed (< 40) or overexposed (> 225) images. Rejects low resolutions (< 150px).
2. **Preprocessor (`preprocessor.py`):** Converts to standard dimensions, normalizes using ImageNet mean/standard deviations, returns normalized batch tensors.
3. **Inference Engine (`inference_engine.py`):** Implements `BaseModelInference` contract. Safely inspects `backend/model_store/` for deployed weights (`.onnx` / `.pt`). If absent, cleanly signals safe abstention without failing the HTTP request.
4. **Uncertainty Detector (`uncertainty.py`):** Calculates normalized Shannon entropy across predictions:
   $$H_{norm}(p) = \frac{-\sum p_i \log_2 p_i}{\log_2 K}$$
   Flags out-of-distribution (OOD) inputs when entropy exceeds safety limits.
5. **Calibrator (`calibration.py`):** Applies temperature scaling to soften overconfident raw softmax distributions:
   $$p_i = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}$$
6. **Abstention Gate (`abstention.py`):** Automatically withholds specific condition categorization if quality gate failed, model is unavailable, entropy is high, or calibrated confidence is under 70%.
7. **Safety Layer (`safety_layer.py`):** Enforces non-definitive educational synthesis, emergency red flag detection, and referral recommendations with specialist timeframes.

---

## 3. Multilingual-First Architecture (12 Indian Languages)

DERMASATHIAI enforces key-based internationalization (`i18next` + `react-i18next`). Zero hard-coded user-facing strings are permitted in React presentation components.

### Supported Language Codes:
- `en` - English
- `hi` - हिन्दी (Hindi)
- `mr` - मराठी (Marathi)
- `bn` - বাংলা (Bengali)
- `ta` - தமிழ் (Tamil)
- `te` - తెలుగు (Telugu)
- `ml` - മലയാളം (Malayalam)
- `kn` - ಕನ್ನಡ (Kannada)
- `gu` - ગુજરાતી (Gujarati)
- `pa` - ਪੰਜਾਬੀ (Punjabi)
- `as` - অসমীয়া (Assamese)
- `or` - ଓଡ଼ିଆ (Odia)

All strings fallback safely to English/Hindi if an unmapped regional key is queried.

---

## 4. Privacy, PHI-Safety & Security Controls

1. **PHI-Safe Logging:** Custom `HealthcareSafetyFilter` scrubs passwords, JWT tokens, phone numbers, email addresses, and base64 image strings from all log outputs.
2. **Upload Constraints:** Strict MIME verification (`image/jpeg`, `image/png`, `image/webp`), 10MB payload limit, and immediate in-memory processing.
3. **Structured Error Handling:** Global exception handlers prevent internal tracebacks and stack traces from leaking to client responses.
4. **JWT Authentication:** Password hashing using direct `bcrypt` salt generation, signed JWT bearer tokens with configurable expiration.
5. **Database Decoupling:** SQLAlchemy 2.0 ORM with PostgreSQL production configuration and SQLite local development fallback.

---

## 5. Low-Connectivity Resilience

- Local browser caching (`offlineStorage.ts`) caches emergency telephone numbers (112, 108, 1075) and first-aid guidelines.
- Online/offline network listener provides clear UI status alerts.
- Offline consultation summaries stored in LocalStorage for intermittent connectivity.
