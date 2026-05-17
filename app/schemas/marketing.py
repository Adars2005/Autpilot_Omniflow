from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

# Policy Schemas
class PolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    natural_language: Optional[str] = None
    policy_type: str
    dsl: Optional[Dict[str, Any]] = None
    entity_name: Optional[str] = None
    is_active: Optional[bool] = True
    priority: Optional[int] = 10
    tags: Optional[List[str]] = []

class PolicyCreate(PolicyBase):
    pass

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    natural_language: Optional[str] = None
    policy_type: Optional[str] = None
    dsl: Optional[Dict[str, Any]] = None
    entity_name: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    tags: Optional[List[str]] = None

class PolicyResponse(PolicyBase):
    id: str
    execution_count: int
    last_executed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Insight Schemas
class InsightBase(BaseModel):
    type: str
    severity: str
    title: str
    description: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    suggested_action: Optional[str] = None
    action_type: Optional[str] = None
    confidence: Optional[float] = None
    is_demo: Optional[str] = "false"

class InsightCreate(InsightBase):
    pass

class InsightResponse(InsightBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True


# Workbench Schemas
class WorkbenchExceptionBase(BaseModel):
    title: str
    description: str
    exception_type: str
    entity_id: Optional[str] = None
    ai_recommendation: Optional[str] = None
    confidence_score: Optional[float] = None
    status: Optional[str] = "pending"
    context_data: Optional[Dict[str, Any]] = None

class WorkbenchExceptionCreate(WorkbenchExceptionBase):
    pass

class WorkbenchExceptionUpdate(BaseModel):
    status: Optional[str] = None

class WorkbenchExceptionResponse(WorkbenchExceptionBase):
    id: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        orm_mode = True
