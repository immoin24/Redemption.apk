import { useState, useEffect } from "react";

const STORAGE_KEY = "daily-health-log-v2";
const ANTHROPIC_API_KEY = "YOUR_KEY_HERE"; 

const defaultForm = {
  lunch: "",
  dinner: "",
  snacks: "",
  calories: "",
  protein: "",
  steps: "",
  workout: false,
  notes: "",
  breakdown: null,
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}

function StatBar({ label, value, max, color, unit }) {
  const pct = Math.min(100, (parseFloat(value) / max) * 100) || 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.1em", color: "#666", textTransform: "uppercase", fontFamily: "monospace" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: value ? color : "#333", fontFamily: "monospace" }}>
          {value ? `${value}${unit}` : "—"}
        </span>
      </div>
      <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("log");
  const [entries, setEntries] = useState({});
  const [form, setForm] = useState(defaultForm);
  const [saved, setSaved] = useState(false);
  const todayKey = getTodayKey();

  useEffect(() => {
    const result = localStorage.getItem(STORAGE_KEY);
    if (result) {
      const data = JSON.parse(result);
      setEntries(data);
      if (data[todayKey]) setForm(data[todayKey]);
    }
  }, [todayKey]);

  function saveEntry() {
    const updated = { ...entries, [todayKey]: { ...form, savedAt: new Date().toISOString() } };
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inp = {
    background: "#0f0f0f", border: "1px solid #202020", borderRadius: 8,
    color: "#e8e8e8", padding: "12px", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none",
  };

  const lbl = { fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 6, display: "block", fontFamily: "monospace" };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e8e8e8", fontFamily: "sans-serif", paddingBottom: "50px" }}>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px" }}>
        
        <header style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: "0.2em" }}>MED-STAT TRACKER</div>
          <div style={{ fontSize: 22, fontWeight: "bold" }}>{formatDate(todayKey)}</div>
        </header>

        <nav style={{ display: "flex", gap: 20, marginBottom: 30, borderBottom: "1px solid #1a1a1a" }}>
          <button onClick={() => setView("log")} style={{ background: "none", border: "none", color: view === "log" ? "#4ade80" : "#444", paddingBottom: 10, borderBottom: view === "log" ? "2px solid #4ade80" : "none", cursor: "pointer", fontWeight: "bold" }}>LOG</button>
          <button onClick={() => setView("history")} style={{ background: "none", border: "none", color: view === "history" ? "#4ade80" : "#444", paddingBottom: 10, borderBottom: view === "history" ? "2px solid #4ade80" : "none", cursor: "pointer", fontWeight: "bold" }}>HISTORY</button>
        </nav>

        {view === "log" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {saved && <div style={{ background: "#0b1f12", color: "#4ade80", padding: "10px", borderRadius: 8, fontSize: 12 }}>✓ Data synced to device memory</div>}
            
            <section>
              <label style={lbl}>Physical Activity</label>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <input type="number" value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} placeholder="Steps" style={inp} />
                <button 
                  onClick={() => setForm({...form, workout: !form.workout})}
                  style={{ background: form.workout ? "#4ade80" : "#111", color: form.workout ? "#000" : "#444", border: "1px solid #222", borderRadius: 8, padding: "0 15px", cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                >
                  {form.workout ? "WORKOUT ✓" : "WORKOUT?"}
                </button>
              </div>
            </section>

            <section>
              <label style={lbl}>Nutrition Log</label>
              <textarea value={form.lunch} onChange={e => setForm({...form, lunch: e.target.value})} placeholder="Lunch details..." rows={2} style={{...inp, marginBottom: "10px"}} />
              <textarea value={form.dinner} onChange={e => setForm({...form, dinner: e.target.value})} placeholder="Dinner details..." rows={2} style={{...inp, marginBottom: "10px"}} />
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="number" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} placeholder="Total Cals" style={inp} />
                <input type="number" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} placeholder="Protein (g)" style={inp} />
              </div>
            </section>

            <button onClick={saveEntry} style={{ width: "100%", background: "#4ade80", color: "#000", border: "none", borderRadius: 10, padding: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>
              SAVE TODAY'S LOG
            </button>
          </div>
        ) : (
          <div>
            {Object.keys(entries).sort().reverse().map(date => (
              <div key={date} style={{ background: "#0f0f0f", padding: "20px", borderRadius: 12, marginBottom: 15, border: "1px solid #1a1a1a" }}>
                <div style={{ fontWeight: "bold", marginBottom: 15, fontSize: 14 }}>{formatDate(date)}</div>
                <StatBar label="Steps" value={entries[date].steps} max={10000} color="#60a5fa" unit="" />
                <StatBar label="Calories" value={entries[date].calories} max={2500} color="#facc15" unit=" kcal" />
                <StatBar label="Protein" value={entries[date].protein} max={150} color="#4ade80" unit="g" />
                {entries[date].workout && <div style={{ fontSize: 10, color: "#4ade80", marginTop: 10, fontWeight: "bold" }}>🏋️ WORKOUT COMPLETED</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
