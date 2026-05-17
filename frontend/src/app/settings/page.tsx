'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api-client'
import apiClientFetch from '@/lib/api-client'
import toast from 'react-hot-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// ── Toggle Component ──────────────────────────────────────────────────────

function SettingToggle({
  id,
  label,
  description,
  defaultChecked = false,
  onChange,
}: {
  id: string
  label: string
  description: string
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between py-3'>
      <div className='space-y-0.5'>
        <Label htmlFor={id} className='text-sm font-medium text-foreground cursor-pointer'>
          {label}
        </Label>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <Switch
        id={id}
        checked={defaultChecked}
        onCheckedChange={onChange}
      />
    </div>
  )
}

// ── Platform Health Card ──────────────────────────────────────────────────

interface PlatformStats {
  campaigns: {
    total: number
    completed: number
    running: number
    paused: number
    failed: number
    completion_rate: number
  }
  budget: { total_allocated: number; average_per_campaign: number }
  agents: { total_log_entries: number; unique_agents_used: number }
  workbench: { total_exceptions: number; pending: number; resolved: number }
  governance: { active_policies: number; total_policies: number }
  intelligence: { total_insights: number }
  recent_campaigns: Array<{
    id: string
    name: string
    budget: number
    status: string
    created_at: string | null
  }>
}

function PlatformHealthCard({ stats }: { stats: PlatformStats | null }) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Loading platform health...
        </CardContent>
      </Card>
    )
  }

  const healthItems = [
    {
      label: 'Campaigns',
      value: stats.campaigns.total,
      detail: `${stats.campaigns.completed} completed, ${stats.campaigns.running} running`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: '🚀',
    },
    {
      label: 'Success Rate',
      value: `${stats.campaigns.completion_rate}%`,
      detail: `${stats.campaigns.failed} failed, ${stats.campaigns.paused} escalated`,
      color: stats.campaigns.completion_rate >= 80 ? 'text-emerald-600' : 'text-amber-600',
      bgColor: stats.campaigns.completion_rate >= 80 ? 'bg-emerald-50' : 'bg-amber-50',
      icon: stats.campaigns.completion_rate >= 80 ? '✅' : '⚠️',
    },
    {
      label: 'Total Budget',
      value: `$${stats.budget.total_allocated.toLocaleString()}`,
      detail: `Avg $${stats.budget.average_per_campaign.toLocaleString()} per campaign`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: '💰',
    },
    {
      label: 'Agent Activity',
      value: stats.agents.total_log_entries,
      detail: `${stats.agents.unique_agents_used} unique agents used`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      icon: '🤖',
    },
    {
      label: 'Workbench',
      value: `${stats.workbench.pending} pending`,
      detail: `${stats.workbench.resolved} resolved of ${stats.workbench.total_exceptions} total`,
      color: stats.workbench.pending > 0 ? 'text-amber-600' : 'text-emerald-600',
      bgColor: stats.workbench.pending > 0 ? 'bg-amber-50' : 'bg-emerald-50',
      icon: stats.workbench.pending > 0 ? '⏳' : '✅',
    },
    {
      label: 'Governance',
      value: `${stats.governance.active_policies} active`,
      detail: `${stats.governance.total_policies} total policies configured`,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      icon: '📜',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-cornflower to-brand-navy">
            <Icons.activity className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <CardTitle className="text-base">Platform Health</CardTitle>
            <CardDescription className="text-xs">
              Live system status from database
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {healthItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                'rounded-xl border border-gray-100 p-3 transition-all hover:shadow-sm',
                item.bgColor,
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{item.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <p className={cn('mt-1.5 text-lg font-bold', item.color)}>
                {item.value}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Recent campaigns */}
        {stats.recent_campaigns.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recent Campaigns
            </p>
            <div className="space-y-1.5">
              {stats.recent_campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      'inline-block h-2 w-2 shrink-0 rounded-full',
                      c.status === 'completed' ? 'bg-emerald-500' :
                      c.status === 'running' ? 'bg-blue-500' :
                      c.status === 'paused' ? 'bg-amber-500' :
                      'bg-red-500'
                    )} />
                    <span className="text-xs font-medium text-foreground truncate">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-muted-foreground">${c.budget.toLocaleString()}</span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      c.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      c.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── API Keys & Integrations Card ──────────────────────────────────────────

function IntegrationsCard() {
  const integrations = [
    {
      name: 'Supervity Agent',
      description: 'Content generation workflow engine',
      envKey: 'SUPERVITY_BEARER_TOKEN',
      icon: '🤖',
      status: 'connected',
    },
    {
      name: 'Gemini AI',
      description: 'Google Gemini for orchestration intelligence',
      envKey: 'GEMINI_API_KEY',
      icon: '🧠',
      status: 'connected',
    },
    {
      name: 'PostgreSQL',
      description: 'Primary data store for campaigns and logs',
      envKey: 'DATABASE_URL',
      icon: '🗄️',
      status: 'connected',
    },
    {
      name: 'Keycloak SSO',
      description: 'Identity and access management',
      envKey: 'KEYCLOAK_SERVER_URL',
      icon: '🔐',
      status: 'bypassed',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cornflower/10">
            <Icons.share className="h-5 w-5 text-brand-cornflower" strokeWidth={1.5} />
          </div>
          <div>
            <CardTitle className="text-base">Integrations</CardTitle>
            <CardDescription className="text-xs">
              Connected services and API keys
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg">{integration.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{integration.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{integration.description}</p>
              </div>
            </div>
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
              integration.status === 'connected'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700',
            )}>
              {integration.status === 'connected' ? '● Connected' : '○ Bypassed'}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiClient.get('/api/users/me/settings')
        setSettings(data)
      } catch (e) {
        console.error(e)
        // If settings endpoint fails (no auth), set defaults
        setSettings({
          email_notifications: true,
          desktop_notifications: true,
          weekly_digest: false,
          marketing_emails: false,
        })
      } finally {
        setIsLoading(false)
      }
    }

    async function loadPlatformStats() {
      try {
        const data = await apiClientFetch('/api/dashboard/summary')
        setPlatformStats(data as PlatformStats)
      } catch (e) {
        console.error('Failed to load platform stats:', e)
      }
    }

    loadSettings()
    loadPlatformStats()
  }, [])

  const handleToggle = async (key: string, checked: boolean) => {
    // Optimistic update
    setSettings((prev: any) => ({ ...prev, [key]: checked }))

    try {
      await apiClient.patch('/api/users/me/settings', { [key]: checked })
      toast.success('Settings updated')
    } catch (e) {
      toast.error('Failed to save setting')
      // Revert on error
      setSettings((prev: any) => ({ ...prev, [key]: !checked }))
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await apiClient.delete('/api/users/me')
      toast.success('Account scheduled for deletion. Logging out...')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (e) {
      toast.error('Failed to delete account')
    }
  }

  return (
    <motion.div
      className='space-y-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className='text-display-3 font-bold tracking-tight text-brand-navy'>
          Settings
        </h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          Manage your account, preferences, and platform configuration.
        </p>
      </motion.div>

      {/* Profile Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-6'>
              <Avatar
                src={session?.user?.image}
                fallback={session?.user?.name || session?.user?.email || '?'}
                size='lg'
                showRing
              />
              <div className='flex-1'>
                <h3 className='text-lg font-semibold text-foreground'>
                  {session?.user?.name || 'User'}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {session?.user?.email}
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  AutoPilot Developer
                </p>
              </div>
              <Button variant='outline' onClick={() => toast.success('Redirecting to Enterprise SSO Profile...')}>
                <Icons.externalLink className='mr-2 h-4 w-4' />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Health — real DB stats */}
      <motion.div variants={itemVariants}>
        <PlatformHealthCard stats={platformStats} />
      </motion.div>

      {/* Integrations + Quick Settings grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Integrations */}
        <motion.div variants={itemVariants}>
          <IntegrationsCard />
        </motion.div>

        {/* Quick Settings */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cornflower/10">
                  <Icons.settings className="h-5 w-5 text-brand-cornflower" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className='text-base'>Quick Settings</CardTitle>
                  <CardDescription className="text-xs">
                    Toggle notification preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='divide-y divide-border'>
              {isLoading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">Loading preferences...</div>
              ) : (
                <>
                  <SettingToggle
                    id='email_notifications'
                    label='Email Notifications'
                    description='Receive email notifications for important updates'
                    defaultChecked={settings?.email_notifications}
                    onChange={(checked) => handleToggle('email_notifications', checked)}
                  />
                  <SettingToggle
                    id='desktop_notifications'
                    label='Desktop Notifications'
                    description='Show desktop notifications when the app is open'
                    defaultChecked={settings?.desktop_notifications}
                    onChange={(checked) => handleToggle('desktop_notifications', checked)}
                  />
                  <SettingToggle
                    id='weekly_digest'
                    label='Weekly Digest'
                    description='Receive a weekly summary of your activity'
                    defaultChecked={settings?.weekly_digest}
                    onChange={(checked) => handleToggle('weekly_digest', checked)}
                  />
                  <SettingToggle
                    id='marketing_emails'
                    label='Marketing Emails'
                    description='Receive product updates and announcements'
                    defaultChecked={settings?.marketing_emails}
                    onChange={(checked) => handleToggle('marketing_emails', checked)}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
        <Card className='border-red-200'>
          <CardHeader>
            <CardTitle className='text-red-600'>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-foreground'>
                Delete Account
              </p>
              <p className='text-xs text-muted-foreground'>
                Permanently delete your account and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='outline'
                  className='border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                >
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 text-white hover:bg-red-700">
                    Yes, delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
