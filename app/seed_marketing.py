"""
Seed script — populates the database with rich synthetic data for hackathon demo.
Covers: Campaigns, Agent Logs, Workbench Exceptions, Insights, Policies
"""

import uuid
import sys
import os
import random
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.orchestration import OrchestrationSession, OrchestrationLog
from app.models.workbench import WorkbenchException
from app.models.insight import Insight
from app.models.policy import Policy

# ── Campaign Templates ────────────────────────────────────────────────────────

CAMPAIGN_NAMES = [
    "Q3 Product Launch — Social Blitz",
    "Summer Sale Email Sequence",
    "LinkedIn Thought Leadership Series",
    "Instagram Reels — Brand Story",
    "Google Ads — Retargeting Funnel",
    "Twitter Engagement Campaign",
    "YouTube Pre-Roll Ads — Awareness",
    "Blog Content Pipeline — SEO Push",
    "Influencer Collaboration — Tier 1",
    "Webinar Funnel — Enterprise Leads",
    "Newsletter Nurture — Onboarding",
    "Black Friday Preview Campaign",
    "Customer Referral Program",
    "App Store Optimization Sprint",
    "TikTok UGC Campaign",
    "PR Outreach — Product Update",
    "Partner Co-Marketing — Q3",
    "Retargeting — Cart Abandoners",
    "Brand Awareness — Display Network",
    "Holiday Season Pre-Launch",
    "Content Syndication — Medium + Dev.to",
    "Email A/B Test — Subject Lines",
    "Community Launch — Discord Server",
    "Competitive Battlecard Campaign",
    "Case Study Promotion — Enterprise",
]

AGENT_NAMES = [
    "Strategy Agent",
    "Content Writer Agent",
    "Analytics Agent",
    "Distribution Agent",
    "SEO Optimizer Agent",
    "Social Media Agent",
    "Budget Allocator Agent",
    "A/B Testing Agent",
    "Compliance Checker Agent",
    "Performance Monitor Agent",
]

LOG_MESSAGES = {
    "Strategy Agent": [
        "Analyzing target audience demographics for campaign",
        "Generated campaign strategy document with 4 phases",
        "Identified 3 key competitor campaigns to differentiate against",
        "Recommended budget allocation: 40% paid, 35% content, 25% influencer",
        "Strategy review complete — proceeding to content generation",
    ],
    "Content Writer Agent": [
        "Generated 5 headline variants for A/B testing",
        "Created email copy — 3 templates (promotional, educational, social proof)",
        "Blog post draft generated — 1,200 words with SEO keywords",
        "Social media copy pack ready: 10 posts across 3 platforms",
        "Ad copy generated for Google Ads (5 responsive search ads)",
    ],
    "Analytics Agent": [
        "Baseline metrics captured: CTR 2.1%, Conv 1.8%, CPA $42",
        "Predicted campaign ROI: 3.2x based on historical data",
        "Audience segmentation complete — 4 cohorts identified",
        "Performance forecast: estimated 12,000 impressions in week 1",
        "Weekly report generated — all KPIs trending positive",
    ],
    "Distribution Agent": [
        "Content scheduled across 4 channels for next 7 days",
        "Email batch queued: 15,000 recipients in 3 segments",
        "Social posts scheduled: Mon/Wed/Fri at optimal times",
        "Paid ad campaigns launched on Google and Meta",
        "Push notification triggered for app users in target cohort",
    ],
    "SEO Optimizer Agent": [
        "On-page SEO audit complete — 8 issues fixed",
        "Meta descriptions optimized for 12 landing pages",
        "Internal linking structure updated — +15 cross-links added",
        "Schema markup added for FAQ and How-To content",
        "Keyword gap analysis: 23 new opportunities identified",
    ],
    "Social Media Agent": [
        "Engagement analysis: Instagram Stories driving 3x more clicks",
        "Optimal posting schedule calculated for each platform",
        "Community responses drafted — 15 comment replies ready",
        "Hashtag strategy updated: removed 3 underperforming tags",
        "UGC curation: selected 8 customer posts for resharing",
    ],
    "Budget Allocator Agent": [
        "Budget rebalanced: shifted $2,000 from Display to Social",
        "Cost per acquisition within target at $38 (target: $45)",
        "Recommended increasing LinkedIn budget by 20%",
        "Flagged overspend on Twitter ads — paused underperforming set",
        "Monthly budget utilization: 67% spent, on track for target",
    ],
    "A/B Testing Agent": [
        "A/B test launched: Subject line variant A vs B (n=5,000 each)",
        "Test results: Variant B outperforms by 18% open rate",
        "CTA button test concluded — 'Get Started' wins over 'Learn More'",
        "Landing page test: long-form page converts 2.3x better",
        "New test initiated: pricing page layout experiment",
    ],
    "Compliance Checker Agent": [
        "Content reviewed — all posts comply with brand guidelines",
        "GDPR compliance check passed for email campaign",
        "Disclaimer added to financial product promotion",
        "Image alt-text audit: 3 missing descriptions added",
        "Legal review flagged: claim needs citation (forwarded to team)",
    ],
    "Performance Monitor Agent": [
        "Real-time dashboard updated with latest metrics",
        "Alert: CTR dropped below threshold on Google Ads group 3",
        "Weekly performance summary sent to stakeholders",
        "Anomaly detected: unusual spike in mobile traffic from India",
        "SLA compliance: 99.2% uptime across all campaign assets",
    ],
}

EXCEPTION_DATA = [
    {
        "title": "Budget Overrun Alert — Google Ads",
        "description": "The Google Ads campaign 'Q3 Product Launch' has exceeded its daily budget limit by 15%. The Budget Allocator Agent detected the overrun and paused bid adjustments.",
        "exception_type": "budget_overrun",
        "ai_recommendation": "Reduce maximum CPC bid by 20% and pause the lowest-performing ad group to bring spending back under control.",
        "confidence_score": 0.91,
    },
    {
        "title": "Content Policy Violation — Twitter Post",
        "description": "A scheduled tweet contains language that may violate Twitter's advertising policies regarding comparative claims without substantiation.",
        "exception_type": "policy_conflict",
        "ai_recommendation": "Remove the comparative claim or add a link to supporting data. Alternative copy has been generated.",
        "confidence_score": 0.85,
    },
    {
        "title": "Duplicate Audience Segment Detected",
        "description": "The Distribution Agent found a 72% overlap between 'Enterprise Decision Makers' and 'C-Suite Tech Leaders' segments, which may cause ad fatigue.",
        "exception_type": "data_quality",
        "ai_recommendation": "Merge the two segments and create exclusion rules to prevent duplicate impressions.",
        "confidence_score": 0.78,
    },
    {
        "title": "Low Confidence AI-Generated Copy",
        "description": "The Content Writer Agent generated email subject lines with confidence scores below 0.6. The topic involves sensitive financial projections.",
        "exception_type": "low_confidence",
        "ai_recommendation": "Route to a human copywriter for review. Three alternative subject lines have been prepared as starting points.",
        "confidence_score": 0.52,
    },
    {
        "title": "Platform API Rate Limit Warning",
        "description": "Instagram API returned a 429 (rate limit) error during scheduled post publishing. 3 of 8 posts were not published.",
        "exception_type": "platform_error",
        "ai_recommendation": "Reschedule the failed posts with 30-minute intervals. Consider upgrading to Business API tier for higher rate limits.",
        "confidence_score": 0.94,
    },
    {
        "title": "A/B Test Statistical Insignificance",
        "description": "The A/B test for landing page layout has been running for 5 days but has not reached statistical significance (p=0.23, target p<0.05).",
        "exception_type": "test_inconclusive",
        "ai_recommendation": "Extend the test duration by 7 days or increase traffic allocation to 50/50 split.",
        "confidence_score": 0.67,
    },
]


def seed_data():
    db = SessionLocal()
    now = datetime.utcnow()

    try:
        # ── Clear existing data for clean seed ────────────────────────────
        print("Clearing existing data...")
        db.query(OrchestrationLog).delete()
        db.query(OrchestrationSession).delete()
        db.query(WorkbenchException).delete()
        db.query(Insight).delete()
        # Don't delete policies — preserve user-created ones

        db.commit()

        # ══════════════════════════════════════════════════════════════════
        # 1. CAMPAIGNS (OrchestrationSession) — spread across 7 days
        # ══════════════════════════════════════════════════════════════════
        print("Seeding campaigns...")
        sessions = []
        statuses = ["completed", "completed", "completed", "completed", "running", "running", "paused", "failed"]
        
        for i, name in enumerate(CAMPAIGN_NAMES):
            days_ago = random.randint(0, 6)
            hours_ago = random.randint(0, 23)
            created = now - timedelta(days=days_ago, hours=hours_ago)
            
            status = random.choice(statuses)
            budget = random.choice([5000, 8000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000, 75000, 100000])

            # Completed campaigns have an updated_at that's after created_at
            updated = created + timedelta(hours=random.randint(2, 48)) if status == "completed" else created
            
            session = OrchestrationSession(
                id=str(uuid.uuid4()),
                campaign_name=name,
                budget=budget,
                status=status,
                context_data={
                    "channel": random.choice(["social", "email", "paid_ads", "content", "seo", "influencer"]),
                    "target_audience": random.choice(["enterprise", "smb", "consumer", "developer", "c-suite"]),
                    "region": random.choice(["North America", "Europe", "APAC", "Global"]),
                },
                created_at=created,
                updated_at=updated,
            )
            sessions.append(session)
            db.add(session)

        db.flush()  # Get IDs

        # ══════════════════════════════════════════════════════════════════
        # 2. AGENT LOGS — 4-8 logs per campaign
        # ══════════════════════════════════════════════════════════════════
        print("Seeding agent execution logs...")
        for session in sessions:
            num_logs = random.randint(4, 8)
            used_agents = random.sample(AGENT_NAMES, min(num_logs, len(AGENT_NAMES)))
            
            for j, agent in enumerate(used_agents):
                messages = LOG_MESSAGES.get(agent, ["Task executed successfully"])
                msg = random.choice(messages)
                log_time = session.created_at + timedelta(minutes=random.randint(5, 120) * (j + 1))
                
                db.add(OrchestrationLog(
                    id=str(uuid.uuid4()),
                    session_id=session.id,
                    log_level=random.choice(["INFO", "INFO", "INFO", "DEBUG", "WARNING"]),
                    message=msg,
                    agent_name=agent,
                    created_at=log_time,
                ))

        # ══════════════════════════════════════════════════════════════════
        # 3. WORKBENCH EXCEPTIONS
        # ══════════════════════════════════════════════════════════════════
        print("Seeding workbench exceptions...")
        exception_statuses = ["pending", "pending", "pending", "approved", "rejected", "modified"]
        for exc_data in EXCEPTION_DATA:
            days_ago = random.randint(0, 4)
            db.add(WorkbenchException(
                id=str(uuid.uuid4()),
                title=exc_data["title"],
                description=exc_data["description"],
                exception_type=exc_data["exception_type"],
                entity_id=random.choice(sessions).id,
                ai_recommendation=exc_data["ai_recommendation"],
                confidence_score=exc_data["confidence_score"],
                status=random.choice(exception_statuses),
                context_data={"source": "ai_agent", "priority": random.choice(["high", "medium", "low"])},
                created_at=now - timedelta(days=days_ago, hours=random.randint(0, 12)),
            ))

        # ══════════════════════════════════════════════════════════════════
        # 4. AI INSIGHTS
        # ══════════════════════════════════════════════════════════════════
        print("Seeding AI insights...")
        insight_data = [
            {
                "type": "pattern",
                "severity": "info",
                "title": "LinkedIn Posts with Questions Get 40% More Engagement",
                "description": "Analysis of 150+ posts shows that headlines framed as questions consistently outperform statements by 40% in engagement rate.",
                "action": "Create a policy to recommend question-format headlines for LinkedIn.",
            },
            {
                "type": "anomaly",
                "severity": "warning",
                "title": "Email Open Rates Dropped 28% This Week",
                "description": "Personalized subject lines are underperforming compared to last week. Possible cause: deliverability issues or inbox placement changes.",
                "action": "Investigate email deliverability and check spam filter reports.",
            },
            {
                "type": "recommendation",
                "severity": "info",
                "title": "Optimal Posting Time: Tuesdays 10AM-12PM",
                "description": "Cross-platform analysis shows Tuesday mornings generate 2.3x more impressions than other time slots for your audience.",
                "action": "Update social media scheduling to prioritize Tuesday mornings.",
            },
            {
                "type": "trend",
                "severity": "info",
                "title": "Video Content ROI 3.5x Higher Than Static Images",
                "description": "Over the past 30 days, video assets delivered 3.5x better ROI per dollar spent compared to static image ads.",
                "action": "Shift 20% of creative budget from static to video production.",
            },
            {
                "type": "anomaly",
                "severity": "critical",
                "title": "Google Ads CPA Exceeded Target by 45%",
                "description": "Cost per acquisition on 3 ad groups has spiked above the $45 target, currently averaging $65. Immediate action recommended.",
                "action": "Pause underperforming ad groups and reallocate budget to top performers.",
            },
            {
                "type": "recommendation",
                "severity": "info",
                "title": "Untapped Audience: Developer Community",
                "description": "Competitor analysis shows a gap in developer-focused content. Your product's API documentation could be a strong content pillar.",
                "action": "Launch a developer-focused blog series and API tutorial campaign.",
            },
        ]

        for ins in insight_data:
            db.add(Insight(
                id=str(uuid.uuid4()),
                type=ins["type"],
                severity=ins["severity"],
                title=ins["title"],
                description=ins["description"],
                suggested_action=ins["action"],
                confidence=round(random.uniform(0.7, 0.98), 2),
                created_at=now - timedelta(days=random.randint(0, 5), hours=random.randint(0, 12)),
            ))

        # ══════════════════════════════════════════════════════════════════
        # 5. POLICIES (only if none exist)
        # ══════════════════════════════════════════════════════════════════
        if db.query(Policy).count() == 0:
            print("Seeding policies...")
            db.add_all([
                Policy(
                    id="demo-001",
                    name="Require Brand Voice Review",
                    description="Require brand voice review for all LinkedIn posts before publishing.",
                    natural_language="If a post is scheduled for LinkedIn, route it to the marketing manager for brand voice review before it can be published.",
                    policy_type="natural_language",
                    entity_name="post",
                    priority=10,
                    tags=["social", "linkedin", "approval"],
                ),
                Policy(
                    id="demo-002",
                    name="Auto-Approve Standard Content",
                    description="Auto-approve social media posts that follow the approved template format.",
                    natural_language="If a post follows the standard weekly update template and contains no restricted keywords, auto-approve it.",
                    policy_type="logical",
                    dsl={"conditions": [{"field": "template_used", "operator": "eq", "value": "weekly_update"}], "actions": [{"type": "auto_approve"}], "match_mode": "all"},
                    entity_name="post",
                    priority=5,
                    tags=["social", "auto-approve"],
                ),
                Policy(
                    id="demo-003",
                    name="Budget Cap Enforcement",
                    description="Block campaigns that exceed the $50,000 budget threshold without VP approval.",
                    natural_language="Any campaign with a budget exceeding $50,000 must receive VP-level approval before launch.",
                    policy_type="logical",
                    dsl={"conditions": [{"field": "budget", "operator": "gt", "value": "50000"}], "actions": [{"type": "require_approval", "value": "VP Marketing"}], "match_mode": "all"},
                    entity_name="campaign",
                    priority=1,
                    tags=["budget", "approval", "governance"],
                ),
                Policy(
                    id="demo-004",
                    name="Mandatory CTA Link",
                    description="Never post content without a CTA link.",
                    natural_language="Every piece of outbound marketing content must contain a valid call-to-action link.",
                    policy_type="logical",
                    dsl={"conditions": [{"field": "has_cta_link", "operator": "eq", "value": "false"}], "actions": [{"type": "flag_review", "value": "Missing CTA link"}], "match_mode": "all"},
                    entity_name="content",
                    priority=20,
                    tags=["content", "validation"],
                ),
            ])

        db.commit()

        # ── Print summary ─────────────────────────────────────────────────
        total_campaigns = db.query(OrchestrationSession).count()
        total_logs = db.query(OrchestrationLog).count()
        total_exceptions = db.query(WorkbenchException).count()
        total_insights = db.query(Insight).count()
        total_policies = db.query(Policy).count()

        total_budget = db.query(
            __import__('sqlalchemy', fromlist=['func']).func.sum(OrchestrationSession.budget)
        ).scalar() or 0

        print("\n" + "=" * 60)
        print("  [OK] DATABASE SEEDED SUCCESSFULLY FOR HACKATHON DEMO")
        print("=" * 60)
        print(f"  Campaigns:    {total_campaigns}")
        print(f"  Agent Logs:   {total_logs}")
        print(f"  Exceptions:   {total_exceptions}")
        print(f"  Insights:     {total_insights}")
        print(f"  Policies:     {total_policies}")
        print(f"  Total Budget: ${total_budget:,.0f}")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"[ERROR] Error seeding data: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
