'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader } from '@/components/founderos/PageHeader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function DashboardSettingsPage() {
  const { company } = useFounderOS()

  return (
    <div>
      <PageHeader title="Settings" description="Company configuration and preferences" />

      <div className="max-w-xl space-y-6">
        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold text-white">Company Profile</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Startup Name</Label>
              <Input
                defaultValue={company.startup.name}
                className="mt-1.5 border-white/10 bg-white/5 text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Industry</Label>
              <Input
                defaultValue={company.startup.industry}
                className="mt-1.5 border-white/10 bg-white/5 text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Funding Stage</Label>
              <Input
                defaultValue={company.startup.fundingStage}
                className="mt-1.5 border-white/10 bg-white/5 text-white"
              />
            </div>
            <Button
              onClick={() => toast.success('Settings saved')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Save Changes
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold text-white">Redeploy Company</h3>
          <p className="mb-4 text-sm text-white/50">
            Upload a new pitch deck or startup idea to regenerate your autonomous company.
          </p>
          <Link href="/start">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
              Start New Deployment
            </Button>
          </Link>
        </GlassCard>
      </div>
    </div>
  )
}
