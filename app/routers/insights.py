from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.insight import Insight
from app.schemas.marketing import InsightCreate, InsightResponse

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/", response_model=List[InsightResponse])
def get_insights(db: Session = Depends(get_db)):
    return db.query(Insight).order_by(Insight.created_at.desc()).all()


@router.post("/", response_model=InsightResponse)
def create_insight(insight: InsightCreate, db: Session = Depends(get_db)):
    db_insight = Insight(**insight.dict())
    db.add(db_insight)
    db.commit()
    db.refresh(db_insight)
    return db_insight


@router.post("/analyze", response_model=InsightResponse)
def analyze_insights(db: Session = Depends(get_db)):
    """
    Use Gemini to generate a real AI insight based on marketing platform context.
    The Gemini model generates structured JSON that maps directly to our Insight model.
    """
    # Pull real platform context from the DB to give Gemini useful data
    from app.models.orchestration import OrchestrationSession, OrchestrationLog
    from app.models.workbench import WorkbenchException
    from app.models.policy import Policy
    from sqlalchemy import func

    total_campaigns = db.query(OrchestrationSession).count()
    completed = db.query(OrchestrationSession).filter(OrchestrationSession.status == "completed").count()
    paused = db.query(OrchestrationSession).filter(OrchestrationSession.status == "paused").count()
    failed = db.query(OrchestrationSession).filter(OrchestrationSession.status == "failed").count()
    total_budget = db.query(func.sum(OrchestrationSession.budget)).scalar() or 0
    total_logs = db.query(OrchestrationLog).count()
    pending_exceptions = db.query(WorkbenchException).filter(WorkbenchException.status == "pending").count()
    active_policies = db.query(Policy).filter(Policy.is_active == True).count()

    context = f"""
    Platform statistics:
    - Total campaigns: {total_campaigns}
    - Completed campaigns: {completed}
    - Paused/escalated campaigns: {paused}
    - Failed campaigns: {failed}
    - Total budget allocated: ${total_budget:,}
    - Total agent log entries: {total_logs}
    - Pending workbench exceptions: {pending_exceptions}
    - Active governance policies: {active_policies}
    """

    prompt = f"""
    You are an AI analyst for an autonomous marketing orchestration platform.
    Analyze the following real platform data and generate ONE actionable insight.
    
    {context}
    
    Based on this data, identify a pattern, anomaly, or recommendation.
    Consider: campaign success rates, budget efficiency, agent activity levels,
    policy coverage, escalation rates, and operational efficiency.
    
    Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
    {{
        "type": "anomaly",
        "severity": "warning",
        "title": "Short descriptive title",
        "description": "1-2 sentence detailed description of the insight based on the data",
        "data": {{"key": "value", "key2": "value2"}},
        "suggested_action": "What the user should do about it",
        "action_type": "investigate",
        "confidence": 0.85,
        "is_demo": "false"
    }}
    
    Rules:
    - "type" must be one of: "pattern", "anomaly", "recommendation", "trend", "alert"
    - "severity" must be one of: "info", "warning", "critical"
    - "action_type" must be one of: "investigate", "create_policy", "review_transaction", "schedule_maintenance", "review_duplicate"
    - "confidence" must be between 0.0 and 1.0
    - "data" should contain 2-4 relevant metrics from the platform stats
    - Make the insight specific and actionable based on the actual numbers provided
    - Do NOT wrap in markdown code blocks. Return raw JSON only.
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        # Clean up any markdown wrapping
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        insight_data = json.loads(raw_text)

        # Validate required fields exist
        required_fields = ["type", "severity", "title"]
        for field in required_fields:
            if field not in insight_data:
                raise ValueError(f"Missing required field: {field}")

        # Ensure data field is a dict
        if "data" in insight_data and not isinstance(insight_data["data"], dict):
            insight_data["data"] = {}

        # Ensure is_demo is a string
        if "is_demo" in insight_data:
            insight_data["is_demo"] = str(insight_data["is_demo"]).lower()

        # Save to DB
        db_insight = Insight(
            type=insight_data.get("type", "recommendation"),
            severity=insight_data.get("severity", "info"),
            title=insight_data.get("title", "AI Insight"),
            description=insight_data.get("description"),
            data=insight_data.get("data"),
            suggested_action=insight_data.get("suggested_action"),
            action_type=insight_data.get("action_type"),
            confidence=insight_data.get("confidence"),
            is_demo=insight_data.get("is_demo", "false"),
        )
        db.add(db_insight)
        db.commit()
        db.refresh(db_insight)
        return db_insight
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}\nRaw text: {raw_text}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {e}")
    except Exception as e:
        print(f"Gemini error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate AI insight: {str(e)}")


@router.delete("/{insight_id}")
def delete_insight(insight_id: str, db: Session = Depends(get_db)):
    db_insight = db.query(Insight).filter(Insight.id == insight_id).first()
    if not db_insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    db.delete(db_insight)
    db.commit()
    return {"message": "Insight deleted successfully"}
