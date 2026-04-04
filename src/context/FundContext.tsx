import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { ApiService, type LiveFundState, type LiveAuctionResult, type LiveMember } from '../services/ApiService'

export type MemberStatus = 'paid' | 'overdue' | 'grace'
export type Member = LiveMember

export interface ContributionSummary {
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
  state: LiveFundState
  activeFundId: string | null
  hasActiveFund: boolean
  fundLoading: boolean
  notifications: Array<{
    id: string
    title: string
    detail: string
    type: string
    timestamp: string
    unread: boolean
  }>
  unreadNotificationCount: number
  latestToast: {
    id: string
    title: string
    detail: string
    type: string
  } | null
  markNotificationsRead: () => void
  dismissToast: () => void
  sendInviteEmail: (recipientEmail: string) => Promise<string>
  createLiveFund: (payload: {
    fundName: string
    purpose: string
    groupSize: number
    durationMonths: number
    monthlyInstallment: number
  }) => Promise<{ error: string | null; fund: LiveFundState | null }>
  joinLiveFund: (payload: { code: string }) => Promise<{ error: string | null; fund: LiveFundState | null }>
  refreshFund: () => Promise<void>
  placeBid: (amount: number) => Promise<BidOutcome>
  closeAuction: () => Promise<LiveAuctionResult | null>
  updateMemberStatus: (memberId: string, status: MemberStatus) => Promise<string>
  payContribution: (memberId: string) => Promise<string>
  bulkCollectDue: () => Promise<number>
  recalculateTrust: () => void
  synthesizeBlueprint: (intent: string) => Promise<any>
  enforceProtocol: () => void
  contributionSummary: ContributionSummary
}

const ACTIVE_FUND_KEY = 'arthanetra-active-fund-id'

const emptyState: LiveFundState = {
  fundId: '',
  fundName: 'No Fund Yet',
  fundCode: '',
  purpose: '',
  groupSizeTarget: 0,
  durationMonths: 0,
  memberCount: 0,
  availableSlots: 0,
  poolTotal: 0,
  monthlyInstallment: 0,
  currentCycle: 1,
  trustHealth: 0,
  members: [],
  auction: {
    isActive: false,
    currentBid: 0,
    highestBidder: null,
    highestBidderEmail: null,
    timeLeft: 0,
    history: [],
    poolAmount: 0,
    bidIncrement: 0,
    eligibleMembers: [],
    previousWinners: [],
    lastResult: null,
  },
  contributionHistory: [],
  activity: [],
  myWalletBalance: 0,
  myMemberId: null,
  isCreator: false,
  creatorName: '',
}

const FundContext = createContext<FundContextType | undefined>(undefined)

function readStoredFundId() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACTIVE_FUND_KEY)
}

export function FundProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<LiveFundState>(emptyState)
  const [activeFundId, setActiveFundId] = useState<string | null>(readStoredFundId)
  const [fundLoading, setFundLoading] = useState(false)
  const [notifications, setNotifications] = useState<FundContextType['notifications']>([])
  const [latestToast, setLatestToast] = useState<FundContextType['latestToast']>(null)

  const setActiveFund = (fund: LiveFundState | null) => {
    if (!fund) {
      setState(emptyState)
      setActiveFundId(null)
      setNotifications([])
      setLatestToast(null)
      window.localStorage.removeItem(ACTIVE_FUND_KEY)
      return
    }

    setState(fund)
    setActiveFundId(fund.fundId)
    window.localStorage.setItem(ACTIVE_FUND_KEY, fund.fundId)
  }

  useEffect(() => {
    if (!state.fundId) {
      setNotifications([])
      return
    }

    setNotifications((previous) => {
      if (previous.length === 0) {
        return state.activity.map((item) => ({ ...item, unread: false }))
      }

      const previousMap = new Map(previous.map((item) => [item.id, item]))
      const nextNotifications = state.activity.map((item) => ({
        ...item,
        unread: previousMap.has(item.id) ? Boolean(previousMap.get(item.id)?.unread) : true,
      }))

      const newest = nextNotifications[0]
      if (newest && !previousMap.has(newest.id)) {
        setLatestToast({
          id: newest.id,
          title: newest.title,
          detail: newest.detail,
          type: newest.type,
        })
      }

      return nextNotifications
    })
  }, [state.activity, state.fundId])

  const refreshFund = async () => {
    if (!user) {
      setState(emptyState)
      return
    }

    let targetFundId = activeFundId
    if (!targetFundId) {
      const fundList = await ApiService.listFundsForUser(user.email)
      targetFundId = fundList.funds[0]?.fundId || null
      if (!targetFundId) {
        setActiveFund(null)
        return
      }
    }

    const response = await ApiService.getFund(targetFundId, user.email)
    setActiveFund(response.fund)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setState(emptyState)
      setActiveFundId(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(ACTIVE_FUND_KEY)
      }
      return
    }

    let cancelled = false
    setFundLoading(true)
    refreshFund()
      .catch(() => {
        if (!cancelled) {
          setState(emptyState)
        }
      })
      .finally(() => {
        if (!cancelled) setFundLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!user || !activeFundId) return

    const timer = window.setInterval(() => {
      refreshFund().catch(() => {})
    }, 3000)

    return () => window.clearInterval(timer)
  }, [user, activeFundId])

  const contributionSummary = useMemo<ContributionSummary>(() => {
    const expectedThisCycle = state.members.length * state.monthlyInstallment
    const paidCount = state.members.filter((member) => member.status === 'paid').length
    const overdueCount = state.members.filter((member) => member.status === 'overdue').length
    const graceCount = state.members.filter((member) => member.status === 'grace').length
    const collectedThisCycle = paidCount * state.monthlyInstallment
    const outstandingThisCycle = Math.max(expectedThisCycle - collectedThisCycle, 0)
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

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  )

  const markNotificationsRead = () => {
    setNotifications((previous) => previous.map((item) => ({ ...item, unread: false })))
  }

  const dismissToast = () => {
    setLatestToast(null)
  }

  const sendInviteEmail = async (recipientEmail: string) => {
    if (!user) return 'Please login first.'
    if (!activeFundId) return 'Create or join a fund first.'

    try {
      const response = await ApiService.inviteMember(activeFundId, {
        recipientEmail,
        inviterEmail: user.email,
        inviterName: user.name,
      })
      setActiveFund(response.fund)
      return response.message
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not send invite email.'
    }
  }

  const createLiveFund = async (payload: {
    fundName: string
    purpose: string
    groupSize: number
    durationMonths: number
    monthlyInstallment: number
  }) => {
    if (!user) return { error: 'Please login first.', fund: null }

    try {
      const response = await ApiService.createFund({
        ...payload,
        creatorName: user.name,
        creatorEmail: user.email,
        creatorPicture: user.picture,
      })
      setActiveFund(response.fund)
      return { error: null, fund: response.fund }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Could not create fund.', fund: null }
    }
  }

  const joinLiveFund = async (payload: { code: string }) => {
    if (!user) return { error: 'Please login first.', fund: null }

    try {
      const response = await ApiService.joinFund({
        ...payload,
        name: user.name,
        email: user.email,
        picture: user.picture,
      })
      setActiveFund(response.fund)
      return { error: null, fund: response.fund }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Could not join fund.', fund: null }
    }
  }

  const payContribution = async (memberId: string) => {
    if (!activeFundId) return 'Create or join a fund first.'

    try {
      const response = await ApiService.payContribution(activeFundId, memberId)
      setActiveFund(response.fund)
      return response.message
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not collect contribution.'
    }
  }

  const bulkCollectDue = async () => {
    if (!activeFundId) return 0

    try {
      const response = await ApiService.bulkCollect(activeFundId)
      setActiveFund(response.fund)
      return response.processed
    } catch {
      return 0
    }
  }

  const updateMemberStatus = async (memberId: string, status: MemberStatus) => {
    if (!activeFundId) return 'Create or join a fund first.'

    try {
      const response = await ApiService.updateMemberStatus(activeFundId, memberId, status)
      setActiveFund(response.fund)
      return response.message
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not update member status.'
    }
  }

  const placeBid = async (amount: number): Promise<BidOutcome> => {
    if (!user) return { ok: false, message: 'Please login first.' }
    if (!activeFundId) return { ok: false, message: 'Create or join a fund first.' }

    try {
      const response = await ApiService.placeLiveBid(activeFundId, {
        bidderEmail: user.email,
        bidderName: user.name,
        amount,
      })
      setActiveFund(response.fund)
      return { ok: true, message: response.message }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Could not place bid.' }
    }
  }

  const closeAuction = async () => {
    if (!activeFundId) return null

    try {
      const response = await ApiService.closeLiveAuction(activeFundId)
      setActiveFund(response.fund)
      return response.result
    } catch {
      return null
    }
  }

  const recalculateTrust = () => {}
  const enforceProtocol = () => {}
  const synthesizeBlueprint = async (intent: string) => ({ intent })

  return (
    <FundContext.Provider
      value={{
        state,
        activeFundId,
        hasActiveFund: Boolean(activeFundId),
        fundLoading,
        notifications,
        unreadNotificationCount,
        latestToast,
        markNotificationsRead,
        dismissToast,
        sendInviteEmail,
        createLiveFund,
        joinLiveFund,
        refreshFund,
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
