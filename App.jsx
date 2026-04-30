import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Connection to your private database
const SUPABASE_URL = "https://jqioszktfqqtfbkjoosd.supabase.co";
const SUPABASE_ANON_KEY = "Sb_publishable_Nu_9dHse4KCtH2BDPFRRaA_DTGqKjKp";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const defaultForm = {
  lunch: "",
  dinner: "",
  snacks: "",
  calories: "",
  protein: "",
  steps: "",
  workout: false,
};

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}

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
  }, []);

  async function fetchLogs(userId) {
    const { data } = await supabase.from("daily_logs").select("*").eq("user_id", userId);
    const logs = {};
    data?.forEach(row => logs[row.date_key] = row.data);
    setEntries(logs);
    const today = new Date().toISOString().slice(0, 10);
    if (logs[today]) setForm(logs[today]);
  }

  async function handleAuth(type) {
    const { data, error } = type === "login" 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else { setUser(data.user); fetchLogs(data.user.id); }
  }

  async function saveEntry() {
    setSyncing(true);
    const dateKey = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("daily_logs").upsert({ 
      user_id: user.id, 
      date_key: dateKey, 
      data: form 
    }, { onConflict: 'user_id, date_key' });
    
    if (!error) {
      setEntries({ ...entries, [dateKey]: form });
      alert("✓ Data Saved to Cloud");
    } else {
      alert("Error saving: " + error.message);
    }
    setSyncing(false);
  }

  if (loading) return <div style={{background: "#080808", color: "#4ade80", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace"}}>CONNECTING TO DATABASE...</div>;

  if (!user) {
    return (
      <div style={{ background: "#080808", color: "#e8e8e8", minHeight: "100vh", padding: "40px 20px", fontFamily: "sans-serif" }}>
        <h2 style={{color: "#4ade80", letterSpacing: "0.1em"}}>MED-STAT LOGIN</h2>
        <p style={{color: "#444", fontSize: "12px", marginBottom: "30px"}}>Enter your details to sync between devices.</p>
        <input style={{width: "100%", padding: "14px", marginBottom: "15px", background: "#0f0f0f", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input style={{width: "100%", padding: "14px", marginBottom: "25px", background: "#0f0f0f", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button onClick={() => handleAuth("login")} style={{width: "100%", padding: "14px", background: "#4ade80", border: "none", fontWeight: "700", borderRadius: "8px", marginBottom: "15px", cursor: "pointer"}}>LOGIN</button>
        <button onClick={() => handleAuth("signup")} style={{width: "100%", padding: "14px", background: "none", color: "#4ade80", border: "1px solid #4ade80", borderRadius: "8px", cursor: "pointer"}}>SIGN UP</button>
      </div>
    );
  }

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ background: "#080808", color: "#e8e8e8", minHeight: "100vh", fontFamily: "sans-serif", padding: "20px" }}>
      <header style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #1a1a1a", paddingBottom: "15px"}}>
        <div>
          <div style={{fontSize: "10px", color: "#4ade80", fontWeight: "bold"}}>LOGGED IN AS</div>
          <div style={{fontSize: "13px", fontWeight: "600"}}>{user.email}</div>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{background: "#111", border: "1px solid #222", color: "#666", padding: "6px 12px", borderRadius: "6px", fontSize: "10px", cursor: "pointer"}}>LOGOUT</button>
      </header>

      {view === "log" ? (
        <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
          <section>
            <label style={{fontSize: "10px", color: "#444", marginBottom: "8px", display: "block"}}>PHYSICAL ACTIVITY</label>
            <div style={{display: "flex", gap: "10px", marginBottom: "10px"}}>
              <input type="number" value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} placeholder="Steps" style={{flex: 1, padding: "12px", background: "#0f0f0f", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} />
              <button onClick={() => setForm({...form, workout: !form.workout})} style={{padding: "0 20px", background: form.workout ? "#4ade80" : "#0f0f0f", color: form.workout ? "#000" : "#444", border: "1px solid #222", borderRadius: "8px", fontWeight: "bold", fontSize: "12px"}}>WORKOUT</button>
            </div>
          </section>

          <section>
            <label style={{fontSize: "10px", color: "#444", marginBottom: "8px", display: "block"}}>NUTRITION</label>
            <textarea value={form.lunch} onChange={e => setForm({...form, lunch: e.target.value})} placeholder="What did you eat today?" rows={3} style={{width: "100%", padding: "12px", background: "#0f0f0f", border: "1px solid #222", color: "#fff", borderRadius: "8px", marginBottom: "10px"}} />
            <div style={{display: "flex", gap: "10px"}}>
              <input type="number" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} placeholder="Cals" style={{flex: 1, padding: "12px", background: "#0f0f0f", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} />
              <input type="number" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} placeholder="Protein (g)" style={{flex: 1, padding: "12px", background: "#0f0f0f", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} />
            </div>
          </section>

          <button onClick={saveEntry} disabled={syncing} style={{padding: "16px", background: "#4ade80", color: "#000", border: "none", fontWeight: "bold", borderRadius: "10px", cursor: "pointer", marginTop: "10px"}}>
            {syncing ? "SYNCING..." : "SAVE & SYNC DATA"}
          </button>
          
          <button onClick={() => setView("history")} style={{color: "#4ade80", background: "none", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer"}}>VIEW HISTORY</button>
        </div>
      ) : (
        <div>
          <button onClick={() => setView("log")} style={{color: "#4ade80", background: "none", border: "none", marginBottom: "20px", fontWeight: "bold", cursor: "pointer"}}>← BACK TO LOG</button>
          {Object.keys(entries).sort().reverse().map(date => (
            <div key={date} style={{background: "#0f0f0f", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #1a1a1a"}}>
              <div style={{fontWeight: "bold", marginBottom: "10px", color: "#4ade80"}}>{formatDate(date)}</div>
              <div style={{fontSize: "13px", color: "#888", display: "flex", justifyContent: "space-between"}}>
                <span>Steps: {entries[date].steps || "0"}</span>
                <span>{entries[date].calories || "0"} kcal</span>
                <span>{entries[date].protein || "0"}g P</span>
              </div>
              {entries[date].workout && <div style={{fontSize: "10px", color: "#4ade80", marginTop: "10px", fontWeight: "bold"}}>🏋️ WORKOUT LOGGED</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
                           }
