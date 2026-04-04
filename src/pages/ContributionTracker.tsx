import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import {
  AlertCircle,
  Clock,
  Search,
  Download,
  CreditCard,
  Zap,
  CheckCircle2,
  BellRing,
  Wallet,
} from 'lucide-react'
import { cn } from '../utils/cn.ts'
import { useFund, type Member, type MemberStatus } from '../context/FundContext'

type FilterValue = 'all' | 'paid' | 'overdue' | 'grace'

export function ContributionTracker() {
  const { state, payContribution, updateMemberStatus, bulkCollectDue, contributionSummary, hasActiveFund } = useFund()
  const { members, monthlyInstallment, contributionHistory } = state
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [notice, setNotice] = useState('Ready to collect and monitor this cycle.')

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return members.filter((member) => {
      const matchesFilter = filter === 'all' ? true : member.status === filter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        member.name.toLowerCase().includes(normalizedQuery) ||
        member.id.toLowerCase().includes(normalizedQuery)

      return matchesFilter && matchesQuery
    })
  }, [filter, members, query])

  const recentHistory = contributionHistory.slice(0, 5)

  const handleBulkContribution = async () => {
    const processed = await bulkCollectDue()
    setNotice(
      processed > 0
        ? `Bulk contribution completed for ${processed} members.`
        : 'Every member is already marked as paid for this cycle.',
    )
  }

  const handleExport = () => {
    const csvLines = [
      ['Member ID', 'Member Name', 'Amount', 'Status', 'Timestamp', 'Note'].join(','),
      ...contributionHistory.map((entry) =>
        [
          entry.memberId,
          entry.memberName,
          entry.amount.toString(),
          entry.status,
          entry.timestamp,
          `"${entry.note.replace(/"/g, '""')}"`,
        ].join(','),
      ),
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fund-flow-export.csv'
    link.click()
    window.URL.revokeObjectURL(url)
    setNotice('Contribution history exported as CSV.')
  }

  const handleNotify = () => {
    const affectedMembers = members.filter((member) => member.status !== 'paid').length
    setNotice(
      affectedMembers > 0
        ? `Payment reminders prepared for ${affectedMembers} members in grace or overdue status.`
        : 'No reminders needed. Everyone is already paid.',
    )
  }

  if (!hasActiveFund) {
    return (
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="max-w-xl rounded-[2rem] border border-white/5 bg-surface-container-low p-10 text-center">
            <h1 className="text-4xl font-headline font-black text-on-surface mb-4">No Fund Members Yet</h1>
            <p className="text-on-surface-variant opacity-60 mb-8">
              This tracker becomes live once you create a fund room or join an existing chit fund.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex flex-col lg:flex-row justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <CreditCard size={20} />
              </div>
              <span className="text-[10px] font-label font-black tracking-[0.2em] uppercase text-on-surface-variant opacity-60">Fund Flow</span>
            </div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">Contribution Tracker</h1>
            <p className="text-on-surface-variant font-medium opacity-60">Track who paid, who is late, how much was collected, and what still needs action.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-label uppercase tracking-widest"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => { void handleBulkContribution() }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Zap size={16} fill="currentColor" />
              Bulk Contribution
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard label="Expected This Cycle" value={formatCurrency(contributionSummary.expectedThisCycle)} icon={<Wallet size={18} />} detail={`${members.length} members x ${formatCurrency(monthlyInstallment)}`} />
          <SummaryCard label="Collected" value={formatCurrency(contributionSummary.collectedThisCycle)} icon={<CheckCircle2 size={18} />} detail={`${contributionSummary.paidCount} members paid`} />
          <SummaryCard label="Outstanding" value={formatCurrency(contributionSummary.outstandingThisCycle)} icon={<AlertCircle size={18} />} detail={`${contributionSummary.overdueCount + contributionSummary.graceCount} members still pending`} />
          <SummaryCard label="Collection Rate" value={`${contributionSummary.collectionRate}%`} icon={<CreditCard size={18} />} detail="Updated from current statuses" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/20 p-4 rounded-2xl mb-8 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <BellRing size={20} />
          </div>
          <p className="text-sm font-headline font-bold text-on-surface flex-1">{notice}</p>
          <button
            onClick={handleNotify}
            className="text-[10px] font-label uppercase tracking-widest text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all"
          >
            Notify Pending
          </button>
        </motion.div>

        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40" size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by member name or ID..."
                  className="w-full bg-surface-container-low border border-white/5 rounded-xl px-12 py-4 text-on-surface focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterTab label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
                <FilterTab label="Paid" active={filter === 'paid'} onClick={() => setFilter('paid')} />
                <FilterTab label="Overdue" active={filter === 'overdue'} onClick={() => setFilter('overdue')} />
                <FilterTab label="Grace" active={filter === 'grace'} onClick={() => setFilter('grace')} />
              </div>
            </div>

            <div className="bg-surface-container-low rounded-3xl border border-white/5 overflow-hidden">
              <div className="grid grid-cols-12 p-6 border-b border-white/5 text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant opacity-40">
                <div className="col-span-4">Member</div>
                <div className="col-span-2">Due Amount</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Last Paid</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              <div className="divide-y divide-white/5">
                {filteredMembers.length === 0 ? (
                  <div className="p-10 text-center text-on-surface-variant opacity-60">
                    No members match the current search and filter.
                  </div>
                ) : (
                  filteredMembers.map((member, index) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      amount={monthlyInstallment}
                      index={index}
                      onPay={async () => {
                        const message = await payContribution(member.id)
                        setNotice(message)
                      }}
                      onStatusChange={async (status) => {
                        const message = await updateMemberStatus(member.id, status)
                        setNotice(message)
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="w-full xl:w-[360px] space-y-6">
            <section className="bg-surface-container-low rounded-3xl border border-white/5 p-6">
              <h3 className="text-lg font-headline font-bold mb-4">Payment Queue</h3>
              <div className="space-y-3">
                <QueueStat label="Paid" value={contributionSummary.paidCount} tone="text-primary" />
                <QueueStat label="Grace" value={contributionSummary.graceCount} tone="text-secondary" />
                <QueueStat label="Overdue" value={contributionSummary.overdueCount} tone="text-error" />
              </div>
            </section>

            <section className="bg-surface-container-low rounded-3xl border border-white/5 p-6">
              <h3 className="text-lg font-headline font-bold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentHistory.map((entry) => (
                  <div key={entry.id} className="p-4 rounded-2xl bg-surface-container-lowest border border-white/5">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="font-headline font-bold text-sm">{entry.memberName}</p>
                      <span className={cn('text-[10px] font-label uppercase tracking-widest', badgeTone(entry.status))}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface">{entry.amount > 0 ? formatCurrency(entry.amount) : 'No payment collected'}</p>
                    <p className="text-xs text-on-surface-variant opacity-60 mt-1">{entry.note}</p>
                    <p className="text-[10px] text-on-surface-variant opacity-40 mt-2">{formatDateTime(entry.timestamp)}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

function SummaryCard({ label, value, detail, icon }: any) {
  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-40 mb-2">{label}</p>
      <h3 className="text-2xl font-headline font-black">{value}</h3>
      <p className="text-xs text-on-surface-variant opacity-60 mt-1">{detail}</p>
    </div>
  )
}

function MemberRow({
  member,
  amount,
  index,
  onPay,
  onStatusChange,
}: {
  member: Member
  amount: number
  index: number
  onPay: () => void
  onStatusChange: (status: MemberStatus) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/5 transition-all"
    >
      <div className="col-span-4 flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-surface-container-high">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} />
        </div>
        <div className="min-w-0">
          <p className="font-headline font-bold text-on-surface truncate">{member.name}</p>
          <p className="text-[10px] font-mono opacity-30">{member.id}</p>
          <p className="text-[10px] text-primary mt-1">Wallet: {formatCurrency(member.walletBalance)}</p>
        </div>
      </div>
      <div className="col-span-2 font-headline font-black text-on-surface tabular-nums">{formatCurrency(amount)}</div>
      <div className="col-span-2 text-sm text-on-surface-variant opacity-70">{formatDate(member.dueDate)}</div>
      <div className="col-span-2 text-sm text-on-surface-variant opacity-70 flex items-center gap-2">
        <Clock size={14} className="opacity-40" />
        {member.lastPaidOn ? formatDate(member.lastPaidOn) : 'Not yet'}
      </div>
      <div className="col-span-2 flex justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={onPay}
            disabled={member.status === 'paid'}
            className={cn(
              'px-3 py-2 rounded-xl text-[10px] font-label font-black uppercase tracking-widest border transition-all',
              member.status === 'paid'
                ? 'bg-primary/10 text-primary border-primary/20 opacity-60 cursor-default'
                : 'bg-primary text-on-primary border-primary hover:scale-[1.02] active:scale-95',
            )}
          >
            {member.status === 'paid' ? 'Paid' : 'Collect'}
          </button>
          <select
            value={member.status}
            onChange={(event) => onStatusChange(event.target.value as MemberStatus)}
            className={cn(
              'bg-surface-container-lowest border rounded-xl px-3 py-2 text-[10px] font-label font-black uppercase tracking-widest focus:outline-none',
              selectTone(member.status),
            )}
          >
            <option value="paid">Paid</option>
            <option value="grace">Grace</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>
    </motion.div>
  )
}

function QueueStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-lowest border border-white/5">
      <span className="text-sm font-headline font-bold">{label}</span>
      <span className={cn('text-lg font-headline font-black', tone)}>{value}</span>
    </div>
  )
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-6 py-2 rounded-xl text-xs font-label uppercase tracking-widest transition-all',
        active
          ? 'bg-primary text-on-primary font-black shadow-lg shadow-primary/10'
          : 'bg-surface-container-low text-on-surface-variant border border-white/5 hover:bg-white/5',
      )}
    >
      {label}
    </button>
  )
}

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString('en-IN')}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function badgeTone(status: string) {
  if (status === 'paid') return 'text-primary'
  if (status === 'grace') return 'text-secondary'
  return 'text-error'
}

function selectTone(status: MemberStatus) {
  if (status === 'paid') return 'border-primary/20 text-primary'
  if (status === 'grace') return 'border-secondary/20 text-secondary'
  return 'border-error/20 text-error'
}
