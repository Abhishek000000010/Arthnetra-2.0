import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import {
  Dna,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ShieldAlert,
  Brain,
  Zap,
  Activity,
  Wallet,
  Gavel,
} from 'lucide-react'
import { cn } from '../utils/cn.ts'
import { useFund } from '../context/FundContext'
import { GeminiService } from '../services/GeminiService'

type AuditResult = {
  mutation: string
  rationale: string
  impact: string
  summary?: string
}

export function FundDNA() {
  const { state, contributionSummary } = useFund()
  const [auditing, setAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)

  const overdueCount = state.members.filter((member) => member.status === 'overdue').length
  const graceCount = state.members.filter((member) => member.status === 'grace').length
  const paidCount = contributionSummary.paidCount
  const totalMembers = state.members.length
  const repaymentStability = Math.max(0, Math.min(100, Math.round((paidCount / totalMembers) * 100)))
  const auctionEfficiency = Math.max(
    0,
    Math.min(100, Math.round(((state.auction.poolAmount - state.auction.currentBid) / state.auction.poolAmount) * 100)),
  )
  const dnaHealth = Math.max(
    30,
    Math.min(
      99,
      Math.round(
        state.trustHealth * 0.45 +
        contributionSummary.collectionRate * 0.35 +
        auctionEfficiency * 0.2,
      ),
    ),
  )

  const riskLevel = overdueCount > 1 ? 'High' : graceCount > 0 ? 'Medium' : 'Low'
  const cycleHealth = contributionSummary.collectionRate >= 80 ? 'Healthy' : contributionSummary.collectionRate >= 50 ? 'Watchlist' : 'Critical'
  const validatorConsensus = `${Math.max(6, totalMembers - overdueCount)}/${totalMembers}`

  const mutationIdeas = useMemo(() => {
    const ideas: AuditResult[] = []

    if (overdueCount > 0) {
      ideas.push({
        mutation: 'Grace Escalation Rule',
        rationale: `${overdueCount} overdue member(s) detected. Trigger reminders and reserve collateral review before the next cycle cut-off.`,
        impact: 'Lower default risk',
      })
    }

    if (graceCount > 0) {
      ideas.push({
        mutation: 'Auto Reminder Window',
        rationale: `${graceCount} member(s) are in grace status. Add automatic reminders 24 hours before due-date expiry.`,
        impact: 'Improve collection rate',
      })
    }

    if (state.auction.isActive) {
      ideas.push({
        mutation: 'Auction Close Guard',
        rationale: 'A live reverse auction is running. Lock winner selection instantly when the timer hits zero to avoid disputes.',
        impact: 'Stronger payout integrity',
      })
    }

    if (state.auction.lastResult) {
      ideas.push({
        mutation: 'Dividend Buffer Rule',
        rationale: `Last auction generated ${formatCurrency(state.auction.lastResult.groupDividend)} in surplus. Move part of that amount into a safety buffer.`,
        impact: 'Higher reserve strength',
      })
    }

    if (ideas.length === 0) {
      ideas.push({
        mutation: 'Stability Hold',
        rationale: 'Collections and trust are stable. Keep current rules and continue monitoring next cycle changes.',
        impact: 'Protocol remains stable',
      })
    }

    return ideas
  }, [graceCount, overdueCount, state.auction, state.auction.lastResult])

  const handleRunAudit = async () => {
    setAuditing(true)
    try {
      const result = await GeminiService.auditProtocol({
        currentCycle: state.currentCycle,
        trustHealth: state.trustHealth,
        collectionRate: contributionSummary.collectionRate,
        overdueCount,
        graceCount,
        auction: {
          isActive: state.auction.isActive,
          currentBid: state.auction.currentBid,
          poolAmount: state.auction.poolAmount,
          hasWinner: Boolean(state.auction.lastResult),
        },
      })
      setAuditResult(result ?? mutationIdeas[0] ?? null)
    } finally {
      setAuditing(false)
    }
  }

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Dna size={20} />
              <span className="text-[10px] font-label font-black tracking-[0.2em] uppercase">Protocol Intelligence</span>
            </div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">Fund DNA</h1>
            <p className="text-on-surface-variant font-medium opacity-60">Live health check for the fund, based on collections, trust, and auction behavior.</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRunAudit}
              disabled={auditing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface font-headline font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {auditing ? 'Auditing...' : 'Run Audit'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="h-[420px] bg-surface-container-low rounded-3xl border border-white/5 relative overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 network-lines opacity-20"></div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="relative z-10 w-64 h-64 border-4 border-dashed border-primary/20 rounded-full flex items-center justify-center"
              >
                <div className="w-48 h-48 border-4 border-dashed border-tertiary/20 rounded-full animate-pulse"></div>
                <Dna className="absolute text-primary" size={48} />
              </motion.div>

              <div className="absolute top-8 left-8 right-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <DNAStat label="DNA Health" value={`${dnaHealth}%`} color="text-primary" />
                <DNAStat label="Repayment Stability" value={`${repaymentStability}%`} />
                <DNAStat label="Auction Efficiency" value={`${auctionEfficiency}%`} color="text-tertiary" />
              </div>

              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <MiniCard icon={<Wallet size={16} />} label="Collection Rate" value={`${contributionSummary.collectionRate}%`} />
                <MiniCard icon={<ShieldAlert size={16} />} label="Risk Level" value={riskLevel} />
                <MiniCard icon={<Gavel size={16} />} label="Auction State" value={state.auction.isActive ? 'Live' : 'Closed'} />
                <MiniCard icon={<Activity size={16} />} label="Cycle" value={`Month ${state.currentCycle}`} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-label font-bold uppercase tracking-widest mb-6 opacity-40">Mutation Proposals</h3>
              {auditResult ? (
                <MutationCard
                  title={auditResult.mutation}
                  desc={auditResult.rationale}
                  status="Current Audit"
                  impact={auditResult.impact}
                  active
                />
              ) : null}
              {mutationIdeas.map((item, index) => (
                <MutationCard
                  key={`${item.mutation}-${index}`}
                  title={item.mutation}
                  desc={item.rationale}
                  status={index === 0 ? 'Recommended' : 'Observed'}
                  impact={item.impact}
                  active={index === 0}
                />
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 h-full">
              <div className="flex items-center gap-2 mb-8">
                <ShieldAlert size={18} className="text-primary" />
                <h3 className="text-sm font-label font-bold uppercase tracking-widest">System Integrity</h3>
              </div>

              <div className="space-y-8">
                <AuditItem icon={<Zap size={16} />} title="Real-time Risk" value={riskLevel} color={riskLevel === 'High' ? 'text-error' : riskLevel === 'Medium' ? 'text-secondary' : 'text-tertiary'} />
                <AuditItem icon={<BarChart3 size={16} />} title="Validator Consensus" value={validatorConsensus} />
                <AuditItem icon={<Calendar size={16} />} title="Cycle Health" value={cycleHealth} color={cycleHealth === 'Critical' ? 'text-error' : cycleHealth === 'Watchlist' ? 'text-secondary' : 'text-tertiary'} />
              </div>

              <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-label font-black uppercase text-primary mb-2">DNA Summary</p>
                <p className="text-xs text-on-surface-variant leading-relaxed opacity-60">
                  {auditResult?.summary || buildSummary({
                    overdueCount,
                    graceCount,
                    collectionRate: contributionSummary.collectionRate,
                    auctionActive: state.auction.isActive,
                    dnaHealth,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function buildSummary({
  overdueCount,
  graceCount,
  collectionRate,
  auctionActive,
  dnaHealth,
}: {
  overdueCount: number
  graceCount: number
  collectionRate: number
  auctionActive: boolean
  dnaHealth: number
}) {
  if (overdueCount > 0) {
    return `DNA audit flagged ${overdueCount} overdue member(s). Focus on recovery rules before the next cycle closes.`
  }

  if (graceCount > 0) {
    return `The fund is stable, but ${graceCount} member(s) remain in grace. Reminder automation is recommended.`
  }

  if (auctionActive) {
    return `Collections are holding at ${collectionRate}%, and the reverse auction is live. Close the winner cleanly to preserve DNA health at ${dnaHealth}%.`
  }

  return `The fund is stable with a DNA health score of ${dnaHealth}%. Current rules are working well across collections and auction control.`
}

function MutationCard({ title, desc, status, impact, active }: any) {
  return (
    <div className={cn(
      'p-6 rounded-2xl border transition-all flex items-center justify-between group',
      active ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-low border-white/5 hover:border-white/10',
    )}>
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Brain size={24} />
        </div>
        <div>
          <h4 className="font-headline font-bold text-on-surface flex items-center gap-2">
            {title}
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-label uppercase tracking-widest opacity-40">{status}</span>
          </h4>
          <p className="text-xs text-on-surface-variant opacity-60 max-w-md">{desc}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-label font-black uppercase tracking-widest text-tertiary mb-1">{impact}</p>
        <button className="text-primary hover:underline flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
          View Analysis <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  )
}

function AuditItem({ icon, title, value, color = 'text-on-surface' }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 opacity-60">
        {icon}
        <span className="text-xs font-label font-bold uppercase tracking-widest">{title}</span>
      </div>
      <span className={cn('text-sm font-headline font-black', color)}>{value}</span>
    </div>
  )
}

function DNAStat({ label, value, color = 'text-on-surface' }: any) {
  return (
    <div className="rounded-2xl bg-surface/60 border border-white/5 p-4 backdrop-blur-sm">
      <p className="text-[10px] font-label uppercase tracking-widest opacity-40 mb-1">{label}</p>
      <p className={cn('text-2xl font-headline font-black', color)}>{value}</p>
    </div>
  )
}

function MiniCard({ icon, label, value }: any) {
  return (
    <div className="rounded-2xl bg-surface/60 border border-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-primary mb-2">
        {icon}
        <span className="text-[10px] font-label uppercase tracking-widest opacity-60">{label}</span>
      </div>
      <p className="text-lg font-headline font-black">{value}</p>
    </div>
  )
}

function formatCurrency(amount: number) {
  return `Rs ${amount.toLocaleString('en-IN')}`
}
