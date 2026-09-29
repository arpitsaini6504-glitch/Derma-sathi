# DERMASATHIAI - Team Responsibilities & Ownership Matrix

This document defines the architectural ownership and engineering boundaries across the DERMASATHIAI development team.

---

## 1. Team Allocation

### 🔬 Arpit
**Primary Domain:** ML Systems & Model Engineering
- **Model Training & Integration:** Design and train deep learning skin condition classifiers (e.g. EfficientNet / Vision Transformer).
- **Model Artifact Delivery:** Package trained weights (`model.onnx` or `model.pt`), `metadata.json`, and class indices into `backend/model_store/`.
- **Model Evaluation:** Validate calibration (ECE), accuracy on Indian Fitzpatrick skin types (IV, V, VI), and uncertainty thresholds.
- **ML APIs:** Collaborate on inference latency and batch serving optimizations.
- **Backend & Deployment Assistance:** Containerization and model runtime optimization (ONNX Runtime / TensorRT).

---

### ⚙️ Anushka Krishnatry
**Primary Domain:** Backend Engineering & Data Architecture
- **Core Backend APIs:** Implementation and maintenance of `/api/v1` routes and micro-services.
- **Authentication & Security:** JWT authentication flows, password salting/hashing, role-based access control (`patient`, `doctor`, `admin`).
- **Database & Schemas:** PostgreSQL database models, SQLAlchemy ORM relationships, migrations via Alembic.
- **User Management & Audit Trails:** Consultation persistence, PHI compliance, and audit log generation.
- **Server-Side Services:** Integration of external healthcare directories and third-party APIs.

---

### 🩺 Archana
**Primary Domain:** Quality Assurance, Clinical Safety & Verification
- **Safety-Flow Testing:** Validate emergency red-flag escalation paths (e.g. SJS/TEN, anaphylaxis, severe pain).
- **Multilingual Content Verification:** Review and audit medical terminology and translations across all 12 Indian languages.
- **API Testing:** Execute regression test suites, payload boundary tests, and security penetration checks.
- **Medical Disclaimer Compliance:** Ensure no diagnostic guarantees, 100% certainty claims, or misleading assertions exist in UI or API responses.
- **Requirements & Test-Case Tracking:** Maintain test matrices and clinical traceability documentation.

---

### 💻 Arpit Saini
**Primary Domain:** Frontend Architecture & Client Integration
- **Frontend Implementation:** Mobile-first, responsive React + TypeScript user interface.
- **Design System & Aesthetics:** Implement high-grade UI styling with HSL tokens, glassmorphism, and responsive layouts.
- **Multilingual UI (i18n):** Architect key-based localization for 12 Indian languages with dynamic switching.
- **Frontend/Backend Integration:** Connect client services to FastAPI `/api/v1` endpoints with robust error handling.
- **Low-Connectivity UX:** Implement offline caching, network status indicators, and camera capture UX.
- **Demo & Presentation Readiness:** Integration testing, UX polish, and live showcase readiness.
