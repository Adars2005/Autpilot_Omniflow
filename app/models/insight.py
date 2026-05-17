from sqlalchemy import Column, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Insight(Base):
    __tablename__ = "insights"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    type = Column(String, nullable=False)            # 'pattern', 'anomaly', 'recommendation'
    severity = Column(String, nullable=False)          # 'info', 'warning', 'critical'
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    data = Column(JSON, nullable=True)                 # arbitrary key-value data
    suggested_action = Column(String, nullable=True)
    action_type = Column(String, nullable=True)        # 'investigate', 'create_policy', etc.
    confidence = Column(Float, nullable=True)
    is_demo = Column(String, default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
