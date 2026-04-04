import { Sidebar } from '../components/Sidebar'
import { 
  AlertOctagon, 
  ShieldAlert, 
  Lock, 
  History, 
  Zap,
  ArrowRight,
  UserX,
  FileSearch,
  Scale
} from 'lucide-react'
import { cn } from '../utils/cn.ts'

export function DefaultHandling() {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="mb-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 rounded-lg bg-error/10 border border-error/20 text-error">
               <ShieldAlert size={20} />
             </div>
             <span className="text-[10px] font-label font-black tracking-[0.2em] uppercase text-on-surface-variant opacity-60">Enforcement Protocol</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-on-surface mb-2">Default Management Engine</h1>
          <p className="text-on-surface-variant font-medium opacity-60">Automated asset recovery and risk mitigation for cycle-based failures.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
           <div className="lg:col-span-2 space-y-8">
              {/* Impending Default Alert */}
              <section className="bg-error/5 rounded-3xl border border-error/20 p-8 relative overflow-hidden">
                 <div className="flex items-start gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error shrink-0">
                       <AlertOctagon size={32} />
                    </div>
                    <div>
                       <h3 className="text-xl font-headline font-bold text-error mb-2">Impending Default Identified</h3>
                       <p className="text-on-surface-variant text-sm leading-relaxed mb-6 opacity-80">
                         "Member <span className="text-on-surface font-bold">@Aryan_V</span> has missed the auction contribution window for Cycle 14. Historical data suggests <span className="text-on-surface font-black underline italic">high probability of recovery</span> if Grace Protocol is activated within 4 hours."
                       </p>
                       <div className="flex gap-3">
                          <button className="bg-error text-on-error px-6 py-2.5 rounded-xl text-xs font-label font-black uppercase tracking-widest shadow-lg shadow-error/20">Init Grace Protocol</button>
                          <button className="bg-white/5 text-on-surface-variant border border-white/10 px-6 py-2.5 rounded-xl text-xs font-label uppercase tracking-widest hover:bg-white/10">Ignore Inference</button>
                       </div>
                    </div>
                 </div>
                 <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-error/5 blur-3xl -z-0"></div>
              </section>

              {/* Enforcement Steps */}
              <section className="bg-surface-container-low rounded-3xl border border-white/5 p-8">
                 <h3 className="text-lg font-headline font-bold mb-8 flex items-center gap-2">
                    <Scale size={18} className="text-primary" />
                    Automated Enforcement Path
                 </h3>
                 
                 <div className="space-y-6 relative">
                    <div className="absolute left-6 top-8 bottom-8 w-px border-l border-dashed border-white/10"></div>
                    
                    <EnforcementStep 
                      active
                      title="Step 1: Liquidity Verification" 
                      detail="Inter-node checking of connected bank APIs and collateral pools."
                      status="completed"
                    />
                    <EnforcementStep 
                      active
                      title="Step 2: Asset Freeze Triggered" 
                      detail="Funds locked in collateral pool until settlement. Withdrawal disabled for @Aryan_V."
                      status="active"
                      icon={<Lock className="text-error" />}
                    />
                    <EnforcementStep 
                      title="Step 3: Repayment Re-routing" 
                      detail="Direct debit attempt from backup reserve collateral."
                      status="pending"
                    />
                    <EnforcementStep 
                      title="Step 4: Trust Score Correction" 
                      detail="Permanent 12pt reduction and Tier demotion across all active funds."
                      status="pending"
                      icon={<UserX />}
                    />
                 </div>
              </section>
           </div>

           {/* Ledger Log Sidebar */}
           <section className="bg-surface-container-low rounded-3xl border border-white/5 p-8 flex flex-col">
              <h3 className="text-sm font-label font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                 <History size={16} />
                 Immutable Log
              </h3>
              
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-white/5 font-mono text-[10px] space-y-4 mb-8">
                 <p className="text-primary opacity-80">0x71c...a3e29f1_INIT</p>
                 <p className="text-on-surface-variant opacity-30"># FETCH_MEMBER_METADATA (@Aryan_V)</p>
                 <p className="text-on-surface-variant opacity-30"># AUTH_FAILURE_DETECTED (Code: X-902)</p>
                 <p className="text-error opacity-80"># TRIGGER_COLLATERAL_LOCK_E1</p>
                 <div className="h-px bg-white/5 my-2"></div>
                 <p className="text-on-surface-variant opacity-30"># NOTIFY_VALIDATORS_POOL_A1</p>
                 <p className="animate-pulse text-tertiary"># WAITING_FOR_GRACE_INPUT...</p>
              </div>

              <div className="mt-auto space-y-4">
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <Zap size={16} className="text-primary" />
                    <span className="text-[10px] font-label uppercase tracking-widest opacity-60">System Resolution: 14ms</span>
                 </div>
                 <button className="w-full py-4 rounded-2xl border border-white/10 hover:border-primary/50 text-xs font-label uppercase tracking-widest transition-all flex items-center justify-center gap-2 group">
                    Full Audit Report
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
           </section>
        </div>
      </main>
    </div>
  )
}

function EnforcementStep({ title, detail, status, active, icon }: any) {
  return (
    <div className={cn(
      "flex items-start gap-6 transition-opacity",
      !active && "opacity-30 grayscale"
    )}>
       <div className={cn(
         "w-12 h-12 rounded-2xl flex items-center justify-center border relative z-10 bg-surface-container-low",
         status === 'completed' ? "bg-primary/10 text-primary border-primary/20" :
         status === 'active' ? "bg-error/10 text-error border-error/50 shadow-lg shadow-error/10" :
         "bg-white/5 text-white/20 border-white/5"
       )}>
          {icon || <FileSearch size={20} />}
       </div>
       <div className="flex-1 pt-1">
          <h4 className={cn("text-sm font-headline font-bold mb-1", status === 'active' && "text-error")}>{title}</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">{detail}</p>
       </div>
    </div>
  )
}
