"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import useStore from "@/store";
import Canvas from "@/components/Canvas";
import ThoughtInput from "@/components/ThoughtInput";
import InsightPanel from "@/components/InsightPanel";
import FocusMode from "@/components/FocusMode";
import SettingsModal from "@/components/SettingsModal";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import FocusHistory from "@/components/FocusHistory";
import CognitivePatterns from "@/components/CognitivePatterns";
import AddNodeModal from "@/components/AddNodeModal";
import SearchBar from "@/components/SearchBar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import ConnectTypeModal from "@/components/ConnectTypeModal";

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [focusHistoryOpen, setFocusHistoryOpen] = useState(false);
  const [patternsOpen, setPatternsOpen] = useState(false);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [addNodePosition] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Connect mode state
  const [connectMode, setConnectMode] = useState(false);
  const [connectSource, setConnectSource] = useState(null);
  const [connectTarget, setConnectTarget] = useState(null);
  const [connectTypeOpen, setConnectTypeOpen] = useState(false);

  const inputRef = useRef(null);

  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const fetchWorkspaces = useStore((s) => s.fetchWorkspaces);
  const workspaces = useStore((s) => s.workspaces);
  const activeWorkspaceId = useStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useStore((s) => s.setActiveWorkspace);
  const createWorkspace = useStore((s) => s.createWorkspace);
  const nodes = useStore((s) => s.nodes);
  const focusNode = useStore((s) => s.focusNode);
  const addManualConnection = useStore((s) => s.addManualConnection);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setSearchFilter = useStore((s) => s.setSearchFilter);

  // ── Check auth on mount ──
  useEffect(() => {
    const sb = getSupabase();
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await sb.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          setAuthLoading(false);
          return;
        }

        const { data, error } = await sb.auth.signInAnonymously();
        if (error) throw error;

        setUser(data?.user || null);
        setAuthLoading(false);
      } catch (e) {
        setAuthError(e?.message || "Authentication failed");
        setUser(null);
        setAuthLoading(false);
      }
    };

    initAuth();

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
        const ws = useStore.getState().workspaces;
        if (ws.length > 0) {
          await setActiveWorkspace(ws[0].id);
        }
      });
    }
  }, [user, fetchWorkspaces, setActiveWorkspace]);

  // Helper to check if any modal is open
  const isAnyModalOpen = useCallback(() => {
    return sidebarOpen || settingsOpen || focusHistoryOpen || patternsOpen
      || addNodeOpen || shortcutsOpen || connectTypeOpen || focusNode;
  }, [sidebarOpen, settingsOpen, focusHistoryOpen, patternsOpen,
      addNodeOpen, shortcutsOpen, connectTypeOpen, focusNode]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = e.target.tagName.toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || e.target.isContentEditable;

      if (e.key === "Escape") {
        if (connectMode) {
          setConnectMode(false);
          setConnectSource(null);
          return;
        }
        if (searchOpen) {
          setSearchOpen(false);
          setSearchQuery("");
          setSearchFilter(null);
          return;
        }
        if (shortcutsOpen) { setShortcutsOpen(false); return; }
        if (addNodeOpen) { setAddNodeOpen(false); return; }
        if (focusHistoryOpen) { setFocusHistoryOpen(false); return; }
        if (patternsOpen) { setPatternsOpen(false); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        if (sidebarOpen) { setSidebarOpen(false); return; }
        return;
      }

      if (isInput) return;
      if (!activeWorkspaceId) return;
      if (isAnyModalOpen()) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          setAddNodeOpen(true);
          break;
        case "f":
          e.preventDefault();
          setSearchOpen(true);
          break;
        case "/":
          e.preventDefault();
          // Focus the thought input
          const input = document.querySelector("textarea[placeholder*='mind'], textarea[placeholder*='thoughts']");
          if (input) input.focus();
          break;
        case "c":
          e.preventDefault();
          if (nodes.length >= 2) {
            setConnectMode(true);
            setConnectSource(null);
          }
          break;
        case "p":
          e.preventDefault();
          setPatternsOpen(true);
          break;
        case "h":
          e.preventDefault();
          setFocusHistoryOpen(true);
          break;
        case "?":
          e.preventDefault();
          setShortcutsOpen(true);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeWorkspaceId, connectMode, searchOpen, shortcutsOpen, addNodeOpen,
      focusHistoryOpen, patternsOpen, settingsOpen, sidebarOpen, nodes.length,
      isAnyModalOpen, setSearchQuery, setSearchFilter]);

  // ── Connect mode handlers ──
  const handleConnectNodeClick = useCallback((node) => {
    if (!connectSource) {
      setConnectSource(node);
    } else if (node.id !== connectSource.id) {
      setConnectTarget(node);
      setConnectTypeOpen(true);
    }
  }, [connectSource]);

  const handleConnectTypeSelect = useCallback(async (connectionType) => {
    if (connectSource && connectTarget) {
      await addManualConnection(connectSource.id, connectTarget.id, connectionType);
    }
    setConnectMode(false);
    setConnectSource(null);
    setConnectTarget(null);
    setConnectTypeOpen(false);
  }, [connectSource, connectTarget, addManualConnection]);

  const handleConnectCancel = useCallback(() => {
    setConnectMode(false);
    setConnectSource(null);
    setConnectTarget(null);
    setConnectTypeOpen(false);
  }, []);

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

  // ── Auth error ──
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="font-mono text-xs tracking-[4px] text-white/20 uppercase mb-3">
            Authentication error
          </div>
          <div className="font-display text-white/70 text-sm leading-relaxed">
            {authError || "No authenticated session. Enable Anonymous auth in Supabase."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen h-[100dvh] bg-void overflow-hidden">
      {/* Atmospheric gradient — layered for depth */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={{
          background: [
            `radial-gradient(ellipse at 50% 40%, rgba(30,40,90,${
              Math.min(0.05 + nodes.length * 0.01, 0.12)
            }) 0%, transparent 55%)`,
            `radial-gradient(ellipse at 20% 80%, rgba(60,30,80,0.04) 0%, transparent 50%)`,
            `radial-gradient(ellipse at 80% 20%, rgba(20,50,80,0.03) 0%, transparent 50%)`,
          ].join(", "),
        }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4">
        {/* Left: sidebar toggle + workspace title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="font-mono text-[10px] tracking-wider text-white/15 hover:text-white/30
                       transition-colors flex items-center gap-2 shrink-0"
          >
            <span className="text-sm">☰</span>
            <span className="tracking-[4px] uppercase hidden sm:inline">Clearity</span>
          </button>

          {activeWorkspaceId && (
            <span className="font-mono text-[10px] text-white/10 truncate">
              · {workspaces.find((w) => w.id === activeWorkspaceId)?.title || ""}
            </span>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {activeWorkspaceId && !focusNode && (
            <>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="font-mono text-[10px] text-white/15 hover:text-white/30
                           transition-colors p-1.5 sm:px-2"
                title="Search (F)"
              >
                ⌕
              </button>
              <button
                onClick={() => setAddNodeOpen(true)}
                className="font-mono text-[10px] text-white/15 hover:text-white/30
                           transition-colors p-1.5 sm:px-2"
                title="Add node (N)"
              >
                +
              </button>
              {nodes.length >= 2 && (
                <button
                  onClick={() => {
                    setConnectMode(!connectMode);
                    setConnectSource(null);
                  }}
                  className="font-mono text-[10px] transition-colors p-1.5 sm:px-2"
                  style={{
                    color: connectMode ? "rgba(100,255,218,0.7)" : "rgba(255,255,255,0.15)",
                  }}
                  title="Connect nodes (C)"
                >
                  ⟶
                </button>
              )}
              <button
                onClick={() => setFocusHistoryOpen(true)}
                className="font-mono text-[10px] text-white/15 hover:text-white/30
                           transition-colors p-1.5 sm:px-2 hidden sm:block"
                title="Focus history (H)"
              >
                ◷
              </button>
              <button
                onClick={() => setPatternsOpen(true)}
                className="font-mono text-[10px] text-white/15 hover:text-white/30
                           transition-colors p-1.5 sm:px-2 hidden sm:block"
                title="Cognitive patterns (P)"
              >
                ◎
              </button>
            </>
          )}
          <button
            onClick={() => setShortcutsOpen(true)}
            className="font-mono text-[10px] text-white/15 hover:text-white/30
                       transition-colors p-1.5 sm:px-2 hidden sm:block"
            title="Shortcuts (?)"
          >
            ?
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="font-mono text-[10px] tracking-wider text-white/15 hover:text-white/30
                       transition-colors p-1.5 sm:px-2"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Canvas */}
      {activeWorkspaceId && (
        <Canvas
          connectMode={connectMode}
          connectSource={connectSource}
          onNodeClick={connectMode ? handleConnectNodeClick : undefined}
          onCanvasClick={connectMode ? handleConnectCancel : undefined}
        />
      )}

      {/* Empty state - no workspace */}
      {!activeWorkspaceId && workspaces.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
          <h2 className="font-display text-xl text-white/30 font-light mb-4 text-center">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-6">
          <p className="font-display text-lg sm:text-xl text-white/20 font-light mb-2 text-center">
            What&apos;s on your mind?
          </p>
          <p className="font-mono text-[10px] tracking-wider text-white/8 text-center">
            dump your thoughts below — messy is fine
          </p>
        </div>
      )}

      {/* Thought input */}
      {activeWorkspaceId && !focusNode && (
        <ThoughtInput ref={inputRef} onOpenSettings={() => setSettingsOpen(true)} />
      )}

      {/* Search bar */}
      <SearchBar
        visible={searchOpen && !focusNode}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery("");
          setSearchFilter(null);
        }}
      />

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

      {/* Focus history modal */}
      <FocusHistory open={focusHistoryOpen} onClose={() => setFocusHistoryOpen(false)} />

      {/* Cognitive patterns modal */}
      <CognitivePatterns open={patternsOpen} onClose={() => setPatternsOpen(false)} />

      {/* Add node modal */}
      <AddNodeModal
        open={addNodeOpen}
        onClose={() => setAddNodeOpen(false)}
        position={addNodePosition}
      />

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Connect type selector */}
      <ConnectTypeModal
        open={connectTypeOpen}
        onClose={handleConnectCancel}
        onSelect={handleConnectTypeSelect}
        sourceNode={connectSource}
        targetNode={connectTarget}
      />
    </div>
  );
}
