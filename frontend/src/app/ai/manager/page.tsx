'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface AgentOutput {
  agent_name: string
  summary: string
  details?: {
    content_generation?: ContentGeneration
    lines?: string[]
    [key: string]: unknown
  }
  created_at?: string
}

interface PlatformSection {
  platform: string
  icon?: string
  title: string
  body: string
  html?: string
}

interface ContentGeneration {
  agent_name: string
  summary: string
  assets: PlatformSection[]
  html_content?: string
  raw_lines?: string[]
  generated_at?: string
}

interface FinalReport {
  title: string
  campaign_name: string
  status: string
  budget: number
  target_audience: string
  goal: string
  executive_summary: string
  metrics: {
    agent_steps: number
    estimated_reach: number
    projected_roi: string
    readiness_score: number
  }
  deliverables: string[]
  recommendations: string[]
  brief?: string
  generated_at?: string
}

interface CampaignContext {
  campaign_brief?: string
  campaign_goal?: string
  target_audience?: string
  manager_email?: string
  agent_outputs?: AgentOutput[]
  content_generation?: ContentGeneration | null
  final_report?: FinalReport | null
}

interface CampaignSession {
  id: string
  campaign_name: string
  budget: number
  status: string
  context_data: CampaignContext
  created_at: string
  updated_at: string
}

interface CampaignLog {
  id: string
  message: string
  agent_name: string
  log_level: string
  created_at: string
}

const initialForm = {
  campaign_name: '',
  campaign_brief: '',
  campaign_goal: '',
  target_audience: '',
  budget: '',
  manager_email: '',
}

const statusStyles: Record<string, string> = {
  running: 'bg-blue-50 text-blue-700 ring-blue-200',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
}

// Platform brand colors and icons for the content workbench
const platformStyles: Record<string, { bg: string; border: string; badge: string; icon: string; text: string }> = {
  LinkedIn: {
    bg: 'bg-[#0A66C2]/5',
    border: 'border-[#0A66C2]/20',
    badge: 'bg-[#0A66C2] text-white',
    icon: '💼',
    text: 'text-[#0A66C2]',
  },
  Instagram: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    border: 'border-pink-200',
    badge: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
    icon: '📸',
    text: 'text-pink-600',
  },
  WhatsApp: {
    bg: 'bg-[#25D366]/5',
    border: 'border-[#25D366]/20',
    badge: 'bg-[#25D366] text-white',
    icon: '💬',
    text: 'text-[#25D366]',
  },
  'Twitter/X': {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-black text-white',
    icon: '𝕏',
    text: 'text-black',
  },
  Facebook: {
    bg: 'bg-[#1877F2]/5',
    border: 'border-[#1877F2]/20',
    badge: 'bg-[#1877F2] text-white',
    icon: '📘',
    text: 'text-[#1877F2]',
  },
  Email: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-500 text-white',
    icon: '✉️',
    text: 'text-orange-600',
  },
  Blog: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'bg-indigo-500 text-white',
    icon: '📝',
    text: 'text-indigo-600',
  },
  'Press Release': {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    badge: 'bg-slate-700 text-white',
    icon: '📰',
    text: 'text-slate-700',
  },
  YouTube: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-600 text-white',
    icon: '▶️',
    text: 'text-red-600',
  },
  SMS: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    badge: 'bg-teal-500 text-white',
    icon: '📱',
    text: 'text-teal-600',
  },
  Overview: {
    bg: 'bg-blue-50/50',
    border: 'border-blue-200',
    badge: 'bg-brand-navy text-white',
    icon: '📋',
    text: 'text-brand-navy',
  },
}

const defaultPlatformStyle = {
  bg: 'bg-gray-50',
  border: 'border-gray-200',
  badge: 'bg-gray-600 text-white',
  icon: '📄',
  text: 'text-gray-700',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
        statusStyles[status] || 'bg-gray-50 text-gray-700 ring-gray-200',
      )}
    >
      {status}
    </span>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold text-brand-navy">{value}</div>
    </div>
  )
}

function ReportPanel({ report, outputs }: { report?: FinalReport | null; outputs: AgentOutput[] }) {
  if (!report) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-muted-foreground">
        The final report will appear here as soon as the agents finish.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold text-brand-navy">{report.title}</h3>
          <StatusBadge status={report.status} />
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.executive_summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Readiness" value={`${report.metrics.readiness_score}%`} />
        <MetricCard label="Projected ROI" value={report.metrics.projected_roi} />
        <MetricCard label="Est. Reach" value={report.metrics.estimated_reach.toLocaleString()} />
        <MetricCard label="Agent Steps" value={report.metrics.agent_steps} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-brand-navy">Agent Outputs</h4>
          <div className="space-y-2">
            {outputs.map((output, index) => (
              <div key={`${output.agent_name}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-cornflower">
                  {output.agent_name}
                </div>
                <p className="mt-1 text-sm text-gray-700">{output.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-brand-navy">Recommendations</h4>
          <div className="space-y-2">
            {report.recommendations.map((item, index) => (
              <div key={item} className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Smart section categorizer — intelligence/research vs platform content
const intelligenceKeywords = [
  'audience', 'persona', 'demographic', 'key point', 'channel', 'hook',
  'forecast', 'engagement', 'recommendation', 'intelligence', 'research',
  'insight', 'analysis', 'strategy', 'summary', 'overview', 'segment',
  'psychographic', 'behavior', 'trend', 'competitor', 'market',
  'initialized', 'identified', 'preferred', 'strategic',
]

const sectionIcons: Record<string, { emoji: string; color: string }> = {
  'audience': { emoji: '🎯', color: 'from-blue-500 to-cyan-500' },
  'persona': { emoji: '👤', color: 'from-violet-500 to-purple-500' },
  'demographic': { emoji: '📊', color: 'from-emerald-500 to-teal-500' },
  'key point': { emoji: '💡', color: 'from-amber-500 to-yellow-500' },
  'channel': { emoji: '📡', color: 'from-indigo-500 to-blue-500' },
  'hook': { emoji: '🎣', color: 'from-rose-500 to-pink-500' },
  'forecast': { emoji: '📈', color: 'from-green-500 to-emerald-500' },
  'engagement': { emoji: '🔥', color: 'from-orange-500 to-red-500' },
  'recommendation': { emoji: '✨', color: 'from-purple-500 to-indigo-500' },
  'intelligence': { emoji: '🧠', color: 'from-blue-600 to-indigo-600' },
  'research': { emoji: '🔬', color: 'from-cyan-500 to-blue-500' },
  'insight': { emoji: '🔍', color: 'from-teal-500 to-cyan-500' },
  'strategy': { emoji: '♟️', color: 'from-slate-600 to-gray-600' },
  'summary': { emoji: '📋', color: 'from-blue-400 to-indigo-400' },
  'overview': { emoji: '🗺️', color: 'from-sky-500 to-blue-500' },
  'initialized': { emoji: '⚡', color: 'from-yellow-500 to-amber-500' },
  'identified': { emoji: '🏷️', color: 'from-teal-500 to-green-500' },
  'segment': { emoji: '🧩', color: 'from-fuchsia-500 to-pink-500' },
  'trend': { emoji: '📉', color: 'from-cyan-600 to-blue-600' },
  'market': { emoji: '🏪', color: 'from-indigo-500 to-violet-500' },
  'competitor': { emoji: '⚔️', color: 'from-red-500 to-orange-500' },
  'creative': { emoji: '🎨', color: 'from-pink-500 to-rose-500' },
  'design': { emoji: '✏️', color: 'from-fuchsia-500 to-purple-500' },
  'asset': { emoji: '🖼️', color: 'from-amber-500 to-orange-500' },
  'visual': { emoji: '👁️', color: 'from-violet-500 to-indigo-500' },
  'direction': { emoji: '🧭', color: 'from-sky-500 to-cyan-500' },
  'production': { emoji: '🏭', color: 'from-gray-500 to-slate-600' },
  'trace': { emoji: '🔗', color: 'from-lime-500 to-green-500' },
  'generation': { emoji: '⚙️', color: 'from-blue-500 to-indigo-500' },
  'component': { emoji: '🧱', color: 'from-orange-500 to-amber-500' },
  'detail': { emoji: '📝', color: 'from-slate-500 to-gray-500' },
  'integration': { emoji: '🔌', color: 'from-emerald-500 to-green-500' },
  'nano': { emoji: '🍌', color: 'from-yellow-400 to-amber-400' },
  'banana': { emoji: '🍌', color: 'from-yellow-400 to-amber-400' },
  'simulated': { emoji: '🧪', color: 'from-purple-400 to-violet-500' },
  'alignment': { emoji: '📐', color: 'from-blue-400 to-sky-500' },
  'outreach': { emoji: '📨', color: 'from-teal-500 to-emerald-500' },
  'messaging': { emoji: '💬', color: 'from-blue-500 to-indigo-500' },
  'social': { emoji: '🌐', color: 'from-pink-500 to-purple-500' },
  'content': { emoji: '📄', color: 'from-indigo-400 to-blue-500' },
  'professional': { emoji: '💼', color: 'from-blue-600 to-slate-600' },
  'campaign': { emoji: '🚀', color: 'from-orange-500 to-red-500' },
  'workbench': { emoji: '🛠️', color: 'from-gray-600 to-slate-600' },
  'script': { emoji: '🎬', color: 'from-rose-500 to-red-500' },
  'ad ': { emoji: '📺', color: 'from-red-500 to-rose-500' },
  'generator': { emoji: '🤖', color: 'from-cyan-500 to-blue-600' },
  'agent': { emoji: '🤖', color: 'from-indigo-500 to-purple-500' },
  'vibe': { emoji: '🎵', color: 'from-pink-400 to-fuchsia-500' },
  'approach': { emoji: '🧭', color: 'from-teal-500 to-cyan-500' },
  'pipeline': { emoji: '🔄', color: 'from-blue-500 to-violet-500' },
  'multi-agent': { emoji: '🤝', color: 'from-indigo-500 to-blue-600' },
  'performance': { emoji: '⚡', color: 'from-amber-500 to-yellow-500' },
  'budget': { emoji: '💰', color: 'from-green-500 to-emerald-500' },
  'schedule': { emoji: '📅', color: 'from-blue-400 to-indigo-400' },
  'timeline': { emoji: '⏱️', color: 'from-sky-500 to-blue-500' },
  'kpi': { emoji: '🎯', color: 'from-emerald-500 to-green-600' },
  'metric': { emoji: '📏', color: 'from-teal-500 to-cyan-500' },
  'copy': { emoji: '✍️', color: 'from-violet-500 to-purple-500' },
  'headline': { emoji: '📰', color: 'from-amber-500 to-orange-500' },
  'tagline': { emoji: '💬', color: 'from-rose-400 to-pink-500' },
  'tone': { emoji: '🎭', color: 'from-purple-400 to-violet-500' },
  'brand': { emoji: '🏷️', color: 'from-blue-500 to-indigo-600' },
  'target': { emoji: '🎯', color: 'from-red-400 to-rose-500' },
  'funnel': { emoji: '🔻', color: 'from-orange-500 to-red-500' },
  'conversion': { emoji: '🔄', color: 'from-green-500 to-teal-500' },
  'awareness': { emoji: '👀', color: 'from-sky-500 to-blue-500' },
  'retargeting': { emoji: '🔁', color: 'from-amber-500 to-orange-500' },
  'deliverable': { emoji: '📦', color: 'from-slate-500 to-gray-600' },
  'optimization': { emoji: '⚙️', color: 'from-cyan-500 to-blue-500' },
  'report': { emoji: '📊', color: 'from-blue-500 to-indigo-500' },
  'compliance': { emoji: '✅', color: 'from-green-600 to-emerald-600' },
  'audit': { emoji: '🔎', color: 'from-slate-500 to-blue-600' },
  'risk': { emoji: '⚠️', color: 'from-red-500 to-amber-500' },
  'policy': { emoji: '📜', color: 'from-indigo-500 to-blue-600' },
  'enforcement': { emoji: '🛡️', color: 'from-blue-600 to-indigo-700' },
  'reasoning': { emoji: '🧠', color: 'from-purple-500 to-violet-600' },
  'engine': { emoji: '⚙️', color: 'from-gray-500 to-slate-600' },
  'dynamic': { emoji: '🔄', color: 'from-cyan-500 to-blue-500' },
  'governance': { emoji: '🏛️', color: 'from-slate-600 to-gray-700' },
  'family': { emoji: '👨‍👩‍👧', color: 'from-pink-500 to-rose-500' },
  'audited': { emoji: '🔎', color: 'from-emerald-500 to-teal-600' },
  'result': { emoji: '📋', color: 'from-blue-400 to-indigo-500' },
  'assessment': { emoji: '📝', color: 'from-amber-500 to-orange-500' },
  'violation': { emoji: '🚫', color: 'from-red-600 to-rose-600' },
  'approval': { emoji: '👍', color: 'from-green-500 to-emerald-500' },
  'review': { emoji: '🔍', color: 'from-teal-500 to-cyan-600' },
  'safety': { emoji: '🛡️', color: 'from-blue-500 to-indigo-500' },
  'exception': { emoji: '⚡', color: 'from-amber-500 to-red-500' },
}

function getSectionMeta(title: string) {
  const lower = title.toLowerCase()
  for (const [keyword, meta] of Object.entries(sectionIcons)) {
    if (lower.includes(keyword)) return meta
  }
  return { emoji: '📄', color: 'from-gray-400 to-gray-500' }
}

function isIntelligenceSection(section: PlatformSection) {
  const lower = (section.title + ' ' + section.platform).toLowerCase()
  // If it matches a known social platform, it's content not intelligence
  const platformNames = ['linkedin', 'instagram', 'whatsapp', 'twitter', 'facebook', 'email', 'blog', 'youtube', 'sms', 'press']
  if (platformNames.some(p => lower.includes(p))) return false
  return intelligenceKeywords.some(k => lower.includes(k)) || section.platform === 'Overview' || section.platform === 'Content'
}

function ContentGenerationPanel({ content }: { content?: ContentGeneration | null }) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())

  if (!content) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-muted-foreground">
        Content generation outputs from the external agent will appear here after the workflow stream completes.
      </div>
    )
  }

  const sections = content.assets || []
  const hasHtml = !!content.html_content

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // Get icon and color for any section — platform or intelligence
  const getCardMeta = (section: PlatformSection) => {
    const style = platformStyles[section.platform]
    if (style) {
      return { emoji: style.icon, color: style.badge, accentGradient: style.border.replace('border-', 'from-') + ' to-gray-300' }
    }
    return getSectionMeta(section.title)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-cornflower to-brand-navy">
            <Icons.fileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-navy leading-tight">Content Workbench</h3>
            <p className="text-xs text-muted-foreground">{content.summary}</p>
          </div>
        </div>
        {sections.length > 0 && (
          <span className="rounded-full bg-brand-cornflower/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-navy ring-1 ring-brand-cornflower/20">
            {sections.length} {sections.length === 1 ? 'section' : 'sections'}
          </span>
        )}
      </div>

      {/* Unified grid — all sections in the same space */}
      {sections.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50/60 to-blue-50/30 p-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {sections.map((section, idx) => {
              const pStyle = platformStyles[section.platform]
              const meta = getSectionMeta(section.title)
              const isOpen = expandedCards.has(idx)
              const isLong = section.body.length > 180

              const icon = pStyle ? pStyle.icon : meta.emoji
              const badgeClass = pStyle ? pStyle.badge : 'bg-gray-600 text-white'

              return (
                <div
                  key={`section-${idx}`}
                  className="group relative rounded-xl border border-gray-200/80 bg-white p-4 transition-all duration-200 hover:border-brand-cornflower/30 hover:shadow-md"
                >
                  {/* Accent bar */}
                  <div className={cn('absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b', pStyle ? '' : meta.color)}
                    style={pStyle ? { background: `linear-gradient(to bottom, ${pStyle.badge.includes('#0A66C2') ? '#0A66C2' : pStyle.badge.includes('#25D366') ? '#25D366' : pStyle.badge.includes('#1877F2') ? '#1877F2' : '#6366f1'}, #e2e8f0)` } : undefined}
                  />

                  <div className="pl-3">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{icon}</span>
                        {pStyle ? (
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0', badgeClass)}>
                            {section.platform}
                          </span>
                        ) : null}
                        <h5 className="text-[13px] font-bold text-brand-navy truncate leading-snug">{section.title}</h5>
                      </div>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleCard(idx)}
                          className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          {isOpen ? '−' : '+'}
                        </button>
                      )}
                    </div>

                    {/* Body */}
                    <div className={cn(
                      'mt-2 overflow-hidden transition-all duration-300',
                      isOpen ? 'max-h-[1200px]' : 'max-h-[96px]',
                    )}>
                      <p className="whitespace-pre-line text-[13px] leading-relaxed text-gray-600">
                        {section.body}
                      </p>
                    </div>
                    {!isOpen && isLong && (
                      <div className="mt-1.5 pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => toggleCard(idx)}
                          className="text-[11px] font-semibold text-brand-cornflower hover:text-brand-navy transition-colors"
                        >
                          Read more →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          The workflow is processing. Content will appear here when agent steps complete.
        </div>
      )}

      {/* Collapsible raw viewers */}
      {(hasHtml || (content.raw_lines && content.raw_lines.length > 0)) && (
        <div className="flex flex-wrap gap-2">
          {hasHtml && (
            <details className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-gray-50">
              <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-gray-500">
                Raw HTML output
              </summary>
              <div
                className="content-workbench-html border-t border-gray-200 px-3 py-2 text-sm leading-6 text-gray-800 max-h-60 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: content.html_content || '' }}
              />
            </details>
          )}
          {content.raw_lines && content.raw_lines.length > 0 && (
            <details className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-gray-50">
              <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-gray-500">
                Stream log ({content.raw_lines.length} lines)
              </summary>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap border-t border-gray-200 px-3 py-2 text-[10px] leading-4 text-gray-600">
                {content.raw_lines.join('\n')}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default function AIManagerPage() {
  const router = useRouter()
  const logsEndRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const autoResumeStartedRef = useRef<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const [activeTab, setActiveTab] = useState<'launch' | 'history'>('launch')
  const [formData, setFormData] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [activeSession, setActiveSession] = useState<CampaignSession | null>(null)

  const [campaigns, setCampaigns] = useState<CampaignSession[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignSession | null>(null)
  const [selectedLogs, setSelectedLogs] = useState<CampaignLog[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  const activeReport = activeSession?.context_data?.final_report
  const activeOutputs = activeSession?.context_data?.agent_outputs || []
  const activeContentGeneration =
    activeSession?.context_data?.content_generation ||
    activeOutputs.find(output => output.details?.content_generation)?.details?.content_generation ||
    null
  const selectedReport = selectedCampaign?.context_data?.final_report
  const selectedOutputs = selectedCampaign?.context_data?.agent_outputs || []
  const selectedContentGeneration =
    selectedCampaign?.context_data?.content_generation ||
    selectedOutputs.find(output => output.details?.content_generation)?.details?.content_generation ||
    null

  const isComplete = activeSession?.status === 'completed'

  const terminalLogs = useMemo(() => logs.slice(-160), [logs])

  // Auto-scroll terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [logs])

  // Scroll to Generated Content panel when it first appears
  const prevContentRef = useRef(activeContentGeneration)
  useEffect(() => {
    if (activeContentGeneration && !prevContentRef.current) {
      setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)
    }
    prevContentRef.current = activeContentGeneration
  }, [activeContentGeneration])

  // Scroll to Final Report panel when it first appears
  const prevReportRef = useRef(activeReport)
  useEffect(() => {
    if (activeReport && !prevReportRef.current) {
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)
    }
    prevReportRef.current = activeReport
  }, [activeReport])

  // Cleanup EventSource and polling on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Poll session data every 3s while agents are working
  useEffect(() => {
    if (isSubmitting && sessionId && !isPaused) {
      pollingRef.current = setInterval(() => {
        apiClient.get<CampaignSession>(`/api/orchestration/sessions/${sessionId}`)
          .then(session => {
            setActiveSession(session)
            updateCampaignCache(session)
          })
          .catch(() => { /* silent */ })
      }, 3000)
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, sessionId, isPaused])

  const updateCampaignCache = (session: CampaignSession) => {
    setCampaigns(prev => {
      const existing = prev.find(item => item.id === session.id)
      if (!existing) return [session, ...prev]
      return prev.map(item => (item.id === session.id ? session : item))
    })
  }

  const refreshSession = useCallback(async (sid: string) => {
    const session = await apiClient.get<CampaignSession>(`/api/orchestration/sessions/${sid}`)
    setActiveSession(session)
    updateCampaignCache(session)
    if (selectedCampaign?.id === sid) setSelectedCampaign(session)
    return session
  }, [selectedCampaign?.id])

  const fetchCampaigns = async () => {
    setIsLoadingHistory(true)
    try {
      const data = await apiClient.get<CampaignSession[]>('/api/orchestration/sessions')
      setCampaigns(data)
      if (!selectedCampaign && data.length > 0) {
        void fetchCampaignLogs(data[0])
      }
    } catch {
      setCampaigns([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const fetchCampaignLogs = async (campaign: CampaignSession) => {
    setSelectedCampaign(campaign)
    setIsLoadingLogs(true)
    try {
      const [session, data] = await Promise.all([
        apiClient.get<CampaignSession>(`/api/orchestration/sessions/${campaign.id}`),
        apiClient.get<CampaignLog[]>(`/api/orchestration/sessions/${campaign.id}/logs`),
      ])
      setSelectedCampaign(session)
      setSelectedLogs(data)
      updateCampaignCache(session)
    } catch {
      setSelectedLogs([])
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const connectStream = useCallback((sid: string) => {
    eventSourceRef.current?.close()
    setIsSubmitting(true)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    const eventSource = new EventSource(`${apiUrl}${basePath}/api/orchestration/logs/${sid}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      setLogs(prev => [...prev, event.data])

      // Refresh immediately when content generation completes so panel shows output
      if (event.data.includes('Content Generation Agent') && event.data.includes('Stream complete')) {
        void refreshSession(sid)
      }

      if (event.data.includes('Waiting for human-in-the-loop approval')) {
        setIsPaused(true)
        setIsSubmitting(false)
        eventSource.close()
        void refreshSession(sid)
      }

      if (event.data.includes('Workflow completed successfully')) {
        setIsSubmitting(false)
        setIsPaused(false)
        eventSource.close()
        // Immediate refresh + delayed re-fetch to catch any final DB commit
        void refreshSession(sid)
        setTimeout(() => void refreshSession(sid), 1500)
      }
    }

    eventSource.onerror = () => {
      setIsSubmitting(false)
      eventSource.close()
      // Try to refresh the session — the stream may have completed on the backend
      void refreshSession(sid).catch(() => undefined)
      // Retry once after a brief delay to handle race conditions
      setTimeout(() => void refreshSession(sid).catch(() => undefined), 2000)
    }
  }, [refreshSession])

  useEffect(() => {
    if (activeTab === 'history') {
      void fetchCampaigns()
    }
    // fetchCampaigns intentionally reads the latest selected campaign when invoked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    const resumeSessionId = new URLSearchParams(window.location.search).get('resume')
    if (!resumeSessionId || autoResumeStartedRef.current === resumeSessionId) return

    autoResumeStartedRef.current = resumeSessionId
    setActiveTab('launch')
    setSessionId(resumeSessionId)
    setIsPaused(false)
    setIsSubmitting(true)
    setLogs([
      '[System] Human approval received. Returning to AI Manager...',
      '[System] Resuming orchestrator stream until final output is achieved...',
    ])

    void refreshSession(resumeSessionId)
      .then(session => {
        if (session.status === 'completed') {
          setIsSubmitting(false)
          setLogs(prev => [...prev, '[System] Campaign is already completed. Final report loaded.'])
          return
        }
        connectStream(resumeSessionId)
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : 'Unable to resume session'
        setIsSubmitting(false)
        setLogs(prev => [...prev, `[System] Resume error: ${message}`])
      })
  }, [connectStream, refreshSession])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setIsPaused(false)
    setActiveSession(null)
    setLogs(['[System] Initiating AI Campaign Orchestrator...'])

    try {
      const data = await apiClient.post<{
        session_id: string
        status: string
        session: CampaignSession
      }>('/api/orchestration/launch', formData)
      setSessionId(data.session_id)
      setActiveSession(data.session)
      updateCampaignCache(data.session)
      connectStream(data.session_id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Launch failed'
      setLogs(prev => [...prev, `[System] Error: ${message}`])
      setIsSubmitting(false)
    }
  }

  const logColor = (message: string) => {
    if (message.includes('ERROR') || message.includes('exception') || message.includes('Error') || message.includes('⚠️') || message.includes('failed')) return 'text-red-300'
    if (message.includes('WARN') || message.includes('paused') || message.includes('Policy')) return 'text-amber-300'
    if (message.includes('Report') || message.includes('COMPLETED') || message.includes('successfully') || message.includes('✅') || message.includes('completed')) return 'text-emerald-300'
    if (message.includes('Trend') || message.includes('Content') || message.includes('Media') || message.includes('⚙️') || message.includes('running')) return 'text-cyan-300'
    if (message.includes('Connected') || message.includes('Stream complete')) return 'text-blue-300'
    return 'text-slate-300'
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-display-3 font-bold tracking-tight text-brand-navy">
          <Icons.bot className="h-10 w-10 text-brand-cornflower" />
          AI Manager
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Launch autonomous campaign agents, track every output, and review the final report.
        </p>
      </div>

      <div className="flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('launch')}
          className={cn(
            'inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-100',
            activeTab === 'launch' ? 'bg-white text-brand-navy shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icons.sparkles className="mr-2 h-4 w-4" />
          Launch
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={cn(
            'inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-100',
            activeTab === 'history' ? 'bg-white text-brand-navy shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icons.clock className="mr-2 h-4 w-4" />
          History
        </button>
      </div>

      {activeTab === 'launch' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card className="border-brand-navy/10 lg:col-span-2">
            <CardHeader className="border-b border-brand-navy/10 bg-brand-navy/5">
              <CardTitle>Launch New Campaign</CardTitle>
              <CardDescription>The session is stored immediately, then updated as agents finish.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-brand-navy">Campaign Name</label>
                  <input required name="campaign_name" value={formData.campaign_name} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Summer Q3 Launch" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-brand-navy">Strategic Brief</label>
                  <textarea required name="campaign_brief" value={formData.campaign_brief} onChange={handleChange} className="min-h-[108px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Describe the message, offer, and market context..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-brand-navy">Goal</label>
                    <input required name="campaign_goal" value={formData.campaign_goal} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Lead generation" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-brand-navy">Audience</label>
                    <input required name="target_audience" value={formData.target_audience} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Enterprise CTOs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-brand-navy">Budget ($)</label>
                    <input required type="number" min="1" name="budget" value={formData.budget} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="25000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-brand-navy">Manager Email</label>
                    <input required type="email" name="manager_email" value={formData.manager_email} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="manager@company.com" />
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting} variant="gradient" className="h-12 w-full text-base">
                  {isSubmitting ? <><Icons.loader className="h-5 w-5 animate-spin" /> Agents Working</> : <><Icons.sparkles className="h-5 w-5" /> Launch Campaign</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-3">
            <div ref={reportRef}>
              <Card className="border-brand-navy/10">
                <CardHeader className="flex flex-row items-start justify-between border-b border-brand-navy/10 bg-white">
                  <div>
                    <CardTitle>Final Report</CardTitle>
                    <CardDescription>{activeSession ? activeSession.campaign_name : 'No active campaign yet'}</CardDescription>
                  </div>
                  {activeSession && <StatusBadge status={activeSession.status} />}
                </CardHeader>
                <CardContent className="p-5">
                  <ReportPanel report={activeReport} outputs={activeOutputs} />
                </CardContent>
              </Card>
            </div>

            <div ref={contentRef}>
              <Card className={cn(
                'border-brand-navy/10 transition-all duration-500',
                activeContentGeneration ? 'ring-2 ring-brand-cornflower/30 shadow-lg' : '',
              )}>
                <CardHeader className="border-b border-brand-navy/10 bg-white">
                  <CardTitle className="flex items-center gap-2">
                    Generated Content
                    {isSubmitting && !activeContentGeneration && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        <Icons.loader className="h-3 w-3 animate-spin" />
                        Agent working…
                      </span>
                    )}
                    {activeContentGeneration && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        ✓ Ready
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Structured output from the content generation agent.</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <ContentGenerationPanel content={activeContentGeneration} />
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden border-brand-navy bg-[#0f172a] font-mono text-slate-300">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 bg-[#0b1121] py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Icons.terminal className="h-4 w-4" />
                  Agent Execution
                </div>
                {isComplete && <span className="text-xs font-semibold text-emerald-300">Report stored</span>}
              </CardHeader>
              <CardContent className="max-h-[360px] overflow-y-auto p-4">
                {terminalLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">Awaiting launch...</div>
                ) : (
                  <div className="space-y-1.5 text-sm">
                    {terminalLogs.map((log, index) => (
                      <div key={`${index}-${log}`} className={cn('break-words', logColor(log))}>{log}</div>
                    ))}
                    {isSubmitting && !isPaused && (
                      <div className="mt-3 flex items-center gap-2 text-brand-cornflower">
                        <Icons.loader className="h-4 w-4 animate-spin" />
                        Agents are working...
                      </div>
                    )}
                    {isPaused && (
                      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
                        <div className="mb-2 flex items-center gap-2 font-semibold">
                          <Icons.alertCircle className="h-5 w-5" />
                          Executive Approval Required
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => router.push(`/workbench?session=${sessionId || ''}`)} variant="outline" className="border-amber-500/50 text-amber-700">
                            Approval Form <Icons.arrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-brand-navy">Campaign History</h3>
              <Button variant="ghost" size="icon-sm" onClick={fetchCampaigns} disabled={isLoadingHistory} aria-label="Refresh campaigns">
                <Icons.refresh className={cn('h-4 w-4', isLoadingHistory && 'animate-spin')} />
              </Button>
            </div>
            {campaigns.length === 0 && !isLoadingHistory ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Icons.inbox className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="font-medium">No campaigns yet</p>
                <p className="mt-1 text-sm">Launch a campaign to store it here.</p>
              </Card>
            ) : (
              <div className="max-h-[690px] space-y-2 overflow-y-auto pr-1">
                {campaigns.map(campaign => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => fetchCampaignLogs(campaign)}
                    className={cn(
                      'w-full rounded-lg border bg-white p-4 text-left transition-colors duration-100 hover:border-brand-cornflower/60',
                      selectedCampaign?.id === campaign.id ? 'border-brand-cornflower bg-brand-cornflower/5' : 'border-gray-200',
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-brand-navy">{campaign.campaign_name}</span>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${campaign.budget.toLocaleString()} / {new Date(campaign.created_at).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedCampaign ? (
              <div className="space-y-6">
                <Card className="border-brand-navy/10">
                  <CardHeader className="flex flex-row items-start justify-between border-b border-brand-navy/10">
                    <div>
                      <CardTitle>{selectedCampaign.campaign_name}</CardTitle>
                      <CardDescription>Session {selectedCampaign.id.slice(0, 8)} / stored report and agent outputs</CardDescription>
                    </div>
                    <StatusBadge status={selectedCampaign.status} />
                  </CardHeader>
                  <CardContent className="p-5">
                    <ReportPanel report={selectedReport} outputs={selectedOutputs} />
                  </CardContent>
                </Card>

                <Card className="border-brand-navy/10">
                  <CardHeader className="border-b border-brand-navy/10">
                    <CardTitle>Generated Content</CardTitle>
                    <CardDescription>Stored content generation output for this campaign.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5">
                    <ContentGenerationPanel content={selectedContentGeneration} />
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-brand-navy bg-[#0f172a] font-mono text-slate-300">
                  <CardHeader className="border-b border-slate-800 bg-[#0b1121] py-3">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-200">
                      <Icons.terminal className="h-4 w-4" />
                      Execution Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[360px] overflow-y-auto p-4">
                    {isLoadingLogs ? (
                      <div className="flex items-center justify-center py-10 text-slate-500">
                        <Icons.loader className="mr-2 h-5 w-5 animate-spin" />
                        Loading logs...
                      </div>
                    ) : selectedLogs.length === 0 ? (
                      <div className="py-10 text-center text-slate-500">No logs recorded.</div>
                    ) : (
                      <div className="space-y-1.5 text-sm">
                        {selectedLogs.map(log => (
                          <div key={log.id} className={cn('break-words', logColor(log.message))}>{log.message}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="flex min-h-[420px] items-center justify-center border-dashed">
                <div className="text-center text-muted-foreground">
                  <Icons.fileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
                  <p className="font-semibold">Select a campaign</p>
                  <p className="mt-1 text-sm">Choose a campaign to view its final report.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
