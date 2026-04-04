import type { ReactNode } from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import {
  TrendingUp,
  Trophy,
  Activity,
  ArrowRight,
  Target,
  ShieldCheck,
  Wallet,
  Gavel,
  AlertCircle,
  Clock3,
  CheckCircle2,
  Brain,
  ShieldAlert,
  TrendingDown,
  Scan,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { useFund } from '../context/FundContext'
import { Link } from 'react-router-dom'

function getTrustLevel(health: number) {
  if (health >= 90) return { label: 'PRISTINE', color: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-400/30', bgLight: 'bg-emerald-400/10', desc: 'All members are in good standing. Zero default risk detected.' }
  if (health >= 70) return { label: 'CAUTION', color: 'text-amber-400', bg: 'bg-amber-400', border: 'border-amber-400/30', bgLight: 'bg-amber-400/10', desc: 'Irregular payment patterns detected. Monitor closely.' }
  return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-400', border: 'border-red-400/30', bgLight: 'bg-red-400/10', desc: 'High probability of default. Recommend pausing auction until resolved.' }
}

function getMemberRisk(score: number): { label: string; color: string } {
  if (score >= 900) return { label: 'Low Risk', color: 'text-emerald-400' }
  if (score >= 700) return { label: 'Moderate', color: 'text-amber-400' }
  return { label: 'High Risk', color: 'text-red-400' }
}

export function Dashboard() {
  const { state, contributionSummary, hasActiveFund, sendInviteEmail, payContribution } = useFund()
  const { poolTotal, currentCycle, trustHealth, members, contributionHistory, auction, fundName, fundCode, myWalletBalance, isCreator, myMemberId, monthlyInstallment } = state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteNotice, setInviteNotice] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [paying, setPaying] = useState(false)

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteNotice('Enter an email address first.')
      return
    }

    setSendingInvite(true)
    const message = await sendInviteEmail(inviteEmail.trim())
    setSendingInvite(false)
    setInviteNotice(message)
    if (!message.toLowerCase().includes('could not') && !message.toLowerCase().includes('please') && !message.toLowerCase().includes('not configured')) {
      setInviteEmail('')
    }
  }

  const handlePayInstallment = async () => {
    if (!myMemberId) return
    setPaying(true)
    const message = await payContribution(myMemberId)
    setPaying(false)
    alert(message)
  }

  if (!hasActiveFund) {
    return (
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="max-w-2xl rounded-[2rem] border border-white/5 bg-surface-container-low p-10 text-center">
            <h1 className="text-4xl font-headline font-black text-on-surface mb-4">Start a Live Chit Fund</h1>
            <p className="text-on-surface-variant opacity-60 mb-4">
              Create a fund room, share the code, and other logged-in users will see the same live state.
            </p>
            <p className="text-primary font-headline font-bold">This dashboard becomes shared and real-time after create or join.</p>
          </div>
        </main>
      </div>
    )
  }

  const leaderboard = [...members]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const cycleOverview = [
    {
      label: 'Members Paid',
      value: `${contributionSummary.paidCount}/${members.length}`,
      tone: 'text-primary',
    },
    {
      label: 'Outstanding',
      value: `${contributionSummary.overdueCount + contributionSummary.graceCount}`,
      tone: contributionSummary.overdueCount > 0 ? 'text-error' : 'text-secondary',
    },
    {
      label: 'Auction',
      value: auction.isActive ? 'Live' : 'Closed',
      tone: auction.isActive ? 'text-primary' : 'text-tertiary',
    },
    {
      label: 'Best Bid',
      value: formatCurrency(auction.currentBid),
      tone: 'text-on-surface',
    },
  ]

  const activityItems = [
    ...(auction.lastResult
      ? [{
          id: `auction-result-${auction.lastResult.closedAt}`,
          title: `Auction closed for Month ${auction.lastResult.cycle}`,
          detail: `${auction.lastResult.winner} won with ${formatCurrency(auction.lastResult.winningBid)} and generated ${formatCurrency(auction.lastResult.groupDividend)} for the group.`,
          time: formatDateTime(auction.lastResult.closedAt),
          type: 'system' as const,
        }]
      : []),
    ...auction.history.slice(0, 2).map((bid, index) => ({
      id: `bid-${index}-${bid.bidder}-${bid.amount}`,
      title: `${bid.bidder} is leading with ${formatCurrency(bid.amount)}`,
      detail: `Reverse auction update for Month ${currentCycle}. Lowest valid bid currently leads the pool payout.`,
      time: bid.time,
      type: 'bid' as const,
    })),
    ...contributionHistory.slice(0, 4).map((entry) => ({
      id: entry.id,
      title: entry.status === 'paid'
        ? `${entry.memberName} contribution received`
        : `${entry.memberName} marked as ${entry.status}`,
      detail: entry.amount > 0
        ? `${formatCurrency(entry.amount)} recorded. ${entry.note}`
        : entry.note,
      time: formatDateTime(entry.timestamp),
      type: entry.status === 'paid' ? 'payment' as const : 'alert' as const,
    })),
  ].slice(0, 6)

  const overdueMembers = members.filter((member) => member.status === 'overdue')
  const graceMembers = members.filter((member) => member.status === 'grace')
  const trustLevel = getTrustLevel(trustHealth)

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex flex-col xl:flex-row justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-headline font-bold text-on-surface">Dashboard</h1>
            <p className="text-on-surface-variant font-medium opacity-60">
              {fundName} live overview for Cycle {currentCycle}. Fund code: {fundCode}
            </p>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-label tracking-widest uppercase text-tertiary">My Demo Wallet</span>
              <span className="text-xl font-headline font-black text-tertiary">{formatCurrency(myWalletBalance)}</span>
            </div>
            <div className="h-10 w-px bg-white/5 mx-2"></div>
            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 ring-2 ring-primary/20">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dashboard" alt="Dashboard" />
            </div>
          </div>
        </header>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Live Pool Total"
            value={formatCurrency(poolTotal)}
            icon={<Target size={20} />}
            trend={`${contributionSummary.collectionRate}% collection rate`}
            color="primary"
          />
          <StatCard
            label="Cycle Progress"
            value={`Month ${currentCycle}`}
            icon={<Activity size={20} />}
            trend={`${contributionSummary.paidCount} paid this cycle`}
            color="secondary"
          />
          <StatCard
            label="Auction Status"
            value={auction.isActive ? 'Live' : 'Closed'}
            icon={<Gavel size={20} />}
            trend={auction.isActive ? `Best bid ${formatCurrency(auction.currentBid)}` : auction.lastResult ? `${auction.lastResult.winner} won` : 'Awaiting result'}
            color="primary"
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/*  AI TRUST INTELLIGENCE PANEL                                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "mb-10 rounded-[1.5rem] border p-8 relative overflow-hidden",
            trustLevel.border,
            trustLevel.bgLight
          )}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 20%, currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={cn("p-2.5 rounded-xl border", trustLevel.border, trustLevel.bgLight)}>
                <Brain size={22} className={trustLevel.color} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-headline font-black text-on-surface">AI Trust Intelligence</h2>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", trustLevel.color, trustLevel.border, trustLevel.bgLight)}>
                    Live
                  </span>
                </div>
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-50">
                  Predictive risk analysis • 6-month behavioral pattern engine
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Big Gauge */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-44 h-44">
                  {/* Background ring */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="10" />
                    <motion.circle
                      cx="60" cy="60" r="50" fill="none"
                      className={trustLevel.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - trustHealth / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      className="text-4xl font-headline font-black text-on-surface tabular-nums"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      {trustHealth}%
                    </motion.span>
                    <span className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant opacity-50">
                      Fund Health
                    </span>
                  </div>
                </div>

                {/* Trust Level Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={cn("mt-4 px-5 py-2 rounded-full border text-sm font-headline font-black tracking-wider", trustLevel.color, trustLevel.border, trustLevel.bgLight)}
                >
                  {trustLevel.label}
                </motion.div>
              </div>

              {/* Center: AI Analysis */}
              <div className="flex flex-col justify-center gap-4">
                <div className="p-4 rounded-xl bg-surface/50 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Scan size={14} className={trustLevel.color} />
                    <span className="text-[10px] font-label font-black uppercase tracking-widest text-on-surface-variant opacity-60">AI Analysis</span>
                  </div>
                  <p className={cn("text-sm font-headline font-bold", trustLevel.color)}>
                    {trustLevel.desc}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-surface/50 border border-white/5">
                    <p className="text-xl font-headline font-black text-emerald-400">{contributionSummary.paidCount}</p>
                    <p className="text-[9px] font-label uppercase tracking-widest opacity-40">On-Time</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-surface/50 border border-white/5">
                    <p className="text-xl font-headline font-black text-amber-400">{graceMembers.length}</p>
                    <p className="text-[9px] font-label uppercase tracking-widest opacity-40">Grace</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-surface/50 border border-white/5">
                    <p className="text-xl font-headline font-black text-red-400">{overdueMembers.length}</p>
                    <p className="text-[9px] font-label uppercase tracking-widest opacity-40">Default</p>
                  </div>
                </div>

                {overdueMembers.length > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-400/10 border border-red-400/20">
                    <ShieldAlert size={16} className="text-red-400 shrink-0" />
                    <p className="text-xs text-red-400 font-bold">
                      {overdueMembers.map(m => m.name).join(', ')} {overdueMembers.length === 1 ? 'has' : 'have'} defaulted. Trust score penalties applied.
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Per-Member Risk Breakdown */}
              <div className="flex flex-col justify-center">
                <p className="text-[10px] font-label font-black uppercase tracking-widest text-on-surface-variant opacity-50 mb-3">Member Risk Profile</p>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                  {[...members].sort((a, b) => a.score - b.score).map((member) => {
                    const risk = getMemberRisk(member.score)
                    return (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-white/5 group hover:border-white/10 transition-all">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-headline font-bold text-on-surface truncate">{member.name}</p>
                          <div className="w-full h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                            <motion.div
                              className={cn("h-full rounded-full", member.score >= 900 ? 'bg-emerald-400' : member.score >= 700 ? 'bg-amber-400' : 'bg-red-400')}
                              initial={{ width: 0 }}
                              animate={{ width: `${member.score / 10}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-headline font-black tabular-nums">{member.score}</p>
                          <p className={cn("text-[9px] font-label font-bold uppercase", risk.color)}>{risk.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Recommendation Bar */}
            <div className="mt-6 flex items-center gap-4 p-4 rounded-xl bg-surface/30 border border-white/5">
              <div className={cn("p-2 rounded-lg", trustLevel.bgLight)}>
                {trustHealth >= 90 ? <ShieldCheck size={18} className={trustLevel.color} /> : <TrendingDown size={18} className={trustLevel.color} />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-headline font-bold text-on-surface">
                  {trustHealth >= 90 && 'Recommendation: Safe to proceed with next auction cycle.'}
                  {trustHealth >= 70 && trustHealth < 90 && 'Recommendation: Suggest sending payment reminders before next auction.'}
                  {trustHealth < 70 && 'Recommendation: Pause auction. Recover overdue payments before disbursement.'}
                </p>
                <p className="text-[10px] text-on-surface-variant opacity-50">Based on 6-month rolling behavioral pattern analysis</p>
              </div>
              <Link to="/tracker" className="shrink-0 text-[10px] font-label font-black uppercase tracking-widest text-primary hover:underline">
                View Details →
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Fund Room Section */}
        <section className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-left">
            <div>
              <p className="text-[10px] font-label uppercase tracking-[0.2em] text-primary mb-2">Live Fund Room</p>
              <h2 className="text-2xl font-headline font-black text-on-surface">{fundName}</h2>
              <p className="text-sm text-on-surface-variant opacity-70">
                Share this code so another logged-in user can enter the same chit fund room.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-surface px-6 py-4">
              <p className="text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant opacity-50">Fund Code</p>
              <p className="text-3xl font-headline font-black text-primary">{fundCode}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Personal Installment Card */}
            <div className="rounded-2xl border border-white/5 bg-surface-container-low p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-secondary/10 text-secondary border border-secondary/20">
                    <Clock3 size={20} />
                  </div>
                  {members.find(m => m.id === myMemberId)?.status === 'paid' ? (
                     <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full font-label font-bold uppercase tracking-widest">Completed</span>
                  ) : (
                     <span className="text-[10px] bg-error/20 text-error px-2 py-1 rounded-full font-label font-bold uppercase tracking-widest">Penalty Risk</span>
                  )}
                </div>
                <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant opacity-60 mb-1">Monthly Installment</p>
                <h3 className="text-2xl font-headline font-black mb-2">{formatCurrency(monthlyInstallment)}</h3>
                <p className="text-xs text-on-surface-variant opacity-60">Status: {members.find(m => m.id === myMemberId)?.status || 'checking...'}</p>
              </div>
              <button
                disabled={paying || members.find(m => m.id === myMemberId)?.status === 'paid'}
                onClick={() => { void handlePayInstallment() }}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-on-secondary text-sm font-headline font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {paying ? 'Processing...' : members.find(m => m.id === myMemberId)?.status === 'paid' ? 'Installment Paid' : 'Pay Monthly Now'}
              </button>
            </div>

            {/* Invite Card */}
            {isCreator ? (
              <div className="rounded-2xl border border-white/5 bg-surface-container-low p-6">
                <p className="text-[10px] font-label uppercase tracking-[0.2em] text-primary mb-2">Invite Through Gmail</p>
                <p className="text-sm text-on-surface-variant opacity-70 mb-4">
                  Send the room code to a member by email.
                </p>
                <div className="flex flex-col gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="member@example.com"
                    className="flex-1 rounded-2xl border border-white/10 bg-surface px-4 py-3 text-on-surface outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={() => { void handleSendInvite() }}
                    disabled={sendingInvite}
                    className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-headline font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invite Email'}
                  </button>
                </div>
                {inviteNotice ? (
                  <p className="mt-3 text-sm text-on-surface-variant text-center">{inviteNotice}</p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-surface-container-low p-6 flex items-center justify-center text-center">
                 <div>
                   <p className="text-sm font-headline font-bold opacity-60 italic">Your contributions maintain your trust score and eligibility for bidding.</p>
                 </div>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-headline font-bold flex items-center gap-2">
                  <Trophy size={18} className="text-primary" />
                  Trust Score Leaderboard
                </h3>
                <Link to="/tracker" className="text-xs font-label uppercase tracking-widest text-primary hover:underline">Open Fund Flow</Link>
              </div>

              <div className="space-y-4">
                {leaderboard.map((member, index) => (
                  <LeaderboardItem
                    key={member.id}
                    name={member.name}
                    score={member.score}
                    detail={member.status === 'paid'
                      ? `Paid on ${member.lastPaidOn ? formatShortDate(member.lastPaidOn) : 'time'}`
                      : member.status === 'grace'
                        ? 'Currently in grace period'
                        : 'Payment overdue this cycle'}
                    rank={index + 1}
                    status={member.status}
                  />
                ))}
              </div>
            </section>

            <section className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-headline font-bold mb-6 flex items-center gap-2">
                <Wallet size={18} className="text-primary" />
                Cycle Snapshot
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cycleOverview.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/5 bg-surface-container-lowest p-5">
                    <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-40 mb-2">{item.label}</p>
                    <p className={cn('text-2xl font-headline font-black', item.tone)}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm font-headline font-bold">Collection progress updates live from Fund Flow</p>
                  <p className="text-xs text-on-surface-variant opacity-60">
                    Paid, grace, overdue, and bulk collection actions instantly update this dashboard.
                  </p>
                </div>
                <Link to="/auction" className="inline-flex items-center gap-2 text-primary text-sm font-headline font-bold">
                  Open Live Auction
                  <ArrowRight size={14} />
                </Link>
              </div>
            </section>
          </div>

          <section className="bg-surface-container-low rounded-2xl border border-white/5 p-6 h-fit overflow-hidden relative">
            <h3 className="text-lg font-headline font-bold mb-6 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Activity Feed
            </h3>

            <div className="space-y-8 relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-white/5"></div>

              {activityItems.map((item) => (
                <FeedItem
                  key={item.id}
                  title={item.title}
                  detail={item.detail}
                  time={item.time}
                  type={item.type}
                />
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3">
              <QuickLink to="/tracker" label="Review Contributions" />
              <QuickLink to="/winner" label="Open Winner Screen" />
              <QuickLink to="/ledger" label="View Ledger" />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  trend,
  icon,
  color,
}: {
  label: string
  value: string
  trend: string
  icon: ReactNode
  color: 'primary' | 'secondary' | 'tertiary'
}) {
  const colorMap = {
    primary: 'bg-primary/5 text-primary border-primary/20',
    secondary: 'bg-tertiary/5 text-tertiary border-tertiary/20',
    tertiary: 'bg-secondary/5 text-secondary border-secondary/20',
  } as const

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-surface-container-low p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group"
    >
      <div className={cn('inline-flex p-3 rounded-xl mb-4 border', colorMap[color])}>
        {icon}
      </div>
      <p className="text-xs font-label uppercase tracking-[0.15em] text-on-surface-variant opacity-60 mb-1">{label}</p>
      <h2 className="text-3xl font-headline font-black text-on-surface mb-2">{value}</h2>
      <span className="text-[10px] font-label font-bold text-primary flex items-center gap-1">
        <TrendingUp size={10} />
        {trend}
      </span>
      <div className={cn('absolute -bottom-1 -right-1 w-12 h-12 blur-2xl opacity-20', colorMap[color])}></div>
    </motion.div>
  )
}

function LeaderboardItem({ rank, name, score, detail, status }: any) {
  const risk = getMemberRisk(score)
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-headline font-bold text-on-surface">
        {rank}
      </div>
      <div className="flex-1">
        <h4 className="font-headline font-bold text-on-surface">{name}</h4>
        <p className="text-xs text-on-surface-variant opacity-60">{detail}</p>
      </div>
      <div className="text-right">
        <div className={cn("text-lg font-headline font-black tabular-nums", risk.color)}>{score}</div>
        <p className={cn("text-[10px] font-label tracking-widest uppercase font-bold", risk.color)}>{risk.label}</p>
      </div>
    </div>
  )
}

function FeedItem({
  title,
  detail,
  time,
  type,
}: {
  title: string
  detail: string
  time: string
  type: 'bid' | 'payment' | 'reminder' | 'system' | 'alert'
}) {
  const icons = {
    bid: <Gavel size={16} />,
    payment: <CheckCircle2 size={16} />,
    reminder: <Clock3 size={16} />,
    system: <ShieldCheck size={16} />,
    alert: <AlertCircle size={16} />,
  } as const

  return (
    <div className="flex gap-4 relative">
      <div className="relative z-10 w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10 text-primary">
        {icons[type]}
      </div>
      <div className="flex-1 pb-2">
        <h4 className="text-sm font-headline font-bold text-on-surface leading-tight mb-1">{title}</h4>
        <p className="text-xs text-on-surface-variant leading-relaxed opacity-60 mb-2">{detail}</p>
        <div className="text-[10px] font-label tracking-[0.1em] uppercase text-on-surface-variant opacity-40">{time}</div>
      </div>
    </div>
  )
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-white/5 transition-all text-sm font-label uppercase tracking-widest text-primary border border-white/5"
    >
      {label}
      <ArrowRight size={14} />
    </Link>
  )
}

function formatCurrency(amount: number) {
  return `Rs ${amount.toLocaleString('en-IN')}`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatShortDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}
