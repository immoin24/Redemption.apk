import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SB_URL = "https://jqioszktfqqtfbkjoosd.supabase.co";
const SB_KEY = "sb_publishable_Nu_9dHse4KCtH2BDPFRRaA_DTGqKjKp";
const supabase = createClient(SB_URL, SB_KEY);

const defaultForm = { 
  health: { lunch: "", dinner: "", steps: "", protein: "", workout: false },
  study: { mcqs: 0, subject: "", topics: "", hours: "" },
  journal: { note: "", mood: "😊" }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("health"); // health, study, journal, stats
  const [entries, setEntries] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState(defaultForm);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  useEffect(() => {
    setForm(entries[selectedDate] || defaultForm);
  }, [selectedDate, entries]);

  async function fetchLogs() {
    const { data } = await supabase.from("daily_logs").select("*").eq("user_id", user.id);
    if (data) {
      const logs = {};
      data.forEach(row => logs[row.date_key] = row.data);
      setEntries(logs);
    }
  }

  async function save() {
    setSyncing(true);
    await supabase.from("daily_logs").upsert({ user_id: user.id, date_key: selectedDate, data: form }, { onConflict: 'user_id, date_key' });
    setEntries(prev => ({ ...prev, [selectedDate]: form }));
    setSyncing(false);
    alert("Synced!");
  }

  if (!user) return <div style={{padding: "50px", color: "#4ade80", textAlign: "center", background: "#080808", height: "100vh"}}>Please Login on Vercel Dashboard.</div>;

  return (
    <div style={{ background: "#080808", color: "#e8e8e8", minHeight: "100vh", fontFamily: "sans-serif", padding: "15px", paddingBottom: "80px" }}>
      
      {/* Top Header */}
      <header style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{background: "none", border: "1px solid #333", color: "#4ade80", borderRadius: "5px", padding: "5px"}} />
        <button onClick={save} style={{background: "#4ade80", color: "#000", border: "none", padding: "5px 15px", borderRadius: "5px", fontWeight: "bold"}}>{syncing ? "..." : "SYNC"}</button>
      </header>

      {/* Health Tab */}
      {tab === "health" && (
        <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
          <h3 style={{color: "#4ade80"}}>Health Log</h3>
          <input type="number" placeholder="Steps" value={form.health.steps} onChange={e => setForm({...form, health: {...form.health, steps: e.target.value}})} style={inputStyle} />
          <textarea placeholder="Lunch..." value={form.health.lunch} onChange={e => setForm({...form, health: {...form.health, lunch: e.target.value}})} style={inputStyle} />
          <textarea placeholder="Dinner..." value={form.health.dinner} onChange={e => setForm({...form, health: {...form.health, dinner: e.target.value}})} style={inputStyle} />
        </div>
      )}

      {/* Study Tab (FMGE Prep) */}
      {tab === "study" && (
        <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
          <h3 style={{color: "#4ade80"}}>FMGE Prep</h3>
          <div style={{background: "#111", padding: "15px", borderRadius: "10px", border: "1px solid #222"}}>
            <label style={{fontSize: "12px", color: "#666"}}>MCQs Solved Today</label>
            <input type="number" value={form.study.mcqs} onChange={e => setForm({...form, study: {...form.study, mcqs: e.target.value}})} style={{...inputStyle, fontSize: "24px", textAlign: "center"}} />
          </div>
          <input placeholder="Subject (e.g. Pathology)" value={form.study.subject} onChange={e => setForm({...form, study: {...form.study, subject: e.target.value}})} style={inputStyle} />
          <textarea placeholder="Topics Covered..." value={form.study.topics} onChange={e => setForm({...form, study: {...form.study, topics: e.target.value}})} style={inputStyle} />
        </div>
      )}

      {/* Journal Tab */}
      {tab === "journal" && (
        <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
          <h3 style={{color: "#4ade80"}}>Daily Journal</h3>
          <textarea placeholder="How was your day? Any breakthroughs?" value={form.journal.note} onChange={e => setForm({...form, journal: {...form.journal, note: e.target.value}})} style={{...inputStyle, height: "200px"}} />
          <div style={{display: "flex", justifyContent: "space-around", fontSize: "24px"}}>
            {["😊", "😐", "😴", "🧠", "🔥"].map(m => (
              <span key={m} onClick={() => setForm({...form, journal: {...form.journal, mood: m}})} style={{cursor: "pointer", opacity: form.journal.mood === m ? 1 : 0.3}}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav style={{position: "fixed", bottom: 0, left: 0, right: 0, background: "#111", display: "flex", justifyContent: "space-around", padding: "15px", borderTop: "1px solid #222"}}>
        <button onClick={() => setTab("health")} style={{background: "none", border: "none", color: tab === "health" ? "#4ade80" : "#666"}}>🏥 Health</button>
        <button onClick={() => setTab("study")} style={{background: "none", border: "none", color: tab === "study" ? "#4ade80" : "#666"}}>📚 Study</button>
        <button onClick={() => setTab("journal")} style={{background: "none", border: "none", color: tab === "journal" ? "#4ade80" : "#666"}}>📝 Journal</button>
      </nav>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "12px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "8px", boxSizing: "border-box" };
