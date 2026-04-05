import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import {
  Dna,
  Brain,
  Zap,
  Activity,
  ShieldCheck,
  RefreshCw,
  Search,
  Calendar,
} from 'lucide-react'
import { cn } from '../utils/cn.ts'
import { useFund } from '../context/FundContext'
import { PredictionAccuracyCard } from '../components/predictions/PredictionAccuracyCard'

export function FundDNA() {
  const { state, evolveDNA } = useFund()
  const [evolving, setEvolving] = useState(false)
  
  // The backend now provides this 'dna' object
  const dna = state.dna || {
    version: 1,
    maturity_score: 15,
    last_evolution: new Date().toISOString(),
    rules: {
      min_trust_to_bid: 60,
      due_day: 5,
      penalty_percent: 0.02,
      min_bid_percent: 0.70
    },
    risk_analysis: {
      overall_score: 100,
      level: 'LOW',
      message: 'System initialization complete.',
      dimensions: { payment: 100, default: 100, trust: 100, auction: 100 }
    },
    observations: ['Genesis block active'],
    insights: ['Observing initial group stability']
  };

  const handleEvolve = async () => {
    setEvolving(true);
    try {
      await evolveDNA();
    } finally {
      setEvolving(false);
    }
  };

  // UI mapping for health dimensions
  const risk = dna.risk_analysis;
  const dims = risk.dimensions || { payment: 100, default: 100, trust: 100, auction: 100 };

  const rules = dna.rules || {};
  const displayRules = [
    { id: 'min_trust', name: 'Min Trust to Bid', value: `Score > ${rules.min_trust_to_bid}`, icon: ShieldCheck, change: rules.min_trust_to_bid > 60 },
    { id: 'due_date', name: 'Safe Payment Due', value: `${rules.due_day}th of Month`, icon: Calendar, change: rules.due_day !== 5 },
    { id: 'penalty', name: 'Risk Penalty Rate', value: `${(rules.penalty_percent * 100).toFixed(1)}%`, icon: Zap, change: rules.penalty_percent > 0.02 },
    { id: 'floor', name: 'Auction Floor Limit', value: `${((rules.min_bid_percent || 0.7) * 100).toFixed(0)}%`, icon: Activity, change: (rules.min_bid_percent || 0.7) > 0.7 },
  ];

  return (
    <div className="flex h-screen bg-surface selection:bg-primary/20">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-2 text-primary">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Brain size={16} />
              </div>
              <span className="text-[10px] font-label font-black tracking-[0.2em] uppercase">Autonomous Growth Engine</span>
            </div>
            <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight">Fund DNA</h1>
            <p className="text-on-surface-variant font-medium opacity-60 max-w-xl mt-2 text-sm leading-relaxed">
              ArthaNetra's collective brain. It calculates group risk, classifies member behavior, and evolves rules autonomously based on decentralized semantics.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-4"
          >
            <button
              onClick={handleEvolve}
              disabled={evolving}
              className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-on-primary font-headline font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden shadow-lg shadow-primary/20"
            >
              <AnimatePresence mode="wait">
                {evolving ? (
                  <motion.div
                    key="loading"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw size={18} />
                  </motion.div>
                ) : (
                  <Zap size={18} key="icon" className="group-hover:animate-pulse" />
                )}
              </AnimatePresence>
              {evolving ? 'Synthesizing DNA...' : 'Re-Analyze Cycle Patterns'}
            </button>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: GENOME VISUALIZATION & RISK */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-[530px] bg-surface-container-low rounded-[40px] border border-white/5 overflow-hidden group shadow-2xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.05),transparent_70%)]"></div>
              <div className="absolute inset-0 network-lines opacity-10"></div>
              
              {/* Animated DNA Core */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="w-[380px] h-[380px] border border-primary/10 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[10px] font-label font-black uppercase tracking-[0.3em] opacity-20 transform -rotate-90">Decentralized Logic Engine</p>
                  </div>
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 scale-75 border-2 border-dashed border-tertiary/10 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center scale-150">
                    <Dna className="text-primary/40 animate-pulse" size={64} />
                  </div>
                </div>
              </div>

              {/* Group Health Score overlay */}
              <div className="absolute top-10 left-10 space-y-4">
                <div className="p-8 rounded-[2.5rem] bg-surface/80 border border-white/10 backdrop-blur-xl shadow-xl">
                   <p className="text-[11px] font-label font-black uppercase tracking-[0.2em] text-primary mb-2">Group Health Score</p>
                   <div className="flex items-end gap-3 mb-6">
                      <span className="text-7xl font-headline font-black text-on-surface tabular-nums leading-none">{risk.overall_score}</span>
                      <div className="pb-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          risk.level === 'LOW' ? "bg-primary/20 text-primary" : 
                          risk.level === 'MEDIUM' ? "bg-secondary/20 text-secondary" :
                          "bg-error/20 text-error"
                        )}>
                          {risk.level} Risk
                        </span>
                      </div>
                   </div>
                   
                   <div className="space-y-4 w-64">
                      {Object.entries(dims).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{key} Health</span>
                            <span className="text-xs font-headline font-bold">{value as number}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              className={cn(
                                "h-full bg-primary",
                                (value as number) < 60 ? "bg-error" : (value as number) < 80 ? "bg-secondary" : "bg-primary"
                              )}
                            />
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
                
                <div className="px-6 py-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md max-w-sm">
                   <p className="text-xs font-medium text-on-surface leading-snug">
                     <span className="text-primary font-black uppercase tracking-widest mr-2">Analysis:</span>
                     {risk.message}
                   </p>
                </div>
              </div>

              {/* Observation Feed Cards (Floating) */}
              <div className="absolute bottom-10 right-10 space-y-4 max-w-xs">
                <h4 className="text-[10px] font-label font-black uppercase tracking-widest opacity-40 px-4">Latest Insights</h4>
                {dna.observations.slice(0, 3).map((obs: string, i: number) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex gap-4 items-start group hover:bg-white/10 transition-colors"
                  >
                    <div className="mt-1 p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Zap size={14} />
                    </div>
                    <p className="text-xs font-medium text-on-surface-variant leading-relaxed">{obs}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* RULE EVOLUTION TIMELINE */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-label font-bold uppercase tracking-[0.2em] opacity-40">Autonomous Rule Evolution</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-tertiary">
                  <Activity size={12} />
                  <span>Version {dna.version}.0 Active</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayRules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={cn(
                      "p-6 rounded-[2rem] border transition-all h-full flex flex-col group relative overflow-hidden",
                      rule.change 
                        ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5" 
                        : "bg-surface-container-low border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                      rule.change ? "bg-primary/20 text-primary" : "bg-white/5 text-on-surface opacity-40"
                    )}>
                      <rule.icon size={20} />
                    </div>
                    <p className="text-[10px] font-label font-black uppercase tracking-widest opacity-40 mb-1">{rule.name}</p>
                    <p className={cn(
                      "text-xl font-headline font-black",
                      rule.change ? "text-primary" : "text-on-surface"
                    )}>{rule.value}</p>
                    {rule.change && (
                      <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black uppercase text-primary">
                        <Zap size={10} />
                        <span>Evolved</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: MEMBER CLASSIFICATION */}
          <div className="lg:col-span-4 space-y-8">
            <PredictionAccuracyCard predictionStats={state.predictionStats} />

            <div className="bg-surface-container-high p-8 rounded-[40px] border border-white/5 shadow-xl flex flex-col h-full min-h-[530px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-secondary" />
                  <h3 className="text-sm font-label font-bold uppercase tracking-widest text-on-surface">Behavior Report</h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-xs font-black text-on-surface tabular-nums">{state.members.length}</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {state.members.map((member, i) => {
                  const classification = member.dnaClassification || { type: 'Reliable', emoji: '✅', color: '#6C63FF' };
                  return (
                    <motion.div 
                      key={member.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-3xl bg-surface/40 border border-white/5 hover:bg-white/5 transition-all flex items-center gap-4"
                    >
                      <img src={member.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} className="w-10 h-10 rounded-2xl bg-white/5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-headline font-bold text-on-surface truncate">{member.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black uppercase opacity-40">{classification.type}</span>
                          <div className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="text-[10px] font-black text-primary uppercase">Trust {Math.round(member.score/10)}</span>
                        </div>
                      </div>
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg"
                        style={{ backgroundColor: `${classification.color}20` }}
                      >
                        {classification.emoji}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 p-6 rounded-3xl bg-black/20 border border-white/5">
                <div className="flex items-center gap-2 mb-3 text-secondary">
                  <Search size={14} />
                  <span className="text-[10px] font-label font-black uppercase tracking-widest">Protocol Insight</span>
                </div>
                <p className="text-xs font-medium text-on-surface-variant leading-relaxed italic">
                  "{dna.insights[0] || "Synthesis in progress. Monitoring node synchronization."}"
                </p>
              </div>
            </div>

            {/* GROWTH INDICATOR */}
            <div className="bg-gradient-to-br from-primary/20 to-secondary/10 p-8 rounded-[40px] border border-primary/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                  <Dna size={80} />
               </div>
               <p className="text-[10px] font-label font-black uppercase tracking-widest text-primary mb-2">Network Maturity</p>
               <h4 className="text-4xl font-headline font-black text-on-surface leading-tight mb-4">Autonomous<br/>V{dna.version}.0</h4>
               <p className="text-xs font-medium text-on-surface/60 max-w-[200px]">
                 ArthaNetra has successfully completed {state.currentCycle} learning cycles. Next evolution in {48} hours.
               </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
