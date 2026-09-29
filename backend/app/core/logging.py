import logging
import re
import sys

# Redaction patterns for sensitive healthcare data & credentials
REDACTION_PATTERNS = [
    (re.compile(r'(password\s*[:=]\s*)([^\s,]+)', re.IGNORECASE), r'\1[REDACTED_PASSWORD]'),
    (re.compile(r'(token\s*[:=]\s*)([^\s,]+)', re.IGNORECASE), r'\1[REDACTED_TOKEN]'),
    (re.compile(r'(Bearer\s+)([A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_+/=]*)', re.IGNORECASE), r'\1[REDACTED_JWT_TOKEN]'),
    (re.compile(r'((?:api[_-]?key|secret|jwt_secret)\s*[:=]\s*)([^\s,]+)', re.IGNORECASE), r'\1[REDACTED_KEY]'),
    (re.compile(r'(data:image\/[a-zA-Z]+;base64,)[A-Za-z0-9+/=]+', re.IGNORECASE), r'\1[IMAGE_BINARY_STRIPPED]'),
    (re.compile(r"b'\\xff\\xd8\\xff[^\']*'", re.IGNORECASE), r"[JPEG_BINARY_PAYLOAD_STRIPPED]"),
    (re.compile(r"b'\\x89PNG[^\']*'", re.IGNORECASE), r"[PNG_BINARY_PAYLOAD_STRIPPED]"),
    (re.compile(r'(\b\d{10}\b)', re.IGNORECASE), r'[PHONE_REDACTED]'),
    (re.compile(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', re.IGNORECASE), r'[EMAIL_MASKED]'),
    (re.compile(r'(medical_report_text\s*[:=]\s*)([^\n]+)', re.IGNORECASE), r'\1[PATIENT_REPORT_TEXT_REDACTED]'),
    (re.compile(r'(patient_history\s*[:=]\s*)([^\n]+)', re.IGNORECASE), r'\1[PATIENT_HISTORY_REDACTED]')
]

class HealthcareSafetyFilter(logging.Filter):
    """
    Ensures Protected Health Information (PHI) and raw credentials
    never leak into production or development log outputs.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern, replacement in REDACTION_PATTERNS:
                record.msg = pattern.sub(replacement, record.msg)
        return True

def setup_logger(name: str = "dermasathi") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        handler.addFilter(HealthcareSafetyFilter())
        logger.addHandler(handler)
    return logger

logger = setup_logger()
