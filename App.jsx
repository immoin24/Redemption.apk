import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// This tells the app to look at the secret keys you saved in Vercel
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const defaultForm = { lunch: "", dinner: "", snacks: "", calories: "", protein: "", steps: "", workout: false };

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("log");
  const [entries, setEntries] = useState({});
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchLogs(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchLogs(userId) {
    const { data } = await supabase.from("daily_logs").select("*").eq("user_id", userId);
    if (data) {
      const logs = {};
      data.forEach(row => logs[row.date_key] = row.data);
      setEntries(logs);
    }
  }

  async function handleAuth(type) {
    const { error } = type === "login" 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  }

  if (loading) return <div style={{background: "#080808", color: "#4ade80", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center"}}>LOADING...</div>;

  if (!user) {
    return (
      <div style={{ background: "#080808", color: "#e8e8e8", height: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
        <h2 style={{color: "#4ade80"}}>MED-STAT LOGIN</h2>
        <input style={{width: "100%", padding: "12px", marginBottom: "10px", background: "#111", border: "1px solid #222", color: "#fff"}} placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input style={{width: "100%", padding: "12px", marginBottom: "20px", background: "#111", border: "1px solid #222", color: "#fff"}} type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button onClick={() => handleAuth("login")} style={{width: "100%", padding: "12px", background: "#4ade80", border: "none", fontWeight: "bold", marginBottom: "10px"}}>LOGIN</button>
        <button onClick={() => handleAuth("signup")} style={{width: "100%", padding: "12px", background: "none", color: "#4ade80", border: "1px solid #4ade80"}}>SIGN UP</button>
      </div>
    );
  }

  return (
    <div style={{ background: "#080808", color: "#e8e8e8", minHeight: "100vh", padding: "20px" }}>
      <header style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
        <span style={{color: "#4ade80"}}>{user.email}</span>
        <button onClick={() => supabase.auth.signOut()} style={{color: "#666", background: "none", border: "none"}}>LOGOUT</button>
      </header>
      <div style={{color: "#4ade80", textAlign: "center"}}>✓ YOU ARE CONNECTED</div>
      <p style={{fontSize: "12px", textAlign: "center", color: "#888"}}>Ready to log your med-school hustle.</p>
    </div>
  );
      }
