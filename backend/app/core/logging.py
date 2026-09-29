import logging
import re
import sys

# Redaction patterns for sensitive healthcare data & credentials
REDACTION_PATTERNS = [
    (re.compile(r'(password\s*[:=]\s*)([^\s,]+)', re.IGNORECASE), r'\1[REDACTED_SECRET]'),
    (re.compile(r'(token\s*[:=]\s*)([^\s,]+)', re.IGNORECASE), r'\1[REDACTED_TOKEN]'),
    (re.compile(r'(data:image\/[a-zA-Z]+;base64,)[A-Za-z0-9+/=]+', re.IGNORECASE), r'\1[IMAGE_BINARY_STRIPPED]'),
    (re.compile(r'(\b\d{10}\b)', re.IGNORECASE), r'[PHONE_REDACTED]'),
    (re.compile(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', re.IGNORECASE), r'[EMAIL_MASKED]'),
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
