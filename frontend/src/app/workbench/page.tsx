'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

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

interface WorkbenchException {
  id: string
  title: string
  description: string
  exception_type: string
  entity_id: string | null
  ai_recommendation: string | null
  confidence_score: number | null
  status: string
  context_data: Record<string, unknown> | null
  created_at: string
}

export default function WorkbenchPage() {
  const router = useRouter()
  const [exceptions, setExceptions] = useState<WorkbenchException[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<WorkbenchException | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const loadExceptions = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.get<WorkbenchException[]>('/api/workbench')
      const pending = data.filter(e => e.status === 'pending')
      const sessionId = new URLSearchParams(window.location.search).get('session')
      setExceptions(pending)
      if (sessionId) {
        setSelectedItem(pending.find(e => e.entity_id === sessionId) || null)
      }
    } catch (error) {
      console.error('Failed to load exceptions', error)
      setExceptions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadExceptions()
  }, [loadExceptions])

  const handleAction = async (id: string, action: string) => {
    setResolvingId(id)
    try {
      const resolved = await apiClient.put<WorkbenchException>(`/api/workbench/${id}`, {
        status: action,
      })
      setExceptions(prev => prev.filter(e => e.id !== id))
      setSelectedItem(null)
      setResolvingId(null)

      if (action === 'approved' && resolved.entity_id) {
        router.push(`/ai/manager?resume=${resolved.entity_id}`)
      }
    } catch (error) {
      console.error('Action failed', error)
      setResolvingId(null)
    }
  }

  return (
    <motion.div
      className='space-y-8 flex flex-col h-full'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <motion.div variants={itemVariants}>
        <h1 className='text-display-3 font-bold tracking-tight text-brand-navy'>
          Exception Queue
        </h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          Review and resolve cases where the AI requires human judgment.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Queue List */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Icons.list className="h-5 w-5 text-brand-cornflower" />
            Pending Review ({exceptions.length})
          </h2>
          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
            {isLoading ? (
               <div className="flex justify-center p-8"><Icons.loader className="animate-spin text-brand-cornflower" /></div>
            ) : exceptions.length === 0 ? (
               <Card className="bg-emerald-50 border-emerald-200">
                 <CardContent className="p-6 text-center text-emerald-800">
                   <Icons.checkCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                   <p className="font-medium">All caught up!</p>
                   <p className="text-sm mt-1">No exceptions waiting for review.</p>
                 </CardContent>
               </Card>
            ) : (
              exceptions.map(exc => (
                <Card 
                  key={exc.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:border-brand-cornflower",
                    selectedItem?.id === exc.id ? "border-brand-cornflower shadow-md bg-blue-50/50" : ""
                  )}
                  onClick={() => setSelectedItem(exc)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        {exc.exception_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(exc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <h3 className="font-medium text-brand-navy line-clamp-1">{exc.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{exc.description}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>

        {/* Detail Panel */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full border-brand-navy/10 shadow-lg">
                  <CardHeader className="bg-brand-navy/5 border-b border-brand-navy/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{selectedItem.title}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          <Icons.clock className="h-4 w-4" /> 
                          Generated {new Date(selectedItem.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                        <Icons.sparkles className="h-4 w-4 text-brand-purple" />
                        <span className="text-sm font-medium">AI Confidence:</span>
                        <span className={cn(
                          "font-bold",
                          (selectedItem.confidence_score || 0) > 0.8 ? "text-emerald-600" : "text-amber-600"
                        )}>{Math.round((selectedItem.confidence_score || 0) * 100)}%</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Context</h4>
                      <p className="text-brand-navy text-lg">{selectedItem.description}</p>
                    </div>
                    
                    {selectedItem.ai_recommendation && (
                      <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl p-5">
                        <h4 className="flex items-center gap-2 text-brand-purple font-semibold mb-2">
                          <Icons.bot className="h-5 w-5" /> AI Recommendation
                        </h4>
                        <p className="text-brand-navy">{selectedItem.ai_recommendation}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <Button 
                        onClick={() => handleAction(selectedItem.id, 'approved')} 
                        disabled={resolvingId === selectedItem.id}
                        className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                      >
                        {resolvingId === selectedItem.id ? (
                          <span className="flex items-center gap-2"><Icons.loader className="h-4 w-4 animate-spin" /> Returning to Orchestrator...</span>
                        ) : (
                          <span className="flex items-center"><Icons.check className="mr-2 h-4 w-4" /> Approve & Continue</span>
                        )}
                      </Button>
                      <Button onClick={() => handleAction(selectedItem.id, 'modified')} variant="outline" disabled={resolvingId === selectedItem.id} className="flex-1 border-amber-200 hover:bg-amber-50 hover:text-amber-700">
                        <Icons.edit className="mr-2 h-4 w-4" /> Modify & Resolve
                      </Button>
                      <Button onClick={() => handleAction(selectedItem.id, 'rejected')} variant="outline" disabled={resolvingId === selectedItem.id} className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-700">
                        <Icons.x className="mr-2 h-4 w-4" /> Reject AI Action
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl border-gray-200 bg-gray-50/50">
                <Icons.inbox className="h-12 w-12 mb-4 text-gray-300" />
                <p>Select an item from the queue to review.</p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  )
}
