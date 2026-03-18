import { createBrowserClient } from "@supabase/ssr";

let supabase = null;

export function getSupabase() {
  if (supabase) return supabase;
  supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return supabase;
}

// ── Workspaces ──
export async function fetchWorkspaces() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("workspaces")
    .select("*")
    .order("last_opened_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createWorkspace(title = "Untitled Space") {
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("workspaces")
    .insert({ title, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkspace(id, updates) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("workspaces")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkspace(id) {
  const sb = getSupabase();
  const { error } = await sb.from("workspaces").delete().eq("id", id);
  if (error) throw error;
}

// ── Thought Nodes ──
export async function fetchNodes(workspaceId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("thought_nodes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createNode(workspaceId, node) {
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("thought_nodes")
    .insert({ ...node, workspace_id: workspaceId, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNode(id, updates) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("thought_nodes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNode(id) {
  const sb = getSupabase();
  const { error } = await sb.from("thought_nodes").delete().eq("id", id);
  if (error) throw error;
}

// ── Connections ──
export async function fetchConnections(workspaceId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("node_connections")
    .select("*")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return data;
}

export async function createConnections(connections) {
  if (!connections.length) return [];
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const rows = connections.map((c) => ({ ...c, user_id: user.id }));
  const { data, error } = await sb
    .from("node_connections")
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteConnectionsForNode(nodeId) {
  const sb = getSupabase();
  const { error } = await sb
    .from("node_connections")
    .delete()
    .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);
  if (error) throw error;
}

// ── AI Insights ──
export async function fetchInsights(workspaceId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("ai_insights")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveInsights(workspaceId, insights) {
  if (!insights.length) return [];
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  // Clear old insights for this workspace
  await sb
    .from("ai_insights")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("is_dismissed", false);
  const rows = insights.map((i) => ({
    ...i,
    workspace_id: workspaceId,
    user_id: user.id,
  }));
  const { data, error } = await sb.from("ai_insights").insert(rows).select();
  if (error) throw error;
  return data;
}

export async function dismissInsight(id) {
  const sb = getSupabase();
  const { error } = await sb
    .from("ai_insights")
    .update({ is_dismissed: true })
    .eq("id", id);
  if (error) throw error;
}

// ── Focus Sessions ──
export async function saveFocusSession(session) {
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("focus_sessions")
    .insert({ ...session, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Save node positions (batch) ──
export async function saveNodePositions(nodes) {
  const sb = getSupabase();
  const promises = nodes.map((n) =>
    sb
      .from("thought_nodes")
      .update({ position_x: n.x, position_y: n.y })
      .eq("id", n.id)
  );
  await Promise.all(promises);
}
