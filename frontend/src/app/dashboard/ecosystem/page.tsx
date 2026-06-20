'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFounderOS } from '@/lib/founderos/context'
import { PageHeader } from '@/components/founderos/PageHeader'
import { GlassCard } from '@/components/founderos/GlassCard'

const nodeColors: Record<string, string> = {
  company: '#6366f1',
  investor: '#22c55e',
  advisor: '#8b5cf6',
  lawyer: '#f59e0b',
  patent: '#06b6d4',
  ca: '#ec4899',
  auditor: '#64748b',
  partner: '#14b8a6',
  expert: '#a855f7',
}

export default function EcosystemPage() {
  const { company } = useFounderOS()
  const { nodes: ecoNodes, edges: ecoEdges } = company.ecosystem

  const initialNodes: Node[] = useMemo(
    () =>
      ecoNodes.map((n, i) => {
        const angle = (i / ecoNodes.length) * 2 * Math.PI
        const radius = n.id === 'company' ? 0 : 220
        return {
          id: n.id,
          data: { label: n.label, type: n.type, description: n.description },
          position: {
            x: 300 + Math.cos(angle) * radius,
            y: 250 + Math.sin(angle) * radius,
          },
          style: {
            background: nodeColors[n.type] || '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '10px 16px',
            fontSize: 12,
            fontWeight: 600,
            minWidth: 120,
            textAlign: 'center' as const,
            boxShadow: `0 0 20px ${nodeColors[n.type]}40`,
          },
        }
      }),
    [ecoNodes]
  )

  const initialEdges: Edge[] = useMemo(
    () =>
      ecoEdges.map((e) => ({
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        style: { stroke: 'rgba(99,102,241,0.4)', strokeWidth: 2 },
        animated: true,
      })),
    [ecoEdges]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onInit = useCallback(() => {}, [])

  return (
    <div>
      <PageHeader
        title="Ecosystem"
        description="Investors, advisors, partners, and experts in your network"
      />

      <GlassCard className="mb-4 overflow-hidden p-0" style={{ height: 520 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(255,255,255,0.05)" gap={20} />
          <Controls className="!bg-[#0a0a14] !border-white/10 !shadow-none [&>button]:!bg-white/5 [&>button]:!border-white/10 [&>button]:!text-white" />
          <MiniMap
            nodeColor={(n) => nodeColors[(n.data as { type: string }).type] || '#6366f1'}
            maskColor="rgba(0,0,0,0.8)"
            className="!bg-[#0a0a14] !border-white/10"
          />
        </ReactFlow>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ecoNodes.filter((n) => n.id !== 'company').map((n) => (
          <GlassCard key={n.id} className="p-4">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: nodeColors[n.type] }}
              />
              <h4 className="text-sm font-medium text-white">{n.label}</h4>
            </div>
            <p className="mt-1 text-xs capitalize text-white/40">{n.type}</p>
            <p className="mt-2 text-xs text-white/60">{n.description}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
