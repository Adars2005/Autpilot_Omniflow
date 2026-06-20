'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/founderos/GlassCard'
import { useFounderOS, DEFAULT_STARTUP } from '@/lib/founderos/context'
import { ArrowLeft, Upload, Zap, FileText } from 'lucide-react'
import type { StartupInput } from '@/lib/founderos/types'

export default function StartPage() {
  const router = useRouter()
  const { setStartup } = useFounderOS()
  const [form, setForm] = useState<StartupInput>(DEFAULT_STARTUP)
  const [uploaded, setUploaded] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStartup(form)
    router.push('/deploy')
  }

  const handleFileUpload = () => {
    setUploaded(true)
    setForm((f) => ({ ...f, documentName: 'VetPulse_Pitch_Deck.pdf' }))
  }

  return (
    <div className="founderos-grid min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to FounderOS
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
              <Zap className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Deploy Your Company</h1>
              <p className="text-sm text-white/50">Step 1 — Upload your startup or describe your idea</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-300">
                Startup Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ['name', 'Startup Name'],
                  ['industry', 'Industry'],
                  ['budget', 'Budget'],
                  ['timeline', 'Timeline'],
                  ['targetCustomers', 'Target Customers'],
                  ['fundingStage', 'Funding Stage'],
                ] as const).map(([key, label]) => (
                  <div key={key} className={key === 'targetCustomers' ? 'sm:col-span-2' : ''}>
                    <Label className="text-white/70">{label}</Label>
                    <Input
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1.5 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Label className="text-white/70">Goals</Label>
                  <Input
                    value={form.goals}
                    onChange={(e) => setForm({ ...form, goals: e.target.value })}
                    className="mt-1.5 border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-300">
                Or Paste Your Idea
              </h2>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Describe your startup idea in a few sentences..."
                defaultValue="AI SaaS platform that helps independent veterinary clinics automate patient triage, optimize scheduling, and recover missed revenue through intelligent billing analysis."
              />
            </GlassCard>

            <GlassCard
              className="cursor-pointer p-6 transition-colors hover:border-indigo-500/30"
              onClick={handleFileUpload}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20">
                  <Upload className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-white">Upload Document</h2>
                  <p className="text-sm text-white/50">PDF, Pitch Deck, PRD, Business Plan, Whitepaper</p>
                </div>
                {uploaded && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1.5 text-sm text-green-400">
                    <FileText className="h-4 w-4" />
                    {form.documentName}
                  </div>
                )}
              </div>
            </GlassCard>

            <Button type="submit" size="lg" className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white">
              Deploy Autonomous Company
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
