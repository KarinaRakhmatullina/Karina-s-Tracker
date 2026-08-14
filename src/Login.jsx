import React, { useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { TOKENS, FontLoader } from "./theme";

export default function Login() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setNotice("Account created. If email confirmation is enabled on your Supabase project, check your inbox before signing in.");
      }
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-root pt-auth-wrap">
      <style>{TOKENS}</style>
      <FontLoader />
      <div className="pt-auth-card">
        <div className="pt-eyebrow" style={{ textAlign: "center" }}>Field Notes</div>
        <h1 className="pt-h1" style={{ textAlign: "center", fontSize: 26 }}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="pt-sub" style={{ textAlign: "center", marginBottom: 24 }}>
          {mode === "signin" ? "Welcome back to your tracker." : "Set up access to your private tracker."}
        </p>

        <form className="pt-card" onSubmit={submit}>
          <div className="pt-field">
            <label className="pt-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="pt-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="pt-field">
            <label className="pt-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="pt-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>

          {error && <div style={{ color: "var(--behind)", fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
          {notice && <div style={{ color: "var(--ontrack)", fontSize: 12.5, marginBottom: 12 }}>{notice}</div>}

          <button className="pt-btn pt-btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? <Loader2 size={14} className="pt-spin" /> : mode === "signin" ? <LogIn size={14} /> : <UserPlus size={14} />}
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="pt-auth-toggle">
          {mode === "signin" ? (
            <span>No account yet? <a className="pt-link" style={{ cursor: "pointer" }} onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>Create one</a></span>
          ) : (
            <span>Already have an account? <a className="pt-link" style={{ cursor: "pointer" }} onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Sign in</a></span>
          )}
        </div>
      </div>
    </div>
  );
}
