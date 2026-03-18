"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const sb = getSupabase();

    try {
      if (mode === "login") {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          setMessage("Check your email to confirm your account.");
        } else if (data.user) {
          onAuth(data.user);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-void">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(40,50,100,0.08) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="font-mono text-xs tracking-[6px] uppercase text-white/20 mb-3">
            Clearity
          </h1>
          <p className="font-display text-xl text-white/40 font-light">
            See your mind clearly
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl
                         text-white/90 font-display text-base
                         focus:border-accent-blue/30 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl
                         text-white/90 font-display text-base
                         focus:border-accent-blue/30 transition-colors"
            />
          </div>

          {error && (
            <p className="text-accent-red text-sm font-display">{error}</p>
          )}
          {message && (
            <p className="text-accent-green text-sm font-display">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-mono text-xs tracking-widest uppercase
                       bg-white/[0.04] border border-white/[0.08] text-white/70
                       hover:bg-white/[0.06] hover:border-accent-blue/20
                       disabled:opacity-40 transition-all"
          >
            {loading ? "..." : mode === "login" ? "Enter" : "Create Account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-6 w-full text-center font-mono text-[10px] tracking-wider
                     text-white/20 hover:text-white/40 transition-colors"
        >
          {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
