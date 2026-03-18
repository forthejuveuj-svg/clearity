-- ============================================
-- CLEARITY DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- WORKSPACES (sessions / projects)
-- ============================================
create table public.workspaces (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Space',
  description text,
  color text default '#64B5F6',
  is_archived boolean default false,
  last_opened_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- THOUGHT NODES
-- ============================================
create table public.thought_nodes (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  node_type text not null default 'thought'
    check (node_type in ('thought','question','pressure','idea','blocker','reasoning','emotion','insight','assumption','goal')),
  -- Visual state
  position_x float default 0,
  position_y float default 0,
  radius float default 24,
  is_resolved boolean default false,
  is_hook boolean default false,
  -- AI-generated metadata
  ai_summary text,
  confidence float default 0.5,
  emotional_valence float default 0, -- -1 to 1
  -- Extra data
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- NODE CONNECTIONS (edges)
-- ============================================
create table public.node_connections (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_node_id uuid references public.thought_nodes(id) on delete cascade not null,
  target_node_id uuid references public.thought_nodes(id) on delete cascade not null,
  connection_type text default 'related'
    check (connection_type in ('related','supports','contradicts','causes','enables','blocks','depends_on')),
  strength float default 0.5,
  label text,
  is_ai_generated boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- AI INSIGHTS (observations per workspace)
-- ============================================
create table public.ai_insights (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  insight_type text not null
    check (insight_type in ('pattern','gap','tension','energy','hook','bias','suggestion')),
  text text not null,
  severity text default 'medium'
    check (severity in ('low','medium','high','positive','hook')),
  related_node_ids uuid[] default '{}',
  is_dismissed boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- FOCUS SESSIONS (thread-pulling history)
-- ============================================
create table public.focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  anchor_node_id uuid references public.thought_nodes(id) on delete set null,
  steps jsonb default '[]', -- [{question, answer, timestamp}]
  outcome text,
  duration_seconds integer,
  created_at timestamptz default now()
);

-- ============================================
-- USER COGNITIVE PATTERNS (long-term learning)
-- ============================================
create table public.cognitive_patterns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pattern_type text not null,
  description text not null,
  frequency integer default 1,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_workspaces_user on public.workspaces(user_id);
create index idx_thought_nodes_workspace on public.thought_nodes(workspace_id);
create index idx_thought_nodes_user on public.thought_nodes(user_id);
create index idx_connections_workspace on public.node_connections(workspace_id);
create index idx_connections_source on public.node_connections(source_node_id);
create index idx_connections_target on public.node_connections(target_node_id);
create index idx_insights_workspace on public.ai_insights(workspace_id);
create index idx_focus_workspace on public.focus_sessions(workspace_id);
create index idx_patterns_user on public.cognitive_patterns(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.workspaces enable row level security;
alter table public.thought_nodes enable row level security;
alter table public.node_connections enable row level security;
alter table public.ai_insights enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.cognitive_patterns enable row level security;

-- Workspaces: users can only access their own
create policy "Users manage own workspaces" on public.workspaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Thought nodes: users can only access their own
create policy "Users manage own thoughts" on public.thought_nodes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Connections: users can only access their own
create policy "Users manage own connections" on public.node_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Insights: users can only access their own
create policy "Users manage own insights" on public.ai_insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Focus sessions: users can only access their own
create policy "Users manage own focus sessions" on public.focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cognitive patterns: users can only access their own
create policy "Users manage own patterns" on public.cognitive_patterns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.handle_updated_at();

create trigger thought_nodes_updated_at before update on public.thought_nodes
  for each row execute function public.handle_updated_at();
