import { useState } from "react";
import { BrainCircuit, Activity, ChevronRight, RefreshCw } from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import { RiskExplainerPanel } from "./RiskExplainerPanel";
import { ApiService } from "../../services/ApiService";

interface GroupRiskPanelProps {
  fund: any;
  onRefresh: () => void;
}

export function GroupRiskPanel({ fund, onRefresh }: GroupRiskPanelProps) {
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Group stats
  const predictions = fund.members.filter((m: any) => m.lastPrediction);
  const hasPredictions = predictions.length > 0;
  
  const highRisk = predictions.filter((m: any) => m.currentRiskLevel === 'HIGH').length;
  const medRisk = predictions.filter((m: any) => m.currentRiskLevel === 'MEDIUM').length;
  
  const handleRunPredictions = async () => {
    setIsPredicting(true);
    try {
      await ApiService.runAiPredictions(fund.fundId);
      onRefresh(); // Refresh the whole fund context to get new predictions
    } catch (e) {
      console.error("Failed to run predictions", e);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide">AI Risk Monitor</h3>
            <p className="text-sm text-slate-400">Cycle {fund.currentCycle} Predictions</p>
          </div>
        </div>
        
        <button
          onClick={handleRunPredictions}
          disabled={isPredicting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-all border border-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPredicting ? 'animate-spin text-cyan-400' : ''}`} />
          {isPredicting ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {!hasPredictions ? (
        <div className="py-8 text-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20">
          <Activity className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No predictions generated yet.</p>
          <button 
            onClick={handleRunPredictions}
            className="mt-3 text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors"
          >
            Generate AI Risk Report →
          </button>
        </div>
      ) : (
        <>
          {/* Summary Strip */}
          <div className="flex items-center gap-4 p-3 mb-4 rounded-xl bg-slate-800/50 border border-white/5 text-sm">
            <div className="flex-1">
              <span className="text-slate-400">High Risk:</span>
              <strong className={`ml-2 ${highRisk > 0 ? 'text-red-400' : 'text-slate-300'}`}>{highRisk}</strong>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex-1">
              <span className="text-slate-400">Warnings:</span>
              <strong className={`ml-2 ${medRisk > 0 ? 'text-amber-400' : 'text-slate-300'}`}>{medRisk}</strong>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex-1 text-right">
               <span className="text-cyan-400/80 text-xs font-medium uppercase tracking-wider">Gemini Active</span>
            </div>
          </div>

          {/* Member List */}
          <div className="space-y-2 relative z-10">
            {fund.members.map((member: any) => (
              <div 
                key={member.id}
                onClick={() => member.lastPrediction && setSelectedMember(member)}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  member.lastPrediction 
                    ? 'bg-slate-800/30 border border-white/5 hover:bg-slate-800 hover:border-cyan-500/30 cursor-pointer' 
                    : 'bg-slate-800/10 border border-transparent opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                    {member.picture ? (
                       <img src={member.picture} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{member.name}</h4>
                    {member.lastPrediction && (
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                        {member.lastPrediction.recommendedAction.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                </div>

                {member.lastPrediction ? (
                  <div className="flex items-center gap-3">
                    <RiskBadge variant="pill" riskLevel={member.currentRiskLevel} confidence={member.lastPrediction.confidence} />
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Pending...</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Explainer Modal */}
      {selectedMember && (
        <RiskExplainerPanel 
          isOpen={true} 
          onClose={() => setSelectedMember(null)}
          member={selectedMember}
          prediction={selectedMember.lastPrediction}
          cycle={fund.currentCycle}
        />
      )}
    </div>
  );
}
