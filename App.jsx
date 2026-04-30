import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SB_URL = "https://jqioszktfqqtfbkjoosd.supabase.co";
const SB_KEY = "sb_publishable_Nu_9dHse4KCtH2BDPFRRaA_DTGqKjKp";
const supabase = createClient(SB_URL, SB_KEY);

const defaultForm = { lunch: "", dinner: "", snacks: "", calories: "", protein: "", steps: "", workout: false };

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("log");
  const [entries, setEntries] = useState({});
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchLogs(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchLogs(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchLogs(userId) {
    const { data } = await supabase.from("daily_logs").select("*").eq("user_id", userId);
    if (data) {
      const logs = {};
      data.forEach(row => logs[row.date_key] = row.data);
      setEntries(logs);
      const today = new Date().toISOString().slice(0, 10);
      if (logs[today]) setForm(logs[today]);
    }
  }

  async function handleAuth(type) {
    const { error } = type === "login" 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  }

  async function saveEntry() {
    if (!user) return;
    setSyncing(true);
    const dateKey = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("daily_logs").upsert({ 
      user_id: user.id, 
      date_key: dateKey, 
      data: form 
    }, { onConflict: 'user_id, date_key' });
    
    if (!error) {
      setEntries(prev => ({ ...prev, [dateKey]: form }));
      alert("✓ Data Synced to Cloud");
    } else {
      alert("Error: " + error.message);
    }
    setSyncing(false);
  }

  if (loading) return <div style={{background: "#080808", color: "#4ade80", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace"}}>CONNECTING...</div>;

  if (!user) {
    return (
      <div style={{ background: "#080808", color: "#e8e8e8", height: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
        <h2 style={{color: "#4ade80", marginBottom: "30px"}}>MED-STAT LOGIN</h2>
        <input style={{width: "100%", padding: "12px", marginBottom: "10px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input style={{width: "100%", padding: "12px", marginBottom: "20px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button onClick={() => handleAuth("login")} style={{width: "100%", padding: "12px", background: "#4ade80", border: "none", fontWeight: "bold", marginBottom: "10px", borderRadius: "8px"}}>LOGIN</button>
        <button onClick={() => handleAuth("signup")} style={{width: "100%", padding: "12px", background: "none", color: "#4ade80", border: "1px solid #4ade80", borderRadius: "8px"}}>SIGN UP</button>
      </div>
    );
  }

  return (
    <div style={{ background: "#080808", color: "#e8e8e8", minHeight: "100vh", fontFamily: "sans-serif", padding: "20px" }}>
      <header style={{display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #222", paddingBottom: "10px"}}>
        <span style={{color: "#4ade80", fontSize: "12px"}}>{user.email}</span>
        <button onClick={() => supabase.auth.signOut()} style={{color: "#666", background: "none", border: "none", fontSize: "10px"}}>LOGOUT</button>
      </header>

      {view === "log" ? (
        <div style={{display: "flex", flexDirection: "column", gap: "15px"}}>
          <input type="number" value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} placeholder="Steps Walked" style={{padding: "12px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} />
          <button onClick={() => setForm({...form, workout: !form.workout})} style={{padding: "12px", background: form.workout ? "#4ade80" : "#111", color: form.workout ? "#000" : "#fff", border: "1px solid #222", borderRadius: "8px"}}>WORKOUT {form.workout ? "✓" : "?"}</button>
          <textarea value={form.lunch} onChange={e => setForm({...form, lunch: e.target.value})} placeholder="Meals and Med-School Notes..." rows={4} style={{padding: "12px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} />
          <div style={{display: "flex", gap: "10px"}}>
            <input type="number" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} placeholder="Calories" style={{flex: 1, padding: "12px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} />
            <input type="number" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} placeholder="Protein (g)" style={{flex: 1, padding: "12px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} />
          </div>
          <button onClick={saveEntry} disabled={syncing} style={{padding: "16px", background: "#4ade80", color: "#000", border: "none", fontWeight: "bold", borderRadius: "10px"}}>{syncing ? "SYNCING..." : "SAVE & SYNC"}</button>
          <button onClick={() => setView("history")} style={{color: "#4ade80", background: "none", border: "none", marginTop: "10px"}}>VIEW HISTORY</button>
        </div>
      ) : (
        <div>
          <button onClick={() => setView("log")} style={{color: "#4ade80", background: "none", border: "none", marginBottom: "20px"}}>← BACK TO LOG</button>
          {Object.keys(entries).sort().reverse().map(date => (
            <div key={date} style={{background: "#0f0f0f", padding: "15px", borderRadius: "12px", marginBottom: "10px", border: "1px solid #1a1a1a"}}>
              <div style={{fontWeight: "bold", color: "#4ade80"}}>{date}</div>
              <div style={{fontSize: "12px", color: "#888"}}>Steps: {entries[date].steps || 0} | {entries[date].calories || 0} kcal</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
