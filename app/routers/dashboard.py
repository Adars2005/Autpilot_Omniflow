"""
Dashboard API — fully dynamic metrics computed from real database records.

Data sources:
  - OrchestrationSession  → campaigns, budgets, statuses
  - OrchestrationLog      → agent execution traces, log counts
  - WorkbenchException    → human-in-the-loop escalations
  - Policy                → governance policy enforcement
  - Insight               → AI-generated intelligence items
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta

from ..core.database import get_db
from ..models.orchestration import OrchestrationSession, OrchestrationLog
from ..models.workbench import WorkbenchException
from ..models.policy import Policy
from ..models.insight import Insight

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ── Helpers ────────────────────────────────────────────────────────────────

def _pct_change(current: float, previous: float) -> dict:
    """Calculate trend info between two periods."""
    if previous == 0:
        if current > 0:
            return {"value": "+100%", "positive": True}
        return {"value": "—", "positive": True}
    change = ((current - previous) / previous) * 100
    sign = "+" if change >= 0 else ""
    return {"value": f"{sign}{change:.1f}%", "positive": change >= 0}


# ── GET /dashboard/metrics ─────────────────────────────────────────────────

@router.get("/metrics")
async def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Compute four KPI cards from real database data.

    1. Content Pipeline  — total campaigns launched (all time)
    2. Avg Engagement     — ratio of completed vs total campaigns (success rate %)
    3. Campaign ROI       — average budget efficiency across completed campaigns
    4. AI Autonomy        — % of campaigns that completed without human escalation
    """

    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    fourteen_days_ago = now - timedelta(days=14)

    # ── Total campaigns ──────────────────────────────────────────────────
    total_all_time = db.query(OrchestrationSession).count()
    total_this_week = (
        db.query(OrchestrationSession)
        .filter(OrchestrationSession.created_at >= seven_days_ago)
        .count()
    )
    total_last_week = (
        db.query(OrchestrationSession)
        .filter(
            OrchestrationSession.created_at >= fourteen_days_ago,
            OrchestrationSession.created_at < seven_days_ago,
        )
        .count()
    )

    # ── Completed campaigns ──────────────────────────────────────────────
    completed_all = (
        db.query(OrchestrationSession)
        .filter(OrchestrationSession.status == "completed")
        .count()
    )
    completed_this_week = (
        db.query(OrchestrationSession)
        .filter(
            OrchestrationSession.status == "completed",
            OrchestrationSession.created_at >= seven_days_ago,
        )
        .count()
    )
    completed_last_week = (
        db.query(OrchestrationSession)
        .filter(
            OrchestrationSession.status == "completed",
            OrchestrationSession.created_at >= fourteen_days_ago,
            OrchestrationSession.created_at < seven_days_ago,
        )
        .count()
    )

    # ── Paused (escalated) campaigns ─────────────────────────────────────
    paused_all = (
        db.query(OrchestrationSession)
        .filter(OrchestrationSession.status == "paused")
        .count()
    )

    # ── Budget totals ────────────────────────────────────────────────────
    total_budget = (
        db.query(func.sum(OrchestrationSession.budget)).scalar() or 0
    )
    completed_budget = (
        db.query(func.sum(OrchestrationSession.budget))
        .filter(OrchestrationSession.status == "completed")
        .scalar()
        or 0
    )

    # ── Total execution logs (agent interactions) ────────────────────────
    total_logs = db.query(OrchestrationLog).count()
    logs_this_week = (
        db.query(OrchestrationLog)
        .filter(OrchestrationLog.created_at >= seven_days_ago)
        .count()
    )
    logs_last_week = (
        db.query(OrchestrationLog)
        .filter(
            OrchestrationLog.created_at >= fourteen_days_ago,
            OrchestrationLog.created_at < seven_days_ago,
        )
        .count()
    )

    # ── Workbench exceptions ─────────────────────────────────────────────
    pending_exceptions = (
        db.query(WorkbenchException)
        .filter(WorkbenchException.status == "pending")
        .count()
    )
    total_exceptions = db.query(WorkbenchException).count()

    # ── Active policies ──────────────────────────────────────────────────
    active_policies = (
        db.query(Policy).filter(Policy.is_active == True).count()
    )

    # ── AI Insights ──────────────────────────────────────────────────────
    total_insights = db.query(Insight).count()

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # KPI 1: Content Pipeline — total campaigns launched
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    content_pipeline = {
        "value": total_all_time,
        "trend": _pct_change(total_this_week, total_last_week),
    }

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # KPI 2: Engagement — campaign completion rate %
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    engagement_current = (
        round((completed_this_week / total_this_week) * 100)
        if total_this_week > 0
        else 0
    )
    engagement_prev = (
        round((completed_last_week / total_last_week) * 100)
        if total_last_week > 0
        else 0
    )
    engagement_all = (
        round((completed_all / total_all_time) * 100)
        if total_all_time > 0
        else 0
    )
    engagement = {
        "value": engagement_all,
        "trend": _pct_change(engagement_current, engagement_prev),
    }

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # KPI 3: Campaign ROI — average budget per completed campaign
    #         Higher completion-to-budget ratio = better ROI
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if total_budget > 0 and completed_all > 0:
        roi_value = round((completed_budget / total_budget) * 100)
    else:
        roi_value = 0
    roi = {
        "value": roi_value,
        "trend": _pct_change(completed_this_week, completed_last_week),
    }

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # KPI 4: AI Autonomy — % of campaigns not requiring human escalation
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if total_all_time > 0:
        autonomy_value = round(
            ((total_all_time - paused_all) / total_all_time) * 100
        )
    else:
        autonomy_value = 0
    autonomy = {
        "value": autonomy_value,
        "trend": {
            "value": (
                f"{paused_all} escalated"
                if paused_all > 0
                else "No escalations"
            ),
            "positive": paused_all == 0,
        },
    }

    return {
        "content_pipeline": content_pipeline,
        "engagement": engagement,
        "roi": roi,
        "autonomy": autonomy,
        # Extended stats for potential future dashboard widgets
        "_detail": {
            "total_campaigns": total_all_time,
            "completed_campaigns": completed_all,
            "paused_campaigns": paused_all,
            "total_budget": total_budget,
            "total_agent_logs": total_logs,
            "pending_exceptions": pending_exceptions,
            "total_exceptions": total_exceptions,
            "active_policies": active_policies,
            "total_insights": total_insights,
        },
    }


# ── GET /dashboard/activity ────────────────────────────────────────────────

@router.get("/activity")
async def get_dashboard_activity(db: Session = Depends(get_db)):
    """
    Build a 7-day activity chart from real database timestamps.

    Three data series:
      - sessions  → campaigns launched per day
      - success   → campaigns completed per day
      - aiCalls   → agent log entries per day (proxy for AI interactions)
    """
    today = datetime.utcnow().date()
    day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    # Build 7-day window (today is the last day)
    days = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        days.append(d)

    result = []
    for d in days:
        next_day = d + timedelta(days=1)

        # Campaigns launched on this day
        sessions = (
            db.query(OrchestrationSession)
            .filter(
                cast(OrchestrationSession.created_at, Date) == d,
            )
            .count()
        )

        # Campaigns completed on this day
        success = (
            db.query(OrchestrationSession)
            .filter(
                OrchestrationSession.status == "completed",
                cast(OrchestrationSession.updated_at, Date) == d,
            )
            .count()
        )

        # Agent log entries on this day (proxy for AI calls)
        ai_calls = (
            db.query(OrchestrationLog)
            .filter(
                cast(OrchestrationLog.created_at, Date) == d,
            )
            .count()
        )

        result.append({
            "name": day_labels[d.weekday()],
            "date": d.isoformat(),
            "sessions": sessions,
            "success": success,
            "aiCalls": ai_calls,
        })

    return result


# ── GET /dashboard/summary ─────────────────────────────────────────────────

@router.get("/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    A comprehensive summary endpoint combining all platform stats.
    Useful for reporting and admin overview pages.
    """
    total_campaigns = db.query(OrchestrationSession).count()
    completed = (
        db.query(OrchestrationSession)
        .filter(OrchestrationSession.status == "completed")
        .count()
    )
    running = (
        db.query(OrchestrationSession)
        .filter(OrchestrationSession.status == "running")
        .count()
    )
    paused = (
        db.query(OrchestrationSession)
        .filter(OrchestrationSession.status == "paused")
        .count()
    )
    failed = (
        db.query(OrchestrationSession)
        .filter(OrchestrationSession.status == "failed")
        .count()
    )

    total_budget = (
        db.query(func.sum(OrchestrationSession.budget)).scalar() or 0
    )
    avg_budget = (
        db.query(func.avg(OrchestrationSession.budget)).scalar() or 0
    )

    total_logs = db.query(OrchestrationLog).count()
    unique_agents = (
        db.query(OrchestrationLog.agent_name)
        .distinct()
        .filter(OrchestrationLog.agent_name.isnot(None))
        .count()
    )

    total_exceptions = db.query(WorkbenchException).count()
    pending_exceptions = (
        db.query(WorkbenchException)
        .filter(WorkbenchException.status == "pending")
        .count()
    )
    resolved_exceptions = (
        db.query(WorkbenchException)
        .filter(WorkbenchException.status.in_(["approved", "rejected"]))
        .count()
    )

    active_policies = (
        db.query(Policy).filter(Policy.is_active == True).count()
    )
    total_policies = db.query(Policy).count()

    total_insights = db.query(Insight).count()

    # Recent campaigns (last 5)
    recent_campaigns = (
        db.query(OrchestrationSession)
        .order_by(OrchestrationSession.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "campaigns": {
            "total": total_campaigns,
            "completed": completed,
            "running": running,
            "paused": paused,
            "failed": failed,
            "completion_rate": (
                round((completed / total_campaigns) * 100)
                if total_campaigns > 0
                else 0
            ),
        },
        "budget": {
            "total_allocated": total_budget,
            "average_per_campaign": round(avg_budget),
        },
        "agents": {
            "total_log_entries": total_logs,
            "unique_agents_used": unique_agents,
        },
        "workbench": {
            "total_exceptions": total_exceptions,
            "pending": pending_exceptions,
            "resolved": resolved_exceptions,
        },
        "governance": {
            "active_policies": active_policies,
            "total_policies": total_policies,
        },
        "intelligence": {
            "total_insights": total_insights,
        },
        "recent_campaigns": [
            {
                "id": c.id,
                "name": c.campaign_name,
                "budget": c.budget,
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in recent_campaigns
        ],
    }
