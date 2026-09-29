# DERMASATHIAI: Comprehensive Implementation & Architecture Audit

**Document Version:** 1.0.0  
**Date:** September 2026  
**Auditor:** Senior Software Architect  
**Project:** DERMASATHIAI - Multilingual AI Healthcare Companion  
**Location:** `docs/ARCHITECTURE_AUDIT.md`  

---

## 1. Executive Summary

This audit evaluates the codebase of **DERMASATHIAI**, assessing the frontend, backend, database, security, Docker configuration, test suites, and ML integration architectures. The primary design mandate—treating the platform as a serious, safety-first clinical triage companion rather than a student CRUD project—has been maintained. The trained ML model is deliberately decoupled, ensuring fail-safe abstention while awaiting the delivery of trained weights to `backend/model_store/`.

---

## 2. Detailed Dimension Audit

### 2.1 Frontend Architecture
- **Framework & Tooling:** React 18.3.1 + TypeScript 5.4 + Vite 5.1.
- **Component Organization:** Domain-driven directory structure under `frontend/src/components/{common, skin-analysis, symptoms, medications, wellness, emergency, healthcare, auth}`.
- **Styling Architecture:** High-fidelity Vanilla CSS system with HSL design tokens, responsive typography (Outfit & Plus Jakarta Sans), dark/light mode toggle via data attributes (`[data-theme='dark']`), and micro-interactions. TailwindCSS was avoided per system requirements.
- **Localization (i18n):** Implemented via `i18next` and `react-i18next`. All 12 mandated Indian languages are mapped:
  - English (`en`), Hindi (`hi`), Marathi (`mr`), Bengali (`bn`), Tamil (`ta`), Telugu (`te`), Malayalam (`ml`), Kannada (`kn`), Gujarati (`gu`), Punjabi (`pa`), Assamese (`as`), Odia (`or`).
  - Zero user-facing strings are hard-coded in components.
- **Low-Connectivity Layer:** `offlineStorage.ts` caches emergency telephone directories (112, 108, 1075) and basic first-aid rules to LocalStorage.
- **Voice Assistance:** Multilingual Text-To-Speech (TTS) implemented using browser Web Speech API in `speechService.ts`.

### 2.2 Backend Architecture
- **Framework:** FastAPI running on Python 3.13.
- **Layering & Separation:** Clean separation between:
  - Configuration (`app/core/config.py`)
  - Security & Tokens (`app/core/security.py`)
  - PHI-Safe Logging (`app/core/logging.py`)
  - Database Layer (`app/db/session.py`, `app/db/base.py`)
  - ORM Models (`app/models/*`)
  - Data Validation Schemas (`app/schemas/*`)
  - Domain Services (`app/services/*`)
  - API Endpoints (`app/api/v1/endpoints/*`)
- **Error Handling:** Global exception interceptor shields internal stack traces, DB errors, and credentials from external API consumers.

### 2.3 Existing Routes Audit
All endpoints conform to `/api/v1/...` REST conventions:
| Method | Endpoint | Domain | Status / Notes |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | System | Root metadata and safety notice |
| `GET` | `/api/v1/health/status` | System Health | DB ping + ML model availability status |
| `POST` | `/api/v1/auth/register` | Auth | User registration with preferred language |
| `POST` | `/api/v1/auth/login` | Auth | Issues signed JWT token |
| `GET` | `/api/v1/auth/me` | User | Authenticated profile retrieval |
| `PUT` | `/api/v1/auth/me` | User | Profile / language preference updates |
| `POST` | `/api/v1/skin-analysis/analyze-image` | Skin AI | Full 8-stage safety pipeline |
| `POST` | `/api/v1/skin-analysis/quality-check` | Skin AI | Pre-flight CV blur/illumination check |
| `POST` | `/api/v1/symptoms/check` | Triage | Multi-symptom differential & red flags |
| `POST` | `/api/v1/medications/check-safety` | Pharmacology | Multi-drug contraindication verification |
| `POST` | `/api/v1/wellness/guidance` | Ayurveda | Dosha analysis & seasonal Ritucharya |
| `POST` | `/api/v1/emergency/assess` | Triage | Immediate emergency cutaneous assessment |
| `GET` | `/api/v1/healthcare-access/facilities`| Access | Hospitals, PHCs, and eSanjeevani portals |

### 2.4 Existing Components Audit
- `Navbar.tsx`: Responsive navigation with language picker, theme switch, emergency hotline button, and auth trigger.
- `MedicalDisclaimerBanner.tsx`: Prominent clinical safety disclaimer with local acknowledgment.
- `LanguageSelector.tsx`: Dropdown for 12 Indian languages with native scripts.
- `VoiceAssistButton.tsx`: Audio readout of clinical guidance in selected language.
- `SkinAnalysisModule.tsx`: Multi-input (camera capture & drag-and-drop file upload), pre-flight CV metrics display, fail-safe model staging notice, and referral timeframes.
- `SymptomCheckerModule.tsx`: Interactive chip selector, severity slider, red-flag checklists, and differential possibilities.
- `MedicationSafetyModule.tsx`: Drug chip list, pregnancy safety filter, contraindication alerts, and pharmacology profiles.
- `AyurvedicWellnessModule.tsx`: Dosha-based regimen, seasonal adaptations, classical herb recommendations with safety notes.
- `EmergencyTriageModule.tsx`: Red-flag checklist (SJS/TEN, anaphylaxis), instant dialing links for 112/108, and actionable DOs and DON'Ts.
- `HealthcareAccessModule.tsx`: Directory cards for District Hospitals, Ayushman Arogya Mandirs, and teleconsultation links.
- `AuthModal.tsx`: Patient sign-in and registration dialog with language preference.
- `HeroOverview.tsx`: Platform overview with 6 feature pillar cards and live backend connectivity status.
- `Footer.tsx`: Team responsibility matrix and medical disclaimer.

### 2.5 Existing API Calls Audit
- Centralized in `frontend/src/services/api.ts`.
- Handles `multipart/form-data` for image streams and `application/json` for payloads.
- Automatically attaches `Authorization: Bearer <token>` when tokens exist.
- Graceful offline handling: If backend fails or network drops, API methods catch failures and UI falls back to cached guidelines.

### 2.6 Existing Database Integration
- **ORM:** SQLAlchemy 2.0 Declarative Models.
- **Dual-Mode Engine:**
  - Production: Configurable PostgreSQL (`postgresql://...`).
  - Local Dev Fallback: SQLite (`sqlite:///./dermasathi.db`) enabled with `check_same_thread=False`.
- **Models:**
  - `User`: Handles identity, password hash, role (`patient`, `doctor`, `admin`), language preference.
  - `ConsultationRecord`: Logs anonymized consultation sessions, quality scores, abstention reasons, and triage urgency without storing raw patient photos.
  - `AuditLog`: Captures endpoints, status codes, timestamps, and SHA-256 hashed IPs for privacy compliance.

### 2.7 Existing Authentication
- **Password Security:** Uses direct `bcrypt` salting (`bcrypt.gensalt()` and `bcrypt.hashpw()`), avoiding passlib version deprecation bugs on Python 3.13.
- **Tokens:** RFC 7519 JSON Web Tokens (JWT) signed via HMAC-SHA256 (`HS256`) with standard 24-hour expiration.
- **Protected Dependencies:** `get_current_user` FastAPI dependency for protected routes.

### 2.8 Existing Environment Configuration
- Pydantic v2 `pydantic-settings` (`SettingsConfigDict`) loading `.env` automatically.
- Template provided in `backend/.env.example`.
- Centralized configuration variables for database URL, JWT secret key, blur threshold (`60.0`), confidence abstention threshold (`0.70`), OOD threshold (`0.65`), and CORS origins.

### 2.9 Existing Docker Configuration
- `backend/Dockerfile`: Multi-stage slim Python 3.13 container, non-root `appuser`, OpenCV system dependencies (`libgl1`, `libglib2.0-0`), and health check.
- `frontend/Dockerfile`: Multi-stage build with Node 22-alpine and Nginx alpine serving static assets with SPA routing.
- `docker-compose.yml`: Coordinates `db` (Postgres 16), `backend` (FastAPI), and `frontend` (Nginx), with isolated network and persistent volume for postgres data.

### 2.10 Existing Test Suite
- **Pytest Suite:** 20 automated unit and integration tests in `backend/tests/`:
  - `test_quality_gate.py`: Verifies clear image acceptance, dark image rejection, blurry image rejection, and corrupt bytes handling (4 tests).
  - `test_skin_pipeline.py`: Verifies fail-safe abstention without model weights, Shannon entropy uncertainty, temperature scaling calibration, and abstention thresholds (4 tests).
  - `test_symptoms_and_meds.py`: Verifies red-flag emergency detection, routine symptom matching, contraindicated drug combinations, and pregnancy teratogenicity alerts (4 tests).
  - `test_api_v1.py`: Comprehensive FastAPI TestClient tests covering health status, auth registration/login/me, skin image upload, symptom checking, drug safety, wellness, emergency triage, and healthcare facilities (8 tests).
- **Execution Time:** ~0.67s with 100% pass rate.

### 2.11 Existing Model & ML Integration
- **Directory:** `backend/model_store/` with comprehensive `README.md` defining versioning protocols and metadata schema (`metadata.json`).
- **Fail-Safe Mechanism:** `PlugAndPlaySkinModel` in `backend/app/services/skin_pipeline/inference_engine.py` inspects `DERMASATHI_MODEL_PATH`. If weights are missing, it reports `status="MODEL_PENDING_INTEGRATION"` and enforces clinical abstention. **Zero fake predictions or synthetic weights exist.**
- **8-Stage Pipeline:** Fully realized in code:
  1. `quality_gate.py` (Laplacian variance & brightness analysis)
  2. `preprocessor.py` (RGB normalization and tensor scaling)
  3. `inference_engine.py` (Decoupled abstract interface)
  4. `uncertainty.py` (Normalized Shannon entropy calculation)
  5. `calibration.py` (Temperature scaling)
  6. `abstention.py` (Clinical threshold gate)
  7. `safety_layer.py` (Educational synthesis and non-diagnostic framing)
  8. Referral & care plan formulation.

---

## 3. Existing Working Components vs. Missing Components

### Working Components (Ready & Verified):
- [x] Full responsive React TypeScript frontend with 6 functional healthcare modules.
- [x] 12 Indian languages internationalization architecture (`i18next`).
- [x] OpenCV-based image quality gate (blur, lighting, resolution).
- [x] Fail-safe ML inference abstraction layer with strict non-diagnostic disclaimers.
- [x] Shannon entropy uncertainty and temperature-scaling calibration.
- [x] Multi-symptom triage engine with red-flag detection.
- [x] Pharmacology safety engine with drug interaction rules and pregnancy warnings.
- [x] Traditional Ayurvedic wellness guidance engine.
- [x] Emergency triage with direct one-click calling (112, 108, 1075).
- [x] JWT authentication and user profile management.
- [x] Dual-mode DB session (PostgreSQL + SQLite fallback).
- [x] PHI-safe logging filter scrubbing personal credentials and medical data.
- [x] Web Speech API multilingual audio assistance.
- [x] LocalStorage low-connectivity caching.
- [x] 20/20 passing backend test suite.
- [x] Production Docker and docker-compose files.

### Missing Components (Planned Roadmap):
- [ ] **Medical Report OCR Module:** Endpoint and UI for digitizing lab reports and biopsy summaries (using EasyOCR/Tesseract).
- [ ] **Prescription Parser Module:** Handwriting-tolerant OCR pipeline for extracting prescription medicines and dosages.
- [ ] **Speech-to-Text (STT) Voice Input:** Currently, voice output (TTS) works; voice input for dictating symptoms in regional languages needs Web Speech Recognition / Whisper integration.
- [ ] **Patient Consultation History Dashboard:** UI view allowing logged-in patients to review past triage summaries.
- [ ] **Alembic Database Migration Scripts:** While `Base.metadata.create_all` works, formal migration version tracking (`alembic revision --autogenerate`) will be needed when database schema matures.
- [ ] **Dermatologist / Clinician Portal:** Role-based dashboard allowing registered doctors to review anonymized patient referral triage requests.

---

## 4. Technical Debt, Security & Integration Concerns

### Technical Debt:
1. **Rule-Based Knowledge Bases:** The symptom and drug databases in `symptom_service.py` and `medication_service.py` currently use curated in-memory dictionaries. While clinically accurate, they should eventually be migrated to relational tables or an external medical knowledge graph (e.g., RxNorm, SNOMED-CT).
2. **Translation Content Depth:** While the UI architecture supports 12 languages and English/Hindi dictionaries are fully fleshed out, full regional clinical translation sets for regional languages (Bengali, Tamil, Telugu, etc.) currently use the standardized bilingual fallback.
3. **Database Concurrency in SQLite Mode:** While SQLite is excellent for zero-config local development, production must strictly use PostgreSQL to handle multi-worker concurrent transactions.

### Security Concerns & Mitigations:
1. **Rate Limiting on Auth Routes:** `/api/v1/auth/login` currently does not have rate-limiting. A brute-force defense (e.g. `slowapi` or Redis token bucket) should be integrated before public deployment.
2. **Secret Key in Development:** `.env.example` has a placeholder secret. The production deployment guide must mandate generating cryptographically random 256-bit keys via `openssl rand -hex 32`.
3. **MIME Sniffing Prevention:** `skin_analysis.py` checks `file.content_type`, but should also inspect magic bytes using `python-magic` or PIL verification before reading the full stream.

### Integration Concerns:
1. **CORS Origins in Containerized Environments:** When deployed behind reverse proxies, container DNS names (`dermasathi_frontend`) must be reconciled with browser client origins.
2. **Model Serving Latency:** Once Arpit trains large deep learning models (e.g., ViT or EfficientNet-B4), running inference on CPU inside Docker could exceed 2 seconds. ONNX Runtime with quantized weights (INT8) or TensorRT will be recommended.

---

## 5. File Architecture Strategy

### Files to Preserve (Do NOT Rewrite):
- `backend/app/services/skin_pipeline/*`: The 8-stage pipeline is structurally complete, passes all tests, and handles missing weights safely.
- `backend/app/core/logging.py`: PHI-safe log redaction is active and effective.
- `backend/app/core/security.py`: Direct bcrypt salting and JWT generation are bug-free on Python 3.13.
- `backend/model_store/README.md`: Authoritative protocol for model versioning.
- `backend/tests/*`: All 20 tests provide a reliable regression safety net.
- `frontend/src/i18n/index.ts`: Sound localization foundation covering 12 Indian languages.
- `frontend/src/index.css`: Complete HSL design token system and responsive layout styles.

### Files to Modify in Subsequent Phases:
- `backend/app/core/config.py`: Add rate-limiting settings (`RATE_LIMIT_PER_MINUTE`) and OCR configuration.
- `backend/app/api/v1/endpoints/skin_analysis.py`: Add file magic-byte validation.
- `backend/app/api/v1/router.py`: Register future OCR and prescription endpoints.
- `frontend/src/services/api.ts`: Add OCR endpoints once backend routes are implemented.
- `frontend/src/components/common/Navbar.tsx`: Add navigation links for Consultation History and OCR modules.

### Files to Newly Create in Subsequent Phases:
- `backend/app/schemas/ocr.py`: Schemas for medical report and prescription OCR outputs.
- `backend/app/services/ocr_service.py`: Service utilizing EasyOCR/Tesseract to extract text from medical documents.
- `backend/app/api/v1/endpoints/ocr.py`: Endpoints for prescription and lab report uploads.
- `frontend/src/components/ocr/PrescriptionOcrModule.tsx`: Frontend drag-and-drop report analyzer.
- `frontend/src/components/history/ConsultationHistoryModule.tsx`: View of user's past triage sessions.
- `backend/alembic/`: Formal database migration environment.

---

## 6. Recommended Target Architecture

```mermaid
graph TD
    subgraph Client["Frontend Client (React + TS + i18n)"]
        UI[Mobile-First UI / 12 Languages]
        Camera[Camera & Live Quality Gate]
        Voice[Speech Synthesis & Recognition]
        Offline[LocalStorage Offline Fallback]
        HistoryUI[Consultation History]
    end

    subgraph API_GW["FastAPI API Gateway (/api/v1)"]
        RateLimit[Rate Limiter (SlowAPI / Redis)]
        AuthMid[JWT Auth Guard]
        Logger[PHI-Safe Logging Filter]
        Router[API Router /api/v1]
    end

    subgraph CoreServices["Backend Service Layer"]
        AuthSvc[Auth & Profile Service]
        SkinSvc[8-Stage Skin Pipeline]
        SymptomSvc[Symptom Triage Engine]
        MedSvc[Drug Interaction Engine]
        WellnessSvc[Ayurvedic Regimen Service]
        EmergencySvc[Emergency Red-Flag Escalator]
        OCRSvc[Medical Report & Prescription OCR]
    end

    subgraph ML_Subsystem["ML Model Store & Runtimes"]
        Store["backend/model_store/ (Artifacts)"]
        CVEngine[ONNX Runtime / PyTorch Inference]
        SafetyGate[Confidence & Abstention Gate]
    end

    subgraph DataStore["Data & Persistence"]
        PG[(PostgreSQL Database)]
        Alembic[Alembic Migrations]
    end

    Client --> API_GW
    API_GW --> CoreServices
    SkinSvc --> ML_Subsystem
    CoreServices --> DataStore
```

---

## 7. Prioritized Implementation Plan for Next Tasks

```
[Priority 1: Safety & Hardening]
├── 1.1 Rate limiting on /api/v1/auth/login and /auth/register (SlowAPI)
├── 1.2 File magic-byte validation in image upload gate
└── 1.3 Alembic database migration environment setup

[Priority 2: Consultation History & Patient Dashboard]
├── 2.1 Backend endpoint: GET /api/v1/consultations/history (user scoped)
├── 2.2 Frontend module: ConsultationHistoryModule.tsx
└── 2.3 Cache synchronization between LocalStorage and backend history

[Priority 3: OCR & Prescription Analysis Architecture]
├── 3.1 Backend schema: app/schemas/ocr.py
├── 3.2 Backend service: app/services/ocr_service.py (EasyOCR integration)
├── 3.3 Backend endpoint: POST /api/v1/ocr/prescription
└── 3.4 Frontend component: PrescriptionOcrModule.tsx

[Priority 4: Multilingual Voice Input (Speech-To-Text)]
├── 4.1 Web Speech API speech recognition for hands-free symptom input
└── 4.2 Audio recording fallback for regional Indian dialects

[Priority 5: Trained ML Model Ingestion (Team Member Arpit)]
├── 5.1 Place model.onnx / model.pt in backend/model_store/v1.0.0/
├── 5.2 Validate model metadata and calibration parameters
└── 5.3 Verify seamless live inference via the 8-stage pipeline
```
