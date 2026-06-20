'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { GlassCard } from './GlassCard'
import type { AgentOutput } from '@/lib/founderos/types'
import { Brain, Clock } from 'lucide-react'

interface AgentOutputDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  output: AgentOutput | null
  departmentName?: string
}

export function AgentOutputDrawer({
  open,
  onOpenChange,
  output,
  departmentName,
}: AgentOutputDrawerProps) {
  if (!output) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-white/10 bg-[#0a0a12]/95 backdrop-blur-2xl sm:max-w-xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl text-white">{output.title}</SheetTitle>
          <SheetDescription className="text-white/50">
            {departmentName && `${departmentName} · `}
            Full agent output for inspection
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-4">
            <GlassCard className="flex flex-1 items-center gap-3 p-4">
              <Brain className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-xs text-white/50">Confidence Score</p>
                <p className="text-lg font-semibold text-white">{output.confidenceScore}%</p>
              </div>
            </GlassCard>
            <GlassCard className="flex flex-1 items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-xs text-white/50">Generated</p>
                <p className="text-sm font-medium text-white">
                  {new Date(output.generatedAt).toLocaleString()}
                </p>
              </div>
            </GlassCard>
          </div>

          {output.sections.map((section) => (
            <GlassCard key={section.heading} className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-300">
                {section.heading}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}

          <GlassCard className="border-indigo-500/20 p-5">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-300">
              Reasoning
            </h3>
            <p className="text-sm leading-relaxed text-white/70">{output.reasoning}</p>
          </GlassCard>
        </div>
      </SheetContent>
    </Sheet>
  )
}
