'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/founderos/GlassCard'
import {
  Zap,
  Shield,
  Hexagon,
  ArrowRight,
  Brain,
  Wallet,
  Users,
  BarChart3,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

const features = [
  { icon: Brain, title: 'Autonomous Agents', desc: 'CEO, Finance, Growth, and 10+ department agents working in parallel.' },
  { icon: Wallet, title: 'Treasury Control', desc: 'Multi-wallet budgeting with on-chain approval workflows.' },
  { icon: Users, title: 'Investor Intelligence', desc: 'AI-matched investors with warm intro probability scoring.' },
  { icon: Shield, title: 'Governance Layer', desc: 'Board of Directors debates, votes, and records decisions.' },
  { icon: Hexagon, title: 'Monad Trust Layer', desc: 'On-chain decision ledger, reputation, and company memory.' },
  { icon: BarChart3, title: 'Startup Readiness', desc: 'Real-time scoring across market, product, funding, and growth.' },
]

const agents = [
  'CEO Agent', 'Product Agent', 'CTO Agent', 'Finance Agent',
  'Treasury Agent', 'Growth Agent', 'Marketing Agent', 'Risk Agent',
  'Governance Agent', 'Investor Intelligence', 'Market Intelligence',
]

const steps = [
  { step: '01', title: 'Upload Your Startup', desc: 'Pitch deck, PRD, business plan, or paste your idea.' },
  { step: '02', title: 'Agents Activate', desc: '12+ AI agents analyze, simulate, and build your company.' },
  { step: '03', title: 'Command Center Live', desc: 'Explore departments, treasury, investors, and governance.' },
]

export default function LandingPage() {
  return (
    <div className="founderos-grid relative min-h-screen overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#030308]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-white">FounderOS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5">
                View Demo
              </Button>
            </Link>
            <Link href="/start">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pb-24 pt-32">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              The Autonomous Startup Operating System
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
              Deploy an{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Autonomous Company
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
              Upload your startup idea and FounderOS creates an AI-native company with departments,
              treasury, governance, investor intelligence, and execution planning.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/start">
                <Button size="lg" className="h-12 bg-indigo-600 px-8 hover:bg-indigo-500 text-white">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-12 border-white/20 bg-white/5 px-8 text-white hover:bg-white/10">
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard preview mock */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative mx-auto mt-16 max-w-4xl"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-2xl" />
            <GlassCard glow className="relative overflow-hidden p-1">
              <div className="rounded-xl bg-[#0a0a14] p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs text-white/40">FounderOS Command Center</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {['Health 72%', 'Funding 71%', 'Product 65%', 'Growth 69%'].map((s) => (
                    <div key={s} className="rounded-lg bg-white/5 p-3 text-center">
                      <p className="text-sm font-semibold text-white">{s.split(' ')[0]}</p>
                      <p className="text-lg font-bold text-indigo-400">{s.split(' ')[1]}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {['CEO Agent ✓', 'Treasury ✓', 'Board Active'].map((a) => (
                    <div key={a} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-white/60">
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">
            Everything a startup needs. Autonomous.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <GlassCard hover className="h-full p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm text-white/50">{desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl font-bold text-white">How It Works</h2>
          <div className="mt-12 space-y-6">
            {steps.map(({ step, title, desc }) => (
              <GlassCard key={step} className="flex items-center gap-6 p-6">
                <span className="font-display text-3xl font-bold text-indigo-500/50">{step}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="text-white/50">{desc}</p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-white/20" />
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Departments */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-display text-3xl font-bold text-white">Agent Departments</h2>
          <p className="mt-2 text-white/50">Every function of a real company, powered by AI agents</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {agents.map((a) => (
              <span key={a} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Monad */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <GlassCard glow className="p-8 md:p-12">
            <div className="flex items-center gap-3">
              <Hexagon className="h-8 w-8 text-indigo-400" />
              <h2 className="font-display text-2xl font-bold text-white md:text-3xl">Monad Trust Layer</h2>
            </div>
            <p className="mt-4 text-white/60">
              Every decision, approval, treasury allocation, and reputation update is recorded on-chain.
              Company passport, agent wallets, governance contracts, and institutional memory — all verifiable.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['Company Passport', 'Decision Ledger', 'Treasury Contracts', 'Reputation Ledger'].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-3 text-sm text-white/70">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold text-white">
            Ready to deploy your company?
          </h2>
          <p className="mt-4 text-white/50">
            Upload your pitch deck and watch FounderOS build your autonomous startup in minutes.
          </p>
          <Link href="/start" className="mt-8 inline-block">
            <Button size="lg" className="h-12 bg-indigo-600 px-10 hover:bg-indigo-500 text-white">
              Start Building
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-white/30">
        FounderOS · The Autonomous Startup Operating System
      </footer>
    </div>
  )
}
