"use client";
import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import useStore from "@/store";
import AuthForm from "@/components/AuthForm";
import Canvas from "@/components/Canvas";
import ThoughtInput from "@/components/ThoughtInput";
import InsightPanel from "@/components/InsightPanel";
import FocusMode from "@/components/FocusMode";
import SettingsModal from "@/components/SettingsModal";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const fetchWorkspaces = useStore((s) => s.fetchWorkspaces);
  const workspaces = useStore((s) => s.workspaces);
  const activeWorkspaceId = useStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useStore((s) => s.setActiveWorkspace);
  const createWorkspace = useStore((s) => s.createWorkspace);
  const nodes = useStore((s) => s.nodes);
  const focusNode = useStore((s) => s.focusNode);

  // ── Check auth on mount ──
  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, [setUser]);

  // ── Load workspaces when authed ──
  useEffect(() => {
    if (user) {
      fetchWorkspaces().then(async () => {
        // Auto-open first workspace or create one
        const ws = useStore.getState().workspaces;
        if (ws.length > 0) {
          await setActiveWorkspace(ws[0].id);
        }
      });
    }
  }, [user, fetchWorkspaces, setActiveWorkspace]);

  // ── Loading ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="font-mono text-[10px] tracking-[4px] text-white/10 uppercase animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  // ── Not authenticated ──
  if (!user) {
    return <AuthForm onAuth={(u) => setUser(u)} />;
  }

  // ── Main app ──
  return (
    <div className="relative w-full h-screen bg-void overflow-hidden">
      {/* Atmospheric gradient */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(40,50,100,${
            Math.min(0.03 + nodes.length * 0.008, 0.1)
          }) 0%, transparent 60%)`,
        }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4">
        {/* Left: sidebar toggle + workspace title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="font-mono text-[10px] tracking-wider text-white/15 hover:text-white/30
                       transition-colors flex items-center gap-2"
          >
            <span className="text-sm">☰</span>
            <span className="tracking-[4px] uppercase">Clearity</span>
          </button>

          {activeWorkspaceId && (
            <span className="font-mono text-[10px] text-white/10">
              ·{" "}
              {workspaces.find((w) => w.id === activeWorkspaceId)?.title || ""}
            </span>
          )}
        </div>

        {/* Right: settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="font-mono text-[10px] tracking-wider text-white/15 hover:text-white/30
                     transition-colors"
        >
          ⚙
        </button>
      </div>

      {/* Canvas */}
      {activeWorkspaceId && <Canvas />}

      {/* Empty state - no workspace */}
      {!activeWorkspaceId && workspaces.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <h2 className="font-display text-xl text-white/30 font-light mb-4">
            Create your first thinking space
          </h2>
          <button
            onClick={async () => {
              const ws = await createWorkspace("My First Space");
              await setActiveWorkspace(ws.id);
            }}
            className="font-mono text-[11px] tracking-wider px-6 py-3 rounded-xl
                       bg-white/[0.03] border border-white/[0.06] text-white/50
                       hover:bg-white/[0.05] hover:border-accent-blue/15 transition-all"
          >
            + NEW SPACE
          </button>
        </div>
      )}

      {/* Empty canvas state */}
      {activeWorkspaceId && nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <p className="font-display text-xl text-white/20 font-light mb-2">
            What&apos;s on your mind?
          </p>
          <p className="font-mono text-[10px] tracking-wider text-white/8">
            dump your thoughts below — messy is fine
          </p>
        </div>
      )}

      {/* Thought input */}
      {activeWorkspaceId && !focusNode && (
        <ThoughtInput onOpenSettings={() => setSettingsOpen(true)} />
      )}

      {/* Insight panel */}
      {activeWorkspaceId && !focusNode && <InsightPanel />}

      {/* Focus mode overlay */}
      <FocusMode />

      {/* Workspace sidebar */}
      <WorkspaceSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Settings modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
