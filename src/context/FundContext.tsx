import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type MemberStatus = 'paid' | 'overdue' | 'grace'

export interface Member {
  id: string
  name: string
  score: number
  status: MemberStatus
  repaymentHistory: number[]
  totalContributed: number
  dueDate: string
  lastPaidOn: string | null
}

export interface ContributionRecord {
  id: string
  memberId: string
  memberName: string
  amount: number
  status: 'paid' | 'scheduled' | 'grace' | 'overdue'
  timestamp: string
  note: string
}

export interface AuctionBidRecord {
  bidder: string
  amount: number
  time: string
}

export interface AuctionResult {
  cycle: number
  winner: string
  winningBid: number
  payout: number
  groupDividend: number
  closedAt: string
}

interface AuctionState {
  isActive: boolean
  currentBid: number
  highestBidder: string | null
  timeLeft: number
  history: AuctionBidRecord[]
  poolAmount: number
  bidIncrement: number
  eligibleMembers: string[]
  previousWinners: { month: number; winner: string; amount: number }[]
  lastResult: AuctionResult | null
}

interface FundState {
  poolTotal: number
  monthlyInstallment: number
  currentCycle: number
  trustHealth: number
  members: Member[]
  auction: AuctionState
  contributionHistory: ContributionRecord[]
}

interface ContributionSummary {
  expectedThisCycle: number
  collectedThisCycle: number
  outstandingThisCycle: number
  collectionRate: number
  paidCount: number
  overdueCount: number
  graceCount: number
}

interface BidOutcome {
  ok: boolean
  message: string
}

interface FundContextType {
  state: FundState
  placeBid: (amount: number, bidder: string) => BidOutcome
  closeAuction: () => AuctionResult | null
  updateMemberStatus: (memberId: string, status: MemberStatus) => void
  payContribution: (memberId: string) => void
  bulkCollectDue: () => number
  recalculateTrust: () => void
  synthesizeBlueprint: (intent: string) => Promise<any>
  enforceProtocol: () => void
  contributionSummary: ContributionSummary
}

const STORAGE_KEY = 'arthanetra-fund-state'

const initialMembers: Member[] = [
  { id: '#ANT-2025-01', name: 'Arjun Mehta', score: 982, status: 'paid', repaymentHistory: [100, 100, 100], totalContributed: 40000, dueDate: '2026-04-05', lastPaidOn: '2026-04-01' },
  { id: '#ANT-2025-04', name: 'Sarah Jenkins', score: 945, status: 'overdue', repaymentHistory: [100, 100, 0], totalContributed: 30000, dueDate: '2026-04-05', lastPaidOn: '2026-03-07' },
  { id: '#ANT-2025-07', name: 'Rahul Varma', score: 890, status: 'paid', repaymentHistory: [100, 90, 100], totalContributed: 40000, dueDate: '2026-04-05', lastPaidOn: '2026-04-02' },
  { id: '#ANT-2025-09', name: 'Elena Rodriguez', score: 915, status: 'overdue', repaymentHistory: [100, 100, 0], totalContributed: 30000, dueDate: '2026-04-05', lastPaidOn: '2026-03-04' },
  { id: '#ANT-2025-12', name: 'Meera Kapur', score: 955, status: 'paid', repaymentHistory: [100, 100, 100], totalContributed: 40000, dueDate: '2026-04-05', lastPaidOn: '2026-04-03' },
  { id: '#ANT-2025-15', name: 'Vikram Sethi', score: 880, status: 'grace', repaymentHistory: [80, 90, 0], totalContributed: 30000, dueDate: '2026-04-05', lastPaidOn: '2026-03-10' },
]

const initialHistory: ContributionRecord[] = [
  {
    id: 'txn-001',
    memberId: '#ANT-2025-01',
    memberName: 'Arjun Mehta',
    amount: 10000,
    status: 'paid',
    timestamp: '2026-04-01T10:00:00.000Z',
    note: 'Cycle 4 contribution confirmed',
  },
  {
    id: 'txn-002',
    memberId: '#ANT-2025-07',
    memberName: 'Rahul Varma',
    amount: 10000,
    status: 'paid',
    timestamp: '2026-04-02T12:15:00.000Z',
    note: 'Cycle 4 contribution confirmed',
  },
  {
    id: 'txn-003',
    memberId: '#ANT-2025-15',
    memberName: 'Vikram Sethi',
    amount: 0,
    status: 'grace',
    timestamp: '2026-04-03T08:30:00.000Z',
    note: 'Grace period extended by fund admin',
  },
]

const initialState: FundState = {
  poolTotal: 120000,
  monthlyInstallment: 10000,
  currentCycle: 5,
  trustHealth: 87,
  members: initialMembers,
  auction: {
    isActive: true,
    currentBid: 104000,
    highestBidder: 'Priya Singh',
    timeLeft: 3600,
    history: [
      { bidder: 'Priya Singh', amount: 104000, time: '3 mins ago' },
      { bidder: 'Deepak S.', amount: 108000, time: '11 mins ago' },
      { bidder: 'Rahul Varma', amount: 112000, time: '18 mins ago' },
    ],
    poolAmount: 120000,
    bidIncrement: 1000,
    eligibleMembers: ['Rahul Varma', 'Priya Singh', 'Deepak S.', 'Vikram Sethi', 'Elena Rodriguez'],
    previousWinners: [
      { month: 4, winner: 'Meera Kapur', amount: 102000 },
      { month: 3, winner: 'Anita G.', amount: 106000 },
      { month: 2, winner: 'Rajesh M.', amount: 108000 },
    ],
    lastResult: null,
  },
  contributionHistory: initialHistory,
}

const FundContext = createContext<FundContextType | undefined>(undefined)

function normalizeState(rawState: Partial<FundState> | null | undefined): FundState {
  const rawAuction = (rawState?.auction ?? {}) as Partial<AuctionState>

  return {
    poolTotal: typeof rawState?.poolTotal === 'number' ? rawState.poolTotal : initialState.poolTotal,
    monthlyInstallment: typeof rawState?.monthlyInstallment === 'number' ? rawState.monthlyInstallment : initialState.monthlyInstallment,
    currentCycle: typeof rawState?.currentCycle === 'number' ? rawState.currentCycle : initialState.currentCycle,
    trustHealth: typeof rawState?.trustHealth === 'number' ? rawState.trustHealth : initialState.trustHealth,
    members: Array.isArray(rawState?.members) && rawState.members.length > 0 ? rawState.members : initialState.members,
    contributionHistory:
      Array.isArray(rawState?.contributionHistory) ? rawState.contributionHistory : initialState.contributionHistory,
    auction: {
      isActive: typeof rawAuction.isActive === 'boolean' ? rawAuction.isActive : initialState.auction.isActive,
      currentBid: typeof rawAuction.currentBid === 'number' ? rawAuction.currentBid : initialState.auction.currentBid,
      highestBidder:
        typeof rawAuction.highestBidder === 'string' || rawAuction.highestBidder === null
          ? rawAuction.highestBidder
          : initialState.auction.highestBidder,
      timeLeft: typeof rawAuction.timeLeft === 'number' ? rawAuction.timeLeft : initialState.auction.timeLeft,
      history: Array.isArray(rawAuction.history) && rawAuction.history.length > 0 ? rawAuction.history : initialState.auction.history,
      poolAmount: typeof rawAuction.poolAmount === 'number' ? rawAuction.poolAmount : initialState.auction.poolAmount,
      bidIncrement:
        typeof rawAuction.bidIncrement === 'number' ? rawAuction.bidIncrement : initialState.auction.bidIncrement,
      eligibleMembers:
        Array.isArray(rawAuction.eligibleMembers) && rawAuction.eligibleMembers.length > 0
          ? rawAuction.eligibleMembers
          : initialState.auction.eligibleMembers,
      previousWinners:
        Array.isArray(rawAuction.previousWinners) ? rawAuction.previousWinners : initialState.auction.previousWinners,
      lastResult: rawAuction.lastResult ?? initialState.auction.lastResult,
    },
  }
}

function restoreState(): FundState {
  if (typeof window === 'undefined') return initialState
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return initialState

  try {
    return normalizeState(JSON.parse(raw) as Partial<FundState>)
  } catch {
    return initialState
  }
}

function appendHistoryRecord(
  history: ContributionRecord[],
  member: Member,
  amount: number,
  status: ContributionRecord['status'],
  note: string,
) {
  const record: ContributionRecord = {
    id: `txn-${Date.now()}-${member.id}`,
    memberId: member.id,
    memberName: member.name,
    amount,
    status,
    timestamp: new Date().toISOString(),
    note,
  }
  return [record, ...history].slice(0, 50)
}

function formatRelativeTime(date: Date) {
  return `${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
}

function settleAuction(prev: FundState): FundState {
  if (prev.auction.lastResult || prev.auction.history.length === 0) {
    return {
      ...prev,
      auction: {
        ...prev.auction,
        isActive: false,
        timeLeft: 0,
      },
    }
  }

  const winningBid = prev.auction.currentBid
  const winner = prev.auction.highestBidder ?? prev.auction.history[0]?.bidder ?? 'Pending'
  const payout = winningBid
  const groupDividend = Math.max(prev.auction.poolAmount - winningBid, 0)
  const result: AuctionResult = {
    cycle: prev.currentCycle,
    winner,
    winningBid,
    payout,
    groupDividend,
    closedAt: new Date().toISOString(),
  }

  return {
    ...prev,
    auction: {
      ...prev.auction,
      isActive: false,
      timeLeft: 0,
      eligibleMembers: prev.auction.eligibleMembers.filter((name) => name !== winner),
      previousWinners: [
        { month: prev.currentCycle, winner, amount: winningBid },
        ...prev.auction.previousWinners,
      ].slice(0, 6),
      lastResult: result,
    },
  }
}

export function FundProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FundState>(restoreState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const timer = setInterval(() => {
      setState((prev) => {
        if (!prev.auction.isActive) return prev

        if (prev.auction.timeLeft <= 1) {
          return settleAuction(prev)
        }

        return {
          ...prev,
          auction: {
            ...prev.auction,
            timeLeft: Math.max(0, prev.auction.timeLeft - 1),
          },
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const contributionSummary = useMemo<ContributionSummary>(() => {
    const expectedThisCycle = state.members.length * state.monthlyInstallment
    const paidCount = state.members.filter((member) => member.status === 'paid').length
    const overdueCount = state.members.filter((member) => member.status === 'overdue').length
    const graceCount = state.members.filter((member) => member.status === 'grace').length
    const collectedThisCycle = paidCount * state.monthlyInstallment
    const outstandingThisCycle = expectedThisCycle - collectedThisCycle
    const collectionRate = expectedThisCycle === 0 ? 0 : Math.round((collectedThisCycle / expectedThisCycle) * 100)

    return {
      expectedThisCycle,
      collectedThisCycle,
      outstandingThisCycle,
      collectionRate,
      paidCount,
      overdueCount,
      graceCount,
    }
  }, [state])

  const placeBid = (amount: number, bidder: string): BidOutcome => {
    let outcome: BidOutcome = { ok: false, message: 'Unable to submit bid.' }

    setState((prev) => {
      if (!prev.auction.isActive) {
        outcome = { ok: false, message: 'This auction is already closed.' }
        return prev
      }

      if (!prev.auction.eligibleMembers.includes(bidder)) {
        outcome = { ok: false, message: 'This bidder is not eligible for the current cycle.' }
        return prev
      }

      if (amount >= prev.auction.currentBid) {
        outcome = {
          ok: false,
          message: `Reverse auction is active. Your bid must be lower than Rs ${prev.auction.currentBid.toLocaleString('en-IN')}.`,
        }
        return prev
      }

      if (prev.auction.currentBid - amount < prev.auction.bidIncrement) {
        outcome = {
          ok: false,
          message: `Each new bid must beat the current bid by at least Rs ${prev.auction.bidIncrement.toLocaleString('en-IN')}.`,
        }
        return prev
      }

      if (amount <= 0 || amount > prev.auction.poolAmount) {
        outcome = { ok: false, message: 'Bid amount must stay within the available pool.' }
        return prev
      }

      outcome = { ok: true, message: 'Bid accepted. You are now leading the auction.' }

      return {
        ...prev,
        auction: {
          ...prev.auction,
          currentBid: amount,
          highestBidder: bidder,
          history: [
            { bidder, amount, time: formatRelativeTime(new Date()) },
            ...prev.auction.history,
          ].slice(0, 12),
        },
      }
    })

    return outcome
  }

  const closeAuction = () => {
    let result: AuctionResult | null = null

    setState((prev) => {
      const nextState = settleAuction(prev)
      result = nextState.auction.lastResult
      return nextState
    })

    return result
  }

  const updateMemberStatus = (memberId: string, status: MemberStatus) => {
    setState((prev) => {
      const target = prev.members.find((member) => member.id === memberId)
      if (!target || target.status === status) return prev

      const members = prev.members.map((member) =>
        member.id === memberId ? { ...member, status } : member,
      )

      return {
        ...prev,
        members,
        contributionHistory: appendHistoryRecord(
          prev.contributionHistory,
          target,
          status === 'paid' ? prev.monthlyInstallment : 0,
          status,
          status === 'paid'
            ? 'Contribution manually marked as paid'
            : `Member moved to ${status} status`,
        ),
      }
    })
  }

  const payContribution = (memberId: string) => {
    setState((prev) => {
      const member = prev.members.find((entry) => entry.id === memberId)
      if (!member || member.status === 'paid') return prev

      const updatedMembers = prev.members.map((entry) => {
        if (entry.id !== memberId) return entry

        const updatedHistory = [...entry.repaymentHistory, 100]
        const avg = updatedHistory.reduce((sum, value) => sum + value, 0) / updatedHistory.length

        return {
          ...entry,
          status: 'paid' as const,
          repaymentHistory: updatedHistory,
          totalContributed: entry.totalContributed + prev.monthlyInstallment,
          lastPaidOn: new Date().toISOString(),
          score: Math.min(1000, Math.round(avg * 7 + 300)),
        }
      })

      const trustHealth = Math.round(
        updatedMembers.reduce((sum, entry) => sum + entry.score, 0) / (updatedMembers.length * 10),
      )

      return {
        ...prev,
        members: updatedMembers,
        trustHealth,
        poolTotal: prev.poolTotal + prev.monthlyInstallment,
        contributionHistory: appendHistoryRecord(
          prev.contributionHistory,
          member,
          prev.monthlyInstallment,
          'paid',
          'Contribution collected successfully',
        ),
      }
    })
  }

  const bulkCollectDue = () => {
    let processed = 0

    setState((prev) => {
      const membersToCollect = prev.members.filter((member) => member.status !== 'paid')
      if (membersToCollect.length === 0) return prev

      processed = membersToCollect.length

      const updatedMembers = prev.members.map((member) => {
        if (member.status === 'paid') return member
        const updatedHistory = [...member.repaymentHistory, 100]
        const avg = updatedHistory.reduce((sum, value) => sum + value, 0) / updatedHistory.length

        return {
          ...member,
          status: 'paid' as const,
          repaymentHistory: updatedHistory,
          totalContributed: member.totalContributed + prev.monthlyInstallment,
          lastPaidOn: new Date().toISOString(),
          score: Math.min(1000, Math.round(avg * 7 + 300)),
        }
      })

      const trustHealth = Math.round(
        updatedMembers.reduce((sum, member) => sum + member.score, 0) / (updatedMembers.length * 10),
      )

      const history = membersToCollect.reduce(
        (records, member) =>
          appendHistoryRecord(records, member, prev.monthlyInstallment, 'paid', 'Collected through bulk contribution'),
        prev.contributionHistory,
      )

      return {
        ...prev,
        members: updatedMembers,
        trustHealth,
        poolTotal: prev.poolTotal + membersToCollect.length * prev.monthlyInstallment,
        contributionHistory: history,
      }
    })

    return processed
  }

  const recalculateTrust = () => {
    setState((prev) => {
      const updatedMembers = prev.members.map((member) => {
        const factors = {
          repayment: member.repaymentHistory.reduce((sum, value) => sum + value, 0) / member.repaymentHistory.length,
          consistency: 100 - (member.status === 'overdue' ? 20 : member.status === 'grace' ? 10 : 0),
          liquidity: 90,
          socialProxy: 95,
          aiSentiment: 88,
        }
        const score =
          factors.repayment * 0.4 +
          factors.consistency * 0.3 +
          factors.liquidity * 0.1 +
          factors.socialProxy * 0.1 +
          factors.aiSentiment * 0.1

        return { ...member, score: Math.round(score * 10) }
      })

      const trustHealth = Math.round(
        updatedMembers.reduce((sum, member) => sum + member.score, 0) / (updatedMembers.length * 10),
      )

      return { ...prev, members: updatedMembers, trustHealth }
    })
  }

  const synthesizeBlueprint = async (intent: string) => {
    console.log('Synthesizing blueprint for:', intent)
    return {
      pool: 500000,
      monthly: 5000,
      risk: 'Low',
    }
  }

  const enforceProtocol = () => {
    setState((prev) => {
      const overdueMembers = prev.members.filter((member) => member.status === 'overdue')
      if (overdueMembers.length === 0) return prev

      const updatedMembers = prev.members.map((member) => {
        if (member.status === 'overdue') {
          return { ...member, score: Math.max(0, member.score - 50) }
        }
        return { ...member, score: Math.min(1000, member.score + 5) }
      })

      const trustHealth = Math.round(
        updatedMembers.reduce((sum, member) => sum + member.score, 0) / (updatedMembers.length * 10),
      )

      return { ...prev, members: updatedMembers, trustHealth }
    })
  }

  return (
    <FundContext.Provider
      value={{
        state,
        placeBid,
        closeAuction,
        updateMemberStatus,
        payContribution,
        bulkCollectDue,
        recalculateTrust,
        synthesizeBlueprint,
        enforceProtocol,
        contributionSummary,
      }}
    >
      {children}
    </FundContext.Provider>
  )
}

export function useFund() {
  const context = useContext(FundContext)
  if (!context) throw new Error('useFund must be used within a FundProvider')
  return context
}
