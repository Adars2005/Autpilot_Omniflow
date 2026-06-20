export interface StartupInput {
  name: string
  industry: string
  budget: string
  timeline: string
  targetCustomers: string
  fundingStage: string
  goals: string
  documentName?: string
}

export interface ReadinessScore {
  label: string
  score: number
  trend?: number
}

export interface Department {
  id: string
  name: string
  icon: string
  status: 'active' | 'idle' | 'processing'
  budget: number
  spent: number
  progress: number
  riskScore: number
  reputationScore: number
  outputSummary: string
  output: AgentOutput
}

export interface AgentOutput {
  title: string
  sections: OutputSection[]
  confidenceScore: number
  reasoning: string
  generatedAt: string
}

export interface OutputSection {
  heading: string
  items: string[]
}

export interface Investor {
  id: string
  name: string
  firm: string
  matchScore: number
  thesis: string
  stageFit: string
  industryFit: string
  warmIntroProbability: number
  recommendedOutreach: string
  portfolio: string[]
  checkSize: string
  focus: string[]
}

export interface Customer {
  id: string
  name: string
  type: 'potential' | 'design_partner' | 'pilot'
  leadScore: number
  expectedRevenue: number
  industry: string
  painPoints: string[]
  status: string
}

export interface EcosystemNode {
  id: string
  label: string
  type: 'investor' | 'advisor' | 'lawyer' | 'patent' | 'ca' | 'auditor' | 'partner' | 'expert' | 'company'
  description: string
}

export interface BoardMember {
  id: string
  name: string
  role: string
  opinion: string
  reasoning: string
  vote: 'approve' | 'reject' | 'conditional'
  recommendation: string
  decision: string
  confidence: number
}

export interface Wallet {
  id: string
  name: string
  balance: number
  budget: number
  spent: number
  color: string
}

export interface SpendRequest {
  id: string
  title: string
  department: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  description: string
}

export interface MonadActivity {
  id: string
  type: string
  hash: string
  timestamp: string
  description: string
}

export interface MemoryEntry {
  id: string
  category: string
  title: string
  date: string
  outcome: string
  roi?: string
  lesson: string
}

export interface ApprovalRequest {
  id: string
  type: 'campaign' | 'treasury' | 'hiring' | 'investor' | 'partnership'
  title: string
  description: string
  amount?: number
  requestedBy: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface CompanyState {
  startup: StartupInput
  readiness: ReadinessScore[]
  overallReadiness: number
  departments: Department[]
  investors: Investor[]
  customers: Customer[]
  ecosystem: { nodes: EcosystemNode[]; edges: { source: string; target: string }[] }
  board: BoardMember[]
  wallets: Wallet[]
  spendRequests: SpendRequest[]
  monadActivities: MonadActivity[]
  memory: MemoryEntry[]
  approvals: ApprovalRequest[]
  ceo: {
    mission: string
    vision: string
    roadmap: { phase: string; items: string[] }[]
    priorities: string[]
    risks: string[]
    nextActions: string[]
    recommendations: string[]
  }
}

export type AgentStatus = 'pending' | 'thinking' | 'researching' | 'analyzing' | 'simulating' | 'completed'

export interface DeployAgent {
  id: string
  name: string
  icon: string
  status: AgentStatus
}
