import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import { 
  Database, 
  Hash, 
  Zap,
  Lock,
  Globe,
  Activity,
  Search,
  CheckCircle2,
  Copy,
  Clock
} from 'lucide-react'
import { useFund } from '../context/FundContext'
import { cn } from '../utils/cn.ts'

export function Ledger() {
  const { state } = useFund()
  const { activity, fundName, members } = state
  const [searchTerm, setSearchTerm] = useState('')

  // Simulated Global Stats
  const networkStats = useMemo(() => ({
    shards: members.length + 12,
    nodes: members.length * 4 + 1,
    latency: '12ms',
    tps: '4.2',
    lastBlock: activity[0]?.block || 482931
  }), [members.length, activity])

  const filteredActivity = activity.filter((tx: any) => 
    tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.hash.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden text-on-surface">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* NETWORK PULSE HEADER */}
        <header className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(196,192,255,1)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">ArthaNetra Mainnet Alpha</span>
            </div>
            <h1 className="text-4xl font-headline font-black tracking-tighter bg-gradient-to-r from-on-surface to-primary/40 bg-clip-text text-transparent">
              Block Explorer
            </h1>
            <p className="text-sm font-medium text-on-surface-variant opacity-40">
              Auditing Immutable Financial Lifecycle for {fundName}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="px-4 py-3 bg-surface-container rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Globe size={18} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-black uppercase opacity-40">Shards</span>
                <span className="text-sm font-headline font-bold">{networkStats.shards}</span>
              </div>
            </div>
            <div className="px-4 py-3 bg-surface-container rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <Activity size={18} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-black uppercase opacity-40">TPS</span>
                <span className="text-sm font-headline font-bold">{networkStats.tps}</span>
              </div>
            </div>
          </div>
        </header>

        {/* SEARCH & FILTERS */}
        <div className="relative mb-8 group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Search by Tx Hash, Block Height, or Event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-14 py-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/30"
          />
          <div className="absolute right-5 inset-y-0 flex items-center gap-2">
            <kbd className="px-2 py-1 rounded bg-white/5 text-[10px] text-on-surface-variant border border-white/10 font-bold uppercase tracking-widest leading-none">⌘ K</kbd>
          </div>
        </div>

        {/* LIVE TRANSACTIONS FEED */}
        <div className="space-y-4 max-w-5xl">
          <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-30">
            <div className="col-span-1">Type</div>
            <div className="col-span-2">Block #</div>
            <div className="col-span-4">Transaction Details</div>
            <div className="col-span-3">Timestamp / Hash</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          <AnimatePresence>
            {filteredActivity.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="py-20 text-center bg-surface-container/30 border border-dashed border-white/5 rounded-[2.5rem]"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/5 rounded-full flex items-center justify-center">
                  <Database size={32} className="opacity-20 translate-y-1" />
                </div>
                <p className="text-on-surface-variant opacity-40 font-headline font-bold">No verified transactions found.</p>
              </motion.div>
            ) : (
                filteredActivity.map((tx: any, idx: number) => (
                <ExplorerRow 
                  key={tx.id}
                  tx={tx}
                  index={idx}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER AUDIT SEAL */}
        <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-surface-container to-surface-container-low border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#000] border border-primary/20 flex items-center justify-center p-3 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <Lock size={32} className="text-primary relative z-10" />
              </div>
              <div>
                <h3 className="text-xl font-headline font-black uppercase tracking-tight">Audit Chain Finalized</h3>
                <p className="text-sm text-on-surface-variant opacity-40 leading-relaxed max-w-md">
                   Every cycle within {fundName} is cryptographically hashed across our peer nodes. 
                   Governance rules are enforced by on-chain DNA mutations for 100% transparency.
                </p>
              </div>
           </div>
           
           <div className="relative z-10 flex gap-3">
             <button className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                Download Block Log
             </button>
             <button className="px-6 py-4 rounded-2xl bg-primary text-on-primary text-xs font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(196,192,255,0.4)] transition-all active:scale-95">
                Verify Genesis Hash
             </button>
           </div>

           {/* GLOW EFFECT */}
           <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        </div>
      </main>
    </div>
  )
}

function ExplorerRow({ tx, index }: { tx: any, index: number }) {
  const isMining = index === 0 && (Date.now() - new Date(tx.timestamp).getTime() < 10000);
  
  const typeStyles = {
    auction: "bg-tertiary/10 text-tertiary border-tertiary/20",
    payment: "bg-primary/10 text-primary border-primary/20",
    success: "bg-primary/10 text-primary border-primary/20",
    info: "bg-white/5 text-on-surface-variant border-white/5",
    error: "bg-error/10 text-error border-error/20",
    warning: "bg-secondary/10 text-secondary border-secondary/20",
  } as any

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.005, backgroundColor: "#0e0e0e" }}
      className="grid grid-cols-12 px-6 py-5 bg-[#080808] border border-white/5 rounded-2xl items-center group transition-all"
    >
      <div className="col-span-1">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", typeStyles[tx.type] || typeStyles.info)}>
          {tx.type === 'auction' ? <Zap size={18} /> : <Hash size={18} />}
        </div>
      </div>

      <div className="col-span-2">
        <div className="flex flex-col">
          <span className="text-xs font-mono font-bold text-primary">#{tx.block}</span>
          <span className="text-[10px] text-on-surface-variant opacity-40 uppercase font-black uppercase tracking-tighter">Verified Block</span>
        </div>
      </div>

      <div className="col-span-4">
        <div className="flex flex-col pr-4">
          <h4 className="text-sm font-headline font-bold text-on-surface mb-0.5">{tx.title}</h4>
          <p className="text-xs text-on-surface-variant opacity-60 truncate font-medium">{tx.detail}</p>
        </div>
      </div>

      <div className="col-span-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} className="opacity-30" />
            <span className="text-[10px] font-bold text-on-surface-variant opacity-40">
                {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 group/hash">
             <code className="text-[11px] font-mono text-primary/60 truncate max-w-[140px] px-2 py-0.5 rounded bg-primary/5">{tx.hash}</code>
             <button 
                onClick={() => navigator.clipboard.writeText(tx.hash)}
                className="opacity-0 group-hover/hash:opacity-100 transition-opacity hover:text-primary"
             >
                <Copy size={12} />
             </button>
          </div>
        </div>
      </div>

      <div className="col-span-2 text-right">
        {isMining ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary">
             <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest">Mining...</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary group-hover:bg-primary/10 transition-colors">
             <CheckCircle2 size={12} />
             <span className="text-[9px] font-black uppercase tracking-widest">Confirmed+</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
