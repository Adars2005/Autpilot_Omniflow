from sqlalchemy import Column, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class WorkbenchException(Base):
    __tablename__ = "workbench_exceptions"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    exception_type = Column(String, nullable=False) # 'low_confidence', 'policy_conflict', 'missing_data'
    entity_id = Column(String, nullable=True) # e.g., 'campaign_123'
    ai_recommendation = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    status = Column(String, default="pending") # 'pending', 'approved', 'rejected', 'modified'
    context_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
