import { useState, useEffect } from "react";

const C = {
  bg: "#0D0F14", surface: "#161921", card: "#1C2030", border: "#252A3A",
  accent: "#4ADE80", accentDim: "#1a3d2b", warning: "#FBBF24",
  danger: "#F87171", muted: "#6B7280", text: "#F1F5F9", textDim: "#94A3B8",
};

const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
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

// ── useIsMobile hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ── Small components ──────────────────────────────────────────────────────────
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
    <button onClick={onClick} style={{
      padding: "11px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
      cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
      background: variant === "primary" ? C.accent : C.border,
      color: variant === "primary" ? "#0D0F14" : C.textDim,
      minHeight: 44, ...style }}>
      {children}
    </button>
  );
}

function TextInput({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", color: C.textDim, fontSize: 12, fontWeight: 600,
        marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
      <input {...props} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "12px", color: C.text, fontSize: 16,
        outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }} />
    </div>
  );
}

function SelectInput({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", color: C.textDim, fontSize: 12, fontWeight: 600,
        marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
      <select {...props} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "12px", color: C.text, fontSize: 16,
        outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div onMouseDown={onClose} style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.85)", display: "flex",
      alignItems: "flex-end", justifyContent: "center",
      zIndex: 99999, padding: 0 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "20px 20px 0 0",
        padding: "24px 20px 36px",
        width: "100%", maxWidth: wide ? 560 : 480,
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 -20px 60px rgba(0,0,0,0.5)" }}>
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: C.text, fontSize: 18, fontFamily: "'Playfair Display', serif", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: C.border, border: "none", color: C.text,
            cursor: "pointer", fontSize: 14, fontWeight: 700,
            width: 36, height: 36, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function generatePDF(inv, profile) {
  const num = `INV-${String(inv.id).slice(-5).padStart(5,"0")}`;
  const m = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
  const d = (v) => v ? new Date(v).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "—";
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
    <div><div class="lbl">Date</div><div class="val" style="font-size:13px">${d(new Date().toISOString())}</div></div>
    <div><div class="lbl">Due</div><div class="val" style="font-size:13px">${d(inv.dueDate)}</div></div>
    <div><div class="lbl">Status</div><div class="val" style="font-size:13px;color:${inv.status==="paid"?"#16a34a":inv.status==="overdue"?"#dc2626":"#d97706"}">${inv.status.charAt(0).toUpperCase()+inv.status.slice(1)}</div></div>
  </div>
  <table><thead><tr><th style="width:60%">Description</th><th>Type</th><th>Amount</th></tr></thead>
  <tbody><tr><td>${inv.description||"Services rendered"}</td><td style="color:#6B7280">${inv.type}</td><td>${m(inv.amount)}</td></tr></tbody></table>
  <div class="total"><div class="tbox"><div class="tlbl">Total Due</div><div class="tamt">${m(inv.amount)}</div></div></div>
  <div class="foot">Thank you for your business · Generated by Ledgr</div></body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close();
}

function exportCSV(type, invoices, expenses) {
  let rows, filename;
  if (type === "invoices") {
    rows = [["Invoice #","Client","Description","Amount","Status","Due Date","Type"],
      ...invoices.map(i => [`INV-${String(i.id).slice(-5).padStart(5,"0")}`,i.client,i.description,i.amount,i.status,i.dueDate,i.type])];
    filename = "ledgr-invoices.csv";
  } else {
    rows = [["Name","Amount","Category","Date","Type"], ...expenses.map(e=>[e.name,e.amount,e.category,e.date,e.type])];
    filename = "ledgr-expenses.csv";
  }
  const csv = rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:filename});
  a.click();
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  const [invoices, setInvoices] = useState(() => load("ledgr_inv", INVOICES0));
  const [expenses, setExpenses] = useState(() => load("ledgr_exp", EXPENSES0));
  const [alerts, setAlerts]     = useState(() => load("ledgr_alr", ALERTS0));
  const [profile, setProfile]   = useState(() => load("ledgr_pro", PROFILE0));
  const [modal, setModal]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = () => setModal(null);

  const [newInv, setNewInv] = useState({ client:"", amount:"", dueDate:"", type:"business", description:"", status:"pending" });
  const [newExp, setNewExp] = useState({ name:"", amount:"", category:"", date:"", type:"business" });
  const [newAlr, setNewAlr] = useState({ label:"", amount:"", dueDate:"", type:"personal" });
  const [editPro, setEditPro] = useState(profile);

  useEffect(() => persist("ledgr_inv", invoices), [invoices]);
  useEffect(() => persist("ledgr_exp", expenses), [expenses]);
  useEffect(() => persist("ledgr_alr", alerts), [alerts]);
  useEffect(() => persist("ledgr_pro", profile), [profile]);

  const fInvoices = filter==="all" ? invoices : invoices.filter(i=>i.type===filter);
  const fExpenses = filter==="all" ? expenses : expenses.filter(e=>e.type===filter);
  const upcoming  = alerts.map(a=>({...a,days:daysUntil(a.dueDate)})).filter(a=>a.days<=30).sort((a,b)=>a.days-b.days);
  const totalIncome  = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0);
  const totalPending = invoices.filter(i=>i.status==="pending").reduce((s,i)=>s+i.amount,0);
  const totalOverdue = invoices.filter(i=>i.status==="overdue").reduce((s,i)=>s+i.amount,0);
  const totalExp     = expenses.reduce((s,e)=>s+e.amount,0);
  const netProfit    = totalIncome - expenses.filter(e=>e.type==="business").reduce((s,e)=>s+e.amount,0);
  const byCat        = expenses.reduce((a,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a;},{});

  const addInvoice = () => { if(!newInv.client||!newInv.amount) return; setInvoices(p=>[...p,{...newInv,id:Date.now(),amount:parseFloat(newInv.amount)}]); setNewInv({client:"",amount:"",dueDate:"",type:"business",description:"",status:"pending"}); close(); };
  const addExpense = () => { if(!newExp.name||!newExp.amount) return; setExpenses(p=>[...p,{...newExp,id:Date.now(),amount:parseFloat(newExp.amount)}]); setNewExp({name:"",amount:"",category:"",date:"",type:"business"}); close(); };
  const addAlert   = () => { if(!newAlr.label||!newAlr.dueDate) return; setAlerts(p=>[...p,{...newAlr,id:Date.now(),amount:parseFloat(newAlr.amount)||0}]); setNewAlr({label:"",amount:"",dueDate:"",type:"personal"}); close(); };
  const saveProfile = () => { setProfile(editPro); close(); };

  const TABS = [
    { id:"dashboard", icon:"⊞", label:"Dashboard" },
    { id:"invoices",  icon:"◈", label:"Invoices" },
    { id:"expenses",  icon:"◉", label:"Expenses" },
    { id:"alerts",    icon:"◐", label:"Alerts" },
    { id:"charts",    icon:"◫", label:"Charts" },
  ];

  const goTab = (id) => { setTab(id); setSidebarOpen(false); };

  // ── Sidebar (desktop) / Drawer (mobile) ────────────────────────────────────
  const SidebarContent = () => (
    <>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
          <div style={{ width:32, height:32, background:C.accent, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>Ledgr</span>
          {isMobile && <button onClick={()=>setSidebarOpen(false)} style={{ marginLeft:"auto", background:C.border, border:"none", color:C.text, borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>}
        </div>
        <p style={{ color:C.muted, fontSize:11, margin:0, paddingLeft:42 }}>Personal & Business</p>
      </div>
      <nav style={{ flex:1 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>goTab(t.id)} style={{
            display:"flex", alignItems:"center", gap:10, width:"100%",
            padding:"12px", borderRadius:8, border:"none", cursor:"pointer",
            background: tab===t.id ? C.accentDim : "transparent",
            color: tab===t.id ? C.accent : C.textDim,
            fontSize:14, fontWeight: tab===t.id?600:400,
            marginBottom:4, textAlign:"left", fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ fontSize:16 }}>{t.icon}</span>
            {t.label}
            {t.id==="alerts" && upcoming.length>0 &&
              <span style={{ marginLeft:"auto", background:C.warning, color:"#000", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>{upcoming.length}</span>}
          </button>
        ))}
      </nav>
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16, marginTop:16 }}>
        <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>View</p>
        {["all","business","personal"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            display:"block", width:"100%", padding:"8px 12px", borderRadius:6,
            border:"none", cursor:"pointer", textAlign:"left",
            background: filter===f ? C.border : "transparent",
            color: filter===f ? C.text : C.muted,
            fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:2 }}>
            {f==="all"?"All finances":f==="business"?"💼 Business":"🏠 Personal"}
          </button>
        ))}
      </div>
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16, marginTop:16 }}>
        <button onClick={()=>{setEditPro(profile);setModal("profile");setSidebarOpen(false);}} style={{ display:"block", width:"100%", padding:"8px 12px", borderRadius:6, border:"none", cursor:"pointer", textAlign:"left", background:"transparent", color:C.textDim, fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>👤 My Profile</button>
        <button onClick={()=>{if(window.confirm("Reset to demo data?")){setInvoices(INVOICES0);setExpenses(EXPENSES0);setAlerts(ALERTS0);}}} style={{ display:"block", width:"100%", padding:"8px 12px", borderRadius:6, border:"none", cursor:"pointer", textAlign:"left", background:"transparent", color:C.muted, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>↺ Reset demo data</button>
      </div>
    </>
  );

  // ── Main content by tab ────────────────────────────────────────────────────
  const stats = [
    { label:"Collected", value:money(totalIncome), color:C.accent, icon:"↑" },
    { label:"Pending", value:money(totalPending), color:C.warning, icon:"⏳" },
    { label:"Overdue", value:money(totalOverdue), color:C.danger, icon:"!" },
    { label:"Expenses", value:money(totalExp), color:"#60A5FA", icon:"↓" },
    { label:"Net Profit", value:money(netProfit), color:netProfit>=0?C.accent:C.danger, icon:"≈" },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, minHeight:"100vh", color:C.text, display:"flex", flexDirection:"column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      <div style={{ display:"flex", flex:1, minHeight:0 }}>

        {/* ── Desktop Sidebar ── */}
        {!isMobile && (
          <div style={{ width:220, background:C.surface, borderRight:`1px solid ${C.border}`, padding:"28px 16px", display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>
            <SidebarContent />
          </div>
        )}

        {/* ── Mobile Drawer overlay ── */}
        {isMobile && sidebarOpen && (
          <div onMouseDown={()=>setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9998 }}>
            <div onMouseDown={e=>e.stopPropagation()} style={{ width:260, height:"100%", background:C.surface, borderRight:`1px solid ${C.border}`, padding:"28px 16px", display:"flex", flexDirection:"column", overflowY:"auto" }}>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* ── Main ── */}
        <div style={{ flex:1, overflowY:"auto", paddingBottom: isMobile ? 80 : 0 }}>

          {/* Mobile top bar */}
          {isMobile && (
            <div style={{ position:"sticky", top:0, zIndex:100, background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={()=>setSidebarOpen(true)} style={{ background:C.border, border:"none", color:C.text, borderRadius:8, width:40, height:40, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>☰</button>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>Ledgr</span>
              <span style={{ marginLeft:"auto", color:C.muted, fontSize:13 }}>{TABS.find(t=>t.id===tab)?.label}</span>
            </div>
          )}

          <div style={{ padding: isMobile ? "16px" : "32px 36px" }}>

            {/* DASHBOARD */}
            {tab==="dashboard" && (
              <div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile?22:28, margin:"0 0 4px" }}>Financial Overview</h1>
                <p style={{ color:C.muted, fontSize:14, marginBottom:24 }}>Your money, all in one place.</p>

                {/* Stats grid — 2 cols mobile, 5 cols desktop */}
                <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(5,1fr)", gap:12, marginBottom:24 }}>
                  {stats.map((s,i) => (
                    <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ color:C.muted, fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</span>
                        <span style={{ color:s.color, fontSize:14 }}>{s.icon}</span>
                      </div>
                      <div style={{ color:s.color, fontSize: isMobile?16:20, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Recent invoices */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
                  <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:600 }}>Recent Invoices</h3>
                  {invoices.slice(-4).reverse().map(inv=>(
                    <div key={inv.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:12, marginBottom:12, borderBottom:`1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600 }}>{inv.client}</div>
                        <div style={{ fontSize:12, color:C.muted }}>{inv.description}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:14, fontWeight:700 }}>{money(inv.amount)}</div>
                        <StatusPill status={inv.status}/>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upcoming payments */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
                  <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:600 }}>Upcoming Payments</h3>
                  {upcoming.length===0 && <p style={{ color:C.muted, fontSize:13 }}>No payments due in 30 days.</p>}
                  {upcoming.map(a=>(
                    <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:12, marginBottom:12, borderBottom:`1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600 }}>{a.label}</div>
                        <div style={{ fontSize:12, color:a.days<=3?C.danger:a.days<=7?C.warning:C.muted }}>{a.days<=0?"Due today!":`Due in ${a.days} days`}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:14, fontWeight:700 }}>{money(a.amount)}</div>
                        <Badge type={a.type}/>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Spending breakdown */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
                  <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:600 }}>Spending by Category</h3>
                  {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
                    <div key={cat} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:13, color:C.textDim }}>{cat}</span>
                        <span style={{ fontSize:13, fontWeight:600 }}>{money(amt)}</span>
                      </div>
                      <div style={{ background:C.border, borderRadius:4, height:5 }}>
                        <div style={{ width:`${Math.round(amt/totalExp*100)}%`, height:"100%", background:C.accent, borderRadius:4 }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INVOICES */}
            {tab==="invoices" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, gap:12 }}>
                  <div>
                    <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, margin:"0 0 4px" }}>Invoices</h1>
                    <p style={{ color:C.muted, fontSize:13, margin:0 }}>{fInvoices.length} invoices</p>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <Btn onClick={()=>setModal("invoice")} style={{ padding:"10px 14px", fontSize:13 }}>+ New</Btn>
                    <Btn variant="secondary" onClick={()=>exportCSV("invoices",invoices,expenses)} style={{ padding:"10px 14px", fontSize:13 }}>⬇ CSV</Btn>
                  </div>
                </div>
                {profile.name==="Your Name" && (
                  <div style={{ background:"#2a1e0a", border:`1px solid ${C.warning}55`, borderRadius:10, padding:"12px 14px", marginBottom:16, fontSize:13, color:C.warning }}>
                    ⚠ <button onClick={()=>{setEditPro(profile);setModal("profile");}} style={{ background:"none", border:"none", color:C.warning, textDecoration:"underline", cursor:"pointer", fontSize:13, padding:0 }}>Set up your profile</button> so your name appears on PDF invoices.
                  </div>
                )}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {fInvoices.map(inv=>(
                    <div key={inv.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div>
                          <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{inv.client}</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}><Badge type={inv.type}/><StatusPill status={inv.status}/></div>
                        </div>
                        <div style={{ fontSize:18, fontWeight:700 }}>{money(inv.amount)}</div>
                      </div>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>{inv.description} · Due {fmtDate(inv.dueDate)}</div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <Btn variant="secondary" onClick={()=>generatePDF(inv,profile)} style={{ padding:"8px 12px", fontSize:12, color:C.accent, flex:1 }}>🧾 PDF</Btn>
                        {inv.status!=="paid" && <Btn onClick={()=>setInvoices(p=>p.map(x=>x.id===inv.id?{...x,status:"paid"}:x))} style={{ padding:"8px 12px", fontSize:12, flex:1 }}>Mark Paid</Btn>}
                        <Btn variant="secondary" onClick={()=>setInvoices(p=>p.filter(x=>x.id!==inv.id))} style={{ padding:"8px 12px", fontSize:12, color:C.danger }}>✕</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXPENSES */}
            {tab==="expenses" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, gap:12 }}>
                  <div>
                    <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, margin:"0 0 4px" }}>Expenses</h1>
                    <p style={{ color:C.muted, fontSize:13, margin:0 }}>{fExpenses.length} entries · {money(fExpenses.reduce((s,e)=>s+e.amount,0))}</p>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <Btn onClick={()=>setModal("expense")} style={{ padding:"10px 14px", fontSize:13 }}>+ Add</Btn>
                    <Btn variant="secondary" onClick={()=>exportCSV("expenses",invoices,expenses)} style={{ padding:"10px 14px", fontSize:13 }}>⬇ CSV</Btn>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[...fExpenses].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(exp=>(
                    <div key={exp.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                          <span style={{ fontSize:14, fontWeight:600 }}>{exp.name}</span><Badge type={exp.type}/>
                        </div>
                        <div style={{ fontSize:12, color:C.muted }}>{exp.category} · {fmtDate(exp.date)}</div>
                      </div>
                      <div style={{ fontSize:15, fontWeight:700, color:C.danger }}>{money(exp.amount)}</div>
                      <button onClick={()=>setExpenses(p=>p.filter(x=>x.id!==exp.id))} style={{ background:C.border, border:"none", color:C.muted, borderRadius:6, width:32, height:32, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ALERTS */}
            {tab==="alerts" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div>
                    <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, margin:"0 0 4px" }}>Alerts</h1>
                    <p style={{ color:C.muted, fontSize:13, margin:0 }}>Never miss a due date</p>
                  </div>
                  <Btn onClick={()=>setModal("alert")} style={{ padding:"10px 14px", fontSize:13 }}>+ Add</Btn>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[...alerts].sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).map(a=>{
                    const days=daysUntil(a.dueDate);
                    const urg=days<=3?C.danger:days<=7?C.warning:C.textDim;
                    return (
                      <div key={a.id} style={{ background:C.card, borderRadius:12, padding:"16px", border:`1px solid ${days<=7?urg+"44":C.border}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ width:44, height:44, borderRadius:10, background:urg+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20 }}>
                            {days<=0?"🔴":days<=3?"🔥":days<=7?"⚠️":"📅"}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                              <span style={{ fontSize:14, fontWeight:600 }}>{a.label}</span><Badge type={a.type}/>
                            </div>
                            <div style={{ fontSize:12, color:urg, fontWeight:500 }}>
                              {days<=0?"Due today!":days===1?"Due tomorrow!":`Due in ${days} days`}
                            </div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>{a.amount>0?money(a.amount):"—"}</div>
                            <button onClick={()=>setAlerts(p=>p.filter(x=>x.id!==a.id))} style={{ background:C.border, border:"none", color:C.muted, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:12 }}>Dismiss</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {alerts.length===0 && <div style={{ textAlign:"center", padding:60, color:C.muted }}><div style={{ fontSize:40, marginBottom:12 }}>✓</div><p>No alerts set.</p></div>}
                </div>
              </div>
            )}

            {/* CHARTS */}
            {tab==="charts" && (() => {
              const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(5-i));return{key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString("en-US",{month:"short",year:"2-digit"})};});
              const mInc=months.map(m=>invoices.filter(i=>i.status==="paid"&&i.dueDate?.startsWith(m.key)).reduce((s,i)=>s+i.amount,0));
              const mExp=months.map(m=>expenses.filter(e=>e.date?.startsWith(m.key)).reduce((s,e)=>s+e.amount,0));
              const mNet=months.map((_,i)=>mInc[i]-mExp[i]);
              const maxV=Math.max(...mInc,...mExp,1);
              const H=160,bW=isMobile?18:26,gW=bW*2+8,tW=months.length*(gW+isMobile?16:20)+50;
              const catD=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
              const totCat=catD.reduce((s,[,v])=>s+v,0);
              const PIE=["#4ADE80","#60A5FA","#FBBF24","#F87171","#C084FC","#34D399"];
              const p2c=(cx,cy,r,deg)=>{const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};};
              const arc=(cx,cy,r,s,e)=>{const sp=p2c(cx,cy,r,s),ep=p2c(cx,cy,r,e),l=e-s>180?1:0;return `M ${cx} ${cy} L ${sp.x} ${sp.y} A ${r} ${r} 0 ${l} 1 ${ep.x} ${ep.y} Z`;};
              let cur=0;
              const slices=catD.map(([cat,amt],i)=>{const pct=amt/totCat,s=cur*360;cur+=pct;return{cat,amt,pct,s,e:cur*360,color:PIE[i%PIE.length]};});
              return (
                <div>
                  <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, margin:"0 0 4px" }}>Trends</h1>
                  <p style={{ color:C.muted, fontSize:14, marginBottom:24 }}>Last 6 months</p>
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
                    <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:600 }}>Income vs Expenses</h3>
                    <div style={{ overflowX:"auto" }}>
                      <svg width={tW+60} height={H+50}>
                        {[0,0.5,1].map((p,i)=>{const y=H-p*H;return(<g key={i}><line x1={40} y1={y} x2={tW+60} y2={y} stroke={C.border} strokeWidth={1}/><text x={36} y={y+4} fontSize={9} fill={C.muted} textAnchor="end">{money(p*maxV)}</text></g>);})}
                        {months.map((m,i)=>{const x=i*(gW+(isMobile?16:20))+48;const iH=(mInc[i]/maxV)*H;const eH=(mExp[i]/maxV)*H;return(<g key={m.key}><rect x={x} y={H-iH} width={bW} height={iH} fill={C.accent} rx={3} opacity={0.9}/><rect x={x+bW+4} y={H-eH} width={bW} height={eH} fill={C.danger} rx={3} opacity={0.8}/><text x={x+bW} y={H+18} textAnchor="middle" fontSize={10} fill={C.muted}>{m.label}</text></g>);})}
                        <polyline points={months.map((_,i)=>`${i*(gW+(isMobile?16:20))+48+bW},${H-(Math.max(0,mNet[i])/maxV)*H}`).join(" ")} fill="none" stroke={C.warning} strokeWidth={2} strokeDasharray="4 2"/>
                      </svg>
                    </div>
                    <div style={{ display:"flex", gap:16, marginTop:8, flexWrap:"wrap" }}>
                      {[{c:C.accent,l:"Income"},{c:C.danger,l:"Expenses"},{c:C.warning,l:"Net"}].map(x=>(
                        <div key={x.l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ width:10, height:10, borderRadius:2, background:x.c }}/><span style={{ fontSize:12, color:C.muted }}>{x.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Monthly table */}
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16, overflowX:"auto" }}>
                    <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:600 }}>Monthly Summary</h3>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", minWidth:280 }}>
                      {["Month","Income","Exp.","Net"].map(h=><div key={h} style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>{h}</div>)}
                      {months.map((m,i)=>[
                        <div key={m.key+"l"} style={{ fontSize:12, color:C.textDim, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>{m.label}</div>,
                        <div key={m.key+"i"} style={{ fontSize:12, color:C.accent, padding:"8px 0", borderBottom:`1px solid ${C.border}`, fontWeight:600 }}>{mInc[i]>0?money(mInc[i]):"—"}</div>,
                        <div key={m.key+"e"} style={{ fontSize:12, color:C.danger, padding:"8px 0", borderBottom:`1px solid ${C.border}`, fontWeight:600 }}>{mExp[i]>0?money(mExp[i]):"—"}</div>,
                        <div key={m.key+"p"} style={{ fontSize:12, color:mNet[i]>=0?C.accent:C.danger, padding:"8px 0", borderBottom:`1px solid ${C.border}`, fontWeight:700 }}>{money(mNet[i])}</div>,
                      ])}
                    </div>
                  </div>
                  {/* Pie */}
                  {totCat>0 && (
                    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
                      <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:600 }}>Expense Breakdown</h3>
                      <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
                        <svg width={120} height={120} style={{ flexShrink:0 }}>
                          {slices.map((sl,i)=><path key={i} d={arc(60,60,52,sl.s,sl.e)} fill={sl.color} stroke={C.card} strokeWidth={2}/>)}
                          <circle cx={60} cy={60} r={28} fill={C.card}/>
                          <text x={60} y={58} textAnchor="middle" fontSize={9} fill={C.muted}>Total</text>
                          <text x={60} y={70} textAnchor="middle" fontSize={10} fill={C.text} fontWeight="bold">{money(totCat)}</text>
                        </svg>
                        <div style={{ flex:1, minWidth:160 }}>
                          {slices.map((sl,i)=>(
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                              <div style={{ width:10, height:10, borderRadius:2, background:sl.color, flexShrink:0 }}/>
                              <div>
                                <div style={{ fontSize:13, fontWeight:500 }}>{sl.cat}</div>
                                <div style={{ fontSize:11, color:C.muted }}>{Math.round(sl.pct*100)}% · {money(sl.amt)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      {isMobile && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:200, paddingBottom:"env(safe-area-inset-bottom)" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1, padding:"10px 4px 8px", border:"none", background:"transparent",
              color: tab===t.id ? C.accent : C.muted,
              cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
              <span style={{ fontSize:18 }}>{t.icon}</span>
              <span style={{ fontSize:9, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase" }}>{t.label}</span>
              {t.id==="alerts" && upcoming.length>0 && (
                <span style={{ position:"absolute", top:6, right:"50%", marginRight:-18, background:C.warning, color:"#000", fontSize:8, fontWeight:700, padding:"1px 4px", borderRadius:8 }}>{upcoming.length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {modal==="invoice" && (
        <Modal title="New Invoice" onClose={close}>
          <TextInput label="Client Name" value={newInv.client} onChange={e=>setNewInv({...newInv,client:e.target.value})} placeholder="e.g. Acme Corp"/>
          <TextInput label="Amount ($)" type="number" value={newInv.amount} onChange={e=>setNewInv({...newInv,amount:e.target.value})} placeholder="0.00"/>
          <TextInput label="Description" value={newInv.description} onChange={e=>setNewInv({...newInv,description:e.target.value})} placeholder="e.g. Web redesign Q2"/>
          <TextInput label="Due Date" type="date" value={newInv.dueDate} onChange={e=>setNewInv({...newInv,dueDate:e.target.value})}/>
          <SelectInput label="Type" value={newInv.type} onChange={e=>setNewInv({...newInv,type:e.target.value})}>
            <option value="business">Business</option><option value="personal">Personal</option>
          </SelectInput>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <Btn variant="secondary" onClick={close} style={{ flex:1 }}>Cancel</Btn>
            <Btn onClick={addInvoice} style={{ flex:1 }}>Add Invoice</Btn>
          </div>
        </Modal>
      )}
      {modal==="expense" && (
        <Modal title="Add Expense" onClose={close}>
          <TextInput label="Name" value={newExp.name} onChange={e=>setNewExp({...newExp,name:e.target.value})} placeholder="e.g. Figma Pro"/>
          <TextInput label="Amount ($)" type="number" value={newExp.amount} onChange={e=>setNewExp({...newExp,amount:e.target.value})} placeholder="0.00"/>
          <TextInput label="Category" value={newExp.category} onChange={e=>setNewExp({...newExp,category:e.target.value})} placeholder="e.g. Software, Meals"/>
          <TextInput label="Date" type="date" value={newExp.date} onChange={e=>setNewExp({...newExp,date:e.target.value})}/>
          <SelectInput label="Type" value={newExp.type} onChange={e=>setNewExp({...newExp,type:e.target.value})}>
            <option value="business">Business</option><option value="personal">Personal</option>
          </SelectInput>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <Btn variant="secondary" onClick={close} style={{ flex:1 }}>Cancel</Btn>
            <Btn onClick={addExpense} style={{ flex:1 }}>Add Expense</Btn>
          </div>
        </Modal>
      )}
      {modal==="alert" && (
        <Modal title="New Alert" onClose={close}>
          <TextInput label="Label" value={newAlr.label} onChange={e=>setNewAlr({...newAlr,label:e.target.value})} placeholder="e.g. Rent, Subscription"/>
          <TextInput label="Amount ($) — optional" type="number" value={newAlr.amount} onChange={e=>setNewAlr({...newAlr,amount:e.target.value})} placeholder="0.00"/>
          <TextInput label="Due Date" type="date" value={newAlr.dueDate} onChange={e=>setNewAlr({...newAlr,dueDate:e.target.value})}/>
          <SelectInput label="Type" value={newAlr.type} onChange={e=>setNewAlr({...newAlr,type:e.target.value})}>
            <option value="personal">Personal</option><option value="business">Business</option>
          </SelectInput>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <Btn variant="secondary" onClick={close} style={{ flex:1 }}>Cancel</Btn>
            <Btn onClick={addAlert} style={{ flex:1 }}>Set Alert</Btn>
          </div>
        </Modal>
      )}
      {modal==="profile" && (
        <Modal title="My Profile" onClose={close} wide>
          <p style={{ color:C.muted, fontSize:13, marginBottom:16, marginTop:-8 }}>This info appears on your PDF invoices.</p>
          <TextInput label="Full Name / Business Name" value={editPro.name} onChange={e=>setEditPro({...editPro,name:e.target.value})} placeholder="e.g. Jane Doe"/>
          <TextInput label="Email" value={editPro.email} onChange={e=>setEditPro({...editPro,email:e.target.value})} placeholder="e.g. jane@email.com"/>
          <TextInput label="Phone (optional)" value={editPro.phone} onChange={e=>setEditPro({...editPro,phone:e.target.value})} placeholder="e.g. +1 555 000 1234"/>
          <TextInput label="Address" value={editPro.address} onChange={e=>setEditPro({...editPro,address:e.target.value})} placeholder="e.g. New York, NY 10001"/>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <Btn variant="secondary" onClick={close} style={{ flex:1 }}>Cancel</Btn>
            <Btn onClick={saveProfile} style={{ flex:1 }}>Save Profile</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
