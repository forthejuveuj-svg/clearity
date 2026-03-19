"use client";
import { useState } from "react";
import useStore from "@/store";

const FILTER_TYPES = [
  { id: null, label: "All" },
  { id: "question", label: "?", color: "#64B5F6" },
  { id: "idea", label: "✦", color: "#81C784" },
  { id: "blocker", label: "×", color: "#E57373" },
  { id: "pressure", label: "!", color: "#FF8A65" },
  { id: "reasoning", label: "∴", color: "#BA68C8" },
  { id: "emotion", label: "♡", color: "#FFB74D" },
  { id: "thought", label: "·", color: "#90A4AE" },
  { id: "insight", label: "◆", color: "#64FFDA" },
  { id: "assumption", label: "~", color: "#CE93D8" },
  { id: "goal", label: "→", color: "#4FC3F7" },
];

export default function SearchBar({ visible, onClose }) {
  const searchQuery = useStore((s) => s.searchQuery);
  const searchFilter = useStore((s) => s.searchFilter);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setSearchFilter = useStore((s) => s.setSearchFilter);
  const getFilteredNodes = useStore((s) => s.getFilteredNodes);
  const enterFocus = useStore((s) => s.enterFocus);
  const nodes = useStore((s) => s.nodes);

  if (!visible) return null;

  const filteredNodes = getFilteredNodes();
  const hasActiveFilter = searchQuery.trim() || searchFilter;

  return (
    <div
      className="absolute top-14 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-5"
      style={{ animation: "fadeSlideUp 0.2s ease both" }}
    >
      <div className="bg-void-light/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04]">
          <span className="text-white/15 text-sm">⌕</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search thoughts..."
            autoFocus
            className="flex-1 bg-transparent border-none text-white/80 font-display text-sm
                       placeholder:text-white/15 py-1"
          />
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchFilter(null);
              onClose();
            }}
            className="text-white/15 hover:text-white/30 text-xs transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.03] overflow-x-auto">
          {FILTER_TYPES.map((f) => (
            <button
              key={f.id || "all"}
              onClick={() => setSearchFilter(f.id)}
              className="px-2 py-1 rounded-md font-mono text-[10px] transition-all shrink-0"
              style={{
                background: searchFilter === f.id ? `${f.color || "#64B5F6"}15` : "transparent",
                border: searchFilter === f.id
                  ? `1px solid ${f.color || "#64B5F6"}30`
                  : "1px solid transparent",
                color: searchFilter === f.id ? (f.color || "#64B5F6") : "rgba(255,255,255,0.2)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {hasActiveFilter && (
          <div className="max-h-[240px] overflow-y-auto">
            {filteredNodes.length === 0 && (
              <p className="px-4 py-6 text-center font-display text-xs text-white/15">
                No matching thoughts
              </p>
            )}
            {filteredNodes.map((node) => {
              const typeColors = {
                question: "#64B5F6", idea: "#81C784", blocker: "#E57373",
                pressure: "#FF8A65", reasoning: "#BA68C8", emotion: "#FFB74D",
                thought: "#90A4AE", insight: "#64FFDA", assumption: "#CE93D8", goal: "#4FC3F7",
              };
              const color = typeColors[node.node_type] || "#90A4AE";
              return (
                <button
                  key={node.id}
                  onClick={() => {
                    enterFocus(node);
                    setSearchQuery("");
                    setSearchFilter(null);
                    onClose();
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-left
                             hover:bg-white/[0.03] transition-colors border-b border-white/[0.02]"
                >
                  <span
                    className="font-mono text-xs shrink-0"
                    style={{ color }}
                  >
                    {node.node_type?.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-display text-xs text-white/60 truncate flex-1">
                    {node.text}
                  </span>
                  {node.is_resolved && (
                    <span className="text-accent-green/40 text-[10px]">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="px-4 py-2 border-t border-white/[0.03]">
          <span className="font-mono text-[9px] text-white/15">
            {hasActiveFilter
              ? `${filteredNodes.length} of ${nodes.length} thoughts`
              : `${nodes.length} thoughts · type to search`}
          </span>
        </div>
      </div>
    </div>
  );
}
