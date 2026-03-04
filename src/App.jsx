import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0D0F14", surface: "#161921", card: "#1C2030", border: "#252A3A",
  accent: "#4ADE80", accentDim: "#1a3d2b", warning: "#FBBF24",
  danger: "#F87171", muted: "#6B7280", text: "#F1F5F9", textDim: "#94A3B8",
};

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

const INVOICES0 = [
  { id: 1, client: "Acme Corp", amount: 3200, status: "paid", dueDate: "2025-02-10", type: "business", description: "Web redesign Q1" },
  { id: 2, client: "PixelBridge", amount: 1500, status: "pending", dueDate: "2026-03-15", type: "business", description: "Logo & branding" },
  { id: 3, client: "NovaTech", amount: 4800, status: "overdue", dueDate: "2026-02-20", type: "business", description: "App development sprint" },
  { id: 4, client: "Freelance Guild", amount: 750, status: "pending", dueDate: "2026-03-20", type: "business", description: "Workshop facilitation" },
];
const EXPENSES0 = [
  { id: 1, name: "Adobe Creative Cloud", amount: 54.99, category: "Software", date: "2026-02-28", type: "business" },
  { id: 2, name: "Groceries", amount: 180.5, category: "Personal", date: "2026-03-01", type: "personal" },
  { id: 3, name: "Figma Pro", amount: 15, category: "Software", date: "2026-02-25", type: "business" },
  { id: 4, name: "Electric bill", amount: 92.3, category: "Utilities", date: "2026-03-02", type: "personal" },
  { id: 5, name: "Client lunch", amount: 67, category: "Meals", date: "2026-03-01", type: "business" },
  { id: 6, name: "Gym membership", amount: 40, category: "Health", date: "2026-03-01", type: "personal" },
];
const ALERTS0 = [
  { id: 1, label: "Rent due", amount: 1850, dueDate: "2026-03-05", type: "personal" },
  { id: 2, label: "Notion subscription", amount: 16, dueDate: "2026-03-08", type: "business" },
  { id: 3, label: "Tax estimated payment", amount: 1200, dueDate: "2026-04-15", type: "business" },
];
const PROFILE0 = { name: "Your Name", email: "you@email.com", address: "Your City, State", phone: "" };

const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const persist = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── small components ──────────────────────────────────────────────────────────

function Badge({ type }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 4,
      background: type === "business" ? "#1e2d4a" : "#2a1e3a",
      color: type === "business" ? "#60A5FA" : "#C084FC", textTransform: "uppercase" }}>
      {type}
    </span>
  );
}

function StatusPill({ status }) {
  const map = { paid: ["#1a3d2b","#4ADE80","Paid"], pending: ["#3a2d1a","#FBBF24","Pending"], overdue: ["#3a1a1a","#F87171","Overdue"] };
  const [bg, color, label] = map[status] || map.pending;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: bg, color }}>{label}</span>;
}

function Btn({ children, onClick, variant = "primary", style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
        cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
        background: variant === "primary" ? COLORS.accent : COLORS.border,
        color: variant === "primary" ? "#0D0F14" : COLORS.textDim,
        ...style
      }}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: COLORS.textDim, fontSize: 12, fontWeight: 600,
        marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ label, ...props }) {
  return (
    <Field label={label}>
      <input {...props} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 8, padding: "10px 12px", color: COLORS.text, fontSize: 14,
        outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }} />
    </Field>
  );
}

function SelectInput({ label, children, ...props }) {
  return (
    <Field label={label}>
      <select {...props} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 8, padding: "10px 12px", color: COLORS.text, fontSize: 14,
        outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </select>
    </Field>
  );
}

// ── Modal — self-contained, no z-index fights ─────────────────────────────────
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 99999,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 16, padding: 32,
          width: "90vw", maxWidth: wide ? 520 : 420,
          maxHeight: "85vh", overflowY: "auto",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ color: COLORS.text, fontSize: 18, fontFamily: "'Playfair Display', serif", margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: COLORS.border, border: "none", color: COLORS.text,
              cursor: "pointer", fontSize: 14, fontWeight: 700,
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function generatePDF(inv, profile) {
  const num = `INV-${String(inv.id).slice(-5).padStart(5,"0")}`;
  const money = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
  const date = (d) => d ? new Date(d).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "—";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${num}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;padding:60px;max-width:800px;margin:0 auto;color:#111}
  .top{display:flex;justify-content:space-between;margin-bottom:48px}.logo{font-family:'Playfair Display',serif;font-size:28px}.logo span{color:#16a34a}
  .stripe{height:3px;background:linear-gradient(90deg,#16a34a,#4ade80);margin-bottom:40px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:40px}
  .lbl{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9CA3AF;margin-bottom:6px}
  .val{font-size:15px;font-weight:700}.sub{font-size:13px;color:#555;line-height:1.7}
  .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;background:#F9FAFB;border-radius:10px;padding:20px;margin-bottom:40px}
  table{width:100%;border-collapse:collapse;margin-bottom:32px}thead tr{border-bottom:2px solid #111}
  th{text-align:left;padding:0 0 10px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6B7280}th:last-child{text-align:right}
  td{padding:16px 0;border-bottom:1px solid #f0f0f0;font-size:14px}td:last-child{text-align:right;font-weight:700}
  .total{display:flex;justify-content:flex-end;margin-bottom:48px}.tbox{background:#111;color:#fff;padding:22px 32px;border-radius:12px}
  .tlbl{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px}
  .tamt{font-family:'Playfair Display',serif;font-size:30px;color:#4ade80}
  .foot{text-align:center;padding-top:24px;border-top:1px solid #eee;font-size:12px;color:#9CA3AF}
  .pbtn{position:fixed;bottom:24px;right:24px;background:#16a34a;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
  @media print{.pbtn{display:none}}</style></head>
  <body><button class="pbtn" onclick="window.print()">⬇ Save as PDF</button>
  <div class="top"><div class="logo">Ledgr<span>.</span></div><div style="text-align:right"><h2 style="font-size:24px;font-weight:700">Invoice</h2><div style="color:#6B7280;font-size:13px">${num}</div></div></div>
  <div class="stripe"></div>
  <div class="grid2">
    <div><div class="lbl">From</div><div class="val">${profile.name}</div><div class="sub">${profile.email}${profile.phone?"<br/>"+profile.phone:""}${profile.address?"<br/>"+profile.address:""}</div></div>
    <div><div class="lbl">Bill To</div><div class="val">${inv.client}</div></div>
  </div>
  <div class="meta">
    <div><div class="lbl">Invoice Date</div><div class="val" style="font-size:13px">${date(new Date().toISOString())}</div></div>
    <div><div class="lbl">Due Date</div><div class="val" style="font-size:13px">${date(inv.dueDate)}</div></div>
    <div><div class="lbl">Status</div><div class="val" style="font-size:13px;color:${inv.status==="paid"?"#16a34a":inv.status==="overdue"?"#dc2626":"#d97706"}">${inv.status.charAt(0).toUpperCase()+inv.status.slice(1)}</div></div>
  </div>
  <table><thead><tr><th style="width:60%">Description</th><th>Type</th><th>Amount</th></tr></thead>
  <tbody><tr><td>${inv.description||"Services rendered"}</td><td style="color:#6B7280">${inv.type}</td><td>${money(inv.amount)}</td></tr></tbody></table>
  <div class="total"><div class="tbox"><div class="tlbl">Total Due</div><div class="tamt">${money(inv.amount)}</div></div></div>
  <div class="foot">Thank you for your business · Generated by Ledgr</div>
  </body></html>`;
  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
}

// ── CSV ───────────────────────────────────────────────────────────────────────
function exportCSV(type, invoices, expenses) {
  let rows, filename;
  if (type === "invoices") {
    rows = [["Invoice #","Client","Description","Amount","Status","Due Date","Type"],
      ...invoices.map(i => [`INV-${String(i.id).slice(-5).padStart(5,"0")}`,i.client,i.description,i.amount,i.status,i.dueDate,i.type])];
    filename = "ledgr-invoices.csv";
  } else {
    rows = [["Name","Amount","Category","Date","Type"],
      ...expenses.map(e => [e.name,e.amount,e.category,e.date,e.type])];
    filename = "ledgr-expenses.csv";
  }
  const csv = rows.map(r => r.map(v => `"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download: filename });
  a.click();
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  const [invoices, setInvoices] = useState(() => load("ledgr_inv", INVOICES0));
  const [expenses, setExpenses] = useState(() => load("ledgr_exp", EXPENSES0));
  const [alerts, setAlerts]     = useState(() => load("ledgr_alr", ALERTS0));
  const [profile, setProfile]   = useState(() => load("ledgr_pro", PROFILE0));

  const [modal, setModal] = useState(null); // "invoice"|"expense"|"alert"|"profile"
  const closeModal = () => setModal(null);

  const [newInv, setNewInv] = useState({ client:"", amount:"", dueDate:"", type:"business", description:"", status:"pending" });
  const [newExp, setNewExp] = useState({ name:"", amount:"", category:"", date:"", type:"business" });
  const [newAlr, setNewAlr] = useState({ label:"", amount:"", dueDate:"", type:"personal" });
  const [editPro, setEditPro] = useState(profile);

  useEffect(() => persist("ledgr_inv", invoices), [invoices]);
  useEffect(() => persist("ledgr_exp", expenses), [expenses]);
  useEffect(() => persist("ledgr_alr", alerts),   [alerts]);
  useEffect(() => persist("ledgr_pro", profile),  [profile]);

  const fInvoices = filter === "all" ? invoices : invoices.filter(i => i.type === filter);
  const fExpenses = filter === "all" ? expenses : expenses.filter(e => e.type === filter);
  const upcoming  = alerts.map(a => ({...a, days: daysUntil(a.dueDate)})).filter(a => a.days <= 30).sort((a,b) => a.days - b.days);

  const totalIncome   = invoices.filter(i => i.status==="paid").reduce((s,i) => s+i.amount, 0);
  const totalPending  = invoices.filter(i => i.status==="pending").reduce((s,i) => s+i.amount, 0);
  const totalOverdue  = invoices.filter(i => i.status==="overdue").reduce((s,i) => s+i.amount, 0);
  const totalExp      = expenses.reduce((s,e) => s+e.amount, 0);
  const netProfit     = totalIncome - expenses.filter(e => e.type==="business").reduce((s,e) => s+e.amount, 0);
  const byCat         = expenses.reduce((a,e) => { a[e.category]=(a[e.category]||0)+e.amount; return a; }, {});

  const addInvoice = () => {
    if (!newInv.client || !newInv.amount) return;
    setInvoices(p => [...p, {...newInv, id: Date.now(), amount: parseFloat(newInv.amount)}]);
    setNewInv({ client:"", amount:"", dueDate:"", type:"business", description:"", status:"pending" });
    closeModal();
  };
  const addExpense = () => {
    if (!newExp.name || !newExp.amount) return;
    setExpenses(p => [...p, {...newExp, id: Date.now(), amount: parseFloat(newExp.amount)}]);
    setNewExp({ name:"", amount:"", category:"", date:"", type:"business" });
    closeModal();
  };
  const addAlert = () => {
    if (!newAlr.label || !newAlr.dueDate) return;
    setAlerts(p => [...p, {...newAlr, id: Date.now(), amount: parseFloat(newAlr.amount)||0}]);
    setNewAlr({ label:"", amount:"", dueDate:"", type:"personal" });
    closeModal();
  };
  const saveProfile = () => { setProfile(editPro); closeModal(); };

  const TABS = ["dashboard","invoices","expenses","alerts","charts"];
  const ICONS = { dashboard:"◼", invoices:"◈", expenses:"◉", alerts:"◐", charts:"◫" };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg, minHeight:"100vh", color:COLORS.text, display:"flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Sidebar ── */}
      <div style={{ width:220, background:COLORS.surface, borderRight:`1px solid ${COLORS.border}`,
        padding:"28px 16px", display:"flex", flexDirection:"column", flexShrink:0,
        position:"sticky", top:0, height:"100vh" }}>
        <div style={{ marginBottom:36 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:32, height:32, background:COLORS.accent, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>⚡</div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>Ledgr</span>
          </div>
          <p style={{ color:COLORS.muted, fontSize:11, margin:0, paddingLeft:42 }}>Personal & Business</p>
        </div>

        <nav style={{ flex:1 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"10px 12px", borderRadius:8, border:"none", cursor:"pointer",
              background: tab===t ? COLORS.accentDim : "transparent",
              color: tab===t ? COLORS.accent : COLORS.textDim,
              fontSize:14, fontWeight: tab===t ? 600 : 400,
              marginBottom:4, textAlign:"left", fontFamily:"'DM Sans',sans-serif" }}>
              <span>{ICONS[t]}</span>
              {t.charAt(0).toUpperCase()+t.slice(1)}
              {t==="alerts" && upcoming.length > 0 &&
                <span style={{ marginLeft:"auto", background:COLORS.warning, color:"#000", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:10 }}>{upcoming.length}</span>}
            </button>
          ))}
        </nav>

        <div style={{ borderTop:`1px solid ${COLORS.border}`, paddingTop:16, marginTop:16 }}>
          <p style={{ color:COLORS.muted, fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>View</p>
          {["all","business","personal"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              display:"block", width:"100%", padding:"7px 12px", borderRadius:6,
              border:"none", cursor:"pointer", textAlign:"left",
              background: filter===f ? COLORS.border : "transparent",
              color: filter===f ? COLORS.text : COLORS.muted,
              fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:2 }}>
              {f==="all" ? "All finances" : f==="business" ? "💼 Business" : "🏠 Personal"}
            </button>
          ))}
        </div>

        <div style={{ borderTop:`1px solid ${COLORS.border}`, paddingTop:16, marginTop:16 }}>
          <button onClick={() => { setEditPro(profile); setModal("profile"); }} style={{
            display:"block", width:"100%", padding:"7px 12px", borderRadius:6,
            border:"none", cursor:"pointer", textAlign:"left",
            background:"transparent", color:COLORS.textDim, fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>
            👤 My Profile
          </button>
          <button onClick={() => { if(window.confirm("Reset to demo data?")) { setInvoices(INVOICES0); setExpenses(EXPENSES0); setAlerts(ALERTS0); }}} style={{
            display:"block", width:"100%", padding:"7px 12px", borderRadius:6,
            border:"none", cursor:"pointer", textAlign:"left",
            background:"transparent", color:COLORS.muted, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
            ↺ Reset demo data
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex:1, padding:"32px 36px", overflowY:"auto" }}>

        {/* DASHBOARD */}
        {tab==="dashboard" && (
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, margin:"0 0 6px" }}>Financial Overview</h1>
            <p style={{ color:COLORS.muted, fontSize:14, marginBottom:32 }}>Your money, all in one place.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, marginBottom:32 }}>
              {[
                { label:"Income Collected", value:fmt(totalIncome), color:COLORS.accent, icon:"↑" },
                { label:"Pending Invoices", value:fmt(totalPending), color:COLORS.warning, icon:"⏳" },
                { label:"Overdue", value:fmt(totalOverdue), color:COLORS.danger, icon:"!" },
                { label:"Total Expenses", value:fmt(totalExp), color:"#60A5FA", icon:"↓" },
                { label:"Net Profit", value:fmt(netProfit), color:netProfit>=0?COLORS.accent:COLORS.danger, icon:"≈" },
              ].map((s,i) => (
                <div key={i} style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ color:COLORS.muted, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</span>
                    <span style={{ color:s.color }}>{s.icon}</span>
                  </div>
                  <div style={{ color:s.color, fontSize:22, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:24 }}>
                <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:600 }}>Recent Invoices</h3>
                {invoices.slice(-4).reverse().map(inv => (
                  <div key={inv.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:14, marginBottom:14, borderBottom:`1px solid ${COLORS.border}` }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>{inv.client}</div>
                      <div style={{ fontSize:12, color:COLORS.muted }}>{inv.description}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{fmt(inv.amount)}</div>
                      <StatusPill status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:24 }}>
                <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:600 }}>Upcoming Payments</h3>
                {upcoming.length===0 && <p style={{ color:COLORS.muted, fontSize:13 }}>No upcoming payments in 30 days.</p>}
                {upcoming.map(a => (
                  <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:14, marginBottom:14, borderBottom:`1px solid ${COLORS.border}` }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>{a.label}</div>
                      <div style={{ fontSize:12, color:a.days<=3?COLORS.danger:a.days<=7?COLORS.warning:COLORS.muted }}>
                        {a.days<=0?"Due today!":`Due in ${a.days} day${a.days===1?"":"s"}`}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{fmt(a.amount)}</div>
                      <Badge type={a.type} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:24, marginTop:24 }}>
              <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:600 }}>Spending by Category</h3>
              <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
                {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt]) => (
                  <div key={cat} style={{ flex:"1 1 180px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:13, color:COLORS.textDim }}>{cat}</span>
                      <span style={{ fontSize:13, fontWeight:600 }}>{fmt(amt)}</span>
                    </div>
                    <div style={{ background:COLORS.border, borderRadius:4, height:6 }}>
                      <div style={{ width:`${Math.round(amt/totalExp*100)}%`, height:"100%", background:COLORS.accent, borderRadius:4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INVOICES */}
        {tab==="invoices" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, margin:"0 0 4px" }}>Invoices</h1>
                <p style={{ color:COLORS.muted, fontSize:14, margin:0 }}>{fInvoices.length} invoices · {fmt(fInvoices.reduce((s,i)=>s+i.amount,0))} total</p>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Btn onClick={() => setModal("invoice")}>+ New Invoice</Btn>
                <Btn variant="secondary" onClick={() => exportCSV("invoices",invoices,expenses)} style={{ fontSize:13 }}>⬇ CSV</Btn>
              </div>
            </div>
            {profile.name==="Your Name" && (
              <div style={{ background:"#2a1e0a", border:`1px solid ${COLORS.warning}55`, borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ color:COLORS.warning }}>⚠ Set up your profile so your name appears on PDF invoices.</span>
                <button onClick={() => { setEditPro(profile); setModal("profile"); }} style={{ marginLeft:"auto", background:COLORS.warning, color:"#000", border:"none", borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Set up →</button>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {fInvoices.map(inv => (
                <div key={inv.id} style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"18px 22px", display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <span style={{ fontSize:15, fontWeight:700 }}>{inv.client}</span>
                      <Badge type={inv.type} /><StatusPill status={inv.status} />
                    </div>
                    <div style={{ fontSize:13, color:COLORS.muted }}>{inv.description} · Due {fmtDate(inv.dueDate)}</div>
                  </div>
                  <div style={{ fontSize:20, fontWeight:700, minWidth:100, textAlign:"right" }}>{fmt(inv.amount)}</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn variant="secondary" onClick={() => generatePDF(inv,profile)} style={{ padding:"7px 14px", fontSize:12, color:COLORS.accent }}>🧾 PDF</Btn>
                    {inv.status!=="paid" && <Btn onClick={() => setInvoices(p=>p.map(x=>x.id===inv.id?{...x,status:"paid"}:x))} style={{ padding:"7px 14px", fontSize:12 }}>Mark Paid</Btn>}
                    <Btn variant="secondary" onClick={() => setInvoices(p=>p.filter(x=>x.id!==inv.id))} style={{ padding:"7px 12px", fontSize:12, color:COLORS.danger }}>✕</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPENSES */}
        {tab==="expenses" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
              <div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, margin:"0 0 4px" }}>Expenses</h1>
                <p style={{ color:COLORS.muted, fontSize:14, margin:0 }}>{fExpenses.length} entries · {fmt(fExpenses.reduce((s,e)=>s+e.amount,0))} total</p>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Btn onClick={() => setModal("expense")}>+ Add Expense</Btn>
                <Btn variant="secondary" onClick={() => exportCSV("expenses",invoices,expenses)} style={{ fontSize:13 }}>⬇ CSV</Btn>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[...fExpenses].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(exp => (
                <div key={exp.id} style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"14px 20px", display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:14, fontWeight:600 }}>{exp.name}</span><Badge type={exp.type} />
                    </div>
                    <div style={{ fontSize:12, color:COLORS.muted }}>{exp.category} · {fmtDate(exp.date)}</div>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:COLORS.danger }}>{fmt(exp.amount)}</div>
                  <Btn variant="secondary" onClick={() => setExpenses(p=>p.filter(x=>x.id!==exp.id))} style={{ padding:"6px 10px", fontSize:12, color:COLORS.muted }}>✕</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALERTS */}
        {tab==="alerts" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
              <div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, margin:"0 0 4px" }}>Payment Alerts</h1>
                <p style={{ color:COLORS.muted, fontSize:14, margin:0 }}>Never miss a due date</p>
              </div>
              <Btn onClick={() => setModal("alert")}>+ Add Alert</Btn>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[...alerts].sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).map(a => {
                const days = daysUntil(a.dueDate);
                const urg = days<=3?COLORS.danger:days<=7?COLORS.warning:COLORS.textDim;
                return (
                  <div key={a.id} style={{ background:COLORS.card, borderRadius:12, padding:"18px 22px", border:`1px solid ${days<=7?urg+"44":COLORS.border}`, display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ width:48, height:48, borderRadius:10, background:urg+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20 }}>
                      {days<=0?"🔴":days<=3?"🔥":days<=7?"⚠️":"📅"}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:15, fontWeight:600 }}>{a.label}</span><Badge type={a.type} />
                      </div>
                      <div style={{ fontSize:13, color:urg, fontWeight:500 }}>
                        {days<=0?"Due today!":days===1?"Due tomorrow!":`Due in ${days} days — ${fmtDate(a.dueDate)}`}
                      </div>
                    </div>
                    <div style={{ fontSize:18, fontWeight:700, minWidth:80, textAlign:"right" }}>{a.amount>0?fmt(a.amount):"—"}</div>
                    <Btn variant="secondary" onClick={() => setAlerts(p=>p.filter(x=>x.id!==a.id))} style={{ padding:"7px 12px", fontSize:12, color:COLORS.muted }}>Dismiss</Btn>
                  </div>
                );
              })}
              {alerts.length===0 && <div style={{ textAlign:"center", padding:60, color:COLORS.muted }}><div style={{ fontSize:40, marginBottom:12 }}>✓</div><p>No alerts set.</p></div>}
            </div>
          </div>
        )}

        {/* CHARTS */}
        {tab==="charts" && (() => {
          const months = Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(5-i));return{key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString("en-US",{month:"short",year:"2-digit"})};});
          const mInc = months.map(m=>invoices.filter(i=>i.status==="paid"&&i.dueDate?.startsWith(m.key)).reduce((s,i)=>s+i.amount,0));
          const mExp = months.map(m=>expenses.filter(e=>e.date?.startsWith(m.key)).reduce((s,e)=>s+e.amount,0));
          const mNet = months.map((_,i)=>mInc[i]-mExp[i]);
          const maxV = Math.max(...mInc,...mExp,1);
          const H=180,bW=28,gW=bW*2+12,tW=months.length*(gW+24);
          const catD = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
          const totCat = catD.reduce((s,[,v])=>s+v,0);
          const PIE = ["#4ADE80","#60A5FA","#FBBF24","#F87171","#C084FC","#34D399"];
          const p2c=(cx,cy,r,deg)=>{const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};};
          const arc=(cx,cy,r,s,e)=>{const sp=p2c(cx,cy,r,s),ep=p2c(cx,cy,r,e),l=e-s>180?1:0;return `M ${cx} ${cy} L ${sp.x} ${sp.y} A ${r} ${r} 0 ${l} 1 ${ep.x} ${ep.y} Z`;};
          let cur=0;
          const slices=catD.map(([cat,amt],i)=>{const pct=amt/totCat,s=cur*360;cur+=pct;return{cat,amt,pct,s,e:cur*360,color:PIE[i%PIE.length]};});
          return (
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, margin:"0 0 6px" }}>Trends & Insights</h1>
              <p style={{ color:COLORS.muted, fontSize:14, marginBottom:32 }}>Last 6 months at a glance.</p>
              <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:28, marginBottom:24 }}>
                <h3 style={{ margin:"0 0 4px", fontSize:15, fontWeight:600 }}>Income vs Expenses</h3>
                <p style={{ color:COLORS.muted, fontSize:12, margin:"0 0 24px" }}>Paid invoices vs logged expenses</p>
                <div style={{ overflowX:"auto" }}>
                  <svg width={tW+60} height={H+50}>
                    {[0,0.25,0.5,0.75,1].map((p,i)=>{const y=H-p*H;return(<g key={i}><line x1={40} y1={y} x2={tW+60} y2={y} stroke={COLORS.border} strokeWidth={1}/><text x={36} y={y+4} fontSize={10} fill={COLORS.muted} textAnchor="end">{fmt(p*maxV)}</text></g>);})}
                    {months.map((m,i)=>{const x=i*(gW+24)+48;const iH=(mInc[i]/maxV)*H;const eH=(mExp[i]/maxV)*H;return(<g key={m.key}><rect x={x} y={H-iH} width={bW} height={iH} fill={COLORS.accent} rx={4} opacity={0.9}/><rect x={x+bW+4} y={H-eH} width={bW} height={eH} fill={COLORS.danger} rx={4} opacity={0.8}/><text x={x+bW} y={H+18} textAnchor="middle" fontSize={11} fill={COLORS.muted}>{m.label}</text></g>);})}
                    <polyline points={months.map((_,i)=>`${i*(gW+24)+48+bW},${H-(Math.max(0,mNet[i])/maxV)*H}`).join(" ")} fill="none" stroke={COLORS.warning} strokeWidth={2} strokeDasharray="4 2"/>
                  </svg>
                </div>
                <div style={{ display:"flex", gap:20, marginTop:8 }}>
                  {[{c:COLORS.accent,l:"Income"},{c:COLORS.danger,l:"Expenses"},{c:COLORS.warning,l:"Net profit"}].map(x=>(
                    <div key={x.l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:12, height:12, borderRadius:2, background:x.c }}/>
                      <span style={{ fontSize:12, color:COLORS.muted }}>{x.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:24 }}>
                  <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:600 }}>Monthly Summary</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr" }}>
                    {["Month","Income","Expenses","Net"].map(h=><div key={h} style={{ fontSize:11, fontWeight:700, color:COLORS.muted, textTransform:"uppercase", letterSpacing:"0.06em", paddingBottom:10, borderBottom:`1px solid ${COLORS.border}` }}>{h}</div>)}
                    {months.map((m,i)=>[
                      <div key={m.key+"l"} style={{ fontSize:13, color:COLORS.textDim, padding:"10px 0", borderBottom:`1px solid ${COLORS.border}` }}>{m.label}</div>,
                      <div key={m.key+"i"} style={{ fontSize:13, color:COLORS.accent, padding:"10px 0", borderBottom:`1px solid ${COLORS.border}`, fontWeight:600 }}>{mInc[i]>0?fmt(mInc[i]):"—"}</div>,
                      <div key={m.key+"e"} style={{ fontSize:13, color:COLORS.danger, padding:"10px 0", borderBottom:`1px solid ${COLORS.border}`, fontWeight:600 }}>{mExp[i]>0?fmt(mExp[i]):"—"}</div>,
                      <div key={m.key+"p"} style={{ fontSize:13, color:mNet[i]>=0?COLORS.accent:COLORS.danger, padding:"10px 0", borderBottom:`1px solid ${COLORS.border}`, fontWeight:700 }}>{fmt(mNet[i])}</div>,
                    ])}
                  </div>
                </div>
                <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:24 }}>
                  <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:600 }}>Expense Breakdown</h3>
                  {totCat===0 ? <p style={{ color:COLORS.muted, fontSize:13 }}>No expenses logged yet.</p> : (
                    <div style={{ display:"flex", alignItems:"center", gap:24 }}>
                      <svg width={140} height={140} style={{ flexShrink:0 }}>
                        {slices.map((sl,i)=><path key={i} d={arc(70,70,60,sl.s,sl.e)} fill={sl.color} stroke={COLORS.card} strokeWidth={2}/>)}
                        <circle cx={70} cy={70} r={32} fill={COLORS.card}/>
                        <text x={70} y={68} textAnchor="middle" fontSize={11} fill={COLORS.muted}>Total</text>
                        <text x={70} y={83} textAnchor="middle" fontSize={12} fill={COLORS.text} fontWeight="bold">{fmt(totCat)}</text>
                      </svg>
                      <div style={{ flex:1 }}>
                        {slices.map((sl,i)=>(
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                            <div style={{ width:10, height:10, borderRadius:2, background:sl.color, flexShrink:0 }}/>
                            <div>
                              <div style={{ fontSize:13, fontWeight:500 }}>{sl.cat}</div>
                              <div style={{ fontSize:11, color:COLORS.muted }}>{Math.round(sl.pct*100)}% · {fmt(sl.amt)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Modals ── */}
      {modal==="invoice" && (
        <Modal title="New Invoice" onClose={closeModal}>
          <TextInput label="Client Name" value={newInv.client} onChange={e=>setNewInv({...newInv,client:e.target.value})} placeholder="e.g. Acme Corp"/>
          <TextInput label="Amount ($)" type="number" value={newInv.amount} onChange={e=>setNewInv({...newInv,amount:e.target.value})} placeholder="0.00"/>
          <TextInput label="Description" value={newInv.description} onChange={e=>setNewInv({...newInv,description:e.target.value})} placeholder="e.g. Web redesign Q2"/>
          <TextInput label="Due Date" type="date" value={newInv.dueDate} onChange={e=>setNewInv({...newInv,dueDate:e.target.value})}/>
          <SelectInput label="Type" value={newInv.type} onChange={e=>setNewInv({...newInv,type:e.target.value})}>
            <option value="business">Business</option><option value="personal">Personal</option>
          </SelectInput>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={addInvoice}>Add Invoice</Btn>
          </div>
        </Modal>
      )}

      {modal==="expense" && (
        <Modal title="Add Expense" onClose={closeModal}>
          <TextInput label="Expense Name" value={newExp.name} onChange={e=>setNewExp({...newExp,name:e.target.value})} placeholder="e.g. Figma Pro"/>
          <TextInput label="Amount ($)" type="number" value={newExp.amount} onChange={e=>setNewExp({...newExp,amount:e.target.value})} placeholder="0.00"/>
          <TextInput label="Category" value={newExp.category} onChange={e=>setNewExp({...newExp,category:e.target.value})} placeholder="e.g. Software, Meals"/>
          <TextInput label="Date" type="date" value={newExp.date} onChange={e=>setNewExp({...newExp,date:e.target.value})}/>
          <SelectInput label="Type" value={newExp.type} onChange={e=>setNewExp({...newExp,type:e.target.value})}>
            <option value="business">Business</option><option value="personal">Personal</option>
          </SelectInput>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={addExpense}>Add Expense</Btn>
          </div>
        </Modal>
      )}

      {modal==="alert" && (
        <Modal title="New Payment Alert" onClose={closeModal}>
          <TextInput label="Label" value={newAlr.label} onChange={e=>setNewAlr({...newAlr,label:e.target.value})} placeholder="e.g. Rent, Subscription"/>
          <TextInput label="Amount ($) — optional" type="number" value={newAlr.amount} onChange={e=>setNewAlr({...newAlr,amount:e.target.value})} placeholder="0.00"/>
          <TextInput label="Due Date" type="date" value={newAlr.dueDate} onChange={e=>setNewAlr({...newAlr,dueDate:e.target.value})}/>
          <SelectInput label="Type" value={newAlr.type} onChange={e=>setNewAlr({...newAlr,type:e.target.value})}>
            <option value="personal">Personal</option><option value="business">Business</option>
          </SelectInput>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={addAlert}>Set Alert</Btn>
          </div>
        </Modal>
      )}

      {modal==="profile" && (
        <Modal title="My Profile" onClose={closeModal} wide>
          <p style={{ color:COLORS.muted, fontSize:13, marginBottom:20, marginTop:-8 }}>This info appears on your PDF invoices.</p>
          <TextInput label="Full Name / Business Name" value={editPro.name} onChange={e=>setEditPro({...editPro,name:e.target.value})} placeholder="e.g. Jane Doe"/>
          <TextInput label="Email" value={editPro.email} onChange={e=>setEditPro({...editPro,email:e.target.value})} placeholder="e.g. jane@email.com"/>
          <TextInput label="Phone (optional)" value={editPro.phone} onChange={e=>setEditPro({...editPro,phone:e.target.value})} placeholder="e.g. +1 555 000 1234"/>
          <TextInput label="Address" value={editPro.address} onChange={e=>setEditPro({...editPro,address:e.target.value})} placeholder="e.g. New York, NY 10001"/>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={saveProfile}>Save Profile</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
