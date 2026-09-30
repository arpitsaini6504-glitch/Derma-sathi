import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "DERMASATHIAI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "dermasathi-secure-development-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./dermasathi.db"

    # Google Gemini AI Integration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"

    # ML Model Store configuration
    DERMASATHI_MODEL_PATH: str = "backend/model_store/model.keras"
    DERMASATHI_CLASS_MAPPING_PATH: str = "backend/model_store/class_mapping.json"
    DERMASATHI_MODEL_METADATA: str = "backend/model_store/skin_ai_policy.json"

    # Clinical Safety Thresholds
    QUALITY_BLUR_THRESHOLD: float = 60.0  # Laplacian variance threshold
    CONFIDENCE_ABSTENTION_THRESHOLD: float = 0.70  # Abstain below 70% confidence
    OOD_UNCERTAINTY_THRESHOLD: float = 0.65  # Abstain if entropy/uncertainty is high

    # Upload limitations
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return self.CORS_ORIGINS

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if os.getenv("ENVIRONMENT", "").lower() == "production" and "change-in-production" in v:
            raise ValueError("CRITICAL SECURITY ERROR: Insecure default SECRET_KEY in production! Provide a cryptographically secure key via .env or environment variable.")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
