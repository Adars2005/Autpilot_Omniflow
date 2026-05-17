from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.policy import Policy
from app.schemas.marketing import PolicyCreate, PolicyResponse, PolicyUpdate

router = APIRouter(prefix="/policies", tags=["Policies"])

@router.get("/", response_model=List[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    return db.query(Policy).order_by(Policy.priority.desc()).all()

import os
import json
import google.generativeai as genai
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

class TranslateRequest(BaseModel):
    natural_language: str

@router.post("/translate")
def translate_policy(req: TranslateRequest):
    prompt = f"""
    You are an AI policy translator. Parse the following natural language business rule into a JSON DSL format.
    The rule is: "{req.natural_language}"
    
    Return ONLY a valid JSON object with the following structure:
    {{
        "conditions": [
            {{"field": "amount", "operator": "less_than", "value": 500}}
        ],
        "actions": [
            {{"type": "approve", "value": "auto-approve"}}
        ],
        "match_mode": "all"
    }}
    
    Infer the fields, operators, and actions from the text. Valid operators: equals, not_equals, contains, greater_than, less_than.
    Do not wrap the JSON in Markdown backticks. Return raw JSON.
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()
            
        dsl = json.loads(raw_text)
        return {"dsl": dsl, "confidence": 0.95}
    except Exception as e:
        print(f"Gemini error: {e}")
        return {
            "dsl": {
                "conditions": [{"field": "parsing_error", "operator": "equals", "value": "fallback"}],
                "actions": [{"type": "notify", "value": "admin"}],
                "match_mode": "all"
            },
            "confidence": 0.50
        }

@router.post("/", response_model=PolicyResponse)
def create_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    db_policy = Policy(**policy.dict())
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.put("/{policy_id}", response_model=PolicyResponse)
def update_policy(policy_id: str, policy: PolicyUpdate, db: Session = Depends(get_db)):
    db_policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not db_policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    update_data = policy.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_policy, key, value)
        
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.delete("/{policy_id}")
def delete_policy(policy_id: str, db: Session = Depends(get_db)):
    db_policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not db_policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    db.delete(db_policy)
    db.commit()
    return {"message": "Policy deleted successfully"}
