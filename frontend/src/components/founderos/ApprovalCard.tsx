'use client'

import { GlassCard } from './GlassCard'
import { Button } from '@/components/ui/button'
import { useFounderOS } from '@/lib/founderos/context'
import type { ApprovalRequest } from '@/lib/founderos/types'
import { cn } from '@/lib/utils'
import {
  Megaphone,
  Wallet,
  UserPlus,
  Handshake,
  TrendingUp,
  Check,
  X,
  Link2,
} from 'lucide-react'

const typeIcons = {
  campaign: Megaphone,
  treasury: Wallet,
  hiring: UserPlus,
  investor: TrendingUp,
  partnership: Handshake,
}

const typeLabels = {
  campaign: 'Campaign Approval',
  treasury: 'Treasury Approval',
  hiring: 'Hiring Approval',
  investor: 'Investor Outreach',
  partnership: 'Partnership Approval',
}

interface ApprovalCardProps {
  request: ApprovalRequest
  className?: string
}

export function ApprovalCard({ request, className }: ApprovalCardProps) {
  const { approveRequest, rejectRequest } = useFounderOS()
  const Icon = typeIcons[request.type]
  const isPending = request.status === 'pending'

  return (
    <GlassCard
      className={cn(
        'p-5',
        request.status === 'approved' && 'border-green-500/30',
        request.status === 'rejected' && 'border-red-500/30 opacity-60',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
          <Icon className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-300/80">
            {typeLabels[request.type]}
          </p>
          <h4 className="mt-1 font-semibold text-white">{request.title}</h4>
          <p className="mt-1 text-sm text-white/60">{request.description}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
            <span>Requested by {request.requestedBy}</span>
            {request.amount && (
              <span className="font-medium text-white/70">
                ${request.amount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        {!isPending && (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              request.status === 'approved'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            )}
          >
            {request.status}
          </span>
        )}
      </div>

      {isPending && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => approveRequest(request.id)}
            className="bg-green-600/80 hover:bg-green-600 text-white"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => rejectRequest(request.id)}
            className="border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => approveRequest(request.id, true)}
            className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
          >
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            Approve & Record on Monad
          </Button>
        </div>
      )}
    </GlassCard>
  )
}
