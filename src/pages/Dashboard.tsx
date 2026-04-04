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
} from 'lucide-react'
import { cn } from '../utils/cn'
import { useFund } from '../context/FundContext'
import { Link } from 'react-router-dom'

export function Dashboard() {
  const { state, contributionSummary, hasActiveFund, sendInviteEmail } = useFund()
  const { poolTotal, currentCycle, trustHealth, members, contributionHistory, auction, fundName, fundCode, myWalletBalance, isCreator } = state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteNotice, setInviteNotice] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
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
            label="Trust Health"
            value={`${trustHealth}%`}
            icon={<ShieldCheck size={20} />}
            trend={overdueMembers.length > 0 ? `${overdueMembers.length} overdue member(s)` : 'No overdue members'}
            color="tertiary"
          />
          <StatCard
            label="Auction Status"
            value={auction.isActive ? 'Live' : 'Closed'}
            icon={<Gavel size={20} />}
            trend={auction.isActive ? `Best bid ${formatCurrency(auction.currentBid)}` : auction.lastResult ? `${auction.lastResult.winner} won` : 'Awaiting result'}
            color="primary"
          />
        </div>

        <section className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[10px] font-label uppercase tracking-[0.2em] text-primary mb-2">Live Fund Room</p>
              <h2 className="text-2xl font-headline font-black text-on-surface">{fundName}</h2>
              <p className="text-sm text-on-surface-variant opacity-70">
                Share this code so another logged-in user can enter the same chit fund room.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-surface px-6 py-4 text-center">
              <p className="text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant opacity-50">Fund Code</p>
              <p className="text-3xl font-headline font-black text-primary">{fundCode}</p>
            </div>
          </div>

          {isCreator ? (
            <div className="mt-6 rounded-2xl border border-white/5 bg-surface-container-low p-5">
              <p className="text-[10px] font-label uppercase tracking-[0.2em] text-primary mb-2">Invite Through Twilio</p>
              <p className="text-sm text-on-surface-variant opacity-70 mb-4">
                Send the room code to a member by email through Twilio SendGrid.
              </p>
              <div className="flex flex-col md:flex-row gap-3">
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
                  className="rounded-2xl bg-primary px-5 py-3 text-sm font-headline font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingInvite ? 'Sending...' : 'Send Invite Email'}
                </button>
              </div>
              {inviteNotice ? (
                <p className="mt-3 text-sm text-on-surface-variant">{inviteNotice}</p>
              ) : null}
            </div>
          ) : null}
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
        <div className="text-lg font-headline font-black text-primary tabular-nums">{score}</div>
        <p className="text-[10px] font-label tracking-widest uppercase opacity-40">{status}</p>
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
