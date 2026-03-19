"use client";

const CONNECTION_TYPES = [
  { id: "related", label: "Related", desc: "General connection" },
  { id: "supports", label: "Supports", desc: "Reinforces the target" },
  { id: "contradicts", label: "Contradicts", desc: "Conflicts with target" },
  { id: "causes", label: "Causes", desc: "Leads to the target" },
  { id: "enables", label: "Enables", desc: "Makes the target possible" },
  { id: "blocks", label: "Blocks", desc: "Prevents the target" },
  { id: "depends_on", label: "Depends on", desc: "Requires the target" },
];

export default function ConnectTypeModal({ open, onClose, onSelect, sourceNode, targetNode }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-full max-w-xs bg-void-light border border-white/[0.06] rounded-2xl
                    p-5 shadow-2xl"
        style={{ animation: "fadeSlideUp 0.2s ease both" }}
      >
        <h2 className="font-mono text-xs tracking-[3px] text-white/30 uppercase mb-1">
          Connection Type
        </h2>
        <p className="font-display text-[11px] text-white/20 mb-4 leading-relaxed">
          {sourceNode?.text?.substring(0, 30)} → {targetNode?.text?.substring(0, 30)}
        </p>

        <div className="space-y-1">
          {CONNECTION_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => onSelect(ct.id)}
              className="w-full px-3 py-2.5 rounded-lg text-left
                         hover:bg-white/[0.04] transition-colors flex items-center justify-between"
              style={{ border: "1px solid rgba(255,255,255,0.03)" }}
            >
              <div>
                <div className="font-mono text-[11px] text-white/60">{ct.label}</div>
                <div className="font-display text-[10px] text-white/20">{ct.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 font-mono text-[10px] tracking-wider text-white/20
                     hover:text-white/40 py-2 transition-colors"
        >
          CANCEL
        </button>
      </div>
    </>
  );
}
