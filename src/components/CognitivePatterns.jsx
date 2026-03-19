"use client";
import useStore from "@/store";

const PATTERN_COLORS = {
  recurring_theme: { color: "#64B5F6", icon: "◎" },
  avoidance: { color: "#FF8A65", icon: "⊘" },
  strength: { color: "#81C784", icon: "◆" },
  blind_spot: { color: "#E57373", icon: "◌" },
  decision_style: { color: "#BA68C8", icon: "⟡" },
};

export default function CognitivePatterns({ open, onClose }) {
  const cognitivePatterns = useStore((s) => s.cognitivePatterns);
  const detectPatterns = useStore((s) => s.detectPatterns);
  const patternsLoading = useStore((s) => s.patternsLoading);
  const workspaces = useStore((s) => s.workspaces);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-full max-w-lg max-h-[80vh] bg-void-light border border-white/[0.06]
                    rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
          <h2 className="font-mono text-xs tracking-[3px] text-white/30 uppercase">
            Cognitive Patterns
          </h2>
          <button
            onClick={onClose}
            className="text-white/20 hover:text-white/40 text-sm transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display text-xs text-white/25">
              Patterns detected across your thinking spaces
            </p>
            <button
              onClick={detectPatterns}
              disabled={patternsLoading || workspaces.length < 2}
              className="font-mono text-[9px] tracking-wider px-3 py-1.5 rounded-lg
                         bg-accent-blue/10 border border-accent-blue/20 text-white/50
                         hover:bg-accent-blue/15 disabled:opacity-30 transition-all"
            >
              {patternsLoading ? "ANALYZING..." : "DETECT PATTERNS"}
            </button>
          </div>

          {workspaces.length < 2 && (
            <p className="text-center py-8 font-display text-sm text-white/15">
              Need at least 2 workspaces with thoughts to detect patterns.
            </p>
          )}

          {cognitivePatterns.length === 0 && workspaces.length >= 2 && !patternsLoading && (
            <p className="text-center py-8 font-display text-sm text-white/15">
              No patterns detected yet. Click &quot;Detect Patterns&quot; to analyze your thinking across spaces.
            </p>
          )}

          {patternsLoading && (
            <div className="text-center py-8">
              <span className="font-mono text-[10px] tracking-wider text-accent-blue/30 animate-pulse">
                Analyzing your thinking patterns across workspaces...
              </span>
            </div>
          )}

          {cognitivePatterns.map((pattern) => {
            const cfg = PATTERN_COLORS[pattern.pattern_type] || PATTERN_COLORS.recurring_theme;
            return (
              <div
                key={pattern.id}
                className="rounded-xl px-4 py-3 transition-all"
                style={{
                  background: `${cfg.color}06`,
                  border: `1px solid ${cfg.color}15`,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span
                    className="font-mono text-[9px] tracking-wider uppercase"
                    style={{ color: `${cfg.color}80` }}
                  >
                    {pattern.pattern_type?.replace("_", " ")}
                  </span>
                  {pattern.frequency > 1 && (
                    <span className="font-mono text-[9px] text-white/15 ml-auto">
                      ×{pattern.frequency}
                    </span>
                  )}
                </div>
                <p className="font-display text-sm text-white/60 leading-relaxed">
                  {pattern.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
