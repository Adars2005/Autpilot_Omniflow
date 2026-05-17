import { Icons } from '@/components/ui/icons'

export default function Loading() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute h-full w-full animate-ping rounded-full bg-brand-cornflower/20"></div>
        <Icons.loader className="relative h-8 w-8 animate-spin text-brand-cornflower" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Workspace...</p>
    </div>
  )
}
