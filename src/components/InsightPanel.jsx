"use client";
import useStore from "@/store";

const SEVERITY_COLORS = {
  high: { border: "#E57373", bg: "rgba(229,115,115,0.06)" },
  medium: { border: "#FFB74D", bg: "rgba(255,183,77,0.06)" },
  low: { border: "#90A4AE", bg: "rgba(144,164,174,0.06)" },
  positive: { border: "#81C784", bg: "rgba(129,199,132,0.06)" },
  hook: { border: "#64FFDA", bg: "rgba(100,255,218,0.06)" },
};

const TYPE_LABELS = {
  pattern: "Pattern",
  gap: "Gap",
  tension: "Tension",
  energy: "Energy",
  hook: "Entry Point",
  bias: "Bias",
  suggestion: "Suggestion",
};

export default function InsightPanel() {
  const insights = useStore((s) => s.insights);
  const isAnalyzing = useStore((s) => s.isAnalyzing);
  const cognitiveState = useStore((s) => s.cognitiveState);
  const overallObservation = useStore((s) => s.overallObservation);
  const dismissInsight = useStore((s) => s.dismissInsight);
  const analyzeCanvas = useStore((s) => s.analyzeCanvas);
  const nodes = useStore((s) => s.nodes);

  if (nodes.length < 2 && !isAnalyzing) return null;

  return (
    <div className="absolute top-4 right-4 w-72 z-20 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="font-mono text-[9px] tracking-[2px] text-white/20 uppercase">
          AI Observations
        </span>
        <button
          onClick={analyzeCanvas}
          disabled={isAnalyzing || nodes.length < 2}
          className="font-mono text-[9px] tracking-wider text-white/15 hover:text-white/30
                     disabled:opacity-30 transition-colors"
        >
          {isAnalyzing ? "ANALYZING..." : "REFRESH"}
        </button>
      </div>

      {/* Cognitive state badge */}
      {cognitiveState && (
        <div
          className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
          style={{ animation: "fadeSlideIn 0.3s ease both" }}
        >
          <div className="font-mono text-[9px] tracking-wider text-white/20 mb-1">
            MIND STATE
          </div>
          <div className="font-display text-sm text-white/50 capitalize">
            {cognitiveState}
          </div>
          {overallObservation && (
            <div className="font-display text-xs text-white/30 mt-1 leading-relaxed">
              {overallObservation}
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      {insights.map((ins, i) => {
        const colors = SEVERITY_COLORS[ins.severity] || SEVERITY_COLORS.medium;
        return (
          <div
            key={ins.id}
            className="group relative rounded-lg backdrop-blur-xl px-3 py-2.5"
            style={{
              background: colors.bg,
              borderLeft: `2px solid ${colors.border}50`,
              border: `1px solid ${colors.border}15`,
              animation: `fadeSlideIn 0.4s ease ${i * 0.1}s both`,
            }}
          >
            {/* Dismiss button */}
            <button
              onClick={() => dismissInsight(ins.id)}
              className="absolute top-2 right-2 text-white/10 hover:text-white/30
                         text-xs transition-colors opacity-0 group-hover:opacity-100"
            >
              ×
            </button>

            <div
              className="font-mono text-[9px] tracking-wider uppercase mb-1"
              style={{ color: `${colors.border}80` }}
            >
              {TYPE_LABELS[ins.insight_type] || ins.insight_type}
            </div>
            <div className="font-display text-xs text-white/70 leading-relaxed">
              {ins.text}
            </div>
          </div>
        );
      })}

      {isAnalyzing && (
        <div className="px-3 py-2 rounded-lg bg-white/[0.01] border border-white/[0.03]">
          <div className="font-mono text-[10px] text-accent-blue/30 animate-pulse">
            Observing your thinking...
          </div>
        </div>
      )}
    </div>
  );
}
