import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  // Verify secret to prevent unauthorized access
  const body = await req.json().catch(() => ({}));
  if (body.secret !== process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Use @supabase/supabase-js with service_role to create an RPC function
  // that fixes the grants
  const { createClient } = await import("@supabase/supabase-js");
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return NextResponse.json({ error: "No service role key configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Try to use the pg module directly if available
  try {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
    
    if (databaseUrl) {
      const { Client } = await import("pg");
      const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
      await client.connect();
      
      // Fix grants
      const sql = `
        GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
        GRANT USAGE ON SCHEMA public TO authenticated;
        GRANT USAGE ON SCHEMA public TO service_role;
        GRANT USAGE ON SCHEMA public TO anon;
      `;
      
      await client.query(sql);
      
      // Also ensure RLS policies exist
      const rlsSQL = `
        ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.thought_nodes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.node_connections ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.cognitive_patterns ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users manage own workspaces" ON public.workspaces;
        DROP POLICY IF EXISTS "Users manage own thoughts" ON public.thought_nodes;
        DROP POLICY IF EXISTS "Users manage own connections" ON public.node_connections;
        DROP POLICY IF EXISTS "Users manage own insights" ON public.ai_insights;
        DROP POLICY IF EXISTS "Users manage own focus sessions" ON public.focus_sessions;
        DROP POLICY IF EXISTS "Users manage own patterns" ON public.cognitive_patterns;

        CREATE POLICY "Users manage own workspaces" ON public.workspaces
          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users manage own thoughts" ON public.thought_nodes
          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users manage own connections" ON public.node_connections
          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users manage own insights" ON public.ai_insights
          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users manage own focus sessions" ON public.focus_sessions
          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users manage own patterns" ON public.cognitive_patterns
          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      `;
      
      await client.query(rlsSQL);
      await client.end();
      
      return NextResponse.json({ success: true, method: "direct_pg" });
    }
    
    return NextResponse.json({ error: "No DATABASE_URL found", env_keys: Object.keys(process.env).filter(k => k.includes('PG') || k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('SUPABASE')) });
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack?.substring(0, 200) }, { status: 500 });
  }
}
