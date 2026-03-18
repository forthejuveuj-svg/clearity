"use client";
import { useState, useEffect } from "react";
import { getModel, setModel } from "@/lib/openai";
import { getSupabase } from "@/lib/supabase";

const MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Fast & cheap — great for most use" },
  { id: "gpt-4o", label: "GPT-4o", desc: "Smarter analysis — costs more" },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo", desc: "Previous gen — reliable" },
];

export default function SettingsModal({ open, onClose }) {
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedModel(getModel());
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    setModel(selectedModel);
    setSaved(true);
    setTimeout(() => onClose(), 800);
  };

  const handleSignOut = async () => {
    const sb = getSupabase();
    await sb.auth.signOut();
    window.location.reload();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-full max-w-md bg-void-light border border-white/[0.06] rounded-2xl
                      p-6 shadow-2xl">
        <h2 className="font-mono text-xs tracking-[3px] text-white/30 uppercase mb-6">
          Settings
        </h2>

        <div className="mb-6">
          <p className="font-display text-xs text-white/20 leading-relaxed">
            This deployment uses a server-side OpenAI key. You don&apos;t need to paste an API key
            in your browser.
          </p>
        </div>

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block font-mono text-[10px] tracking-wider text-white/25 uppercase mb-2">
            AI Model
          </label>
          <div className="space-y-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className="w-full px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background:
                    selectedModel === m.id
                      ? "rgba(100,160,255,0.06)"
                      : "rgba(255,255,255,0.01)",
                  border:
                    selectedModel === m.id
                      ? "1px solid rgba(100,160,255,0.15)"
                      : "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div className="font-mono text-xs text-white/60">{m.label}</div>
                <div className="font-display text-xs text-white/25 mt-0.5">
                  {m.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSignOut}
            className="font-mono text-[10px] tracking-wider text-accent-red/40
                       hover:text-accent-red/60 transition-colors"
          >
            SIGN OUT
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="font-mono text-[10px] tracking-wider text-white/25
                         hover:text-white/40 px-4 py-2 transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="font-mono text-[10px] tracking-wider px-5 py-2 rounded-lg
                         bg-accent-blue/10 border border-accent-blue/20 text-white/70
                         hover:bg-accent-blue/15 transition-colors"
            >
              {saved ? "✓ SAVED" : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
