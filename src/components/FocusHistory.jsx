"use client";
import { useState } from "react";
import useStore from "@/store";

const TYPE_CONFIG = {
  question: { color: "#64B5F6", symbol: "?" },
  pressure: { color: "#FF8A65", symbol: "!" },
  idea: { color: "#81C784", symbol: "✦" },
  blocker: { color: "#E57373", symbol: "×" },
  reasoning: { color: "#BA68C8", symbol: "∴" },
  emotion: { color: "#FFB74D", symbol: "♡" },
  thought: { color: "#90A4AE", symbol: "·" },
  insight: { color: "#64FFDA", symbol: "◆" },
  assumption: { color: "#CE93D8", symbol: "~" },
  goal: { color: "#4FC3F7", symbol: "→" },
};

export default function FocusHistory({ open, onClose }) {
  const focusSessions = useStore((s) => s.focusSessions);
  const nodes = useStore((s) => s.nodes);
  const [expandedId, setExpandedId] = useState(null);

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
            Focus History
          </h2>
          <button
            onClick={onClose}
            className="text-white/20 hover:text-white/40 text-sm transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {focusSessions.length === 0 && (
            <p className="text-center py-12 font-display text-sm text-white/15">
              No focus sessions yet. Double-click a node to start one.
            </p>
          )}

          {focusSessions.map((session) => {
            const anchorNode = nodes.find((n) => n.id === session.anchor_node_id);
            const cfg = TYPE_CONFIG[anchorNode?.node_type] || TYPE_CONFIG.thought;
            const isExpanded = expandedId === session.id;
            const steps = session.steps || [];
            const duration = session.duration_seconds;

            return (
              <div
                key={session.id}
                className="rounded-xl border border-white/[0.04] overflow-hidden transition-all"
                style={{ background: "rgba(255,255,255,0.01)" }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{
                      background: `${cfg.color}12`,
                      border: `1px solid ${cfg.color}25`,
                      color: cfg.color,
                    }}
                  >
                    {cfg.symbol}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm text-white/60 truncate">
                      {anchorNode?.text || "Deleted node"}
                    </div>
                    <div className="font-mono text-[9px] text-white/20 mt-0.5 flex items-center gap-2">
                      <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{steps.length}/5 steps</span>
                      {duration && (
                        <>
                          <span>·</span>
                          <span>{Math.round(duration / 60)}m</span>
                        </>
                      )}
                      <span>·</span>
                      <span
                        style={{
                          color: session.outcome === "completed" ? "#81C784" : "#FFB74D",
                        }}
                      >
                        {session.outcome === "completed" ? "completed" : "partial"}
                      </span>
                    </div>
                  </div>
                  <span className="text-white/15 text-xs transition-transform" style={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  }}>
                    ▾
                  </span>
                </button>

                {isExpanded && steps.length > 0 && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/[0.03]">
                    {steps.map((step, i) => (
                      <div key={i} className="pt-3">
                        <div className="font-mono text-[9px] tracking-wider text-white/15 mb-1">
                          STEP {i + 1}
                        </div>
                        <p className="font-display text-xs text-white/50 italic mb-1.5">
                          {step.question}
                        </p>
                        {step.answer && (
                          <p className="font-display text-xs text-white/70 pl-3 border-l border-white/[0.06]">
                            {step.answer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
