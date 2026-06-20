import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glow?: boolean
  hover?: boolean
}

export function GlassCard({ children, className, glow, hover, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        glow && 'shadow-[0_0_40px_rgba(99,102,241,0.15)]',
        hover && 'transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
