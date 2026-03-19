"use client";
import { useState } from "react";
import useStore from "@/store";

const NODE_TYPES = [
  { id: "thought", label: "Thought", symbol: "·", color: "#90A4AE" },
  { id: "question", label: "Question", symbol: "?", color: "#64B5F6" },
  { id: "idea", label: "Idea", symbol: "✦", color: "#81C784" },
  { id: "pressure", label: "Pressure", symbol: "!", color: "#FF8A65" },
  { id: "blocker", label: "Blocker", symbol: "×", color: "#E57373" },
  { id: "reasoning", label: "Reasoning", symbol: "∴", color: "#BA68C8" },
  { id: "emotion", label: "Emotion", symbol: "♡", color: "#FFB74D" },
  { id: "insight", label: "Insight", symbol: "◆", color: "#64FFDA" },
  { id: "assumption", label: "Assumption", symbol: "~", color: "#CE93D8" },
  { id: "goal", label: "Goal", symbol: "→", color: "#4FC3F7" },
];

export default function AddNodeModal({ open, onClose, position }) {
  const [text, setText] = useState("");
  const [nodeType, setNodeType] = useState("thought");
  const addManualNode = useStore((s) => s.addManualNode);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const x = position?.x || (typeof window !== "undefined" ? window.innerWidth / 2 : 500);
    const y = position?.y || (typeof window !== "undefined" ? window.innerHeight / 2 : 350);
    await addManualNode(text.trim(), nodeType, x, y);
    setText("");
    setNodeType("thought");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-full max-w-md bg-void-light border border-white/[0.06] rounded-2xl
                    p-6 shadow-2xl"
        style={{ animation: "fadeSlideUp 0.3s ease both" }}
      >
        <h2 className="font-mono text-xs tracking-[3px] text-white/30 uppercase mb-5">
          Add Thought
        </h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="What's the thought?"
          rows={3}
          autoFocus
          className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.05]
                     rounded-xl text-white/85 font-display text-sm leading-relaxed
                     resize-none focus:border-accent-blue/20 transition-colors mb-4"
        />

        <label className="block font-mono text-[10px] tracking-wider text-white/25 uppercase mb-2">
          Type
        </label>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {NODE_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setNodeType(t.id)}
              className="px-3 py-1.5 rounded-lg font-mono text-[10px] transition-all"
              style={{
                background: nodeType === t.id ? `${t.color}15` : "rgba(255,255,255,0.02)",
                border: nodeType === t.id
                  ? `1px solid ${t.color}30`
                  : "1px solid rgba(255,255,255,0.04)",
                color: nodeType === t.id ? t.color : "rgba(255,255,255,0.3)",
              }}
            >
              {t.symbol} {t.label}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-wider text-white/25
                       hover:text-white/40 px-4 py-2 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="font-mono text-[10px] tracking-wider px-5 py-2 rounded-lg
                       bg-accent-blue/10 border border-accent-blue/20 text-white/70
                       hover:bg-accent-blue/15 disabled:opacity-20 transition-all"
          >
            ADD
          </button>
        </div>
      </div>
    </>
  );
}
