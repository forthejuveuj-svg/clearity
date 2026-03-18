"use client";
import { useState } from "react";
import useStore from "@/store";

export default function WorkspaceSidebar({ open, onClose, onOpenSettings }) {
  const workspaces = useStore((s) => s.workspaces);
  const activeWorkspaceId = useStore((s) => s.activeWorkspaceId);
  const createWorkspace = useStore((s) => s.createWorkspace);
  const setActiveWorkspace = useStore((s) => s.setActiveWorkspace);
  const deleteWorkspace = useStore((s) => s.deleteWorkspace);
  const nodes = useStore((s) => s.nodes);
  const [newTitle, setNewTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleCreate = async () => {
    const title = newTitle.trim() || "Untitled Space";
    const ws = await createWorkspace(title);
    await setActiveWorkspace(ws.id);
    setNewTitle("");
  };

  const handleSelect = async (id) => {
    if (id !== activeWorkspaceId) {
      await setActiveWorkspace(id);
    }
    onClose();
  };

  const handleDelete = async (id) => {
    await deleteWorkspace(id);
    setConfirmDelete(null);
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className="fixed top-0 left-0 h-full w-72 z-40 bg-void-light/95 backdrop-blur-2xl
                   border-r border-white/[0.04] flex flex-col transition-transform duration-300"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/[0.04] flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[3px] text-white/20 uppercase">
            Spaces
          </span>
          <button
            onClick={onClose}
            className="text-white/20 hover:text-white/40 text-sm transition-colors"
          >
            ×
          </button>
        </div>

        {/* New workspace */}
        <div className="px-4 py-3 border-b border-white/[0.03]">
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="New space..."
              className="flex-1 px-3 py-2 bg-white/[0.02] border border-white/[0.05]
                         rounded-lg text-white/70 font-display text-sm
                         focus:border-accent-blue/20 transition-colors"
            />
            <button
              onClick={handleCreate}
              className="px-3 py-2 bg-white/[0.03] border border-white/[0.06]
                         rounded-lg text-white/40 text-sm hover:bg-white/[0.05]
                         transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Workspace list */}
        <div className="flex-1 overflow-y-auto py-2">
          {workspaces.length === 0 && (
            <p className="px-5 py-8 text-center font-display text-sm text-white/15">
              No spaces yet. Create one above.
            </p>
          )}
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className={`group px-4 py-3 mx-2 rounded-lg cursor-pointer transition-all ${
                ws.id === activeWorkspaceId
                  ? "bg-white/[0.04] border border-white/[0.06]"
                  : "border border-transparent hover:bg-white/[0.02]"
              }`}
              onClick={() => handleSelect(ws.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm text-white/60 truncate">
                    {ws.title}
                  </div>
                  <div className="font-mono text-[9px] text-white/15 mt-1">
                    {new Date(ws.last_opened_at).toLocaleDateString()}
                  </div>
                </div>
                {confirmDelete === ws.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ws.id);
                      }}
                      className="font-mono text-[9px] text-accent-red/60 px-2 py-1
                                 border border-accent-red/20 rounded"
                    >
                      DELETE
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(null);
                      }}
                      className="font-mono text-[9px] text-white/30 px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(ws.id);
                    }}
                    className="text-white/10 hover:text-white/30 text-xs
                               opacity-0 group-hover:opacity-100 transition-all"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.04]">
          <button
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
            className="font-mono text-[10px] tracking-wider text-white/20
                       hover:text-white/40 transition-colors"
          >
            ⚙ SETTINGS
          </button>
        </div>
      </div>
    </>
  );
}
