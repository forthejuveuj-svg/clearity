"use client";
import { useState, useEffect } from "react";
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

const Q_TYPE_ICONS = {
  ground: "👁",
  challenge: "⚡",
  reduce: "🔬",
  connect: "🔗",
  expand: "🌍",
};

export default function FocusMode() {
  const focusNode = useStore((s) => s.focusNode);
  const focusSteps = useStore((s) => s.focusSteps);
  const focusLoading = useStore((s) => s.focusLoading);
  const exitFocus = useStore((s) => s.exitFocus);
  const generateFocusQuestion = useStore((s) => s.generateFocusQuestion);
  const answerFocusStep = useStore((s) => s.answerFocusStep);
  const connections = useStore((s) => s.connections);
  const nodes = useStore((s) => s.nodes);

  const [visible, setVisible] = useState(false);
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    if (focusNode) {
      setTimeout(() => setVisible(true), 50);
      // Generate first question
      if (focusSteps.length === 0) generateFocusQuestion();
    } else {
      setVisible(false);
    }
  }, [focusNode]);

  if (!focusNode) return null;

  const cfg = TYPE_CONFIG[focusNode.node_type] || TYPE_CONFIG.thought;
  const currentStep = focusSteps[focusSteps.length - 1];

  // Find related nodes
  const relatedIds = new Set();
  connections.forEach((c) => {
    if (c.source_node_id === focusNode.id) relatedIds.add(c.target_node_id);
    if (c.target_node_id === focusNode.id) relatedIds.add(c.source_node_id);
  });
  const relatedNodes = nodes.filter((n) => relatedIds.has(n.id));

  const handleAnswer = () => {
    if (!inputVal.trim()) return;
    const idx = focusSteps.length - 1;
    answerFocusStep(idx, inputVal.trim());
    setInputVal("");
    // Generate next question
    if (focusSteps.length < 5) {
      setTimeout(() => generateFocusQuestion(), 300);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center"
      style={{
        background: "rgba(6,7,12,0.96)",
        backdropFilter: "blur(20px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* Back button */}
      <button
        onClick={exitFocus}
        className="absolute top-6 left-6 font-mono text-[11px] tracking-wider
                   text-white/30 hover:text-white/50 border border-white/[0.06]
                   px-4 py-1.5 rounded-md transition-colors"
      >
        ← CANVAS
      </button>

      {/* Progress */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <div className="w-48 h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(focusSteps.length / 5) * 100}%`,
              background: `linear-gradient(90deg, ${cfg.color}60, rgba(100,160,255,0.6))`,
            }}
          />
        </div>
      </div>

      {/* Anchor thought */}
      <div className="text-center max-w-lg px-6 mb-10">
        <div
          className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center text-xl"
          style={{
            background: `${cfg.color}12`,
            border: `1px solid ${cfg.color}30`,
            boxShadow: `0 0 40px ${cfg.color}15`,
            color: cfg.color,
          }}
        >
          {cfg.symbol}
        </div>
        <p className="font-display text-xl text-white/80 leading-relaxed font-light">
          &ldquo;{focusNode.text}&rdquo;
        </p>
        <div
          className="font-mono text-[9px] tracking-widest uppercase mt-2"
          style={{ color: `${cfg.color}50` }}
        >
          {focusNode.node_type} · {relatedNodes.length} connected
        </div>
      </div>

      {/* Related nodes */}
      {relatedNodes.length > 0 && (
        <div className="flex gap-2 mb-8 flex-wrap justify-center max-w-lg px-6">
          {relatedNodes.slice(0, 4).map((rn) => {
            const rc = TYPE_CONFIG[rn.node_type] || TYPE_CONFIG.thought;
            return (
              <div
                key={rn.id}
                className="px-3 py-1.5 rounded-full text-xs font-display max-w-[160px]
                           truncate"
                style={{
                  background: `${rc.color}08`,
                  border: `1px solid ${rc.color}15`,
                  color: `${rc.color}80`,
                }}
              >
                {rc.symbol} {rn.text.substring(0, 30)}
              </div>
            );
          })}
        </div>
      )}

      {/* Current question */}
      <div className="w-full max-w-md px-6">
        {currentStep && !currentStep.answer && (
          <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
            <div className="font-mono text-[9px] tracking-widest text-white/15 mb-3">
              IMMERSION · STEP {focusSteps.length}/5
              {currentStep.question_type && (
                <span className="ml-2">
                  {Q_TYPE_ICONS[currentStep.question_type] || ""}
                </span>
              )}
            </div>
            <p className="font-display text-base text-white/60 leading-relaxed italic mb-5">
              {currentStep.question}
            </p>
            <textarea
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAnswer();
                }
              }}
              placeholder="Think out loud..."
              rows={3}
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.05]
                         rounded-xl text-white/85 font-display text-sm leading-relaxed
                         resize-none focus:border-accent-blue/20 transition-colors"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAnswer}
                disabled={!inputVal.trim()}
                className="font-mono text-[10px] tracking-wider px-5 py-2 rounded-lg
                           border transition-all disabled:opacity-20"
                style={{
                  background: inputVal.trim() ? `${cfg.color}10` : "transparent",
                  borderColor: inputVal.trim() ? `${cfg.color}25` : "rgba(255,255,255,0.05)",
                  color: "rgba(200,210,230,0.8)",
                }}
              >
                {focusSteps.length >= 5 ? "COMPLETE" : "NEXT →"}
              </button>
            </div>
          </div>
        )}

        {focusLoading && (
          <div className="text-center py-8">
            <span className="font-mono text-[10px] tracking-wider text-accent-blue/30 animate-pulse">
              FORMULATING NEXT QUESTION...
            </span>
          </div>
        )}

        {/* Completed steps summary */}
        {focusSteps.length > 0 && (
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  background:
                    i < focusSteps.filter((s) => s.answer).length
                      ? `${cfg.color}60`
                      : "rgba(255,255,255,0.06)",
                }}
              />
            ))}
          </div>
        )}

        {/* All steps answered - show summary */}
        {focusSteps.length >= 5 &&
          focusSteps.every((s) => s.answer) && (
            <div
              className="mt-8 text-center"
              style={{ animation: "fadeSlideUp 0.4s ease both" }}
            >
              <p className="font-display text-sm text-white/40 mb-4">
                You&apos;ve pulled this thread through 5 layers. The canvas is waiting.
              </p>
              <button
                onClick={exitFocus}
                className="font-mono text-[10px] tracking-wider px-6 py-2.5 rounded-lg
                           bg-accent-teal/10 border border-accent-teal/20 text-white/70
                           hover:bg-accent-teal/15 transition-colors"
              >
                RETURN TO CANVAS →
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
