import { Target, CheckCircle2, XCircle } from 'lucide-react'

interface PredictionAccuracyCardProps {
  predictionStats?: {
    total_evaluated: number
    correct_predictions: number
    accuracy_history: Array<{
      cycle: number
      evaluated: number
      correct: number
      accuracy: number
    }>
  }
}

export function PredictionAccuracyCard({ predictionStats }: PredictionAccuracyCardProps) {
  if (!predictionStats || predictionStats.accuracy_history.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-surface-container-low p-6 flex flex-col items-center justify-center text-center opacity-70">
        <Target size={32} className="text-on-surface-variant mb-3 opacity-50" />
        <h4 className="text-sm font-headline font-bold text-on-surface">No Accuracy Data Yet</h4>
        <p className="text-xs text-on-surface-variant max-w-xs mt-1">
          Predictions will be validated at the end of the current cycle.
        </p>
      </div>
    )
  }

  const latestAcc = predictionStats.accuracy_history[predictionStats.accuracy_history.length - 1].accuracy;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mr-6 -mt-6">
        <Target size={120} className="text-primary/10 transition-transform group-hover:scale-110 duration-700" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
          <Target size={16} className="text-primary" />
          AI Default Prediction Accuracy
        </h3>
        <p className="text-xs text-on-surface-variant opacity-70 mb-6 max-w-sm">
          Tracking the success rate of Gemini's predictions matching actual payment behaviors correctly at auction close.
        </p>

        <div className="flex items-end gap-3 mb-6">
          <div className="text-4xl font-headline font-black text-primary tabular-nums">
            {latestAcc.toFixed(1)}%
          </div>
          <p className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant opacity-60 mb-1.5">
            Latest Result
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-primary" />
            <div className="text-sm font-medium text-on-surface">
              <span className="font-bold text-primary">{predictionStats.correct_predictions}</span> Correct
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-error" />
            <div className="text-sm font-medium text-on-surface">
              <span className="font-bold text-error">{predictionStats.total_evaluated - predictionStats.correct_predictions}</span> Wrong
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant opacity-50 mb-3">
            Cycle History
          </p>
          <div className="flex gap-2">
            {predictionStats.accuracy_history.slice(-5).map((h, i) => (
              <div key={i} className="flex-1 rounded-lg bg-surface-container-high border border-white/5 p-3 flex flex-col items-center justify-center">
                <span className="text-[10px] font-label opacity-60 mb-1">C{h.cycle}</span>
                <span className="text-xs font-headline font-bold text-on-surface">{h.accuracy}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
