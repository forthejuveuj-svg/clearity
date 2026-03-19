"use client";

export default function KeyboardShortcuts({ open, onClose }) {
  if (!open) return null;

  const shortcuts = [
    { keys: ["N"], desc: "Add new thought manually" },
    { keys: ["F"], desc: "Search / filter thoughts" },
    { keys: ["/"], desc: "Focus the input bar" },
    { keys: ["C"], desc: "Connect two nodes" },
    { keys: ["P"], desc: "Detect cognitive patterns" },
    { keys: ["H"], desc: "Focus session history" },
    { keys: ["Esc"], desc: "Close modal / cancel" },
    { keys: ["?"], desc: "Show keyboard shortcuts" },
    { keys: ["Enter"], desc: "Submit thought" },
    { keys: ["Shift", "Enter"], desc: "New line in input" },
    { keys: ["Double-click"], desc: "Focus on a node" },
    { keys: ["Right-click"], desc: "Node context menu" },
    { keys: ["Long press"], desc: "Context menu (mobile)" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-full max-w-sm bg-void-light border border-white/[0.06] rounded-2xl
                    p-6 shadow-2xl"
        style={{ animation: "fadeSlideUp 0.3s ease both" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-mono text-xs tracking-[3px] text-white/30 uppercase">
            Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-white/20 hover:text-white/40 text-sm transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5"
            >
              <span className="font-display text-xs text-white/50">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <span key={j}>
                    {j > 0 && <span className="text-white/10 text-[10px] mx-0.5">+</span>}
                    <kbd
                      className="inline-block px-2 py-0.5 rounded-md font-mono text-[10px]
                                 bg-white/[0.04] border border-white/[0.08] text-white/40"
                    >
                      {k}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
