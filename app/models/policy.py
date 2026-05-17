from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    natural_language = Column(String, nullable=True)
    policy_type = Column(String, nullable=False) # 'logical' or 'natural_language'
    dsl = Column(JSON, nullable=True)
    entity_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=10)
    tags = Column(JSON, nullable=True) # list of strings
    execution_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
