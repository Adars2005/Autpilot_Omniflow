import asyncio
import datetime
import json
import os
import re
import uuid
from typing import Any, Dict, List

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.core.database import get_db
from app.models.orchestration import OrchestrationLog, OrchestrationSession
from app.models.workbench import WorkbenchException

router = APIRouter(prefix="/orchestration", tags=["Orchestration"])

SUPERVITY_API_URL = os.getenv(
    "SUPERVITY_API_URL",
    "https://auto-workflow-api.supervity.ai/api/v1/workflow-runs/execute/stream",
)
SUPERVITY_BEARER_TOKEN = os.getenv("SUPERVITY_BEARER_TOKEN")
SUPERVITY_WORKFLOW_ID = os.getenv(
    "SUPERVITY_WORKFLOW_ID", "019e260c-55a4-7000-b356-8cf1b37cda6c"
)


def _ts() -> str:
    return datetime.datetime.now().strftime("%H:%M:%S")


def _save_log(
    db: Session,
    session_id: str,
    message: str,
    agent_name: str = "System",
    level: str = "INFO",
) -> None:
    db.add(
        OrchestrationLog(
            id=str(uuid.uuid4()),
            session_id=session_id,
            log_level=level,
            message=message,
            agent_name=agent_name,
        )
    )
    db.commit()


def _context(session: OrchestrationSession) -> Dict[str, Any]:
    return dict(session.context_data or {})


def _append_output(
    db: Session,
    session: OrchestrationSession,
    agent_name: str,
    summary: str,
    details: Dict[str, Any] | None = None,
) -> None:
    context = _context(session)
    outputs = list(context.get("agent_outputs") or [])
    outputs.append(
        {
            "agent_name": agent_name,
            "summary": summary,
            "details": details or {},
            "created_at": datetime.datetime.utcnow().isoformat(),
        }
    )
    context["agent_outputs"] = outputs
    session.context_data = context
    flag_modified(session, "context_data")
    db.add(session)
    db.commit()


def _try_json(value: str) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


# ---------------------------------------------------------------------------
#  Supervity SSE event classification
# ---------------------------------------------------------------------------
# The Supervity stream sends three types of messages (all wrapped in
# {"content": ...}):
#
# 1. STEP LIFECYCLE  — content is a dict with "stepId", "status", "kind":"step"
#    e.g. {"content":{"stepId":"cmo_orchestrate_research","status":"running","attempt":1,"kind":"step",...}}
#
# 2. PROGRESS TEXT   — content is a string, optionally with a stepId
#    e.g. {"content":"Configuring \"Audience Intelligence Research\"","stepId":"cmo_orchestrate_research",...}
#
# 3. CONTENT OUTPUT  — a step completes with "status":"completed" and carries
#    outputs.output / outputs.displayData.html with the actual generated content
#
# We want the terminal to show human-readable progress for (1) and (2),
# and only collect real content from (3) for the Generated Content panel.
# ---------------------------------------------------------------------------

_STEP_LABELS: Dict[str, str] = {
    "cmo_orchestrate_research": "Audience Intelligence Research",
    "cmo_orchestrate_strategy": "Campaign Strategy",
    "cmo_orchestrate_content": "Content Creation",
    "cmo_orchestrate_channels": "Channel Planning",
    "cmo_orchestrate_budget": "Budget Allocation",
    "cmo_orchestrate_review": "Final Review",
    "cmo_orchestrate_report": "Report Generation",
}


def _step_label(step_id: str) -> str:
    return _STEP_LABELS.get(step_id, step_id.replace("_", " ").replace("cmo orchestrate ", "").title())


def _classify_supervity_event(data_value: str):
    """Parse a single Supervity SSE data value.

    Returns a tuple: (event_type, display_line, content_asset_or_none)
    event_type: "status" | "progress" | "content" | "raw"
    """
    parsed = _try_json(data_value)
    if not isinstance(parsed, dict):
        return "raw", data_value.strip(), None

    content = parsed.get("content")

    # --- Case 1: content is a string → progress message ---
    if isinstance(content, str):
        step_id = parsed.get("stepId", "")
        label = _step_label(step_id) if step_id else ""
        prefix = f"[{label}] " if label else ""
        return "progress", f"{prefix}{content}", None

    # --- Case 2: content is a dict → step lifecycle / content output ---
    if isinstance(content, dict):
        step_id = content.get("stepId", "")
        status = content.get("status", "")
        attempt = content.get("attempt")
        label = _step_label(step_id) if step_id else "Workflow"
        outputs = content.get("outputs") if isinstance(content.get("outputs"), dict) else {}

        # Build human-readable status line
        attempt_str = f" (attempt {attempt})" if attempt and attempt > 1 else ""
        status_emoji = {
            "running": "⚙️",
            "completed": "✅",
            "failed": "⚠️",
        }.get(status, "📋")
        display = f"{status_emoji} {label} — {status}{attempt_str}"

        # Check for actual content in completed steps
        if status == "completed" and outputs:
            raw_output = (outputs.get("output") or "").strip()
            display_html = ""
            display_data = outputs.get("displayData")
            if isinstance(display_data, dict):
                display_html = (display_data.get("html") or "").strip()

            # We need actual content (not just empty strings)
            if raw_output or display_html:
                asset = {
                    "step_id": step_id,
                    "title": label or f"Output from {step_id}",
                    "output_text": raw_output,
                    "output_html": display_html,
                    "raw": content,
                }
                return "content", display, asset

        return "status", display, None

    return "raw", data_value[:300], None


def _parse_html_sections(html: str) -> List[Dict[str, Any]]:
    """Parse the Supervity 'Content Workbench' HTML into platform sections.

    The HTML typically contains headers like:
      <h2>Professional Messaging (LinkedIn)</h2>
      <p>content...</p>
      <h2>Social Media Post (Instagram)</h2>
      <p>content...</p>
    """
    if not html:
        return []

    sections: List[Dict[str, Any]] = []

    # Try splitting by <h2>, <h3>, <strong> headers that denote platform sections
    # Match patterns like "Professional Messaging (LinkedIn)" or "WhatsApp Message"
    header_pattern = re.compile(
        r'<(?:h[1-4]|strong)[^>]*>\s*(.*?)\s*</(?:h[1-4]|strong)>',
        re.IGNORECASE | re.DOTALL,
    )

    # Split the HTML by headers
    parts = header_pattern.split(html)

    # parts[0] is text before the first header (campaign summary etc.)
    # parts[1] is the first header text, parts[2] is content after first header
    # parts[3] is the second header text, parts[4] is content after second header, etc.

    # Extract the campaign summary from the intro section
    intro = parts[0].strip() if parts else ""
    if intro:
        # Clean HTML tags from intro
        intro_clean = re.sub(r'<[^>]+>', ' ', intro).strip()
        intro_clean = re.sub(r'\s+', ' ', intro_clean).strip()
        # Skip if intro is just whitespace or the "Content Workbench" label
        if intro_clean and len(intro_clean) > 20 and "content workbench" not in intro_clean.lower():
            sections.append({
                "platform": "Overview",
                "title": "Campaign Summary",
                "body": intro_clean,
                "html": intro,
            })

    # Platform detection patterns
    platform_keywords = {
        "linkedin": {"platform": "LinkedIn", "icon": "linkedin"},
        "instagram": {"platform": "Instagram", "icon": "instagram"},
        "whatsapp": {"platform": "WhatsApp", "icon": "messageCircle"},
        "twitter": {"platform": "Twitter/X", "icon": "twitter"},
        "x.com": {"platform": "Twitter/X", "icon": "twitter"},
        "facebook": {"platform": "Facebook", "icon": "facebook"},
        "email": {"platform": "Email", "icon": "mail"},
        "blog": {"platform": "Blog", "icon": "fileText"},
        "press": {"platform": "Press Release", "icon": "newspaper"},
        "sms": {"platform": "SMS", "icon": "smartphone"},
        "youtube": {"platform": "YouTube", "icon": "youtube"},
    }

    for i in range(1, len(parts) - 1, 2):
        header_text = re.sub(r'<[^>]+>', '', parts[i]).strip()
        body_html = parts[i + 1].strip() if (i + 1) < len(parts) else ""

        # Clean the body to plain text
        body_text = re.sub(r'<br\s*/?>', '\n', body_html)
        body_text = re.sub(r'<[^>]+>', '', body_text).strip()
        body_text = re.sub(r'\n{3,}', '\n\n', body_text)

        if not body_text or len(body_text) < 5:
            continue

        # Detect platform from header
        detected = None
        header_lower = header_text.lower()
        for keyword, info in platform_keywords.items():
            if keyword in header_lower:
                detected = info
                break

        sections.append({
            "platform": detected["platform"] if detected else "Content",
            "icon": detected["icon"] if detected else "fileText",
            "title": header_text,
            "body": body_text,
            "html": body_html,
        })

    # If no sections were parsed (HTML is not section-based), return the whole thing
    if not sections:
        full_text = re.sub(r'<br\s*/?>', '\n', html)
        full_text = re.sub(r'<[^>]+>', '', full_text).strip()
        full_text = re.sub(r'\s+', ' ', full_text).strip()
        if full_text and len(full_text) > 10:
            sections.append({
                "platform": "Content",
                "icon": "fileText",
                "title": "Generated Content",
                "body": full_text,
                "html": html,
            })

    return sections


def _content_text(value: Any) -> str:
    """Extract readable text from an arbitrarily nested value."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, list):
        return "\n".join(filter(None, (_content_text(item) for item in value)))
    if isinstance(value, dict):
        preferred_keys = [
            "headline", "title", "subject", "caption",
            "body", "copy", "content", "message",
            "description", "call_to_action", "cta",
            "output", "result",
        ]
        parts = []
        for key in preferred_keys:
            if key in value:
                text = _content_text(value[key])
                if text:
                    parts.append(text)
        if parts:
            return "\n".join(dict.fromkeys(parts))
        return "\n".join(
            filter(None, (_content_text(item) for item in value.values()))
        )
    return str(value)


def _build_content_generation(
    content_assets: List[Dict[str, Any]],
    raw_lines: List[str],
) -> Dict[str, Any]:
    """Build the structured content generation payload from parsed assets.

    Merges all completed-step outputs, parses any HTML into platform sections,
    and produces a payload the frontend can render directly.
    """
    # Collect all HTML and text outputs from completed steps
    all_html = ""
    all_text = ""
    for asset in content_assets:
        html = asset.get("output_html", "")
        text = asset.get("output_text", "")
        if html:
            all_html += html + "\n"
        if text:
            all_text += text + "\n"

    # Parse the combined HTML into platform sections
    platform_sections = _parse_html_sections(all_html)

    # If no HTML sections but we have plain text, create a single section
    if not platform_sections and all_text.strip():
        platform_sections = [{
            "platform": "Content",
            "icon": "fileText",
            "title": "Generated Content",
            "body": all_text.strip(),
            "html": "",
        }]

    n_sections = len(platform_sections)
    platforms = [s["platform"] for s in platform_sections if s.get("platform") != "Overview"]

    return {
        "agent_name": "Content Generation Agent",
        "summary": (
            f"Generated content for {len(platforms)} platform{'s' if len(platforms) != 1 else ''}: {', '.join(platforms)}."
            if platforms
            else "Workflow completed; content output is being processed."
        ),
        "assets": platform_sections,
        "html_content": all_html.strip(),
        "raw_lines": raw_lines[-50:],
        "generated_at": datetime.datetime.utcnow().isoformat(),
    }


def _build_report(session: OrchestrationSession) -> Dict[str, Any]:
    context = _context(session)
    outputs: List[Dict[str, Any]] = list(context.get("agent_outputs") or [])
    budget = int(session.budget or 0)
    audience = context.get("target_audience") or "Target audience"
    goal = context.get("campaign_goal") or "Campaign growth"
    brief = context.get("campaign_brief") or ""

    return {
        "title": "Campaign Execution Report",
        "campaign_name": session.campaign_name,
        "status": "completed",
        "budget": budget,
        "target_audience": audience,
        "goal": goal,
        "executive_summary": (
            f"{session.campaign_name} completed end-to-end for {audience}. "
            f"The agent chain aligned the brief to the goal of {goal}, generated execution "
            "outputs, and prepared the campaign for launch review."
        ),
        "metrics": {
            "agent_steps": len(outputs),
            "estimated_reach": max(1200, budget * 3),
            "projected_roi": f"{min(420, 145 + (budget // 1000) * 4)}%",
            "readiness_score": min(98, 78 + len(outputs) * 4),
        },
        "deliverables": [
            output.get("summary", "") for output in outputs if output.get("summary")
        ],
        "recommendations": [
            "Approve final creative variants after brand review.",
            "Launch with a 15% budget holdback for optimization after the first performance read.",
            "Monitor audience response daily and refresh messaging if engagement drops.",
        ],
        "brief": brief,
        "generated_at": datetime.datetime.utcnow().isoformat(),
    }


def _persist_report(db: Session, session: OrchestrationSession) -> Dict[str, Any]:
    context = _context(session)
    report = _build_report(session)
    context["final_report"] = report
    session.context_data = context
    session.status = "completed"
    session.updated_at = datetime.datetime.utcnow()
    flag_modified(session, "context_data")
    db.add(session)
    db.commit()
    return report


def _session_payload(session: OrchestrationSession) -> Dict[str, Any]:
    return {
        "id": session.id,
        "campaign_name": session.campaign_name,
        "budget": session.budget,
        "status": session.status,
        "context_data": session.context_data or {},
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
    }


@router.post("/launch")
async def launch_campaign(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    budget = int(body.get("budget") or 0)
    campaign_name = body.get("campaign_name") or "Untitled Campaign"
    session_id = str(uuid.uuid4())
    status = "running"

    if budget > 50000:
        status = "paused"
        db.add(
            WorkbenchException(
                id=str(uuid.uuid4()),
                title=f"Brand Safety: High Budget Approval Required for {campaign_name}",
                description=(
                    f"Campaign budget of ${budget:,} exceeds the $50,000 auto-approval "
                    "threshold. Executive approval required before agents can proceed."
                ),
                exception_type="policy_violation",
                entity_id=session_id,
                ai_recommendation=(
                    "Review the strategic brief and approve if the budget aligns with campaign goals. "
                    "The Orchestrator can resume after approval."
                ),
                confidence_score=0.99,
                status="pending",
                context_data=body,
            )
        )

    session = OrchestrationSession(
        id=session_id,
        campaign_name=campaign_name,
        budget=budget,
        status=status,
        context_data={**body, "agent_outputs": [], "final_report": None},
    )
    db.add(session)
    db.commit()

    return {"session_id": session_id, "status": status, "session": _session_payload(session)}


@router.post("/resume/{session_id}")
async def resume_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(OrchestrationSession).filter(OrchestrationSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "running"
    session.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"session_id": session_id, "status": "running"}


@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = (
        db.query(OrchestrationSession)
        .order_by(OrchestrationSession.created_at.desc())
        .all()
    )
    return [_session_payload(session) for session in sessions]


@router.get("/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(OrchestrationSession).filter(OrchestrationSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _session_payload(session)


@router.get("/sessions/{session_id}/logs")
def get_session_logs(session_id: str, db: Session = Depends(get_db)):
    logs = (
        db.query(OrchestrationLog)
        .filter(OrchestrationLog.session_id == session_id)
        .order_by(OrchestrationLog.created_at.asc())
        .all()
    )
    return [
        {
            "id": log.id,
            "message": log.message,
            "agent_name": log.agent_name,
            "log_level": log.log_level,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.get("/logs/{session_id}")
async def stream_orchestration_logs(session_id: str, db: Session = Depends(get_db)):
    session = db.query(OrchestrationSession).filter(OrchestrationSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_generator():
        def fmt(message: str) -> str:
            return f"data: {message}\n\n"

        context = _context(session)
        target_audience = context.get("target_audience") or "audience"
        campaign_goal = context.get("campaign_goal") or "campaign growth"
        supervity_output_lines: List[str] = []
        content_assets: List[Dict[str, Any]] = []

        steps = [
            ("Orchestrator", f"[{_ts()}] [Orchestrator] Campaign brief received: {session.campaign_name}"),
            ("Governance", f"[{_ts()}] [Governance] Evaluating enterprise execution policies..."),
        ]

        for agent_name, message in steps:
            _save_log(db, session_id, message, agent_name)
            yield fmt(message)
            await asyncio.sleep(0.2)

        if session.status == "paused":
            messages = [
                (
                    "Brand Safety",
                    "WARN",
                    f"[{_ts()}] [Brand Safety] Policy exception: budget ${session.budget:,} exceeds $50,000.",
                ),
                (
                    "Exception Handler",
                    "ERROR",
                    f"[{_ts()}] [Exception Handler] Escalated to AI Workbench for approval.",
                ),
                (
                    "Orchestrator",
                    "WARN",
                    f"[{_ts()}] [Orchestrator] Execution paused. Waiting for human-in-the-loop approval.",
                ),
            ]
            for agent_name, level, message in messages:
                _save_log(db, session_id, message, agent_name, level)
                yield fmt(message)
            return

        planned_outputs = [
            (
                "Trend Intelligence",
                f"Market signals analyzed for {target_audience}; strongest angle is urgency plus measurable business impact.",
                {"audience": target_audience, "confidence": 0.91},
            ),
            (
                "Content Strategy",
                f"Messaging variants prepared for the goal: {campaign_goal}.",
                {"variants": ["value-led", "proof-led", "urgency-led"]},
            ),
            (
                "Media Planner",
                "Budget split drafted across awareness, retargeting, and conversion campaigns.",
                {"awareness": 45, "retargeting": 25, "conversion": 30},
            ),
        ]

        for agent_name, summary, details in planned_outputs:
            message = f"[{_ts()}] [{agent_name}] {summary}"
            _save_log(db, session_id, message, agent_name)
            _append_output(db, session, agent_name, summary, details)
            yield fmt(message)
            await asyncio.sleep(0.25)

        if SUPERVITY_API_URL and SUPERVITY_BEARER_TOKEN:
            form_data = {"workflowId": SUPERVITY_WORKFLOW_ID}
            for key, value in context.items():
                if key not in {"agent_outputs", "final_report"}:
                    form_data[f"inputs[{key}]"] = str(value)

            try:
                async with httpx.AsyncClient(
                    timeout=httpx.Timeout(180.0, connect=15.0)
                ) as client:
                    response = await client.send(
                        client.build_request(
                            "POST",
                            SUPERVITY_API_URL,
                            headers={
                                "Authorization": f"Bearer {SUPERVITY_BEARER_TOKEN}",
                                "x-source": "v1",
                            },
                            data=form_data,
                        ),
                        stream=True,
                    )

                    if response.status_code != 200:
                        body = await response.aread()
                        message = f"[{_ts()}] [Supervity] Workflow returned HTTP {response.status_code}."
                        _save_log(db, session_id, message, "Supervity", "ERROR")
                        yield fmt(message)
                        detail = body.decode("utf-8", errors="replace")[:500]
                        _append_output(db, session, "Supervity", "External workflow failed.", {"detail": detail})
                    else:
                        message = f"[{_ts()}] [Content Generation Agent] Connected to content workflow stream."
                        _save_log(db, session_id, message, "Content Generation Agent")
                        yield fmt(message)

                        buffer = ""
                        current_event = ""
                        stream_done = False
                        max_deadline = asyncio.get_event_loop().time() + 180

                        async for chunk in response.aiter_bytes():
                            if asyncio.get_event_loop().time() > max_deadline:
                                warn = f"[{_ts()}] [Content Generation Agent] Stream timed out after 180s; proceeding with collected output."
                                _save_log(db, session_id, warn, "Content Generation Agent", "WARN")
                                yield fmt(warn)
                                break

                            buffer += chunk.decode("utf-8", errors="replace")
                            while "\n" in buffer:
                                raw_line, buffer = buffer.split("\n", 1)
                                raw_line = raw_line.strip()

                                if not raw_line:
                                    current_event = ""
                                    continue

                                if raw_line.startswith("event:"):
                                    current_event = raw_line[6:].strip().lower()
                                    continue

                                if raw_line.startswith("data:"):
                                    data_value = raw_line[5:].strip()
                                else:
                                    data_value = raw_line

                                if data_value.upper() in {"[DONE]", "DONE"}:
                                    stream_done = True
                                    break

                                # Skip ping keepalives silently
                                if current_event == "ping":
                                    continue
                                ping_parsed = _try_json(data_value)
                                if isinstance(ping_parsed, dict) and ping_parsed.get("content") == "ping":
                                    continue

                                # --- Classify and display ---
                                supervity_output_lines.append(data_value)
                                event_type, display_text, asset = _classify_supervity_event(data_value)

                                display_line = f"[{_ts()}] [Content Generation Agent] {display_text}"
                                _save_log(db, session_id, display_line, "Content Generation Agent")
                                yield fmt(display_line)

                                if asset:
                                    content_assets.append(asset)

                            if stream_done:
                                break

                        # Handle any remaining data in buffer
                        remainder = buffer.strip()
                        if remainder and remainder.upper() not in {"[DONE]", "DONE"}:
                            is_ping = False
                            if remainder.startswith("event:") and "ping" in remainder.lower():
                                is_ping = True
                            rem_parsed = _try_json(remainder)
                            if isinstance(rem_parsed, dict) and rem_parsed.get("content") == "ping":
                                is_ping = True
                            if not is_ping:
                                supervity_output_lines.append(remainder)
                                event_type, display_text, asset = _classify_supervity_event(remainder)
                                display_line = f"[{_ts()}] [Content Generation Agent] {display_text}"
                                _save_log(db, session_id, display_line, "Content Generation Agent")
                                yield fmt(display_line)
                                if asset:
                                    content_assets.append(asset)

                        await response.aclose()

                        # Build structured content from collected assets
                        content_generation = _build_content_generation(content_assets, supervity_output_lines)
                        context = _context(session)
                        context["content_generation"] = content_generation
                        session.context_data = context
                        flag_modified(session, "context_data")
                        db.add(session)
                        db.commit()
                        _append_output(
                            db,
                            session,
                            "Content Generation Agent",
                            content_generation["summary"],
                            {
                                "content_generation": content_generation,
                                "lines": supervity_output_lines[-25:],
                            },
                        )

                        if content_assets:
                            done_msg = f"[{_ts()}] [Content Generation Agent] Stream complete — {len(content_assets)} content asset(s) generated."
                        elif supervity_output_lines:
                            done_msg = f"[{_ts()}] [Content Generation Agent] Stream complete — workflow ran {len(supervity_output_lines)} steps but no final content assets yet."
                        else:
                            done_msg = f"[{_ts()}] [Content Generation Agent] Stream ended with no output; workflow may still be pending on Supervity."
                        _save_log(db, session_id, done_msg, "Content Generation Agent")
                        yield fmt(done_msg)

            except Exception as exc:
                message = f"[{_ts()}] [Content Generation Agent] External workflow unavailable: {str(exc)}"
                _save_log(db, session_id, message, "Content Generation Agent", "WARN")
                yield fmt(message)
                _append_output(
                    db,
                    session,
                    "Content Generation Agent",
                    "External workflow was skipped; local agent outputs are ready.",
                    {"reason": str(exc)},
                )
        else:
            summary = "External workflow credentials not configured; completed with built-in campaign agents."
            message = f"[{_ts()}] [Execution] {summary}"
            _save_log(db, session_id, message, "Execution", "WARN")
            _append_output(db, session, "Execution", summary)
            yield fmt(message)

        message = f"[{_ts()}] [Report Generator] Compiling final campaign report..."
        _save_log(db, session_id, message, "Report Generator")
        yield fmt(message)
        await asyncio.sleep(0.2)

        report = _persist_report(db, session)
        report_lines = [
            "===== CAMPAIGN EXECUTION REPORT =====",
            f"Campaign: {report['campaign_name']}",
            f"Audience: {report['target_audience']}",
            f"Goal: {report['goal']}",
            f"Projected ROI: {report['metrics']['projected_roi']}",
            f"Readiness Score: {report['metrics']['readiness_score']}%",
            "Status: COMPLETED",
        ]
        for line in report_lines:
            _save_log(db, session_id, line, "Report Generator")
            yield fmt(line)
            await asyncio.sleep(0.05)

        message = f"[{_ts()}] [Orchestrator] Workflow completed successfully."
        _save_log(db, session_id, message, "Orchestrator")
        yield fmt(message)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
