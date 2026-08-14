import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { TOKENS, FontLoader } from "./theme";
import Login from "./Login";
import Tracker from "./Tracker";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="pt-root" style={{ alignItems: "center", justifyContent: "center", width: "100%" }}>
        <style>{TOKENS}</style>
        <FontLoader />
        <Loader2 className="pt-spin" size={22} color="var(--ink-soft)" />
      </div>
    );
  }

  if (!session) return <Login />;

  return <Tracker onSignOut={() => supabase.auth.signOut()} />;
}
