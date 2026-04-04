import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import { 
  Database, 
  ShieldCheck, 
  Layers, 
  Hash, 
  Zap,
  Lock,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { cn } from '../utils/cn.ts'

export function Ledger() {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
               <Database size={20} />
             </div>
             <span className="text-[10px] font-label font-black tracking-[0.2em] uppercase text-on-surface-variant opacity-60">Immutable Record</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">Sovereign Ledger</h1>
          <p className="text-on-surface-variant font-medium opacity-60">Real-time cryptographic verification of all group activities.</p>
        </header>

        {/* Ledger Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <LedgerStat 
            label="Total Contributions" 
            value="₹1,24,00,000" 
            detail="124 active members"
            icon={<ShieldCheck size={18} />}
          />
          <LedgerStat 
            label="Yield Generated" 
            value="12.8% APY" 
            detail="Average across 482 cycles"
            icon={<Zap size={18} />}
          />
          <LedgerStat 
            label="Default Risk" 
            value="0.02%" 
            detail="AI-mitigated in Cycle #482"
            icon={<Lock size={18} />}
          />
        </div>

        {/* Blockchain-style Feed */}
        <div className="space-y-6 max-w-4xl">
          <LedgerBlock 
            type="auction"
            title="Auction Completed: Cycle #482"
            description="Bid won by @Ananya_K • ID: 829-XJ2"
            timestamp="Oct 24, 14:22:10"
            hash="0x7a8f...92c4"
            prevHash="0x4b1e...01df"
          />
          <LedgerBlock 
            type="payment"
            title="Monthly Contribution Processed"
            description="118/124 members successful • Batch #992"
            timestamp="Oct 24, 09:00:00"
            hash="0x4b1e...01df"
            prevHash="0x1c9d...f4a2"
          />
          <LedgerBlock 
            type="rule"
            title="Smart Rule Triggered: Default Prevention"
            description="Grace period extended for @Rahul_M • Collateral Held"
            timestamp="Oct 23, 18:45:12"
            hash="0x1c9d...f4a2"
            prevHash="0xe82b...3371"
          />
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-surface-container-low border border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20">
               <Layers size={24} className="text-primary" />
             </div>
             <div>
               <h4 className="font-headline font-bold">Node Governance</h4>
               <p className="text-xs text-on-surface-variant opacity-60">Verified by 12 validator nodes across the collective.</p>
             </div>
           </div>
           <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-label uppercase tracking-widest">
             Export Audit CSV
             <ExternalLink size={14} />
           </button>
        </div>
      </main>
    </div>
  )
}

function LedgerStat({ label, value, detail, icon }: any) {
  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-primary opacity-60">{icon}</span>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <ArrowRight size={16} />
        </button>
      </div>
      <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-40 mb-1">{label}</p>
      <h3 className="text-2xl font-headline font-black text-on-surface tabular-nums mb-1">{value}</h3>
      <p className="text-xs text-on-surface-variant opacity-60">{detail}</p>
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12 transition-all group-hover:bg-primary/20"></div>
    </div>
  )
}

function LedgerBlock({ type, title, description, timestamp, hash, prevHash }: any) {
  const typeStyles = {
    auction: "bg-tertiary/10 text-tertiary border-tertiary/20",
    payment: "bg-primary/10 text-primary border-primary/20",
    rule: "bg-secondary/10 text-secondary border-secondary/20",
  } as any

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-surface-container-low rounded-2xl border border-white/5 p-6 flex gap-6 group hover:border-white/10 transition-all shadow-sm"
    >
      <div className="flex flex-col items-center">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", typeStyles[type])}>
          <Hash size={18} />
        </div>
        <div className="flex-1 w-px bg-white/5 my-2"></div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-headline font-bold text-lg">{title}</h3>
          <span className="text-[10px] font-label uppercase tracking-widest opacity-40">{timestamp}</span>
        </div>
        <p className="text-sm text-on-surface-variant opacity-60 mb-6">{description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-label uppercase tracking-tighter opacity-30">Current Hash</span>
            <code className="text-xs font-mono bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/5 text-primary/80 truncate">
              {hash}
            </code>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-label uppercase tracking-tighter opacity-30">Previous Hash</span>
            <code className="text-xs font-mono bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/5 text-on-surface-variant opacity-40 truncate">
              {prevHash}
            </code>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
