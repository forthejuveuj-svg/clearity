import { create } from "zustand";
import * as db from "../lib/supabase";
import { callAIJson } from "../lib/openai";
import {
  buildDecomposePrompt,
  buildAnalyzePrompt,
  buildFocusPrompt,
} from "../lib/prompts";

const useStore = create((set, get) => ({
  // ── Auth ──
  user: null,
  setUser: (user) => set({ user }),

  // ── Workspaces ──
  workspaces: [],
  activeWorkspaceId: null,
  loadingWorkspaces: false,

  fetchWorkspaces: async () => {
    set({ loadingWorkspaces: true });
    try {
      const data = await db.fetchWorkspaces();
      set({ workspaces: data, loadingWorkspaces: false });
    } catch (e) {
      console.error("Failed to fetch workspaces:", e);
      set({ loadingWorkspaces: false });
    }
  },

  createWorkspace: async (title) => {
    const ws = await db.createWorkspace(title);
    set((s) => ({ workspaces: [ws, ...s.workspaces] }));
    return ws;
  },

  setActiveWorkspace: async (id) => {
    set({
      activeWorkspaceId: id,
      nodes: [],
      connections: [],
      insights: [],
      focusNode: null,
    });
    if (id) {
      await db.updateWorkspace(id, { last_opened_at: new Date().toISOString() });
      await get().loadWorkspaceData(id);
    }
  },

  deleteWorkspace: async (id) => {
    await db.deleteWorkspace(id);
    set((s) => ({
      workspaces: s.workspaces.filter((w) => w.id !== id),
      activeWorkspaceId: s.activeWorkspaceId === id ? null : s.activeWorkspaceId,
    }));
  },

  // ── Nodes ──
  nodes: [],
  connections: [],
  loadingNodes: false,

  loadWorkspaceData: async (workspaceId) => {
    set({ loadingNodes: true });
    try {
      const [nodes, connections, insights] = await Promise.all([
        db.fetchNodes(workspaceId),
        db.fetchConnections(workspaceId),
        db.fetchInsights(workspaceId),
      ]);
      set({ nodes, connections, insights, loadingNodes: false });
    } catch (e) {
      console.error("Failed to load workspace:", e);
      set({ loadingNodes: false });
    }
  },

  // ── AI Decomposition (the core feature) ──
  isDecomposing: false,
  decomposeError: null,

  decompose: async (rawText) => {
    const { activeWorkspaceId, nodes } = get();
    if (!activeWorkspaceId) return;

    set({ isDecomposing: true, decomposeError: null });

    try {
      const prompt = buildDecomposePrompt(rawText, nodes);
      const result = await callAIJson(prompt);

      if (!result.nodes || !Array.isArray(result.nodes)) {
        throw new Error("AI did not return valid nodes");
      }

      // Calculate spawn positions (spread around center)
      const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
      const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 350;

      // Create nodes in DB
      const createdNodes = [];
      for (let i = 0; i < result.nodes.length; i++) {
        const n = result.nodes[i];
        const angle = (i / result.nodes.length) * Math.PI * 2;
        const dist = 80 + Math.random() * 60;
        const node = await db.createNode(activeWorkspaceId, {
          text: n.text,
          node_type: n.node_type || "thought",
          confidence: n.confidence || 0.5,
          emotional_valence: n.emotional_valence || 0,
          position_x: cx + Math.cos(angle) * dist,
          position_y: cy + Math.sin(angle) * dist,
          is_hook: result.hook?.node_index === i,
        });
        createdNodes.push(node);
      }

      // Create connections
      const conns = [];
      if (result.connections) {
        for (const c of result.connections) {
          const src = createdNodes[c.source_index];
          const tgt = createdNodes[c.target_index];
          if (src && tgt) {
            conns.push({
              workspace_id: activeWorkspaceId,
              source_node_id: src.id,
              target_node_id: tgt.id,
              connection_type: c.connection_type || "related",
              strength: c.strength || 0.5,
              label: c.label || null,
              is_ai_generated: true,
            });
          }
        }
      }
      const createdConns = await db.createConnections(conns);

      set((s) => ({
        nodes: [...s.nodes, ...createdNodes],
        connections: [...s.connections, ...createdConns],
        isDecomposing: false,
      }));

      // Trigger analysis after decomposition
      setTimeout(() => get().analyzeCanvas(), 500);

      return createdNodes;
    } catch (e) {
      console.error("Decomposition failed:", e);
      set({ isDecomposing: false, decomposeError: e.message });
      throw e;
    }
  },

  // ── AI Analysis (canvas observation) ──
  insights: [],
  isAnalyzing: false,
  cognitiveState: null,
  overallObservation: null,

  analyzeCanvas: async () => {
    const { activeWorkspaceId, nodes, connections } = get();
    if (!activeWorkspaceId || nodes.length < 2) return;

    set({ isAnalyzing: true });
    try {
      const prompt = buildAnalyzePrompt(nodes, connections);
      const result = await callAIJson(prompt);

      if (result.insights) {
        const saved = await db.saveInsights(activeWorkspaceId, result.insights);
        set({
          insights: saved,
          cognitiveState: result.cognitive_state || null,
          overallObservation: result.overall_observation || null,
          isAnalyzing: false,
        });

        // Update hook status on nodes
        if (result.recommended_hook?.node_index != null) {
          const hookNode = nodes[result.recommended_hook.node_index];
          if (hookNode) {
            await db.updateNode(hookNode.id, { is_hook: true });
            set((s) => ({
              nodes: s.nodes.map((n) =>
                n.id === hookNode.id ? { ...n, is_hook: true } : { ...n, is_hook: false }
              ),
            }));
          }
        }
      }
    } catch (e) {
      console.error("Analysis failed:", e);
      set({ isAnalyzing: false });
    }
  },

  // ── Focus Mode ──
  focusNode: null,
  focusSteps: [],
  focusLoading: false,

  enterFocus: (node) => {
    set({ focusNode: node, focusSteps: [] });
  },

  exitFocus: () => {
    set({ focusNode: null, focusSteps: [] });
  },

  generateFocusQuestion: async () => {
    const { focusNode, focusSteps, nodes, connections } = get();
    if (!focusNode) return;

    set({ focusLoading: true });

    // Find related nodes
    const relatedIds = new Set();
    connections.forEach((c) => {
      if (c.source_node_id === focusNode.id) relatedIds.add(c.target_node_id);
      if (c.target_node_id === focusNode.id) relatedIds.add(c.source_node_id);
    });
    const relatedNodes = nodes.filter((n) => relatedIds.has(n.id));

    try {
      const prompt = buildFocusPrompt(
        focusNode,
        relatedNodes,
        focusSteps.length,
        focusSteps
      );
      const result = await callAIJson(prompt, { temperature: 0.6 });

      set((s) => ({
        focusSteps: [
          ...s.focusSteps,
          {
            question: result.question,
            question_type: result.question_type,
            why: result.why,
            answer: "",
          },
        ],
        focusLoading: false,
      }));
    } catch (e) {
      console.error("Focus question failed:", e);
      set({ focusLoading: false });
    }
  },

  answerFocusStep: (stepIndex, answer) => {
    set((s) => ({
      focusSteps: s.focusSteps.map((step, i) =>
        i === stepIndex ? { ...step, answer } : step
      ),
    }));
  },

  // ── Node operations ──
  updateNodePosition: (id, x, y) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, position_x: x, position_y: y } : n)),
    }));
  },

  resolveNode: async (id) => {
    await db.updateNode(id, { is_resolved: true });
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, is_resolved: true } : n)),
    }));
  },

  removeNode: async (id) => {
    await db.deleteConnectionsForNode(id);
    await db.deleteNode(id);
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      connections: s.connections.filter(
        (c) => c.source_node_id !== id && c.target_node_id !== id
      ),
    }));
  },

  dismissInsight: async (id) => {
    await db.dismissInsight(id);
    set((s) => ({ insights: s.insights.filter((i) => i.id !== id) }));
  },

  // ── Save positions periodically ──
  savePositions: async () => {
    const { nodes } = get();
    const toSave = nodes.map((n) => ({
      id: n.id,
      x: n.position_x,
      y: n.position_y,
    }));
    await db.saveNodePositions(toSave);
  },
}));

export default useStore;
