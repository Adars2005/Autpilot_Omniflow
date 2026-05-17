from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.workbench import WorkbenchException
from app.models.orchestration import OrchestrationSession
from app.schemas.marketing import WorkbenchExceptionCreate, WorkbenchExceptionResponse, WorkbenchExceptionUpdate

router = APIRouter(prefix="/workbench", tags=["Workbench"])

@router.get("/", response_model=List[WorkbenchExceptionResponse])
def get_exceptions(db: Session = Depends(get_db)):
    return db.query(WorkbenchException).order_by(WorkbenchException.created_at.desc()).all()

@router.post("/", response_model=WorkbenchExceptionResponse)
def create_exception(exc: WorkbenchExceptionCreate, db: Session = Depends(get_db)):
    db_exc = WorkbenchException(**exc.dict())
    db.add(db_exc)
    db.commit()
    db.refresh(db_exc)
    return db_exc

@router.put("/{exc_id}", response_model=WorkbenchExceptionResponse)
def update_exception(exc_id: str, exc: WorkbenchExceptionUpdate, db: Session = Depends(get_db)):
    db_exc = db.query(WorkbenchException).filter(WorkbenchException.id == exc_id).first()
    if not db_exc:
        raise HTTPException(status_code=404, detail="Exception not found")
    
    update_data = exc.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_exc, key, value)
        
    if exc.status and exc.status != "pending":
        db_exc.resolved_at = datetime.utcnow()
        
        # Human-in-the-Loop Recovery: Resume paused orchestration session
        if exc.status == "approved" and db_exc.entity_id:
            session = db.query(OrchestrationSession).filter(OrchestrationSession.id == db_exc.entity_id).first()
            if session and session.status == "paused":
                session.status = "running"
                session.updated_at = datetime.utcnow()
                context = dict(session.context_data or {})
                context["human_approval"] = {
                    "exception_id": db_exc.id,
                    "approved_at": datetime.utcnow().isoformat(),
                    "status": "approved",
                }
                session.context_data = context
        
    db.commit()
    db.refresh(db_exc)
    return db_exc
