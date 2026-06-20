'use client'

import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: number
  label?: string
  className?: string
}

export function ScoreRing({ score, size = 120, label, className }: ScoreRingProps) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#22c55e' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/50">/ 100</span>
        </div>
      </div>
      {label && <span className="text-sm text-white/70">{label}</span>}
    </div>
  )
}
