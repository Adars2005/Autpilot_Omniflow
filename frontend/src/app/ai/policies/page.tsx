'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CardWatermark } from '@/components/ui/card-watermark'
import { Icons } from '@/components/ui/icons'
import { PolicyCard, type Policy } from '@/components/ai/policies/PolicyCard'
import { PolicyDetailModal } from '@/components/ai/policies/PolicyDetailModal'
import { PolicyEditModal } from '@/components/ai/policies/PolicyEditModal'
import { CreateWithAI } from '@/components/ai/policies/CreateWithAI'
import { PermissionMatrixTab } from '@/components/ai/policies/PermissionMatrixTab'
import { StructuredBuilder } from '@/components/ai/policies/StructuredBuilder'
import { apiClient } from '@/lib/api-client'

// ============================================================================
// Types
// ============================================================================

type TabType = 'policies' | 'create-ai' | 'structured' | 'matrix'
type FilterType = 'all' | 'active' | 'inactive' | 'logical' | 'natural_language'
type SortType = 'newest' | 'oldest' | 'priority' | 'name' | 'executions'

// ============================================================================
// Tab Configuration
// ============================================================================

const TABS = [
  { id: 'policies' as TabType, label: 'Policies', Icon: Icons.layers },
  { id: 'create-ai' as TabType, label: 'Create with AI', Icon: Icons.sparkles },
  { id: 'structured' as TabType, label: 'Structured Builder', Icon: Icons.grid },
  { id: 'matrix' as TabType, label: 'Permission Matrix', Icon: Icons.table },
]

// ============================================================================
// Page Component
// ============================================================================

export default function AIPoliciesPage() {
  // State
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('policies')
  
  // Modal state
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Filters
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('newest')
  const [searchQuery, setSearchQuery] = useState('')

  // Structured builder state
  const [structuredDSL, setStructuredDSL] = useState<{conditions: Array<{field: string; operator: string; value: string}>; actions: Array<{type: string; value?: string}>; match_mode: 'all' | 'any'} | null>(null)
  const [structuredName, setStructuredName] = useState('')
  const [isSavingStructured, setIsSavingStructured] = useState(false)

  // ============================================================================
  // Data Loading — Static import, no dynamic import() overhead
  // ============================================================================

  const loadPolicies = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.get<Policy[]>('/api/policies')
      setPolicies(data && data.length > 0 ? data : [])
    } catch (error) {
      console.error('Failed to load policies from API', error)
      setPolicies([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPolicies()
  }, [loadPolicies])

  // ============================================================================
  // Policy Actions
  // ============================================================================

  const handleCardClick = useCallback((policy: Policy) => {
    setSelectedPolicy(policy)
    setIsDetailModalOpen(true)
  }, [])

  const handleEditFromDetail = useCallback((policy: Policy) => {
    setEditingPolicy(policy)
    setIsEditModalOpen(true)
  }, [])

  const handleSavePolicy = useCallback(async () => {
    loadPolicies()
  }, [loadPolicies])

  const togglePolicyStatus = useCallback(async (id: string, isActive: boolean) => {
    // Optimistic: update UI immediately
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, is_active: !isActive } : p))
    try {
      await apiClient.put(`/api/policies/${id}`, { is_active: !isActive })
    } catch (e) {
      console.error('Failed to toggle policy status', e)
      loadPolicies() // revert on failure
    }
  }, [loadPolicies])

  const deletePolicy = useCallback(async (id: string) => {
    // Optimistic: remove from UI immediately
    setPolicies(prev => prev.filter(p => p.id !== id))
    try {
      await apiClient.delete(`/api/policies/${id}`)
    } catch (e) {
      console.error('Failed to delete policy', e)
      loadPolicies() // revert on failure
    }
  }, [loadPolicies])

  const handlePolicyCreate = async (policyData: {
    name: string
    description: string
    naturalLanguage: string
    policyType: 'logical' | 'natural_language'
    dsl: unknown
    refinedInstruction: string | null
    entityName: string | null
    tags: string[]
    priority: number
  }) => {
    try {
      await apiClient.post('/api/policies', {
        name: policyData.name,
        description: policyData.description,
        natural_language: policyData.naturalLanguage,
        summary: policyData.description,
        policy_type: policyData.policyType,
        dsl: policyData.dsl,
        refined_instruction: policyData.refinedInstruction,
        ai_instruction: policyData.naturalLanguage,
        entity_name: policyData.entityName || 'content',
        is_active: true,
        priority: policyData.priority,
        tags: policyData.tags,
      })
      setActiveTab('policies')
      // Reload in background — don't block the tab switch
      loadPolicies()
    } catch (e) {
      console.error('Failed to create policy', e)
    }
  }

  // ============================================================================
  // Filtering & Sorting — Memoized to prevent recalculation on unrelated renders
  // ============================================================================

  const filteredPolicies = useMemo(() => {
    return policies
      .filter((policy) => {
        if (filter === 'active' && !policy.is_active) return false
        if (filter === 'inactive' && policy.is_active) return false
        if (filter === 'logical' && policy.policy_type !== 'logical') return false
        if (filter === 'natural_language' && policy.policy_type !== 'natural_language') return false

        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            policy.name.toLowerCase().includes(query) ||
            policy.description.toLowerCase().includes(query) ||
            policy.natural_language.toLowerCase().includes(query) ||
            policy.tags.some((tag) => tag.toLowerCase().includes(query))
          )
        }

        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case 'priority':
            return a.priority - b.priority
          case 'name':
            return a.name.localeCompare(b.name)
          case 'executions':
            return b.execution_count - a.execution_count
          default:
            return 0
        }
      })
  }, [policies, filter, sortBy, searchQuery])

  // ============================================================================
  // Stats — Memoized
  // ============================================================================

  const stats = useMemo(() => ({
    total: policies.length,
    active: policies.filter((p) => p.is_active).length,
    structured: policies.filter((p) => p.policy_type === 'logical').length,
    natural: policies.filter((p) => p.policy_type === 'natural_language').length,
  }), [policies])

  // ============================================================================
  // Render — Minimal animations for snappy UX
  // ============================================================================

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display-3 font-bold tracking-tight text-brand-navy lg:text-display-2">
            AI Policies
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Define business rules in natural language. The AI determines the best format.
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={() => setActiveTab('create-ai')}
          className={activeTab !== 'policies' ? 'opacity-50' : ''}
        >
          <Icons.plus className="mr-2 h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 p-1.5 bg-gray-100 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                activeTab === tab.id
                  ? 'text-brand-navy bg-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.Icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content — CSS transitions instead of AnimatePresence */}
      {activeTab === 'policies' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: stats.total, label: 'Total Policies', icon: Icons.layers, bg: 'bg-brand-navy/10', color: 'text-brand-navy' },
              { value: stats.active, label: 'Active', icon: Icons.check, bg: 'bg-emerald-100', color: 'text-emerald-600' },
              { value: stats.structured, label: 'Structured', icon: Icons.grid, bg: 'bg-blue-100', color: 'text-blue-600' },
              { value: stats.natural, label: 'Natural Language', icon: Icons.brain, bg: 'bg-purple-100', color: 'text-purple-600' },
            ].map((stat) => (
              <div 
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md transition-all duration-150 cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', stat.bg)}>
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                  <div>
                    <p className={cn('text-2xl font-bold', stat.color)}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policies..."
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-white',
                  'text-sm focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50'
                )}
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="logical">Structured</option>
                <option value="natural_language">Natural Language</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
                <option value="name">Name</option>
                <option value="executions">Most Used</option>
              </select>
            </div>
          </div>

          {/* Policy Grid */}
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Icons.loader className="h-8 w-8 animate-spin text-brand-cornflower" />
              </div>
            ) : filteredPolicies.length === 0 ? (
              <Card className="relative overflow-hidden">
                <CardWatermark opacity={3} scale={1} />
                <CardContent className="relative z-10 flex flex-col items-center justify-center py-16 text-center">
                  <div className={cn(
                    'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
                    'bg-gradient-to-br from-brand-cornflower/20 to-brand-purple/20'
                  )}>
                    <Icons.brain className="h-8 w-8 text-brand-cornflower" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-brand-navy">
                    {searchQuery || filter !== 'all' ? 'No matching policies' : 'No policies yet'}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {searchQuery || filter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Create your first AI policy using natural language.'}
                  </p>
                  <Button
                    variant="gradient"
                    className="mt-6"
                    onClick={() => setActiveTab('create-ai')}
                  >
                    <Icons.sparkles className="mr-2 h-4 w-4" />
                    Create with AI
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPolicies.map((policy) => (
                  <PolicyCard
                    key={policy.id}
                    policy={policy}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'create-ai' && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-150">
          <Card className="relative overflow-hidden">
            <CardWatermark opacity={2} scale={1} />
            <CardContent className="relative z-10 py-8">
              <CreateWithAI
                onPolicyCreate={handlePolicyCreate}
                onCancel={() => setActiveTab('policies')}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'structured' && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-150">
          <Card className="relative overflow-hidden">
            <CardWatermark opacity={2} scale={1} />
            <CardContent className="relative z-10 py-8">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-brand-navy mb-2">
                    Structured Rule Builder
                  </h2>
                  <p className="text-muted-foreground">
                    Visually build rules with conditions and actions
                  </p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Rule Name *</label>
                  <input
                    type="text"
                    value={structuredName}
                    onChange={(e) => setStructuredName(e.target.value)}
                    placeholder="e.g., Auto-Approve Low Value Items"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50"
                  />
                </div>
                <StructuredBuilder
                  onChange={(dsl) => setStructuredDSL(dsl)}
                />
                <div className="flex justify-center gap-3 mt-8">
                  <Button variant="ghost" onClick={() => setActiveTab('policies')}>
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    disabled={!structuredDSL || structuredDSL.conditions.length === 0 || !structuredName.trim() || isSavingStructured}
                    onClick={async () => {
                      if (!structuredDSL || !structuredName.trim()) return
                      setIsSavingStructured(true)
                      try {
                        await handlePolicyCreate({
                          name: structuredName.trim(),
                          description: '',
                          naturalLanguage: `Structured rule: ${structuredName}`,
                          policyType: 'logical',
                          dsl: {
                            conditions: structuredDSL.conditions.map(c => ({ field: c.field, operator: c.operator, value: c.value })),
                            actions: structuredDSL.actions.map(a => ({ type: a.type, value: a.value })),
                            match_mode: structuredDSL.match_mode,
                          },
                          refinedInstruction: null,
                          entityName: null,
                          tags: ['structured'],
                          priority: 50,
                        })
                        setStructuredName('')
                        setStructuredDSL(null)
                      } finally {
                        setIsSavingStructured(false)
                      }
                    }}
                  >
                    {isSavingStructured ? (
                      <><Icons.loader className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                    ) : (
                      <><Icons.check className="mr-2 h-4 w-4" />Save Policy</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-150">
          <PermissionMatrixTab />
        </div>
      )}

      {/* Detail Modal - View only */}
      <PolicyDetailModal
        policy={selectedPolicy}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedPolicy(null)
        }}
        onEdit={handleEditFromDetail}
        onToggleStatus={(id, isActive) => {
          togglePolicyStatus(id, isActive)
          setIsDetailModalOpen(false)
        }}
        onDelete={(id) => {
          deletePolicy(id)
          setIsDetailModalOpen(false)
        }}
      />

      {/* Edit Modal */}
      <PolicyEditModal
        policy={editingPolicy}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingPolicy(null)
        }}
        onSave={handleSavePolicy}
      />
    </div>
  )
}
