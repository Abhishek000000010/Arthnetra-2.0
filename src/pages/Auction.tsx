import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import {
  Gavel,
  Info,
  History,
  TrendingDown,
  CheckCircle2,
  Users,
  TimerReset,
  Trophy,
} from 'lucide-react'
import { cn } from '../utils/cn.ts'
import { useFund } from '../context/FundContext'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Auction() {
  const { state, placeBid, closeAuction, hasActiveFund } = useFund()
  const { user } = useAuth()
  const { auction, currentCycle } = state
  const [bidAmount, setBidAmount] = useState('')
  const [isBidding, setIsBidding] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const minNextBid = Math.max(auction.currentBid - auction.bidIncrement, auction.bidIncrement)
  const isEligible = user ? auction.eligibleMembers.includes(user.email) : false
  const closedResult = auction.lastResult

  const aiRecommendation = useMemo(() => {
    const suggestedBid = Math.max(auction.currentBid - auction.bidIncrement * 2, auction.bidIncrement)
    const groupDividend = auction.poolAmount - suggestedBid
    return {
      suggestedBid,
      groupDividend,
    }
  }, [auction.bidIncrement, auction.currentBid, auction.poolAmount])

  const handleOpenConfirm = () => {
    if (!isEligible) {
      setMessage('You already won a previous cycle, so you are not eligible to bid again right now.')
      return
    }

    if (!auction.isActive) {
      setMessage('This auction is already closed.')
      return
    }

    if (!bidAmount) {
      setMessage('Enter a bid amount first.')
      return
    }

    setIsBidding(true)
  }

  const handleConfirmBid = async () => {
    const parsed = Number(bidAmount)
    if (!Number.isFinite(parsed)) {
      setMessage('Enter a valid number for the bid.')
      return
    }

    setSubmitting(true)
    try {
      const outcome = await placeBid(parsed)
      setMessage(outcome.message)

      if (outcome.ok) {
        setBidAmount('')
        setIsBidding(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseAuction = async () => {
    const result = await closeAuction()
    if (result) {
      setMessage(`Auction closed. ${result.winner} won Month ${result.cycle} with a bid of ${formatCurrency(result.winningBid)}.`)
    } else {
      setMessage('Auction closed.')
    }
  }

  if (!hasActiveFund) {
    return (
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="max-w-xl rounded-[2rem] border border-white/5 bg-surface-container-low p-10 text-center">
            <h1 className="text-4xl font-headline font-black text-on-surface mb-4">No Live Fund Yet</h1>
            <p className="text-on-surface-variant opacity-60 mb-8">
              Create a live fund room or join one with a code before running the auction.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/create" className="rounded-2xl bg-primary px-6 py-4 font-headline font-bold text-on-primary">Create Fund</Link>
              <Link to="/join" className="rounded-2xl border border-white/10 px-6 py-4 font-headline font-bold hover:bg-white/5">Join Fund</Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex flex-col xl:flex-row justify-between gap-6 mb-10">
          <div>
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-label tracking-widest uppercase mb-3',
              auction.isActive ? 'bg-error/10 border-error/20 text-error' : 'bg-primary/10 border-primary/20 text-primary',
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', auction.isActive ? 'bg-error animate-pulse' : 'bg-primary')} />
              {auction.isActive ? `Live Auction #0${currentCycle}` : `Auction #0${currentCycle} Closed`}
            </div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">
              Month {currentCycle} Auction
            </h1>
            <p className="text-on-surface-variant font-medium opacity-60">
              Reverse auction for this month&apos;s pool. Lowest eligible bid wins the payout.
            </p>
          </div>

          <div className="bg-surface-container-low px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant opacity-40">Pool Amount</p>
              <p className="text-2xl font-headline font-black text-on-surface">{formatCurrency(auction.poolAmount)}</p>
            </div>
            <div className="h-8 w-px bg-white/5 mx-2"></div>
            <div className="text-right">
              <p className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant opacity-40">
                {auction.isActive ? 'Time Remaining' : 'Winning Bid'}
              </p>
              <p className={cn(
                'text-2xl font-headline font-black tabular-nums transition-colors',
                auction.isActive ? (auction.timeLeft < 300 ? 'text-error' : 'text-primary') : 'text-primary',
              )}>
                {auction.isActive ? formatTime(auction.timeLeft) : formatCurrency(auction.currentBid)}
              </p>
            </div>
            <div className="h-8 w-px bg-white/5 mx-2"></div>
            <div className="text-right">
              <p className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant opacity-40">Eligible Bidders</p>
              <p className="text-2xl font-headline font-black text-on-surface tabular-nums">{auction.eligibleMembers.length}</p>
            </div>
          </div>
        </header>

        {message ? (
          <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 text-sm font-headline font-bold text-on-surface">
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-surface-container-low rounded-2xl border border-white/5 p-8 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-headline font-bold mb-6 flex items-center gap-2">
                  <Gavel size={18} className="text-primary" />
                  {auction.isActive ? 'Place Your Reverse Bid' : 'Auction Outcome'}
                </h3>

                {auction.isActive ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-headline font-bold text-xl opacity-40">Rs</span>
                        <input
                          type="number"
                          min={auction.bidIncrement}
                          max={auction.poolAmount}
                          step={auction.bidIncrement}
                          value={bidAmount}
                          onChange={(event) => setBidAmount(event.target.value)}
                          placeholder={`Lower than ${auction.currentBid}`}
                          className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-14 py-5 text-2xl font-headline font-bold text-on-surface focus:outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/20"
                        />
                      </div>
                      <button
                        onClick={handleOpenConfirm}
                        disabled={!isEligible}
                        className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-headline font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                      >
                        Place Reverse Bid
                      </button>
                      <div className="grid grid-cols-2 gap-4 text-xs text-on-surface-variant opacity-70">
                        <div>Current best bid: <span className="text-on-surface font-bold">{formatCurrency(auction.currentBid)}</span></div>
                        <div>Lowest next bid allowed: <span className="text-on-surface font-bold">{formatCurrency(minNextBid)}</span></div>
                      </div>
                    </div>

                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Info size={16} className="text-primary" />
                        <span className="text-[10px] font-label font-black tracking-widest uppercase text-primary">How This Auction Works</span>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                        This is a reverse auction. Members bid for the payout they want from the monthly pool, and the
                        lowest eligible bid wins. The remaining amount stays with the group as dividend value.
                      </p>
                      <div className="space-y-2 text-sm">
                        <p>Suggested bid: <span className="text-primary font-bold">{formatCurrency(aiRecommendation.suggestedBid)}</span></p>
                        <p>Estimated group dividend: <span className="text-primary font-bold">{formatCurrency(aiRecommendation.groupDividend)}</span></p>
                        <p>Bid increment rule: <span className="text-primary font-bold">{formatCurrency(auction.bidIncrement)}</span></p>
                      </div>
                    </div>
                  </div>
                ) : closedResult ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                      <Trophy size={20} />
                      <span className="text-sm font-headline font-black">Winner Confirmed</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ResultBox label="Winner" value={closedResult.winner} />
                      <ResultBox label="Winning Bid" value={formatCurrency(closedResult.winningBid)} />
                      <ResultBox label="Group Dividend" value={formatCurrency(closedResult.groupDividend)} />
                    </div>
                    <div className="mt-5 flex gap-3">
                      <Link to="/winner" className="px-5 py-3 rounded-xl bg-primary text-on-primary font-headline font-bold">
                        View Winner Screen
                      </Link>
                      <Link to="/ledger" className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-headline font-bold">
                        View Ledger
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-0"></div>
            </section>

            <section className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-headline font-bold flex items-center gap-2">
                  <TrendingDown size={18} className="text-primary" />
                  Live Leaderboard
                </h3>
                <span className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant opacity-40">Lowest bid leads</span>
              </div>

              <div className="space-y-3">
                        {auction.history.map((bid, index) => (
                  <BidderItem
                    key={`${bid.bidder}-${index}`}
                    name={bid.bidder}
                    amount={formatCurrency(bid.amount)}
                    isLeader={index === 0}
                    isMe={bid.bidder_email === user?.email}
                    time={bid.time}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-headline font-bold mb-4 flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Eligibility
              </h3>
              <p className="text-xs text-on-surface-variant opacity-60 mb-4 leading-relaxed">
                Members who already received the fund in earlier months are excluded from this cycle.
              </p>
              <div className="space-y-3">
                {auction.previousWinners.map((entry) => (
                  <div key={`${entry.month}-${entry.winner}`} className="flex items-center gap-3 grayscale opacity-50">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.winner}`} alt={entry.winner} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold font-headline">{entry.winner}</p>
                      <p className="text-[10px] opacity-60 italic">Won in Month {entry.month}</p>
                    </div>
                    <CheckCircle2 size={14} className="text-primary opacity-60" />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-headline font-bold mb-4 flex items-center gap-2">
                <History size={16} className="text-primary" />
                Recent History
              </h3>
              <div className="space-y-4">
                {auction.previousWinners.map((entry) => (
                  <HistoryItem
                    key={`history-${entry.month}`}
                    month={entry.month}
                    winner={entry.winner}
                    amount={formatCurrency(entry.amount)}
                  />
                ))}
              </div>
            </section>

            {auction.isActive ? (
              <section className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
                <h3 className="text-sm font-headline font-bold mb-4 flex items-center gap-2">
                  <TimerReset size={16} className="text-primary" />
                  Control
                </h3>
                <p className="text-xs text-on-surface-variant opacity-60 mb-4">
                  Close the auction manually when the bidding window ends or during your demo.
                </p>
                <button
            onClick={() => { void handleCloseAuction() }}
                  className="w-full rounded-xl bg-primary text-on-primary py-3 font-headline font-bold"
                >
                  Close Auction and Lock Winner
                </button>
              </section>
            ) : null}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isBidding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-md px-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface-container-high max-w-md w-full rounded-2xl border border-white/10 p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Gavel size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-headline font-black text-on-surface mb-2">Confirm Reverse Bid</h2>
              <p className="text-on-surface-variant mb-8 opacity-60">
                You are requesting <span className="text-on-surface font-bold">{formatCurrency(Number(bidAmount) || 0)}</span> from the
                Month {currentCycle} pool. Lower bids are better in this auction.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmBid}
                  disabled={submitting}
                  className="bg-primary text-on-primary py-4 rounded-xl font-headline font-bold text-lg hover:bg-primary-container transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Bid'}
                </button>
                <button
                  onClick={() => setIsBidding(false)}
                  className="py-4 text-on-surface-variant font-headline font-bold hover:text-on-surface transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BidderItem({ name, amount, isLeader, isMe, time }: any) {
  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-xl border transition-all',
      isLeader ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-lowest border-white/5',
    )}>
      <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt={name} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold font-headline">
          {name}
          {isMe ? <span className="text-[10px] font-label text-primary ml-2 uppercase tracking-widest">(You)</span> : null}
          {isLeader ? <span className="text-[10px] font-label text-primary ml-2 uppercase tracking-widest">(Leading)</span> : null}
        </p>
        <p className="text-[10px] text-on-surface-variant opacity-40 uppercase tracking-widest">{formatTimeStamp(time)}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-headline font-black text-on-surface tabular-nums">{amount}</p>
      </div>
    </div>
  )
}

function HistoryItem({ month, winner, amount }: any) {
  return (
    <div className="flex justify-between items-center text-xs">
      <div>
        <span className="text-on-surface-variant opacity-40 font-label tracking-widest uppercase mr-2">Month {month}</span>
        <span className="font-bold text-on-surface">{winner}</span>
      </div>
      <span className="font-headline font-black text-tertiary tabular-nums">{amount}</span>
    </div>
  )
}

function ResultBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
      <p className="text-[10px] font-label uppercase tracking-tighter opacity-40 mb-1">{label}</p>
      <p className="text-xl font-headline font-black text-on-surface">{value}</p>
    </div>
  )
}

function formatCurrency(amount: number) {
  return `Rs ${amount.toLocaleString('en-IN')}`
}

function formatTimeStamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit' })
}
