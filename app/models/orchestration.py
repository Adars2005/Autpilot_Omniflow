from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base

class OrchestrationSession(Base):
    __tablename__ = "orchestration_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    campaign_name = Column(String, nullable=False)
    budget = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="running")  # running, paused, completed, failed
    context_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    logs = relationship("OrchestrationLog", back_populates="session", cascade="all, delete-orphan")

class OrchestrationLog(Base):
    __tablename__ = "orchestration_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String, ForeignKey("orchestration_sessions.id", ondelete="CASCADE"), nullable=False)
    log_level = Column(String, nullable=False, default="INFO")
    message = Column(String, nullable=False)
    agent_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("OrchestrationSession", back_populates="logs")
