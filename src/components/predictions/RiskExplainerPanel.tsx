import { X, BrainCircuit, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import { RiskBadge } from "./RiskBadge";

interface RiskExplainerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
  prediction: any;
  cycle: number;
}

export function RiskExplainerPanel({ isOpen, onClose, member, prediction, cycle }: RiskExplainerPanelProps) {
  if (!isOpen || !member || !prediction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden shadow-cyan-500/10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white tracking-wide">Gemini Risk Analysis</h3>
              <p className="text-xs text-slate-400">{member.name} — Cycle {cycle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[80vh] space-y-6">
          
          {/* Top Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Risk Level</span>
              <RiskBadge riskLevel={prediction.riskLevel} variant="full" confidence={prediction.confidence} />
            </div>
            
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Confidence</span>
                <span>{prediction.confidence}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    prediction.riskLevel === 'LOW' ? 'bg-emerald-400' :
                    prediction.riskLevel === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Why this score</h4>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5 text-sm text-slate-300 leading-relaxed italic">
              "{prediction.reasoning}"
            </div>
          </div>

          {/* Factors */}
          <div className="grid gap-4">
            {prediction.positiveFactors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-emerald-400/80 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Positive Factors
                </h4>
                <ul className="space-y-1.5">
                  {prediction.positiveFactors.map((factor: string, i: number) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 mt-1.5 shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {prediction.keyRiskFactors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Risk Factors
                </h4>
                <ul className="space-y-1.5">
                  {prediction.keyRiskFactors.map((factor: string, i: number) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mt-1.5 shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              System Action
            </h4>
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/30 text-sm text-cyan-100/90 font-medium tracking-wide">
              {prediction.recommendedAction.replace(/_/g, ' ')}
              {prediction.earlyNudgeDays > 0 && ` — Scheduled for ${prediction.earlyNudgeDays} days early`}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
