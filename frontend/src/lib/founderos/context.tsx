'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { generateCompanyState, DEFAULT_STARTUP } from './mock-data'
import type { CompanyState, StartupInput } from './types'

interface FounderOSContextValue {
  company: CompanyState
  setStartup: (input: StartupInput) => void
  isDeployed: boolean
  setDeployed: (v: boolean) => void
  approveRequest: (id: string, recordOnMonad?: boolean) => void
  rejectRequest: (id: string) => void
}

const FounderOSContext = createContext<FounderOSContextValue | null>(null)

export function FounderOSProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanyState>(() => generateCompanyState())
  const [isDeployed, setDeployed] = useState(false)

  const setStartup = useCallback((input: StartupInput) => {
    setCompany(generateCompanyState(input))
  }, [])

  const approveRequest = useCallback((id: string, recordOnMonad?: boolean) => {
    setCompany((prev) => ({
      ...prev,
      approvals: prev.approvals.map((a) =>
        a.id === id ? { ...a, status: 'approved' as const } : a
      ),
      spendRequests: prev.spendRequests.map((s) =>
        s.id === id.replace('ap', 'sr') ? { ...s, status: 'approved' as const } : s
      ),
      monadActivities: recordOnMonad
        ? [
            {
              id: `m-${Date.now()}`,
              type: 'Approval Recorded',
              hash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
              description: `Approval ${id} recorded on Monad governance ledger`,
            },
            ...prev.monadActivities,
          ]
        : prev.monadActivities,
    }))
  }, [])

  const rejectRequest = useCallback((id: string) => {
    setCompany((prev) => ({
      ...prev,
      approvals: prev.approvals.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const } : a
      ),
    }))
  }, [])

  return (
    <FounderOSContext.Provider
      value={{
        company,
        setStartup,
        isDeployed,
        setDeployed,
        approveRequest,
        rejectRequest,
      }}
    >
      {children}
    </FounderOSContext.Provider>
  )
}

export function useFounderOS() {
  const ctx = useContext(FounderOSContext)
  if (!ctx) throw new Error('useFounderOS must be used within FounderOSProvider')
  return ctx
}

export { DEFAULT_STARTUP }
