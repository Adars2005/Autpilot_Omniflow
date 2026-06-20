'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/founderos/GlassCard'
import { useFounderOS } from '@/lib/founderos/context'
import { DEPLOY_AGENTS } from '@/lib/founderos/mock-data'
import type { AgentStatus, DeployAgent } from '@/lib/founderos/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, Loader2 } from 'lucide-react'

const STATUS_LABELS: Record<AgentStatus, string> = {
  pending: 'Waiting',
  thinking: 'Thinking',
  researching: 'Researching',
  analyzing: 'Analyzing',
  simulating: 'Simulating',
  completed: 'Completed',
}

const STATUS_SEQUENCE: AgentStatus[] = [
  'thinking',
  'researching',
  'analyzing',
  'simulating',
  'completed',
]

export default function DeployPage() {
  const router = useRouter()
  const { setDeployed, company } = useFounderOS()
  const [agents, setAgents] = useState<DeployAgent[]>(DEPLOY_AGENTS)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let agentIndex = 0
    let statusIndex = 0

    const interval = setInterval(() => {
      setAgents((prev) => {
        const next = [...prev]
        if (agentIndex < next.length) {
          next[agentIndex] = {
            ...next[agentIndex],
            status: STATUS_SEQUENCE[statusIndex],
          }
          statusIndex++
          if (statusIndex >= STATUS_SEQUENCE.length) {
            statusIndex = 0
            agentIndex++
          }
        }
        return next
      })

      setProgress((p) => Math.min(p + 2, 100))

      if (agentIndex >= DEPLOY_AGENTS.length) {
        clearInterval(interval)
        setDone(true)
        setDeployed(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    }, 600)

    return () => clearInterval(interval)
  }, [router, setDeployed])

  const completedCount = agents.filter((a) => a.status === 'completed').length

  return (
    <div className="founderos-grid flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <motion.div
            animate={{ rotate: done ? 0 : 360 }}
            transition={{ duration: 2, repeat: done ? 0 : Infinity, ease: 'linear' }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600"
          >
            {done ? (
              <CheckCircle2 className="h-8 w-8 text-white" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            )}
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-white">
            {done ? 'Company Deployed!' : 'Deploying Autonomous Company'}
          </h1>
          <p className="mt-2 text-white/50">
            {done
              ? `Redirecting to ${company.startup.name} Command Center...`
              : 'Activating AI agents across all departments...'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="mb-6 text-center text-sm text-white/40">
          {completedCount}/{agents.length} agents completed
        </p>

        <div className="space-y-2">
          <AnimatePresence>
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="flex items-center gap-4 p-4">
                  <span className="text-xl">{agent.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{agent.name}</p>
                    <p
                      className={cn(
                        'text-xs',
                        agent.status === 'completed'
                          ? 'text-green-400'
                          : agent.status === 'pending'
                            ? 'text-white/30'
                            : 'text-indigo-400'
                      )}
                    >
                      {STATUS_LABELS[agent.status]}
                      {agent.status !== 'pending' && agent.status !== 'completed' && '...'}
                    </p>
                  </div>
                  {agent.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : agent.status !== 'pending' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-white/20" />
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
