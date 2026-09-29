# DERMASATHIAI 🩺✨
> **Multilingual AI Healthcare & Skin Wellness Companion**  
> *A serious, safety-first clinical triage and wellness platform tailored for Indian populations and scalable globally.*

---

## 🌟 Key Capabilities
1. **8-Stage Skin Analysis Pipeline:** Image Quality Gate (Laplacian blur & illumination check) $\to$ Preprocessing $\to$ Fail-safe Model Engine $\to$ Uncertainty/OOD Detection $\to$ Confidence Calibration $\to$ Clinical Abstention Gate $\to$ Safety Layer $\to$ Referral.
2. **Multilingual-First (12 Indian Languages):** English, Hindi, Marathi, Bengali, Tamil, Telugu, Malayalam, Kannada, Gujarati, Punjabi, Assamese, and Odia.
3. **Interactive Symptom Triage:** Differential condition education, duration and severity scoring, and immediate red-flag detection.
4. **Medication & Contraindication Safety:** Multi-drug interaction verification, retinoid/steroid safety checks, and pregnancy contraindication flags.
5. **Traditional & Ayurvedic Wellness:** Dosha balance, seasonal regimens (Ritucharya), and evidence-informed herbal advice (Neem, Haridra, Manjistha, Kumari).
6. **Emergency & Red-Flag Escalation:** Rapid detection of severe cutaneous conditions (SJS/TEN, anaphylaxis) with one-click calling for **112 / 108 / 1075**.
7. **Healthcare Access Directory:** Information on District Civil Hospitals, Primary Health Centers, and official eSanjeevani Telemedicine.
8. **Low-Connectivity Resilience:** Offline LocalStorage caching for emergency protocols and first-aid guidelines.
9. **Multilingual Voice Assistance:** Web Speech API integration for audio reading of healthcare advice.
10. **Decoupled Model Store:** Isolated `backend/model_store/` with safe abstention when weights are not present.

---

## 🏗️ Architecture Overview

```
Derma Sathi/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # Auth, Skin, Symptoms, Meds, Wellness, Emergency
│   │   ├── core/              # Config, Security (bcrypt/JWT), PHI-safe Logging
│   │   ├── db/                # PostgreSQL / SQLite fallback session & models
│   │   ├── models/            # User, ConsultationRecord, AuditLog
│   │   ├── schemas/           # Pydantic v2 validation contracts
│   │   ├── services/
│   │   │   └── skin_pipeline/ # 8-Stage CV & Safety Pipeline
│   │   └── main.py            # FastAPI Application Entrypoint
│   ├── model_store/           # Dedicated storage for trained ML model artifacts
│   ├── tests/                 # Pytest unit & integration test suite (20 tests)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # UI modules (Skin, Symptoms, Meds, Wellness, Emergency, Clinics)
│   │   ├── i18n/              # 12-language localization architecture
│   │   ├── services/          # API client, Web Speech API, Offline storage
│   │   ├── context/           # AuthContext (JWT management)
│   │   ├── types/             # TypeScript definitions
│   │   ├── App.tsx
│   │   └── index.css          # Vanilla CSS design system (HSL tokens)
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml         # Full multi-container stack orchestration
├── ARCHITECTURE.md            # In-depth architectural blueprint
├── TEAM_ROLES.md              # Team responsibility matrix
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Unit & Integration Tests (20 tests)
pytest tests/ -v

# Run Development Server
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check Endpoint: [http://localhost:8000/api/v1/health/status](http://localhost:8000/api/v1/health/status)

---

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Start local development server
npm run dev
```
- Open browser at: [http://localhost:5173](http://localhost:5173)

---

### 3. Docker Deployment
```bash
# Launch PostgreSQL, FastAPI Backend, and Nginx Frontend
docker-compose up --build
```

---

## 🧠 ML Model Integration Guide (For Arpit)
1. Train your skin classification model (e.g. EfficientNet on ISIC / Indian clinical skin datasets).
2. Export the trained model to ONNX or PyTorch format (`model.onnx` or `model.pt`).
3. Place model files in `backend/model_store/v1.0.0/` along with `metadata.json`.
4. Update `.env`:
   ```bash
   DERMASATHI_MODEL_PATH="backend/model_store/v1.0.0/model.onnx"
   DERMASATHI_MODEL_METADATA="backend/model_store/v1.0.0/metadata.json"
   ```
5. The `PlugAndPlaySkinModel` automatically picks up the model and runs the 8-stage pipeline without altering any API endpoints!

---

## 👥 Team
- **Arpit:** ML Systems, Model Training, Evaluation & ML APIs
- **Anushka Krishnatry:** Backend Systems, Auth, PostgreSQL Database & APIs
- **Archana:** QA, Testing, Multilingual Content & Clinical Safety Verification
- **Arpit Saini:** Frontend Architecture, UI/UX, Integration & Presentation
