import { useState, useEffect } from "react";

const STORAGE_KEY = "daily-health-log-v2";
// 1. PUT YOUR API KEY BETWEEN THE QUOTES BELOW
const ANTHROPIC_API_KEY = "YOUR_KEY_HERE"; 

const defaultForm = {
  lunch: "",
  dinner: "",
  snacks: "",
  calories: "",
  protein: "",
  steps: "",
  workout: "",
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

async function estimateNutrition(lunch, dinner, snacks) {
  const foodText = [
    lunch && `Lunch: ${lunch}`,
    dinner && `Dinner: ${dinner}`,
    snacks && `Snacks/other: ${snacks}`,
  ].filter(Boolean).join("\n");

  const prompt = `You are a nutrition expert. Estimate the calories and protein for these meals. Be realistic with typical portion sizes unless the user specifies.

${foodText}

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "lunch": { "calories": number, "protein": number, "notes": "brief note about main calories/protein source" },
  "dinner": { "calories": number, "protein": number, "notes": "brief note" },
  "snacks": { "calories": number, "protein": number, "notes": "brief note" },
  "total_calories": number,
  "total_protein": number,
  "tip": "one short beginner-friendly tip about today's nutrition (max 20 words)"
}
If a meal was not provided, set its values to 0 and notes to "".`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { 
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "dangerouslyAllowBrowser": "true" 
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function StatBar({ label, value, max, color, unit }) {
  const pct = Math.min(100, (parseFloat(value) / max) * 100) || 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "#666", textTransform: "uppercase", fontFamily: "monospace" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: value ? color : "#333", fontFamily: "monospace" }}>
          {value ? `${value}${unit}` : "—"}
        </span>
      </div>
      <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function MealCard({ label, text }) {
  return (
    <div style={{ marginTop: 8, padding: "10px 12px", background: "#0a0a0a", borderRadius: 8, borderLeft: "2px solid #1e1e1e" }}>
      <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "monospace" }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 13, color: "#888" }}>{text}</div>
    </div>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 14, height: 14, border: "2px solid #1a3a22", borderTop: "2px solid #4ade80", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
    </>
  );
}

export default function App() {
  const [view, setView] = useState("log");
  const [entries, setEntries] = useState({});
  const [form, setForm] = useState(defaultForm);
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [editingDate, setEditingDate] = useState(null);
  const todayKey = getTodayKey();

  useEffect(() => {
    async function load() {
      try {
        const result = localStorage.getItem(STORAGE_KEY);
        if (result) {
          const data = JSON.parse(result);
          setEntries(data);
          if (data[todayKey]) setForm(data[todayKey]);
        }
      } catch {}
    }
    load();
  }, [todayKey]);

  async function handleAnalyze() {
    if (!form.lunch && !form.dinner && !form.snacks) {
      setAnalyzeError("Add at least one meal first!");
      return;
    }
    setAnalyzeError("");
    setAnalyzing(true);
    try {
      const result = await estimateNutrition(form.lunch, form.dinner, form.snacks);
      setForm(f => ({
        ...f,
        calories: String(result.total_calories),
        protein: String(result.total_protein),
        breakdown: result,
      }));
    } catch {
      setAnalyzeError("Couldn't analyze — check API key or try again.");
    }
    setAnalyzing(false);
  }

  async function saveEntry() {
    const key = editingDate || todayKey;
    const updated = { ...entries, [key]: { ...form, savedAt: new Date().toISOString() } };
    setEntries(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
    setSaved(true);
    setEditingDate(null);
    setTimeout(() => setSaved(false), 2500);
  }

  async function deleteEntry(dateKey) {
    const updated = { ...entries };
    delete updated[dateKey];
    setEntries(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }

  function startEdit(dateKey) {
    setForm(entries[dateKey]);
    setEditingDate(dateKey);
    setView("log");
  }

  const sortedDates = Object.keys(entries).sort((a, b) => b.localeCompare(a));
  const chartDates = sortedDates.slice(0, 14).reverse();

  const inp = {
    background: "#0f0f0f",
    border: "1px solid #202020",
    borderRadius: 8,
    color: "#e8e8e8",
    padding: "10px 14px",
    fontSize: 14,
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  };

  const lbl = {
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#444",
    marginBottom: 6,
    display: "block",
    fontFamily: "monospace",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e8e8e8", fontFamily: "'Outfit', 'Helvetica Neue', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ borderBottom: "1px solid #141414", padding: "18px 20px 0", position: "sticky", top: 0, background: "#080808", zIndex: 10 }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#4ade80", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 2 }}>Health Log</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {editingDate ? `Editing ${formatDate(editingDate)}` : formatDate(todayKey)}
              </div>
            </div>
            <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#444", fontFamily: "monospace" }}>
              {sortedDates.length} days
            </div>
          </div>
          <div style={{ display: "flex" }}>
            {[["log","Log Day"], ["history","History"], ["chart","Trends"]].map(([v, label]) => (
              <button key={v} onClick={() => { setView(v); if (v === "log" && !editingDate) setForm(entries[todayKey] || defaultForm); }}
                style={{ background: "none", border: "none", color: view === v ? "#4ade80" : "#383838", padding: "8px 16px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderBottom: view === v ? "2px solid #4ade80" : "2px solid transparent", transition: "all 0.2s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "24px 20px 80px" }}>
        {view === "log" && (
          <div>
            {saved && (
              <div style={{ background: "#0b1f12", border: "1px solid #4ade8040", borderRadius: 10, padding: "11px 16px", marginBottom: 20, fontSize: 13, color: "#4ade80" }}>
                ✓ Entry saved!
              </div>
            )}
            <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={lbl}>Lunch</label>
                <textarea value={form.lunch} onChange={e => setForm({...form, lunch: e.target.value, breakdown: null})} placeholder="What did you eat?" rows={2} style={{...inp, resize: "vertical"}} />
              </div>
              <div>
                <label style={lbl}>Dinner</label>
                <textarea value={form.dinner} onChange={e => setForm({...form, dinner: e.target.value, breakdown: null})} placeholder="What's for dinner?" rows={2} style={{...inp, resize: "vertical"}} />
              </div>
              <div>
                <label style={lbl}>Snacks</label>
                <textarea value={form.snacks} onChange={e => setForm({...form, snacks: e.target.value, breakdown: null})} placeholder="Any tea or snacks?" rows={2} style={{...inp, resize: "vertical"}} />
              </div>
            </div>

            <button onClick={handleAnalyze} disabled={analyzing} style={{ width: "100%", background: analyzing ? "#0f1f14" : "#4ade80", color: "#000", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, cursor: "pointer", marginBottom: 20 }}>
              {analyzing ? <Spinner /> : "Calculate Nutrition"}
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveEntry} style={{ flex: 1, background: "#e8e8e8", color: "#000", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, cursor: "pointer" }}>Save Log</button>
            </div>
          </div>
        )}

        {view === "history" && (
          <div>
            {sortedDates.map(dateKey => (
              <div key={dateKey} style={{ background: "#0f0f0f", border: "1px solid #161616", borderRadius: 14, padding: 18, marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{formatDate(dateKey)}</div>
                <StatBar label="Calories" value={entries[dateKey].calories} max={3000} color="#facc15" unit=" kcal" />
                <StatBar label="Protein" value={entries[dateKey].protein} max={200} color="#4ade80" unit="g" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
