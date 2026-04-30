import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// HARD-CODED KEYS (Direct Connection)
const SB_URL = "https://jqioszktfqqtfbkjoosd.supabase.co";
const SB_KEY = "sb_publishable_Nu_9dHse4KCtH2BDPFRRaA_DTGqKjKp";

// Safety Guard: If connection fails, it won't white-screen the app
let supabase;
try {
  supabase = createClient(SB_URL, SB_KEY);
} catch (err) {
  console.error("Supabase failed to initialize:", err);
}

const defaultForm = { lunch: "", dinner: "", snacks: "", calories: "", protein: "", steps: "", workout: false };

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleAuth(type) {
    setAuthError(null);
    const { data, error } = type === "login" 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    
    if (error) setAuthError(error.message);
  }

  if (loading) {
    return <div style={{background: "#080808", color: "#4ade80", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace"}}>INITIALIZING MED-STAT...</div>;
  }

  if (!user) {
    return (
      <div style={{ background: "#080808", color: "#e8e8e8", minHeight: "100vh", padding: "40px 20px", fontFamily: "sans-serif" }}>
        <h2 style={{color: "#4ade80", letterSpacing: "1px"}}>MED-STAT</h2>
        <p style={{fontSize: "12px", color: "#666", marginBottom: "20px"}}>Cloud Sync Active</p>
        
        {authError && <div style={{color: "#ff4d4d", fontSize: "12px", marginBottom: "15px", padding: "10px", background: "rgba(255,0,0,0.1)", borderRadius: "5px"}}>{authError}</div>}
        
        <input style={{width: "100%", padding: "12px", marginBottom: "10px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "6px"}} placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input style={{width: "100%", padding: "12px", marginBottom: "20px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "6px"}} type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        
        <button onClick={() => handleAuth("login")} style={{width: "100%", padding: "12px", background: "#4ade80", border: "none", fontWeight: "bold", borderRadius: "6px", marginBottom: "10px"}}>LOGIN</button>
        <button onClick={() => handleAuth("signup")} style={{width: "100%", padding: "12px", background: "none", color: "#4ade80", border: "1px solid #4ade80", borderRadius: "6px"}}>SIGN UP</button>
      </div>
    );
  }

  return (
    <div style={{ background: "#080808", color: "#e8e8e8", minHeight: "100vh", padding: "20px", textAlign: "center" }}>
      <h3 style={{color: "#4ade80"}}>✓ LOGGED IN</h3>
      <p>{user.email}</p>
      <button onClick={() => supabase.auth.signOut()} style={{marginTop: "20px", background: "#222", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "5px"}}>LOGOUT</button>
    </div>
  );
}
