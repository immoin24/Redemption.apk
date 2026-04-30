import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SB_URL = "https://jqioszktfqqtfbkjoosd.supabase.co";
const SB_KEY = "sb_publishable_Nu_9dHse4KCtH2BDPFRRaA_DTGqKjKp";
const supabase = createClient(SB_URL, SB_KEY);

const defaultForm = { lunch: "", dinner: "", snacks: "", workout_details: "", calories: "", protein: "", steps: "", workout: false };

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("log");
  const [entries, setEntries] = useState({});
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchLogs(session.user.id);
      setLoading(false);
    });
  }, []);

  async function fetchLogs(userId) {
    const { data } = await supabase.from("daily_logs").select("*").eq("user_id", userId).order('date_key', { ascending: true });
    if (data) {
      const logs = {};
      data.forEach(row => logs[row.date_key] = row.data);
      setEntries(logs);
      const today = new Date().toISOString().slice(0, 10);
      if (logs[today]) setForm(logs[today]);
    }
  }

  async function saveEntry() {
    if (!user) return;
    setSyncing(true);
    const dateKey = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("daily_logs").upsert({ user_id: user.id, date_key: dateKey, data: form }, { onConflict: 'user_id, date_key' });
    if (!error) { setEntries(prev => ({ ...prev, [dateKey]: form })); alert("✓ Synced"); }
    setSyncing(false);
  }

  // GRAPH LOGIC: Get last 7 days of steps
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), steps: Number(entries[key]?.steps || 0) };
  }).reverse();

  const maxSteps = Math.max(...last7Days.map(d => d.steps), 10000);

  if (loading) return <div style={{background: "#080808", color: "#4ade80", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center"}}>LOADING STATS...</div>;

  if (!user) return (
    <div style={{ background: "#080808", color: "#e8e8e8", height: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      <h2 style={{color: "#4ade80"}}>MED-STAT</h2>
      <input style={{width: "100%", padding: "12px", marginBottom: "10px", background: "#111", border: "1px solid #222", color: "#fff"}} placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input style={{width: "100%", padding: "12px", marginBottom: "20px", background: "#111", border: "1px solid #222", color: "#fff"}} type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={async () => { const { error } = await supabase.auth.signInWithPassword({email, password}); if(error) alert(error.message); }} style={{width: "100%", padding: "12px", background: "#4ade80", border: "none", fontWeight: "bold"}}>LOGIN</button>
    </div>
  );

  return (
    <div style={{ background: "#080808", color: "#e8e8e8", minHeight: "100vh", fontFamily: "sans-serif", padding: "20px" }}>
      <header style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
        <span style={{color: "#4ade80", fontSize: "12px"}}>{user.email}</span>
        <div style={{display: "flex", gap: "15px"}}>
          <button onClick={() => setView(view === "progress" ? "log" : "progress")} style={{background: "none", border: "none", color: "#4ade80", fontWeight: "bold"}}>{view === "progress" ? "BACK" : "STATS"}</button>
          <button onClick={() => supabase.auth.signOut()} style={{color: "#666", background: "none", border: "none"}}>EXIT</button>
        </div>
      </header>

      {view === "log" ? (
        <div style={{display: "flex", flexDirection: "column", gap: "15px"}}>
          <input type="number" value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} placeholder="Steps" style={{padding: "15px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px", fontSize: "18px"}} />
          <button onClick={() => setForm({...form, workout: !form.workout})} style={{padding: "12px", background: form.workout ? "#4ade80" : "#111", color: form.workout ? "#000" : "#fff", border: "1px solid #333", borderRadius: "10px"}}>WORKOUT {form.workout ? "✓" : "+"}</button>
          {form.workout && <textarea value={form.workout_details} onChange={e => setForm({...form, workout_details: e.target.value})} placeholder="Exercises..." style={{padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px"}} />}
          <textarea value={form.lunch} onChange={e => setForm({...form, lunch: e.target.value})} placeholder="Lunch..." style={{padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px"}} />
          <textarea value={form.dinner} onChange={e => setForm({...form, dinner: e.target.value})} placeholder="Dinner..." style={{padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px"}} />
          <div style={{display: "flex", gap: "10px"}}>
            <input type="number" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} placeholder="Cals" style={{flex: 1, padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px"}} />
            <input type="number" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} placeholder="Prot" style={{flex: 1, padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px"}} />
          </div>
          <button onClick={saveEntry} style={{padding: "18px", background: "#4ade80", color: "#000", border: "none", fontWeight: "bold", borderRadius: "12px", fontSize: "16px"}}>{syncing ? "SAVING..." : "SAVE & SYNC"}</button>
        </div>
      ) : (
        <div>
          <h3 style={{textAlign: "center", color: "#4ade80", marginBottom: "30px"}}>7-DAY STEP TREND</h3>
          
          {/* THE CHART */}
          <div style={{display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "200px", padding: "0 10px", marginBottom: "40px", borderBottom: "1px solid #333"}}>
            {last7Days.map((d, i) => (
              <div key={i} style={{display: "flex", flexDirection: "column", alignItems: "center", flex: 1}}>
                <div style={{
                  width: "25px", 
                  background: d.steps > 8000 ? "#4ade80" : "#222", 
                  height: `${(d.steps / maxSteps) * 180}px`, 
                  borderRadius: "5px 5px 0 0",
                  transition: "height 0.5s ease"
                }}></div>
                <div style={{fontSize: "10px", color: "#666", marginTop: "8px"}}>{d.day}</div>
              </div>
            ))}
          </div>

          <div style={{background: "#111", padding: "20px", borderRadius: "15px", textAlign: "center"}}>
            <div style={{fontSize: "12px", color: "#666"}}>AVG DAILY STEPS</div>
            <div style={{fontSize: "32px", fontWeight: "bold", color: "#4ade80"}}>
              {Math.round(last7Days.reduce((a, b) => a + b.steps, 0) / 7)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
