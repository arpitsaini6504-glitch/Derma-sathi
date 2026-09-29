# DERMASATHIAI Security Review & Threat Assessment

**Document Version:** 1.0.0  
**Target Environment:** FastAPI Backend (`/api/v1`) & React Client (`dermasathi-frontend`)  
**Scope:** Healthcare Application Security, HIPAA/DISHA Privacy Compliance, Safe ML Integration  

---

## 1. Executive Summary

This security review audits the DERMASATHIAI system against critical web application vulnerabilities (OWASP Top 10) and healthcare-specific data protection standards (DISHA - Digital Information Security in Healthcare Act, India, and HIPAA guidelines). 

The application implements a defense-in-depth security model:
- **Zero Raw Pixel Logging:** Patient dermatological photos and biometric data are never written to system logs.
- **Fail-Safe Abstention:** Machine learning pipelines abstain safely with structured codes rather than leaking uncalibrated or synthetic medical findings.
- **Dual-Tier Upload Verification:** File uploads are checked at the HTTP transport boundary and re-validated via byte-level magic number inspection.

---

## 2. Comprehensive Security Assessment (15 Focus Areas)

### 2.1 Environment Variables & Configuration
- **Implemented Protections:**
  - Configuration is centrally managed via Pydantic Settings (`backend/app/core/config.py`).
  - Sensitive environment files (`.env`, `.env.local`, `*.env`) are strictly excluded in `.gitignore`.
  - Automated field validator (`validate_secret_key`) prevents deployment in production with the default development secret key (`"change-in-production"`).
- **Remaining Risks:**
  - In local development, `.env` file must be guarded against accidental copying to public repositories.
- **Future Production Requirements:**
  - Inject secrets via an external secrets manager (AWS Secrets Manager, HashiCorp Vault, or GCP Secret Manager) rather than static files.

---

### 2.2 Secret Handling & Cryptography
- **Implemented Protections:**
  - Password hashing utilizes **salted bcrypt** (`bcrypt.gensalt()`, `bcrypt.hashpw()`).
  - Access tokens are signed JWTs with explicit algorithm pinning (`HS256`) and automated expiration timestamps (`exp`).
  - Tokens are verified cryptographically in `decode_access_token()`; malformed or forged tokens immediately trigger `401 Unauthorized`.
- **Remaining Risks:**
  - Single secret key used for both session tokens and internal HMAC.
- **Future Production Requirements:**
  - Transition to asymmetric public/private key pairs (`RS256` or `EdDSA`) so client-facing verification does not require private key distribution.
  - Implement automated token revocation / blacklisting in Redis for instant logout.

---

### 2.3 Cross-Origin Resource Sharing (CORS)
- **Implemented Protections:**
  - `CORSMiddleware` is configured in `backend/app/main.py`.
  - Permitted origins are parsed from an explicit whitelist (`settings.cors_origins_list`), defaulting strictly to verified local development ports (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`).
  - Wildcard `*` origins are prohibited when `allow_credentials=True`.
- **Remaining Risks:**
  - Misconfiguration in staging environments if developers add wide wildcards.
- **Future Production Requirements:**
  - Pin production domain (e.g. `https://dermasathi.ai`) and subdomain routing in deployment configuration.

---

### 2.4 Authentication Boundaries
- **Implemented Protections:**
  - Dependency-injected authentication via `OAuth2PasswordBearer` in `backend/app/api/v1/endpoints/auth.py`.
  - Clear separation between:
    - **Public Triage:** Unregistered emergency triage (`/symptoms/check`, `/emergency/assess`, `/health/status`) to ensure patients in immediate medical crisis are never blocked by a login wall.
    - **Protected Clinical Records:** Patient profile (`/auth/me`), consultation histories, and future medical document storage require verified Bearer JWT tokens.
- **Remaining Risks:**
  - Long token lifetime (default 24 hours).
- **Future Production Requirements:**
  - Short-lived access tokens (15–30 minutes) combined with sliding refresh tokens and device fingerprinting.

---

### 2.5 Authorization & Access Control
- **Implemented Protections:**
  - Role-based attributes (`patient`, `clinician`, `admin`) are defined on the `User` database model.
  - `PUT /api/v1/auth/me` scopes profile updates strictly to `current_user.id`, preventing Insecure Direct Object Reference (IDOR) attacks.
- **Remaining Risks:**
  - Administrative endpoints will require strict RBAC enforcement as clinician features expand.
- **Future Production Requirements:**
  - Granular Policy-Based Access Control (PBAC) ensuring doctors can only access consultation records assigned to their care roster.

---

### 2.6 File Upload Validation
- **Implemented Protections:**
  - Multipart upload boundary validates incoming MIME type against permitted image formats (`image/jpeg`, `image/png`, `image/webp`).
  - Reject non-image or executable payloads before processing pipeline ingestion.

---

### 2.7 Image Size & Dimensional Limits
- **Implemented Protections:**
  - Maximum upload size strictly enforced at `10 MB` (`settings.MAX_UPLOAD_SIZE_BYTES`).
  - Payloads exceeding 10MB receive immediate `413 Request Entity Too Large`.
  - Zero-byte and truncated uploads under 100 bytes receive `400 Bad Request` to prevent empty resource allocation.
  - Preprocessing gate checks physical pixel dimensions ($\ge 180 \times 180$px) to prevent tiny denial-of-service decompression bombs.

---

### 2.8 Content & Magic-Byte Validation (Anti-Spoofing)
- **Implemented Protections:**
  - `FileValidator` (`backend/app/ml/preprocessing/validator.py`) inspects raw file header bytes:
    - `JPEG`: Magic bytes `b"\xFF\xD8\xFF"`
    - `PNG`: Magic bytes `b"\x89PNG\r\n\x1a\n"`
    - `WEBP`: Magic bytes `b"RIFF"` + `"WEBP"`
  - Completely defeats MIME-spoofing where malicious shell scripts or executables are renamed with `.jpg` extensions.

---

### 2.9 Temporary File Handling & Lifecycle Safety
- **Implemented Protections:**
  - Temporary files utilize `tempfile.NamedTemporaryFile(delete=False, suffix=suffix)` in OS-managed temp directories.
  - **Guaranteed Cleanup:** File deletion is wrapped in a strict `try ... finally` block ensuring `os.remove(temp_file_path)` executes even if downstream inference or validation crashes.
  - Original uploaded images are processed in-memory or as ephemeral temp files; raw biometric pixels are never permanently written to application disks.

---

### 2.10 Path Traversal Protection
- **Implemented Protections:**
  - User-supplied filenames are never used to construct target file system paths.
  - Extension extraction applies `os.path.basename` and validates extensions strictly against the permitted whitelist (`.jpg`, `.jpeg`, `.png`, `.webp`).
  - Path traversal sequences (`../`, `..\`, `%2e%2e%2f`) are stripped and neutralized.

---

### 2.11 Error Handling & Information Disclosure
- **Implemented Protections:**
  - Global FastAPI exception handler (`@app.exception_handler(Exception)` in `backend/app/main.py`) catches unhandled exceptions.
  - Returns sanitized, uniform error responses (`INTERNAL_SERVER_ERROR`).
  - Internal tracebacks, server paths, database credentials, and library versions are completely suppressed from client-facing responses.

---

### 2.12 Logging & Protected Health Information (PHI) Redaction
- **Implemented Protections:**
  - Custom `HealthcareSafetyFilter` in `backend/app/core/logging.py` monitors all log streams and automatically scrubs:
    - **Passwords:** `password: [REDACTED_PASSWORD]`
    - **Authentication Tokens:** `token: [REDACTED_TOKEN]`
    - **Bearer JWTs:** `Bearer [REDACTED_JWT_TOKEN]`
    - **API Keys & Secrets:** `[REDACTED_KEY]`
    - **Base64 & Binary Images:** `[IMAGE_BINARY_STRIPPED]`, `[JPEG_BINARY_PAYLOAD_STRIPPED]`, `[PNG_BINARY_PAYLOAD_STRIPPED]`
    - **Phone Numbers:** `[PHONE_REDACTED]`
    - **Email Addresses:** `[EMAIL_MASKED]`
    - **Patient Reports & Histories:** `[PATIENT_REPORT_TEXT_REDACTED]`
- **Healthcare Rule Enforced:**
  - Patient biometric images and confidential medical histories are never output to console logs or text files.

---

### 2.13 Sensitive Data Exposure Prevention
- **Implemented Protections:**
  - Consultation database records store triage metadata, risk tiers, and clinical red flags, but **do not store raw image bytes**.
  - Patient biometric EXIF metadata (including private camera GPS coordinates and device identifiers) is automatically stripped during image decoding (`ImageOps.exif_transpose` without EXIF retention).

---

### 2.14 Rate Limiting Architecture
- **Current Architecture:**
  - The API structure is decoupled to support reverse-proxy rate limiting (Nginx / Cloudflare) at edge routers.
- **Production Target Architecture:**
  - Implement Redis-backed token bucket rate limiting on high-resource endpoints:
    - `POST /api/v1/auth/login`: Maximum 5 requests/minute per IP (prevents credential stuffing).
    - `POST /api/v1/auth/register`: Maximum 3 requests/hour per IP.
    - `POST /api/v1/skin/analyze`: Maximum 10 requests/minute per user (mitigates model inference exhaustion).
    - `POST /api/v1/symptoms/check`: Maximum 20 requests/minute per user.

---

### 2.15 API Input Validation & Type Safety
- **Implemented Protections:**
  - All incoming JSON payloads are validated through Pydantic v2 schemas (`UserCreate`, `UserLogin`, `SymptomCheckRequest`, `MedicationCheckRequest`, `EmergencyAssessmentRequest`).
  - Numerical inputs have strict range boundaries (`ge=0`, `le=100`).
  - Booleans and enumerated values enforce type safety, rejecting malformed injections before reaching database queries or clinical evaluation logic.

---

## 3. Summary of Implemented Protections vs. Future Requirements

| Security Domain | Current Status | Implemented Protection | Future Production Requirement |
| :--- | :--- | :--- | :--- |
| **Secrets & Keys** | Verified | Salted bcrypt, JWT HS256, production key check | External Vault / KMS key rotation |
| **CORS Policy** | Verified | Explicit origin whitelist, no wildcards | Environment-specific DNS pinning |
| **Authentication** | Verified | Bearer JWT, emergency public exemptions | Refresh token rotation, SMS OTP / Passkeys |
| **Upload Safety** | Verified | Magic bytes verification, 10MB limit | ClamAV antivirus / malware stream scanner |
| **File Lifecycle** | Verified | Ephemeral temp files, guaranteed deletion | In-memory RAM-disk container processing |
| **Path Traversal** | Verified | Basename sanitization, extension whitelist | Strict containerized read-only root FS |
| **Error Handling** | Verified | Global handler, suppressed stack traces | Centralized Sentry error monitoring |
| **PHI Redaction** | Verified | Custom regex filter for logs (tokens, images) | Automated DLP (Data Loss Prevention) pipeline |
| **Rate Limiting** | Planned | Ingress/gateway rate-limiting ready | Redis-backed token bucket middleware |
| **Data Retention** | Verified | No raw images stored in database | Automated data lifecycle purging (DISHA) |

---

## 4. Compliance & Verification Checklist

- [x] All 42 automated tests passing in backend test suite.
- [x] Passwords hashed with salted bcrypt.
- [x] Sensitive tokens, keys, and image byte streams redacted in logger.
- [x] Ephemeral upload files guaranteed cleaned up in `finally` blocks.
- [x] Path traversal sanitized using `os.path.basename` and extension whitelist.
- [x] Global exception handler prevents stack trace leakage.
- [x] Frontend headers transmit localized preferences without exposing auth secrets.
