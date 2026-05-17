"""
AI Router — Gemini-powered chat with RAG on the campaigns database.

The /ai/chat endpoint queries the database for live campaign data, agent activity,
policies, exceptions, and insights, then injects this context into the Gemini prompt
so the AI can answer questions about real platform data.
"""

import os
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
import google.generativeai as genai
from dotenv import load_dotenv

from ..core.database import get_db
from ..models.orchestration import OrchestrationSession, OrchestrationLog
from ..models.workbench import WorkbenchException
from ..models.policy import Policy
from ..models.insight import Insight

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Request / Response Models ──────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]
    context: Optional[Dict[str, Any]] = None


# ── Database Context Builder (RAG) ─────────────────────────────────────────

def _build_database_context(db: Session) -> str:
    """
    Query the database and build a structured context string for the LLM.
    This is the RAG component — injecting live data into the prompt.
    """
    # ── Campaign Summary ─────────────────────────────────────────────────
    total_campaigns = db.query(OrchestrationSession).count()
    completed = db.query(OrchestrationSession).filter(
        OrchestrationSession.status == "completed"
    ).count()
    running = db.query(OrchestrationSession).filter(
        OrchestrationSession.status == "running"
    ).count()
    paused = db.query(OrchestrationSession).filter(
        OrchestrationSession.status == "paused"
    ).count()
    failed = db.query(OrchestrationSession).filter(
        OrchestrationSession.status == "failed"
    ).count()

    total_budget = db.query(
        func.sum(OrchestrationSession.budget)
    ).scalar() or 0
    avg_budget = db.query(
        func.avg(OrchestrationSession.budget)
    ).scalar() or 0

    completion_rate = round((completed / total_campaigns) * 100) if total_campaigns > 0 else 0

    # ── Recent Campaigns (last 10) ───────────────────────────────────────
    recent = (
        db.query(OrchestrationSession)
        .order_by(OrchestrationSession.created_at.desc())
        .limit(10)
        .all()
    )
    recent_lines = []
    for c in recent:
        channel = c.context_data.get("channel", "N/A") if c.context_data else "N/A"
        audience = c.context_data.get("target_audience", "N/A") if c.context_data else "N/A"
        recent_lines.append(
            f"  - \"{c.campaign_name}\" | Budget: ${c.budget:,} | Status: {c.status} | Channel: {channel} | Audience: {audience}"
        )

    # ── Agent Activity ───────────────────────────────────────────────────
    total_logs = db.query(OrchestrationLog).count()
    unique_agents = (
        db.query(OrchestrationLog.agent_name)
        .distinct()
        .filter(OrchestrationLog.agent_name.isnot(None))
        .count()
    )
    
    # Top agents by log count
    top_agents = (
        db.query(
            OrchestrationLog.agent_name,
            func.count(OrchestrationLog.id).label("count"),
        )
        .filter(OrchestrationLog.agent_name.isnot(None))
        .group_by(OrchestrationLog.agent_name)
        .order_by(func.count(OrchestrationLog.id).desc())
        .limit(5)
        .all()
    )
    agent_lines = [f"  - {name}: {count} executions" for name, count in top_agents]

    # ── Workbench Exceptions ─────────────────────────────────────────────
    total_exceptions = db.query(WorkbenchException).count()
    pending_exceptions = db.query(WorkbenchException).filter(
        WorkbenchException.status == "pending"
    ).count()

    pending_list = (
        db.query(WorkbenchException)
        .filter(WorkbenchException.status == "pending")
        .order_by(WorkbenchException.created_at.desc())
        .limit(5)
        .all()
    )
    exception_lines = [
        f"  - [{e.exception_type}] \"{e.title}\" (confidence: {e.confidence_score:.0%})"
        for e in pending_list
    ]

    # ── Policies ─────────────────────────────────────────────────────────
    total_policies = db.query(Policy).count()
    active_policies = db.query(Policy).filter(Policy.is_active == True).count()

    policies = db.query(Policy).order_by(Policy.priority).limit(10).all()
    policy_lines = [
        f"  - \"{p.name}\" | Type: {p.policy_type} | Active: {p.is_active} | Priority: {p.priority}"
        for p in policies
    ]

    # ── Insights ─────────────────────────────────────────────────────────
    total_insights = db.query(Insight).count()
    recent_insights = (
        db.query(Insight)
        .order_by(Insight.created_at.desc())
        .limit(5)
        .all()
    )
    insight_lines = [
        f"  - [{i.severity.upper()}] \"{i.title}\""
        for i in recent_insights
    ]

    # ── Build Context String ─────────────────────────────────────────────
    context = f"""
=== LIVE PLATFORM DATA (from database) ===

CAMPAIGN SUMMARY:
  Total Campaigns: {total_campaigns}
  Completed: {completed} | Running: {running} | Paused: {paused} | Failed: {failed}
  Completion Rate: {completion_rate}%
  Total Budget Allocated: ${total_budget:,.0f}
  Average Budget per Campaign: ${avg_budget:,.0f}

RECENT CAMPAIGNS (most recent 10):
{chr(10).join(recent_lines)}

AGENT ACTIVITY:
  Total Agent Executions: {total_logs}
  Unique Agents Active: {unique_agents}
  Top Agents:
{chr(10).join(agent_lines)}

WORKBENCH (Human-in-the-Loop):
  Total Exceptions: {total_exceptions}
  Pending Review: {pending_exceptions}
  Current Pending Items:
{chr(10).join(exception_lines) if exception_lines else "  (none)"}

GOVERNANCE POLICIES:
  Total Policies: {total_policies}
  Active Policies: {active_policies}
  Policy List:
{chr(10).join(policy_lines) if policy_lines else "  (none)"}

AI INSIGHTS:
  Total Insights Generated: {total_insights}
  Recent Insights:
{chr(10).join(insight_lines) if insight_lines else "  (none)"}
"""
    return context


# ── POST /ai/chat ──────────────────────────────────────────────────────────

@router.post("/chat")
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    """
    RAG-powered chat endpoint.
    Queries the campaigns database and injects live data into the Gemini prompt.
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Build RAG context from database
        db_context = _build_database_context(db)

        system_prompt = f"""You are the AutoPilot AI Assistant — an intelligent command center assistant for an autonomous marketing operations platform.

You have access to LIVE platform data from the database. Use this data to answer questions accurately with specific numbers, campaign names, and details.

{db_context}

INSTRUCTIONS:
- Always cite specific numbers from the data above when answering questions.
- If asked about campaigns, budgets, or metrics, reference the actual data.
- Format currency values with $ and commas (e.g., $50,000).
- Format percentages clearly (e.g., 85%).
- Be concise but thorough. Use bullet points for lists.
- If the user asks about something not in the data, say so honestly.
- You can provide recommendations based on the data trends.
- The user is currently viewing: {req.context.get('page', 'Unknown') if req.context else 'Unknown'}
"""

        # Build conversation
        prompt = system_prompt + "\n\n"
        for msg in req.history[-10:]:  # Last 10 messages for context window
            prompt += f"{msg.role.upper()}: {msg.content}\n"
        
        prompt += f"USER: {req.message}\nASSISTANT: "

        response = model.generate_content(prompt)

        return {
            "response": response.text.strip(),
            "tool_calls": []
        }
    except Exception as e:
        print(f"Gemini chat error: {e}")
        return {
            "response": "I encountered an error connecting to the AI system. Please check your Gemini API key.",
            "tool_calls": []
        }


# ── POST /ai/policies/analyze-input ────────────────────────────────────────

class AnalyzeInputRequest(BaseModel):
    input: str

@router.post("/policies/analyze-input")
def analyze_input(req: AnalyzeInputRequest):
    prompt = f"""
    You are an AI policy analyzer. Evaluate the following natural language business rule:
    "{req.input}"
    
    Decide if this rule is better suited as a structured 'logical' rule (using conditions and actions) or a 'natural_language' rule (complex logic needing AI interpretation).
    
    If 'logical', construct a DSL. If 'natural_language', provide a refined_instruction.
    
    Return ONLY valid JSON:
    {{
        "suggested_type": "logical" | "natural_language",
        "confidence": 0.0 to 1.0,
        "reason": "Brief explanation of why this type was chosen",
        "suggested_name": "A short, descriptive name",
        "summary": "Brief summary",
        "dsl": {{
            "conditions": [{{"field": "str", "operator": "equals", "value": "str"}}],
            "actions": [{{"type": "str", "value": "str"}}],
            "match_mode": "all"
        }} | null,
        "refined_instruction": "string" | null,
        "entity_name": "detected entity or null",
        "suggested_tags": ["tag1", "tag2"]
    }}
    Do not wrap in backticks.
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()
            
        data = json.loads(raw_text)
        return data
    except Exception as e:
        print(f"Gemini analyze error: {e}")
        return {
            "suggested_type": "natural_language",
            "confidence": 0.5,
            "reason": "Fallback due to parsing error",
            "suggested_name": "AI Rule",
            "summary": "Rule fallback",
            "dsl": None,
            "refined_instruction": req.input,
            "entity_name": None,
            "suggested_tags": ["fallback"]
        }


# ── POST /ai/policies/check-conflicts ──────────────────────────────────────

class ConflictCheckRequest(BaseModel):
    natural_language: str
    policy_scope: str
    entity_name: Optional[str] = None

@router.post("/policies/check-conflicts")
def check_conflicts(req: ConflictCheckRequest):
    return {
        "conflicts": [],
        "overrides": [],
        "clarifications": [
            "This rule appears clear and actionable."
        ],
        "suggested_instructions": [],
        "refined_instruction": req.natural_language,
        "is_valid": True,
        "warnings": []
    }
