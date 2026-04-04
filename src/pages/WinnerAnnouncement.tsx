import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import {
  Trophy,
  ArrowRight,
  ShieldCheck,
  Zap,
  LayoutDashboard
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFund } from '../context/FundContext'

export function WinnerAnnouncement() {
  const { state } = useFund()
  const result = state.auction.lastResult

  if (!result) {
    return (
      <div className="flex h-screen bg-surface overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="max-w-xl w-full rounded-[2rem] border border-white/5 bg-surface-container-low p-10 text-center">
            <h1 className="text-4xl font-headline font-black text-on-surface mb-4">No Winner Yet</h1>
            <p className="text-on-surface-variant opacity-60 mb-8">
              Close the live auction first to lock the winner and generate the result screen.
            </p>
            <Link to="/auction" className="inline-flex items-center gap-3 rounded-2xl bg-primary px-6 py-4 font-headline font-bold text-on-primary">
              Go To Auction
              <ArrowRight size={20} />
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const verificationHash = `0x${result.winner.replace(/\s+/g, '').slice(0, 6).toLowerCase()}${result.cycle}secured`

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 relative flex flex-col items-center justify-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full"></div>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-4xl w-full z-10"
        >
          <header className="text-center mb-12">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6"
            >
              <Trophy size={20} className="animate-bounce" />
              <span className="text-xs font-label font-black tracking-[0.2em] uppercase">Auction Results Verified</span>
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-headline font-black text-on-surface mb-4 tracking-tighter"
            >
              Winner Announcement
            </motion.h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-surface-container-low rounded-[2rem] border border-white/5 p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>

              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-primary/20 mb-6 shadow-xl ring-8 ring-primary/5">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${result.winner}`} alt={result.winner} className="w-full h-full object-cover" />
              </div>

              <h2 className="text-4xl font-headline font-black text-on-surface mb-2 tracking-tight">{result.winner}</h2>
              <p className="text-primary font-label uppercase tracking-widest text-xs font-bold mb-8">Verified Recipient • Month {result.cycle}</p>

              <div className="w-full grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-label uppercase tracking-tighter opacity-40 mb-1">Winning Bid</p>
                  <p className="text-xl font-headline font-black text-on-surface">{formatCurrency(result.winningBid)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-label uppercase tracking-tighter opacity-40 mb-1">Net Payout</p>
                  <p className="text-xl font-headline font-black text-tertiary italic">{formatCurrency(result.payout)}</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4 text-left w-full">
                <ShieldCheck size={24} className="text-primary shrink-0" />
                <div>
                  <p className="text-[10px] font-label font-black uppercase text-primary mb-0.5">Verification Lock</p>
                  <p className="text-[10px] font-mono opacity-40 truncate max-w-[200px]">{verificationHash}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-8 flex flex-col"
            >
              <div className="bg-surface-container-low rounded-[2rem] border border-white/5 p-8 flex-1">
                <div className="flex items-center gap-2 mb-6">
                  <Zap size={18} className="text-primary" />
                  <h3 className="text-sm font-label font-bold uppercase tracking-widest opacity-80">Result Summary</h3>
                </div>
                <p className="text-on-surface-variant text-lg leading-relaxed font-medium mb-8 opacity-80">
                  {result.winner} secured the Month {result.cycle} pool with the lowest valid bid, which protected group returns while meeting the winner&apos;s liquidity need.
                </p>

                <div className="p-6 rounded-2xl bg-tertiary/5 border border-tertiary/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-label font-black uppercase tracking-widest text-tertiary">Group Dividend Distributed</h4>
                    <span className="text-xl font-headline font-black tabular-nums text-tertiary">{formatCurrency(result.groupDividend)}</span>
                  </div>
                  <p className="text-[10px] font-label uppercase tracking-widest opacity-40">
                    Generated from the difference between the pool amount and the winning bid.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Link to="/dashboard" className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 p-5 rounded-2xl text-center font-headline font-bold transition-all flex items-center justify-center gap-3 group">
                  <LayoutDashboard size={20} className="group-hover:-rotate-6 transition-transform" />
                  Back to Dashboard
                </Link>
                <Link to="/ledger" className="bg-primary p-5 rounded-2xl aspect-square flex items-center justify-center text-on-primary hover:scale-105 transition-all">
                  <ArrowRight size={28} />
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

function formatCurrency(amount: number) {
  return `Rs ${amount.toLocaleString('en-IN')}`
}
