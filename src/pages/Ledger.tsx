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
import { useFund } from '../context/FundContext'
import { cn } from '../utils/cn.ts'

export function Ledger() {
  const { state } = useFund()
  const { activity, fundName, currentCycle, poolTotal, members } = state

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Database size={20} />
              </div>
              <span className="text-[10px] font-label font-black tracking-[0.2em] uppercase text-on-surface-variant opacity-60">
                Immutable Virtual Chain
              </span>
            </div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">Audit Ledger: {fundName}</h1>
            <p className="text-on-surface-variant font-medium opacity-60">
              Real-time cryptographic verification of all group activities for Cycle #{currentCycle}.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Chain Active
          </div>
        </header>

        {/* Ledger Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <LedgerStat 
            label="Total Pool Value" 
            value={`₹${poolTotal.toLocaleString('en-IN')}`} 
            detail={`${members.length} verified members`}
            icon={<ShieldCheck size={18} />}
          />
          <LedgerStat 
            label="Current Cycle" 
            value={`Cycle #${currentCycle}`} 
            detail="Active consensus round"
            icon={<Zap size={18} />}
          />
          <LedgerStat 
            label="Ledger State" 
            value="Synchronized" 
            detail={`${activity.length} verified blocks`}
            icon={<Lock size={18} />}
          />
        </div>

        {/* Blockchain-style Feed */}
        <div className="relative space-y-6 max-w-4xl pb-20">
          {activity.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-white/5 bg-surface-container-low">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Database size={32} className="opacity-20" />
              </div>
              <p className="text-on-surface-variant opacity-40 font-headline font-bold">No blocks mined yet.</p>
            </div>
          ) : (
            activity.map((block: any, index: number) => (
              <LedgerBlock 
                key={block.id}
                type={block.type === 'member' ? 'payment' : block.type}
                title={block.title}
                description={block.detail}
                timestamp={new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                hash={block.hash}
                prevHash={block.prevHash}
                isLast={index === activity.length - 1}
              />
            ))
          )}
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-surface-container-low border border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20">
               <Layers size={24} className="text-primary" />
             </div>
             <div>
               <h4 className="font-headline font-bold uppercase tracking-tight text-sm">ArthaNetra Node Governance</h4>
               <p className="text-[10px] text-on-surface-variant opacity-60">Verified by {members.length + 1} validator shards across the collective.</p>
             </div>
           </div>
           <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-label uppercase tracking-widest opacity-50">
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
            <span className="text-[9px] font-label uppercase tracking-tighter opacity-30">Current Block Hash</span>
            <div className="relative group/hash">
              <code className="block text-xs font-mono bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/5 text-primary/80 truncate">
                {hash || "VERIFYING_CONSENSUS..."}
              </code>
              {hash && (
                <button 
                  onClick={() => { navigator.clipboard.writeText(hash).catch(() => {}) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-primary/10 text-primary opacity-0 group-hover/hash:opacity-100 transition-all hover:bg-primary/20"
                >
                  <ArrowRight size={10} className="-rotate-45" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-label uppercase tracking-tighter opacity-30">Previous Block Hash</span>
            <code className="text-xs font-mono bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/5 text-on-surface-variant opacity-40 truncate">
              {prevHash || "0x0000_GENESIS_SEED"}
            </code>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
