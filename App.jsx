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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
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

  // When you change the date, load the data for that specific day
  useEffect(() => {
    if (entries[selectedDate]) {
      setForm(entries[selectedDate]);
    } else {
      setForm(defaultForm);
    }
  }, [selectedDate, entries]);

  async function fetchLogs(userId) {
    const { data } = await supabase.from("daily_logs").select("*").eq("user_id", userId).order('date_key', { ascending: true });
    if (data) {
      const logs = {};
      data.forEach(row => logs[row.date_key] = row.data);
      setEntries(logs);
    }
  }

  async function saveEntry() {
    if (!user) return;
    setSyncing(true);
    const { error } = await supabase.from("daily_logs").upsert({ user_id: user.id, date_key: selectedDate, data: form }, { onConflict: 'user_id, date_key' });
    if (!error) { 
      setEntries(prev => ({ ...prev, [selectedDate]: form })); 
      alert(`✓ Saved for ${selectedDate}`); 
    }
    setSyncing(false);
  }

  const getMondayStartWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return [...Array(7)].map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return { 
        day: d.toLocaleDateString('en-US', { weekday: 'short' }), 
        steps: Number(entries[key]?.steps || 0),
        protein: Number(entries[key]?.protein || 0)
      };
    });
  };

  const weeklyData = getMondayStartWeek();
  const avgSteps = Math.round(weeklyData.reduce((a, b) => a + b.steps, 0) / 7);
  const avgProtein = Math.round(weeklyData.reduce((a, b) => a + b.protein, 0) / 7);
  const maxSteps = Math.max(...weeklyData.map(d => d.steps), 10000);

  if (loading) return <div style={{background: "#080808", color: "#4ade80", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center"}}>LOADING JOURNAL...</div>;

  if (!user) return (
    <div style={{ background: "#080808", color: "#e8e8e8", height: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      <h2 style={{color: "#4ade80"}}>MED-STAT</h2>
      <input style={{width: "100%", padding: "12px", marginBottom: "10px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input style={{width: "100%", padding: "12px", marginBottom: "20px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={async () => { const { error } = await supabase.auth.signInWithPassword({email, password}); if(error) alert(error.message); }} style={{width: "100%", padding: "12px", background: "#4ade80", border: "none", fontWeight: "bold", borderRadius: "8px"}}>LOGIN</button>
    </div>
  );

  return (
    <div style={{ background: "#080808", color: "#e8e8e8", minHeight: "100vh", fontFamily: "sans-serif", padding: "15px" }}>
      <header style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px"}}>
        <span style={{color: "#4ade80", fontSize: "11px", opacity: 0.7}}>MED-STAT</span>
        <div style={{display: "flex", gap: "15px"}}>
          <button onClick={() => setView(view === "progress" ? "log" : "progress")} style={{background: "none", border: "none", color: "#4ade80", fontWeight: "bold"}}>{view === "progress" ? "BACK" : "STATS"}</button>
          <button onClick={() => supabase.auth.signOut()} style={{color: "#666", background: "none", border: "none", fontSize: "12px"}}>EXIT</button>
        </div>
      </header>

      {view === "log" ? (
        <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
          {/* DATE PICKER */}
          <div style={{marginBottom: "5px"}}>
            <label style={{fontSize: "10px", color: "#666", display: "block", marginBottom: "5px"}}>LOGGING FOR DATE:</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} 
                   style={{width: "100%", padding: "10px", background: "#1a1a1a", border: "1px solid #4ade80", color: "#4ade80", borderRadius: "8px", fontSize: "16px", outline: "none"}} />
          </div>

          <input type="number" value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} placeholder="Steps" style={{padding: "15px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px", fontSize: "18px", width: "100%", boxSizing: "border-box"}} />
          <button onClick={() => setForm({...form, workout: !form.workout})} style={{padding: "12px", background: form.workout ? "#4ade80" : "#111", color: form.workout ? "#000" : "#fff", border: "1px solid #333", borderRadius: "10px", fontWeight: "bold"}}>WORKOUT {form.workout ? "✓" : "+"}</button>
          {form.workout && <textarea value={form.workout_details} onChange={e => setForm({...form, workout_details: e.target.value})} placeholder="Exercises..." style={{padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px", width: "100%", boxSizing: "border-box"}} />}
          <textarea value={form.lunch} onChange={e => setForm({...form, lunch: e.target.value})} placeholder="Lunch..." style={{padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px", width: "100%", boxSizing: "border-box"}} />
          <textarea value={form.dinner} onChange={e => setForm({...form, dinner: e.target.value})} placeholder="Dinner..." style={{padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px", width: "100%", boxSizing: "border-box"}} />
          
          <div style={{display: "flex", gap: "10px"}}>
            <input type="number" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} placeholder="Cals" style={{flex: 1, padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px", minWidth: "0"}} />
            <input type="number" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} placeholder="Prot" style={{flex: 1, padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "10px", minWidth: "0"}} />
          </div>
          
          <button onClick={saveEntry} style={{padding: "18px", background: "#4ade80", color: "#000", border: "none", fontWeight: "bold", borderRadius: "12px", fontSize: "16px", marginTop: "10px"}}>{syncing ? "SYNCING..." : "SAVE & SYNC"}</button>
        </div>
      ) : (
        <div style={{paddingBottom: "40px"}}>
          <h3 style={{textAlign: "center", color: "#4ade80", marginBottom: "5px"}}>WEEKLY TRENDS</h3>
          <p style={{textAlign: "center", fontSize: "10px", color: "#555", marginBottom: "30px"}}>Monday - Sunday</p>
          
          <div style={{display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "160px", padding: "0 10px", marginBottom: "40px", borderBottom: "1px solid #222"}}>
            {weeklyData.map((d, i) => (
              <div key={i} style={{display: "flex", flexDirection: "column", alignItems: "center", flex: 1}}>
                <div style={{
                  width: "18px", 
                  background: d.steps > 8000 ? "#4ade80" : "#222", 
                  height: `${(d.steps / maxSteps) * 140}px`, 
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.6s ease"
                }}></div>
                <div style={{fontSize: "9px", color: "#555", marginTop: "10px"}}>{d.day}</div>
              </div>
            ))}
          </div>

          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}}>
            <div style={{background: "#111", padding: "20px", borderRadius: "15px", textAlign: "center", border: "1px solid #222"}}>
              <div style={{fontSize: "10px", color: "#666"}}>AVG STEPS</div>
              <div style={{fontSize: "26px", fontWeight: "bold", color: "#4ade80", marginTop: "5px"}}>{avgSteps}</div>
            </div>
            <div style={{background: "#111", padding: "20px", borderRadius: "15px", textAlign: "center", border: "1px solid #222"}}>
              <div style={{fontSize: "10px", color: "#666"}}>AVG PROTEIN</div>
              <div style={{fontSize: "26px", fontWeight: "bold", color: "#4ade80", marginTop: "5px"}}>{avgProtein}g</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
          }
