from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False)
    endpoint = Column(String(255), nullable=False)
    status_code = Column(Integer, nullable=False)
    ip_hash = Column(String(64), nullable=True)  # SHA-256 hashed IP for privacy compliance
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
