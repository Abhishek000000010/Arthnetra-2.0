import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import { 
  User, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  Award,
  AlertCircle,
  FileText,
  BadgeCheck
} from 'lucide-react'
import { cn } from '../utils/cn.ts'

export function MemberProfile() {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary/20 shadow-xl">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul" alt="Rahul" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-1.5 rounded-xl shadow-lg">
                 <BadgeCheck size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-headline font-black text-on-surface">Rahul Sharma</h1>
                <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-label font-bold uppercase tracking-widest border border-primary/20">Tier 1</span>
              </div>
              <p className="text-on-surface-variant font-medium opacity-60">Member since Oct 2022 • 12 Active Funds</p>
            </div>
          </div>

          <div className="flex gap-4">
             <div className="bg-surface-container-low px-6 py-4 rounded-2xl border border-white/5 text-right">
                <p className="text-[10px] font-label tracking-widest uppercase opacity-40 mb-1">Total Assets</p>
                <p className="text-2xl font-headline font-black text-on-surface tabular-nums">₹4,50,000</p>
             </div>
             <div className="bg-surface-container-low px-6 py-4 rounded-2xl border border-white/5 text-right">
                <p className="text-[10px] font-label tracking-widest uppercase opacity-40 mb-1">Trust Score</p>
                <p className="text-2xl font-headline font-black text-primary tabular-nums">942</p>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
          {/* Left: AI Trust Insight */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-surface-container-low rounded-3xl border border-white/5 p-8 relative overflow-hidden">
               <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-2">
                 <ShieldCheck size={20} className="text-primary" />
                 AI Trust Insight
               </h3>
               
               <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8 italic text-on-surface-variant text-lg leading-relaxed relative">
                  <span className="absolute -top-3 left-6 bg-surface-container-low px-2 text-[10px] uppercase font-label text-primary">Inference Report #992</span>
                  "Score reduced by 4 pts due to a late payment in July cycle. High recovery potential observed through recent over-collateralization. Potential for Tier 0 upgrade in 3 months."
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <h4 className="text-xs font-label uppercase tracking-widest text-on-surface-variant opacity-40">Risk Dimensions</h4>
                   <RiskProgress label="Repayment Accuracy" value={98} />
                   <RiskProgress label="Group Interaction" value={85} />
                   <RiskProgress label="Collateral Strength" value={92} />
                 </div>
                 <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-headline font-black text-primary mb-2">Regain 'Elite' Status</h4>
                      <p className="text-xs text-on-surface-variant opacity-60 leading-relaxed">Maintain 100% on-time payments for 3 cycles to recover lost points and unlock lower reserve requirements.</p>
                    </div>
                    <button className="mt-4 text-xs font-label uppercase tracking-widest text-primary font-bold flex items-center gap-2 hover:underline">
                      View Recovery Path
                      <TrendingUp size={14} />
                    </button>
                 </div>
               </div>
            </section>

            {/* Ledger Entries */}
            <section className="bg-surface-container-low rounded-3xl border border-white/5 p-8">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                   <FileText size={20} className="text-primary" />
                   Ledger Entries
                 </h3>
                 <button className="text-xs font-label uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">See all history</button>
               </div>

               <div className="space-y-4">
                 <LedgerItem 
                   title="Monthly Installment #04"
                   fund="Creative Studio"
                   amount="₹10,500"
                   status="verified"
                   date="Oct 12"
                 />
                 <LedgerItem 
                   title="Auction Bid Received"
                   fund="Health Tech"
                   amount="₹15,000"
                   status="verified"
                   date="Sep 28"
                 />
                 <LedgerItem 
                   title="Monthly Installment #03"
                   fund="Creative Studio"
                   amount="₹10,500"
                   status="late"
                   date="Sep 12"
                 />
               </div>
            </section>
          </div>

          {/* Right: Badges & Memberships */}
          <div className="space-y-8">
             <section className="bg-surface-container-low rounded-3xl border border-white/5 p-8">
                <h3 className="text-sm font-headline font-bold mb-6 flex items-center gap-2">
                  <Award size={18} className="text-primary" />
                  Proof of Reputation
                </h3>
                <div className="grid grid-cols-2 gap-4">
                   <Badge label="Founder" icon={<User size={14} />} />
                   <Badge label="Punctual" icon={<Clock size={14} />} />
                   <Badge label="Liquid" icon={<TrendingUp size={14} />} />
                   <Badge label="Trusted" icon={<ShieldCheck size={14} />} />
                </div>
             </section>

             <section className="bg-surface-container-low rounded-3xl border border-white/5 p-8">
                <h3 className="text-sm font-headline font-bold mb-6 flex items-center gap-2">
                  <Award size={18} className="text-primary" />
                  Active Groups
                </h3>
                <div className="space-y-4">
                   <ActiveGroup name="Creative Studio" role="Leader" />
                   <ActiveGroup name="Health Tech" role="Member" />
                   <ActiveGroup name="Agri-Yield Fund" role="Validator" />
                </div>
             </section>

             <div className="p-6 rounded-3xl bg-error/5 border border-error/20 flex items-start gap-4">
                <AlertCircle size={20} className="text-error mt-0.5" />
                <div>
                   <p className="text-xs font-headline font-bold text-error mb-1">Security Notice</p>
                   <p className="text-[10px] text-error/60 leading-normal">Your collateral is currently locked in Cycle #04 due to the July late status. Recovery in progress.</p>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function RiskProgress({ label, value }: any) {
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between text-[10px] font-label uppercase tracking-widest opacity-60">
         <span>{label}</span>
         <span>{value}%</span>
       </div>
       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            className="h-full bg-primary"
          />
       </div>
    </div>
  )
}

function LedgerItem({ title, fund, amount, status, date }: any) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-white/5 group hover:border-white/10 transition-all">
       <div className={cn(
         "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold",
         status === 'verified' ? "bg-primary/10 text-primary border border-primary/20" : "bg-error/10 text-error border border-error/20"
       )}>
         {status === 'verified' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
       </div>
       <div className="flex-1">
         <h4 className="text-sm font-headline font-bold">{title}</h4>
         <p className="text-xs opacity-40">{fund} • {date}</p>
       </div>
       <div className="text-right">
         <p className="text-sm font-headline font-black tabular-nums">{amount}</p>
         <p className="text-[10px] font-label uppercase tracking-widest opacity-30">{status}</p>
       </div>
    </div>
  )
}

function Badge({ label, icon }: any) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container-lowest border border-white/5">
       <div className="text-primary opacity-60">{icon}</div>
       <span className="text-[10px] font-label uppercase tracking-widest opacity-40">{label}</span>
    </div>
  )
}

function ActiveGroup({ name, role }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest border border-white/5">
       <span className="text-sm font-headline font-bold">{name}</span>
       <span className="text-[10px] font-label uppercase tracking-widest opacity-40 px-2 py-1 bg-white/5 rounded-md">{role}</span>
    </div>
  )
}
