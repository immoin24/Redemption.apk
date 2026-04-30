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
      <input style={{width: "100%", padding: "12px", marginBottom: "20px", background: "#111", border: "1px solid #222", color: "#fff", borderRadius: "8px"}} type="password" placeholder="Password" onChange={e => setPassword(e.
                                                                                                                                                                                                                                
