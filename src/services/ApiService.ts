const API_BASE = 'http://127.0.0.1:8001/api'

export type SynthesizePayload = {
  intent: string
  groupSize: number
  durationMonths: number
}

export type BlueprintResponse = {
  fundName: string
  summary: string
  poolTotal: string
  monthlyInstallment: string
  riskLevel: string
  dividendEstimate: string
  confidence: string
}

export type LiveMember = {
  id: string
  name: string
  email: string
  picture?: string | null
  score: number
  status: 'paid' | 'overdue' | 'grace'
  repaymentHistory: number[]
  totalContributed: number
  dueDate: string
  lastPaidOn: string | null
  walletBalance: number
  isCurrentUser?: boolean
}

export type LiveContributionRecord = {
  id: string
  memberId: string
  memberName: string
  amount: number
  status: 'paid' | 'scheduled' | 'grace' | 'overdue'
  timestamp: string
  note: string
}

export type LiveAuctionBidRecord = {
  bidder: string
  bidder_email: string
  amount: number
  time: string
}

export type LiveAuctionResult = {
  cycle: number
  winner: string
  winnerEmail: string
  winningBid: number
  payout: number
  groupDividend: number
  bonusPerMember: number
  closedAt: string
}

export type LiveFundState = {
  fundId: string
  fundName: string
  fundCode: string
  purpose: string
  groupSizeTarget: number
  durationMonths: number
  memberCount: number
  availableSlots: number
  poolTotal: number
  monthlyInstallment: number
  currentCycle: number
  trustHealth: number
  members: LiveMember[]
  auction: {
    isActive: boolean
    currentBid: number
    highestBidder: string | null
    highestBidderEmail?: string | null
    timeLeft: number
    history: LiveAuctionBidRecord[]
    poolAmount: number
    bidIncrement: number
    eligibleMembers: string[]
    previousWinners: { month: number; winner: string; winner_email?: string; amount: number }[]
    lastResult: LiveAuctionResult | null
  }
  contributionHistory: LiveContributionRecord[]
  activity: {
    id: string
    title: string
    detail: string
    type: string
    timestamp: string
  }[]
  myWalletBalance: number
  myMemberId: string | null
  isCreator: boolean
  creatorName: string
}

export type PublicFundCard = {
  fundId: string
  fundName: string
  purpose: string
  creatorName: string
  memberCount: number
  availableSlots: number
  durationMonths: number
  monthlyInstallment: number
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || `Request failed with status ${response.status}`)
  }
  return payload as T
}

export const ApiService = {
  async synthesize(payload: SynthesizePayload): Promise<BlueprintResponse> {
    const response = await fetch(`${API_BASE}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<BlueprintResponse>(response)
  },

  async registerGoogleUser(user: { id: string; name: string; email: string; picture?: string }) {
    const response = await fetch(`${API_BASE}/auth/google-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    })
    return parseResponse<{ user: { id: string; name: string; email: string; picture?: string; provider: 'google' } }>(response)
  },

  async createFund(payload: {
    fundName: string
    purpose: string
    groupSize: number
    durationMonths: number
    monthlyInstallment: number
    joinPassword: string
    creatorName: string
    creatorEmail: string
    creatorPicture?: string
  }) {
    const response = await fetch(`${API_BASE}/funds/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<{ message: string; fund: LiveFundState }>(response)
  },

  async joinFund(payload: {
    code: string
    password: string
    name: string
    email: string
    picture?: string
  }) {
    const response = await fetch(`${API_BASE}/funds/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<{ message: string; fund: LiveFundState }>(response)
  },

  async inviteMember(fundId: string, payload: { recipientEmail: string; inviterEmail: string; inviterName: string }) {
    const response = await fetch(`${API_BASE}/funds/${fundId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<{ message: string; fund: LiveFundState }>(response)
  },

  async listFundsForUser(email: string) {
    const response = await fetch(`${API_BASE}/funds/by-user?email=${encodeURIComponent(email)}`)
    return parseResponse<{ funds: Array<{ fundId: string; fundName: string; fundCode: string; memberCount: number; currentCycle: number; poolTotal: number }> }>(response)
  },

  async listPublicFunds() {
    const response = await fetch(`${API_BASE}/funds/public`)
    return parseResponse<{ funds: PublicFundCard[] }>(response)
  },

  async requestJoinCodeEmail(fundId: string, payload: { recipientEmail: string; recipientName: string }) {
    const response = await fetch(`${API_BASE}/funds/${fundId}/request-join-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<{ message: string }>(response)
  },

  async getFund(fundId: string, email?: string) {
    const query = email ? `?email=${encodeURIComponent(email)}` : ''
    const response = await fetch(`${API_BASE}/funds/${fundId}${query}`)
    return parseResponse<{ fund: LiveFundState }>(response)
  },

  async payContribution(fundId: string, memberId: string) {
    const response = await fetch(`${API_BASE}/funds/${fundId}/contributions/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    return parseResponse<{ message: string; fund: LiveFundState }>(response)
  },

  async bulkCollect(fundId: string) {
    const response = await fetch(`${API_BASE}/funds/${fundId}/contributions/bulk`, {
      method: 'POST',
    })
    return parseResponse<{ message: string; processed: number; fund: LiveFundState }>(response)
  },

  async updateMemberStatus(fundId: string, memberId: string, status: 'paid' | 'grace' | 'overdue') {
    const response = await fetch(`${API_BASE}/funds/${fundId}/members/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, status }),
    })
    return parseResponse<{ message: string; fund: LiveFundState }>(response)
  },

  async placeLiveBid(fundId: string, payload: { bidderEmail: string; bidderName: string; amount: number }) {
    const response = await fetch(`${API_BASE}/funds/${fundId}/auction/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<{ message: string; fund: LiveFundState }>(response)
  },

  async closeLiveAuction(fundId: string) {
    const response = await fetch(`${API_BASE}/funds/${fundId}/auction/close`, {
      method: 'POST',
    })
    return parseResponse<{ message: string; result: LiveAuctionResult; fund: LiveFundState }>(response)
  },
}
