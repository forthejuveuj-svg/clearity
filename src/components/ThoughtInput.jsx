"use client";
import { useState, useRef } from "react";
import useStore from "@/store";

export default function ThoughtInput({ onOpenSettings }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const decompose = useStore((s) => s.decompose);
  const isDecomposing = useStore((s) => s.isDecomposing);
  const decomposeError = useStore((s) => s.decomposeError);
  const nodes = useStore((s) => s.nodes);

  const handleSubmit = async () => {
    if (!text.trim() || isDecomposing) return;

    setError(null);
    try {
      await decompose(text.trim());
      setText("");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-5">
      {/* Error */}
      {(error || decomposeError) && (
        <div
          className="mb-3 px-4 py-2 rounded-lg bg-accent-red/10 border border-accent-red/20
                      text-accent-red text-sm font-display animate-fade-in"
        >
          {error || decomposeError}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex items-center gap-2 bg-void-light/80 backdrop-blur-2xl
                    border border-white/[0.06] rounded-2xl px-5 py-1
                    focus-within:border-accent-blue/20 transition-colors"
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            nodes.length === 0
              ? "What's on your mind? Dump it here — messy is fine..."
              : "Add more thoughts..."
          }
          rows={1}
          className="flex-1 bg-transparent border-none text-white/90 font-display text-base
                     resize-none py-3 leading-relaxed placeholder:text-white/15"
          style={{ minHeight: 44, maxHeight: 120 }}
          onInput={(e) => {
            e.target.style.height = "44px";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isDecomposing}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                     text-sm transition-all disabled:opacity-20"
          style={{
            background: text.trim()
              ? "rgba(100,160,255,0.15)"
              : "transparent",
            border: text.trim()
              ? "1px solid rgba(100,160,255,0.2)"
              : "1px solid transparent",
            color: text.trim() ? "rgba(200,215,240,0.9)" : "rgba(255,255,255,0.1)",
          }}
        >
          {isDecomposing ? (
            <span className="animate-spin">◌</span>
          ) : (
            "↑"
          )}
        </button>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {isDecomposing && (
          <span className="font-mono text-[10px] tracking-wider text-accent-blue/40 animate-pulse">
            DECOMPOSING YOUR THOUGHTS...
          </span>
        )}
        {!isDecomposing && nodes.length === 0 && (
          <span className="font-mono text-[10px] tracking-wider text-white/10">
            PRESS ENTER TO DECOMPOSE · SHIFT+ENTER FOR NEW LINE
          </span>
        )}
        {!isDecomposing && nodes.length > 0 && (
          <span className="font-mono text-[10px] tracking-wider text-white/10">
            {nodes.length} thought{nodes.length !== 1 ? "s" : ""} · DOUBLE-CLICK TO FOCUS ·
            RIGHT-CLICK FOR OPTIONS
          </span>
        )}
      </div>
    </div>
  );
}
