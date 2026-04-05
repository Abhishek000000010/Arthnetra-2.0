import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

interface RiskBadgeProps {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence?: number;
  variant?: "full" | "mini" | "pill";
  onClick?: () => void;
}

export function RiskBadge({ riskLevel, confidence, variant = "pill", onClick }: RiskBadgeProps) {
  const config = {
    LOW: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: ShieldCheck, label: "Low Risk" },
    MEDIUM: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: Shield, label: "Medium Risk" },
    HIGH: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", icon: ShieldAlert, label: "High Risk" },
  };

  const current = config[riskLevel] || config.LOW;
  const Icon = current.icon;

  if (variant === "mini") {
    return (
      <button 
        onClick={onClick}
        title={confidence ? `AI confidence: ${confidence}%` : current.label}
        className={`flex items-center justify-center w-6 h-6 rounded-full ${current.bg} ${current.color} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <Icon className="w-3 h-3" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      title={confidence ? `AI confidence: ${confidence}%` : current.label}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg} ${current.border} ${current.color} cursor-pointer hover:opacity-80 transition-opacity`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{current.label}</span>
      {variant === "full" && confidence && (
        <span className="opacity-70 ml-1">— {confidence}%</span>
      )}
    </button>
  );
}
