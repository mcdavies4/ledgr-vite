import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { startCheckout } from "./stripe";

const C = {
  bg: "#0D0F14", surface: "#161921", card: "#1C2030", border: "#252A3A",
  accent: "#4ADE80", accentDim: "#1a3d2b", warning: "#FBBF24",
  danger: "#F87171", muted: "#6B7280", text: "#F1F5F9", textDim: "#94A3B8",
};

const CURRENCIES = [
  { code:"USD", label:"USD - US Dollar", locale:"en-US" },
  { code:"EUR", label:"EUR - Euro", locale:"de-DE" },
  { code:"GBP", label:"GBP - British Pound", locale:"en-GB" },
  { code:"NGN", label:"NGN - Nigerian Naira", locale:"en-NG" },
  { code:"CAD", label:"CAD - Canadian Dollar", locale:"en-CA" },
  { code:"AUD", label:"AUD - Australian Dollar", locale:"en-AU" },
  { code:"ZAR", label:"ZAR - South African Rand", locale:"en-ZA" },
  { code:"GHS", label:"GHS - Ghanaian Cedi", locale:"en-GH" },
  { code:"KES", label:"KES - Kenyan Shilling", locale:"en-KE" },
  { code:"INR", label:"INR - Indian Rupee", locale:"en-IN" },
  { code:"JPY", label:"JPY - Japanese Yen", locale:"ja-JP" },
  { code:"CNY", label:"CNY - Chinese Yuan", locale:"zh-CN" },
  { code:"BRL", label:"BRL - Brazilian Real", locale:"pt-BR" },
  { code:"MXN", label:"MXN - Mexican Peso", locale:"es-MX" },
  { code:"AED", label:"AED - UAE Dirham", locale:"ar-AE" },
];

const getCurrency = () => {
  try { return localStorage.getItem("ledgr_currency") || "USD"; } catch { return "USD"; }
};
const setCurrencyStore = (c) => {
  try { localStorage.setItem("ledgr_currency", c); } catch {}
};
const getLocale = (code) => CURRENCIES.find(c=>c.code===code)?.locale || "en-US";
const money = (n, currencyCode) => {
  const code = currencyCode || getCurrency();
  return new Intl.NumberFormat(getLocale(code), { style: "currency", currency: code }).format(n);
};
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
function Badge({ type }) {
  return <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", padding:"2px 7px", borderRadius:4, background:type==="business"?"#1e2d4a":"#2a1e3a", color:type==="business"?"#60A5FA":"#C084FC", textTransform:"uppercase" }}>{type}</span>;
}
function StatusPill({ status }) {
  const map = { paid:["#1a3d2b","#4ADE80","Paid"], pending:["#3a2d1a","#FBBF24","Pending"], overdue:["#3a1a1a","#F87171","Overdue"] };
  const [bg,color,label] = map[status]||map.pending;
  return <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20, background:bg, color }}>{label}</span>;
}
function Btn({ children, onClick, variant="primary", style={}, disabled=false }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding:"11px 20px", borderRadius:8, fontSize:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer", border:"none", fontFamily:"'DM Sans',sans-serif", background:variant==="primary"?C.accent:variant==="danger"?"#3a1a1a":C.border, color:variant==="primary"?"#0D0F14":variant==="danger"?C.danger:C.textDim, minHeight:44, opacity:disabled?0.6:1, ...style }}>{children}</button>;
}
function TextInput({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block", color:C.textDim, fontSize:12, fontWeight:600, marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</label>}
      <input {...props} style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px", color:C.text, fontSize:16, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }} />
    </div>
  );
}
function SelectInput({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", color:C.textDim, fontSize:12, fontWeight:600, marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</label>
      <select {...props} style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px", color:C.text, fontSize:16, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }}>{children}</select>
    </div>
  );
}
function Modal({ title, onClose, children, wide=false, footer=null }) {
  const mobile = window.innerWidth < 768;
  // Inject global style for iOS scroll fix once
  if (!document.getElementById("modal-style")) {
    const s = document.createElement("style");
    s.id = "modal-style";
    s.textContent = `.modal-scroll { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; } .modal-scroll::-webkit-scrollbar { display: none; }`;
    document.head.appendChild(s);
  }
  return (
    <div
      onMouseDown={onClose}
      style={{
        position:"fixed", top:0, left:0, right:0, bottom:0,
        background:"rgba(0,0,0,0.85)",
        display:"flex",
        alignItems: mobile ? "flex-end" : "center",
        justifyContent:"center",
        zIndex:99999,
        padding: mobile ? 0 : "20px",
      }}
    >
      <div
        onMouseDown={e=>e.stopPropagation()}
        style={{
          background:C.card,
          border:`1px solid ${C.border}`,
          borderRadius: mobile ? "20px 20px 0 0" : "16px",
          width:"100%",
          maxWidth: wide ? 560 : 480,
          height: mobile ? "auto" : "auto",
          maxHeight: mobile ? "80vh" : "85vh",
          display:"flex",
          flexDirection:"column",
          boxShadow: mobile ? "0 -20px 60px rgba(0,0,0,0.6)" : "0 25px 60px rgba(0,0,0,0.6)",
          overflow:"hidden",
        }}
      >
        {/* Fixed header */}
        <div style={{ flexShrink:0, padding:"16px 20px 0", background:C.card }}>
          {mobile && <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 14px" }}/>}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>
            <h3 style={{ color:C.text, fontSize:18, fontFamily:"'Playfair Display',serif", margin:0 }}>{title}</h3>
            <button onClick={onClose} style={{ background:C.border, border:"none", color:C.text, cursor:"pointer", width:36, height:36, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16, fontWeight:700 }}>✕</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="modal-scroll"
          style={{ flex:1, overflowY:"scroll", padding:"16px 20px", minHeight:0 }}
        >
          {children}
        </div>

        {/* Fixed footer - always visible */}
        {footer && (
          <div style={{
            flexShrink:0,
            padding:"14px 20px",
            paddingBottom: mobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : "16px",
            borderTop:`1px solid ${C.border}`,
            background:C.card,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Paywall Screen ────────────────────────────────────────────────────────────
function PaywallScreen({ session, onSignOut }) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await startCheckout(session.user.id, session.user.email);
    } catch (e) {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{ width:"100%", maxWidth:440 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:52, height:52, background:C.accent, borderRadius:14, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"#0D0F14", marginBottom:16 }}>L</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.text, margin:"0 0 8px" }}>Ledgr Pro</h1>
          <p style={{ color:C.muted, fontSize:15, margin:0 }}>Your free trial has ended.</p>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, overflow:"hidden", marginBottom:16 }}>
          {/* Price header */}
          <div style={{ background:C.accentDim, borderBottom:`1px solid ${C.border}`, padding:"28px 32px", textAlign:"center" }}>
            <div style={{ color:C.accent, fontSize:42, fontWeight:700, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>$15</div>
            <div style={{ color:C.textDim, fontSize:14, marginTop:4 }}>per month · cancel anytime</div>
          </div>

          {/* Features */}
          <div style={{ padding:"24px 32px" }}>
            {[
              "Unlimited invoices & PDF export",
              "Expense tracking & CSV export",
              "Payment alerts & reminders",
              "Monthly trend charts",
              "Business & personal views",
              "Syncs across all your devices",
            ].map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:C.accentDim, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ color:C.accent, fontSize:11, fontWeight:700 }}>✓</span>
                </div>
                <span style={{ fontSize:14, color:C.textDim }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ padding:"0 32px 28px" }}>
            <Btn onClick={handleSubscribe} disabled={loading} style={{ width:"100%", fontSize:15, padding:"14px" }}>
              {loading ? "Redirecting to Stripe..." : "Subscribe for $15/mo"}
            </Btn>
            <p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:12, marginBottom:0 }}>
              Secured by Stripe · No hidden fees
            </p>
          </div>
        </div>

        <div style={{ textAlign:"center" }}>
          <button onClick={onSignOut} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
            Sign out ({session.user.email})
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trial Banner ──────────────────────────────────────────────────────────────
function TrialBanner({ profile, session }) {
  const [loading, setLoading] = useState(false);
  if (!profile?.trial_ends_at) return null;
  const status = profile?.subscription_status;
  if (status === "active" || status === "past_due") return null;
  const days = daysUntil(profile.trial_ends_at);
  if (days <= 0) return null;

  const urgent = days <= 3;

  const handleUpgrade = async () => {
    setLoading(true);
    try { await startCheckout(session.user.id, session.user.email); }
    catch { setLoading(false); }
  };

  return (
    <div style={{ background: urgent ? "#3a1a0a" : "#1a2a1a", borderBottom:`1px solid ${urgent ? C.danger+"44" : C.accent+"44"}`, padding:"10px 20px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
      <span style={{ fontSize:13, color: urgent ? C.danger : C.accent, fontWeight:500 }}>
        {urgent ? "⚠️" : "⏳"} {days} day{days===1?"":"s"} left in your free trial
      </span>
      <button onClick={handleUpgrade} disabled={loading} style={{ marginLeft:"auto", background:C.accent, color:"#0D0F14", border:"none", borderRadius:6, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
        {loading ? "..." : "Upgrade - $15/mo"}
      </button>
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handle = async () => {
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else setMessage("Check your email to confirm your account, then log in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setError(error.message);
        else setMessage("Password reset email sent.");
      }
    } catch(e) { setError("Something went wrong."); }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:52, height:52, background:C.accent, borderRadius:14, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"#0D0F14", marginBottom:16 }}>L</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:C.text }}>Ledgr</div>
          <div style={{ color:C.muted, fontSize:13, marginTop:4 }}>Personal & Business Finance</div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:32 }}>
          <h2 style={{ color:C.text, fontSize:18, fontWeight:700, margin:"0 0 24px", fontFamily:"'Playfair Display',serif" }}>
            {mode==="login"?"Welcome back":mode==="signup"?"Start your 14-day free trial":"Reset password"}
          </h2>
          <TextInput label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" onKeyDown={e=>e.key==="Enter"&&handle()}/>
          {mode!=="reset" && <TextInput label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="min 6 characters" onKeyDown={e=>e.key==="Enter"&&handle()}/>}
          {error && <div style={{ background:"#3a1a1a", border:`1px solid ${C.danger}44`, borderRadius:8, padding:"10px 14px", color:C.danger, fontSize:13, marginBottom:16 }}>{error}</div>}
          {message && <div style={{ background:C.accentDim, border:`1px solid ${C.accent}44`, borderRadius:8, padding:"10px 14px", color:C.accent, fontSize:13, marginBottom:16 }}>{message}</div>}
          <Btn onClick={handle} disabled={loading} style={{ width:"100%", marginBottom:12 }}>
            {loading?"Please wait...":mode==="login"?"Log in":mode==="signup"?"Start free trial":"Send reset email"}
          </Btn>
          {mode!=="reset" && (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ flex:1, height:1, background:C.border }}/><span style={{ color:C.muted, fontSize:12 }}>or</span><div style={{ flex:1, height:1, background:C.border }}/>
              </div>
              <button onClick={signInWithGoogle} style={{ width:"100%", padding:"11px 20px", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:16, minHeight:44 }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
              </button>
            </>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
            {mode==="login" && <>
              <button onClick={()=>{setMode("signup");setError("");setMessage("");}} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>No account? Start 14-day free trial</button>
              <button onClick={()=>{setMode("reset");setError("");setMessage("");}} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Forgot password?</button>
            </>}
            {mode!=="login" && <button onClick={()=>{setMode("login");setError("");setMessage("");}} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Back to log in</button>}
          </div>
        </div>
        {mode==="signup" && <p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:12 }}>14 days free · then $15/month · cancel anytime</p>}
      </div>
    </div>
  );
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function generatePDF(inv, profile) {
  const num = `INV-${inv.id.slice(-8,-3).toUpperCase()}`;
  const currCode = profile.currency || "USD"; const m = (n) => new Intl.NumberFormat(CURRENCIES.find(c=>c.code===currCode)?.locale||"en-US",{style:"currency",currency:currCode}).format(n);
  const d = (v) => v ? new Date(v).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "N/A";
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
  <body><button class="pbtn" onclick="window.print()">Save as PDF</button>
  <div class="top"><div class="logo">Ledgr<span>.</span></div><div style="text-align:right"><h2 style="font-size:24px;font-weight:700">Invoice</h2><div style="color:#6B7280;font-size:13px">${num}</div></div></div>
  <div class="stripe-bar" style="height:3px;background:linear-gradient(90deg,#16a34a,#4ade80);margin-bottom:40px"></div>
  <div class="grid2">
    <div><div class="lbl">From</div><div class="val">${profile.name||"Your Name"}</div><div class="sub">${profile.email||""}${profile.phone?"<br/>"+profile.phone:""}${profile.address?"<br/>"+profile.address:""}</div></div>
    <div><div class="lbl">Bill To</div><div class="val">${inv.client}</div></div>
  </div>
  <div class="meta">
    <div><div class="lbl">Date</div><div class="val" style="font-size:13px">${d(new Date().toISOString())}</div></div>
    <div><div class="lbl">Due</div><div class="val" style="font-size:13px">${d(inv.due_date)}</div></div>
    <div><div class="lbl">Status</div><div class="val" style="font-size:13px;color:${inv.status==="paid"?"#16a34a":inv.status==="overdue"?"#dc2626":"#d97706"}">${inv.status.charAt(0).toUpperCase()+inv.status.slice(1)}</div></div>
  </div>
  <table><thead><tr><th style="width:60%">Description</th><th>Type</th><th>Amount</th></tr></thead>
  <tbody><tr><td>${inv.description||"Services rendered"}</td><td style="color:#6B7280">${inv.type}</td><td>${m(inv.amount)}</td></tr></tbody></table>
  <div class="total"><div class="tbox"><div class="tlbl">Total Due</div><div class="tamt">${m(inv.amount)}</div></div></div>
  <div class="foot">Thank you for your business - Generated by Ledgr</div></body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close();
}

function exportCSV(type, invoices, expenses) {
  let rows, filename;
  if (type==="invoices") { rows=[["Invoice #","Client","Description","Amount","Status","Due Date","Type"],...invoices.map(i=>[i.id.slice(-8).toUpperCase(),i.client,i.description,i.amount,i.status,i.due_date,i.type])]; filename="ledgr-invoices.csv"; }
  else { rows=[["Name","Amount","Category","Date","Type"],...expenses.map(e=>[e.name,e.amount,e.category,e.date,e.type])]; filename="ledgr-expenses.csv"; }
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:filename}); a.click();
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null); // for client detail view

  const [csvRows, setCsvRows] = useState([]);
  const [csvParsing, setCsvParsing] = useState(false);
  const [csvMappings, setCsvMappings] = useState({ date:"", description:"", amount:"", type:"debit" });
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvStep, setCsvStep] = useState(1); // 1=upload, 2=map columns, 3=review
  const [clientsError, setClientsError] = useState(null);
  const [newClient, setNewClient] = useState({ name:"", email:"", phone:"", company:"", address:"", notes:"" });
  const [editClient, setEditClient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = () => setModal(null);
  const [newInv, setNewInv] = useState({ client:"", client_id:null, amount:"", due_date:"", type:"business", description:"", status:"pending", recurring:false, recurring_frequency:"monthly" });
  const [newExp, setNewExp] = useState({ name:"", amount:"", category:"", date:"", type:"business" });
  const [newAlr, setNewAlr] = useState({ label:"", amount:"", due_date:"", type:"personal" });
  const [editPro, setEditPro] = useState({ name:"", email:"", phone:"", address:"" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Handle ?success=true from Stripe redirect - poll until subscription is active
  const [stripeSuccess, setStripeSuccess] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
      setStripeSuccess(true);
    }
  }, []);

  // Poll Supabase until subscription_status is active (webhook may take a few seconds)
  useEffect(() => {
    if (!stripeSuccess || !session) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase.from("profiles").select("subscription_status").eq("id", session.user.id).single();
      if (data?.subscription_status === "active" || attempts >= 10) {
        clearInterval(interval);
        setStripeSuccess(false);
        await loadAll();
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [stripeSuccess, session]);

  useEffect(() => { if (session) loadAll(); }, [session]);

  const loadAll = async () => {
    setLoading(true);
    const uid = session?.user?.id;
    if (!uid) return;
    const [inv, exp, alr, pro, cli] = await Promise.all([
      supabase.from("invoices").select("*").eq("user_id",uid).order("created_at",{ascending:false}),
      supabase.from("expenses").select("*").eq("user_id",uid).order("created_at",{ascending:false}),
      supabase.from("alerts").select("*").eq("user_id",uid).order("created_at",{ascending:false}),
      supabase.from("profiles").select("*").eq("id",uid).single(),
      supabase.from("clients").select("*").eq("user_id",uid).order("name",{ascending:true}),
    ]);
    if (inv.data) setInvoices(inv.data);
    if (exp.data) setExpenses(exp.data);
    if (alr.data) setAlerts(alr.data);
    if (cli.data) { setClients(cli.data); setClientsError(null); }
    else if (cli.error) { setClients([]); setClientsError(cli.error.message); }
    else setClients([]);
    if (pro.data) { setProfile(pro.data); setEditPro(pro.data); if(pro.data.currency) setCurrencyStore(pro.data.currency); }
    else {
      // First login - create profile with trial
      await supabase.from("profiles").insert({ id: uid, email: session.user.email, name: "", phone: "", address: "" });
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      if (data) { setProfile(data); setEditPro(data); }
    }
    setLoading(false);
  };

  const addInvoice = async () => {
    if (!newInv.client||!newInv.amount) return;
    let recurring_next_date = null;
    if (newInv.recurring && newInv.due_date) {
      const d = new Date(newInv.due_date);
      if (newInv.recurring_frequency==="weekly") d.setDate(d.getDate()+7);
      else if (newInv.recurring_frequency==="monthly") d.setMonth(d.getMonth()+1);
      else if (newInv.recurring_frequency==="quarterly") d.setMonth(d.getMonth()+3);
      recurring_next_date = d.toISOString().split("T")[0];
    }
    const row = {...newInv, amount:parseFloat(newInv.amount), user_id:session.user.id, recurring_next_date};
    const { data } = await supabase.from("invoices").insert(row).select().single();
    if (data) setInvoices(p=>[data,...p]);
    setNewInv({client:"",client_id:null,amount:"",due_date:"",type:"business",description:"",status:"pending",recurring:false,recurring_frequency:"monthly"}); close();
  };
  const addExpense = async () => {
    if (!newExp.name||!newExp.amount) return;
    const { data } = await supabase.from("expenses").insert({...newExp,amount:parseFloat(newExp.amount),user_id:session.user.id}).select().single();
    if (data) setExpenses(p=>[data,...p]);
    setNewExp({name:"",amount:"",category:"",date:"",type:"business"}); close();
  };
  const addAlert = async () => {
    if (!newAlr.label||!newAlr.due_date) return;
    const { data } = await supabase.from("alerts").insert({...newAlr,amount:parseFloat(newAlr.amount)||0,user_id:session.user.id}).select().single();
    if (data) setAlerts(p=>[data,...p]);
    setNewAlr({label:"",amount:"",due_date:"",type:"personal"}); close();
  };
  const markPaid = async (id) => { await supabase.from("invoices").update({status:"paid"}).eq("id",id); setInvoices(p=>p.map(x=>x.id===id?{...x,status:"paid"}:x)); };
  const delInvoice = async (id) => { await supabase.from("invoices").delete().eq("id",id); setInvoices(p=>p.filter(x=>x.id!==id)); };
  const delExpense = async (id) => { await supabase.from("expenses").delete().eq("id",id); setExpenses(p=>p.filter(x=>x.id!==id)); };
  const delAlert   = async (id) => { await supabase.from("alerts").delete().eq("id",id); setAlerts(p=>p.filter(x=>x.id!==id)); };

  // ── Bank functions ──
  const SUPABASE_URL = "https://phjybvphmlzghdebonzy.supabase.co";
  const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanlidnBobWx6Z2hkZWJvbnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTI2MDIsImV4cCI6MjA4ODE2ODYwMn0.6r7C6aQPn0YTjmDjRkP8fVd6cQhXJ_L1jBYqsu2qRWM";

  // ── CSV Import ──
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvParsing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { alert("CSV appears empty."); setCsvParsing(false); return; }
      // Parse headers
      const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g,"").trim());
      setCsvHeaders(headers);
      // Parse rows
      const rows = lines.slice(1).map(line => {
        const vals = line.match(/(".*?"|[^,]+)(?=,|$)/g) || line.split(",");
        const row = {};
        headers.forEach((h,i) => { row[h] = (vals[i]||"").replace(/^"|"$/g,"").trim(); });
        return row;
      }).filter(r => Object.values(r).some(v => v));
      setCsvRows(rows);
      // Auto-detect common column names
      const lower = headers.map(h => h.toLowerCase());
      const dateCol = headers[lower.findIndex(h => h.includes("date"))] || "";
      const descCol = headers[lower.findIndex(h => h.includes("desc") || h.includes("name") || h.includes("merchant") || h.includes("detail"))] || "";
      const amtCol = headers[lower.findIndex(h => h.includes("amount") || h.includes("debit") || h.includes("credit") || h.includes("value"))] || "";
      setCsvMappings({ date: dateCol, description: descCol, amount: amtCol, type:"debit" });
      setCsvStep(2);
      setCsvParsing(false);
    };
    reader.readAsText(file);
  };

  const importCsvTransactions = async () => {
    const { date: dateCol, description: descCol, amount: amtCol } = csvMappings;
    if (!dateCol || !descCol || !amtCol) { alert("Please map all columns first."); return; }
    const toImport = csvRows.filter(r => {
      const amt = parseFloat((r[amtCol]||"").replace(/[^0-9.-]/g,""));
      return !isNaN(amt) && amt > 0;
    });
    if (toImport.length === 0) { alert("No valid transactions found."); return; }
    const rows = toImport.map(r => ({
      name: r[descCol] || "Transaction",
      amount: Math.abs(parseFloat((r[amtCol]||"0").replace(/[^0-9.-]/g,""))),
      category: "Bank Import",
      date: r[dateCol] || new Date().toISOString().split("T")[0],
      type: "business",
      user_id: session.user.id,
    }));
    const { data } = await supabase.from("expenses").insert(rows).select();
    if (data) {
      setExpenses(p => [...data, ...p]);
      alert(`✅ Imported ${data.length} transactions as expenses!`);
      setCsvStep(1); setCsvRows([]); setCsvHeaders([]); close();
    }
  };

  const addClient = async () => {
    if (!newClient.name) return;
    const { data } = await supabase.from("clients").insert({...newClient, user_id:session.user.id}).select().single();
    if (data) setClients(p=>[...p,data].sort((a,b)=>a.name.localeCompare(b.name)));
    setNewClient({name:"",email:"",phone:"",company:"",address:"",notes:""}); close();
  };
  const updateClient = async () => {
    if (!editClient?.name) return;
    await supabase.from("clients").update(editClient).eq("id", editClient.id);
    setClients(p=>p.map(x=>x.id===editClient.id?editClient:x).sort((a,b)=>a.name.localeCompare(b.name)));
    setEditClient(null); close();
  };
  const delClient = async (id) => {
    await supabase.from("clients").delete().eq("id",id);
    setClients(p=>p.filter(x=>x.id!==id));
    setSelectedClient(null);
  };
  const saveProfile = async () => { await supabase.from("profiles").upsert({...editPro,id:session.user.id}); setProfile(editPro); if(editPro.currency) setCurrencyStore(editPro.currency); close(); };
  const signOut = () => supabase.auth.signOut();

  // ── Subscription gate ──
  const isActive = () => {
    if (!profile) return true; // still loading
    const status = profile.subscription_status;
    if (status === "active" || status === "past_due") return true; // give grace for past_due
    if (status === "trialing" || !status) {
      return profile.trial_ends_at ? daysUntil(profile.trial_ends_at) > 0 : true;
    }
    return false; // canceled, unpaid, etc
  };

  const fInvoices = filter==="all"?invoices:invoices.filter(i=>i.type===filter);
  const fExpenses = filter==="all"?expenses:expenses.filter(e=>e.type===filter);
  const upcoming  = alerts.map(a=>({...a,days:daysUntil(a.due_date)})).filter(a=>a.days<=30).sort((a,b)=>a.days-b.days);
  const totalIncome  = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0);
  const totalPending = invoices.filter(i=>i.status==="pending").reduce((s,i)=>s+i.amount,0);
  const totalOverdue = invoices.filter(i=>i.status==="overdue").reduce((s,i)=>s+i.amount,0);
  const totalExp     = expenses.reduce((s,e)=>s+e.amount,0);
  const netProfit    = totalIncome-expenses.filter(e=>e.type==="business").reduce((s,e)=>s+e.amount,0);
  const byCat        = expenses.reduce((a,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a;},{});

  if (authLoading) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"sans-serif"}}>Loading...</div>;

  // Smooth Stripe success screen while webhook processes
  if (stripeSuccess) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",maxWidth:360}}>
        <div style={{width:72,height:72,background:C.accentDim,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:32}}>✓</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:C.text,margin:"0 0 12px"}}>You're all set!</h2>
        <p style={{color:C.muted,fontSize:15,marginBottom:32,lineHeight:1.6}}>Payment confirmed. Setting up your account…</p>
        <div style={{display:"flex",justifyContent:"center",gap:8}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.accent,opacity:0.3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
      </div>
    </div>
  );
  if (!session) return <AuthScreen/>;
  if (!loading && profile && !isActive()) return <PaywallScreen session={session} onSignOut={signOut}/>;

  const TABS=[{id:"dashboard",label:"Dashboard"},{id:"invoices",label:"Invoices"},{id:"expenses",label:"Expenses"},{id:"alerts",label:"Alerts"},{id:"clients",label:"Clients"},{id:"bank",label:"Bank"},{id:"charts",label:"Charts"}];
  const goTab=(id)=>{setTab(id);setSidebarOpen(false);};

  const SidebarContent=()=>(
    <>
      <div style={{marginBottom:32}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <div style={{width:32,height:32,background:C.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#0D0F14"}}>L</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>Ledgr</span>
          {isMobile&&<button onClick={()=>setSidebarOpen(false)} style={{marginLeft:"auto",background:C.border,border:"none",color:C.text,borderRadius:8,width:32,height:32,cursor:"pointer"}}>X</button>}
        </div>
        <p style={{color:C.muted,fontSize:11,margin:0,paddingLeft:42,wordBreak:"break-all"}}>{session.user.email}</p>
      </div>
      <nav style={{flex:1}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>goTab(t.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"12px",borderRadius:8,border:"none",cursor:"pointer",background:tab===t.id?C.accentDim:"transparent",color:tab===t.id?C.accent:C.textDim,fontSize:14,fontWeight:tab===t.id?600:400,marginBottom:4,textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            {t.label}
            {t.id==="alerts"&&upcoming.length>0&&<span style={{marginLeft:"auto",background:C.warning,color:"#000",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10}}>{upcoming.length}</span>}
          </button>
        ))}
      </nav>
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:16}}>
        <p style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>View</p>
        {["all","business","personal"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{display:"block",width:"100%",padding:"8px 12px",borderRadius:6,border:"none",cursor:"pointer",textAlign:"left",background:filter===f?C.border:"transparent",color:filter===f?C.text:C.muted,fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>
            {f==="all"?"All finances":f==="business"?"Business":"Personal"}
          </button>
        ))}
      </div>
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:16}}>
        {profile?.subscription_status==="active" && <div style={{fontSize:11,color:C.accent,fontWeight:600,padding:"4px 12px",marginBottom:8}}>✓ Pro subscriber</div>}
        <button onClick={()=>{setEditPro(profile||{});setModal("profile");setSidebarOpen(false);}} style={{display:"block",width:"100%",padding:"8px 12px",borderRadius:6,border:"none",cursor:"pointer",textAlign:"left",background:"transparent",color:C.textDim,fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>My Profile</button>
        <button onClick={signOut} style={{display:"block",width:"100%",padding:"8px 12px",borderRadius:6,border:"none",cursor:"pointer",textAlign:"left",background:"transparent",color:C.danger,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Sign Out</button>
      </div>
    </>
  );

  const stats=[
    {label:"Collected",value:money(totalIncome),color:C.accent},
    {label:"Pending",value:money(totalPending),color:C.warning},
    {label:"Overdue",value:money(totalOverdue),color:C.danger},
    {label:"Expenses",value:money(totalExp),color:"#60A5FA"},
    {label:"Net Profit",value:money(netProfit),color:netProfit>=0?C.accent:C.danger},
  ];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Trial banner - always visible at top */}
      {profile && <TrialBanner profile={profile} session={session}/>}

      <div style={{display:"flex",flex:1,minHeight:0}}>
        {!isMobile&&(
          <div style={{width:220,background:C.surface,borderRight:`1px solid ${C.border}`,padding:"28px 16px",display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
            <SidebarContent/>
          </div>
        )}
        {isMobile&&sidebarOpen&&(
          <div onMouseDown={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9998}}>
            <div onMouseDown={e=>e.stopPropagation()} style={{width:260,height:"100%",background:C.surface,borderRight:`1px solid ${C.border}`,padding:"28px 16px",display:"flex",flexDirection:"column",overflowY:"auto"}}>
              <SidebarContent/>
            </div>
          </div>
        )}

        <div style={{flex:1,overflowY:"auto",paddingBottom:isMobile?80:0}}>
          {isMobile&&(
            <div style={{position:"sticky",top:0,zIndex:100,background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
              <button onClick={()=>setSidebarOpen(true)} style={{background:C.border,border:"none",color:C.text,borderRadius:8,width:40,height:40,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>☰</button>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>Ledgr</span>
              <span style={{marginLeft:"auto",color:C.muted,fontSize:13}}>{TABS.find(t=>t.id===tab)?.label}</span>
            </div>
          )}

          {loading&&<div style={{padding:60,textAlign:"center",color:C.muted}}>Loading your data...</div>}
          {!loading&&(
            <div style={{padding:isMobile?"16px":"32px 36px"}}>

              {tab==="dashboard"&&(
                <div>
                  <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px"}}>Financial Overview</h1>
                  <p style={{color:C.muted,fontSize:14,marginBottom:24}}>Your money, all in one place.</p>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(5,1fr)",gap:12,marginBottom:24}}>
                    {stats.map((s,i)=>(
                      <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
                        <div style={{color:C.muted,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{s.label}</div>
                        <div style={{color:s.color,fontSize:isMobile?15:19,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
                    <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:600}}>Recent Invoices</h3>
                    {invoices.length===0&&<p style={{color:C.muted,fontSize:13}}>No invoices yet - create your first one!</p>}
                    {invoices.slice(0,4).map(inv=>(
                      <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:12,marginBottom:12,borderBottom:`1px solid ${C.border}`}}>
                        <div><div style={{fontSize:14,fontWeight:600}}>{inv.client}</div><div style={{fontSize:12,color:C.muted}}>{inv.description}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700}}>{money(inv.amount)}</div><StatusPill status={inv.status}/></div>
                      </div>
                    ))}
                  </div>
                  {upcoming.length>0&&(
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
                      <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:600}}>Upcoming Payments</h3>
                      {upcoming.map(a=>(
                        <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:12,marginBottom:12,borderBottom:`1px solid ${C.border}`}}>
                          <div><div style={{fontSize:14,fontWeight:600}}>{a.label}</div><div style={{fontSize:12,color:a.days<=3?C.danger:a.days<=7?C.warning:C.muted}}>{a.days<=0?"Due today!":`Due in ${a.days} days`}</div></div>
                          <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700}}>{money(a.amount)}</div><Badge type={a.type}/></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab==="invoices"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:12}}>
                    <div><h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px"}}>Invoices</h1><p style={{color:C.muted,fontSize:13,margin:0}}>{fInvoices.length} invoices</p></div>
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <Btn onClick={()=>setModal("invoice")} style={{padding:"10px 14px",fontSize:13}}>+ New</Btn>
                      <Btn variant="secondary" onClick={()=>exportCSV("invoices",invoices,expenses)} style={{padding:"10px 14px",fontSize:13}}>CSV</Btn>
                    </div>
                  </div>
                  {fInvoices.length===0&&<div style={{textAlign:"center",padding:60,color:C.muted}}>No invoices yet.</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {fInvoices.map(inv=>(
                      <div key={inv.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <div><div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{inv.client}</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Badge type={inv.type}/><StatusPill status={inv.status}/></div></div>
                          <div style={{fontSize:18,fontWeight:700}}>{money(inv.amount)}</div>
                          {inv.recurring&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,background:"#1e2d4a",color:"#60A5FA",letterSpacing:"0.06em"}}>RECURRING</span>}
                        </div>
                        <div style={{fontSize:12,color:C.muted,marginBottom:12}}>{inv.description} · Due {inv.due_date?fmtDate(inv.due_date):"-"}</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          <Btn variant="secondary" onClick={()=>generatePDF(inv,profile||{})} style={{padding:"8px 12px",fontSize:12,color:C.accent,flex:1}}>PDF</Btn>
                          {inv.status!=="paid"&&<Btn onClick={()=>markPaid(inv.id)} style={{padding:"8px 12px",fontSize:12,flex:1}}>Mark Paid</Btn>}
                          <Btn variant="danger" onClick={()=>delInvoice(inv.id)} style={{padding:"8px 12px",fontSize:12}}>Delete</Btn>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab==="expenses"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:12}}>
                    <div><h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px"}}>Expenses</h1><p style={{color:C.muted,fontSize:13,margin:0}}>{fExpenses.length} entries</p></div>
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <Btn onClick={()=>setModal("expense")} style={{padding:"10px 14px",fontSize:13}}>+ Add</Btn>
                      <Btn variant="secondary" onClick={()=>exportCSV("expenses",invoices,expenses)} style={{padding:"10px 14px",fontSize:13}}>CSV</Btn>
                    </div>
                  </div>
                  {fExpenses.length===0&&<div style={{textAlign:"center",padding:60,color:C.muted}}>No expenses logged yet.</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {[...fExpenses].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(exp=>(
                      <div key={exp.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                        <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><span style={{fontSize:14,fontWeight:600}}>{exp.name}</span><Badge type={exp.type}/></div><div style={{fontSize:12,color:C.muted}}>{exp.category} · {exp.date?fmtDate(exp.date):"-"}</div></div>
                        <div style={{fontSize:15,fontWeight:700,color:C.danger}}>{money(exp.amount)}</div>
                        <button onClick={()=>delExpense(exp.id)} style={{background:C.border,border:"none",color:C.muted,borderRadius:6,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>X</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab==="alerts"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div><h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px"}}>Alerts</h1><p style={{color:C.muted,fontSize:13,margin:0}}>Never miss a due date</p></div>
                    <Btn onClick={()=>setModal("alert")} style={{padding:"10px 14px",fontSize:13}}>+ Add</Btn>
                  </div>
                  {alerts.length===0&&<div style={{textAlign:"center",padding:60,color:C.muted}}>No alerts set.</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {[...alerts].sort((a,b)=>new Date(a.due_date)-new Date(b.due_date)).map(a=>{
                      const days=daysUntil(a.due_date);
                      const urg=days<=3?C.danger:days<=7?C.warning:C.textDim;
                      return(
                        <div key={a.id} style={{background:C.card,borderRadius:12,padding:"16px",border:`1px solid ${days<=7?urg+"44":C.border}`}}>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{width:44,height:44,borderRadius:10,background:urg+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18,color:urg,fontWeight:700}}>{days<=0?"!":days<=3?"!!":"ok"}</div>
                            <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><span style={{fontSize:14,fontWeight:600}}>{a.label}</span><Badge type={a.type}/></div><div style={{fontSize:12,color:urg,fontWeight:500}}>{days<=0?"Due today!":days===1?"Due tomorrow!":`Due in ${days} days`}</div></div>
                            <div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{a.amount>0?money(a.amount):"-"}</div><button onClick={()=>delAlert(a.id)} style={{background:C.border,border:"none",color:C.muted,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}>Dismiss</button></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab==="clients"&&(
                <div>
                  {clientsError&&<div style={{background:"#3a1a1a",border:"1px solid #f8717144",borderRadius:10,padding:16,marginBottom:16,fontSize:13,color:"#f87171"}}>Error: {clientsError}</div>}
                  {selectedClient ? (
                    // ── Client detail view ──
                    <div>
                      <button onClick={()=>setSelectedClient(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:20,padding:0}}>Back to clients</button>
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                          <div>
                            <div style={{width:48,height:48,borderRadius:12,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:C.accent,marginBottom:12}}>
                              {selectedClient.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:"0 0 4px"}}>{selectedClient.name}</h2>
                            {selectedClient.company&&<div style={{fontSize:13,color:C.textDim,marginBottom:8}}>{selectedClient.company}</div>}
                            <div style={{display:"flex",flexDirection:"column",gap:4}}>
                              {selectedClient.email&&<div style={{fontSize:13,color:C.muted}}>✉ {selectedClient.email}</div>}
                              {selectedClient.phone&&<div style={{fontSize:13,color:C.muted}}>✆ {selectedClient.phone}</div>}
                              {selectedClient.address&&<div style={{fontSize:13,color:C.muted}}>⌖ {selectedClient.address}</div>}
                              {selectedClient.notes&&<div style={{fontSize:13,color:C.muted,marginTop:4,fontStyle:"italic"}}>"{selectedClient.notes}"</div>}
                            </div>
                          </div>
                          <Btn variant="secondary" onClick={()=>{setEditClient(selectedClient);setModal("edit-client");}} style={{padding:"8px 14px",fontSize:13}}>Edit</Btn>
                        </div>
                        {(()=>{
                          const cli=selectedClient;
                          const cliInvs=invoices.filter(i=>i.client_id===cli.id||i.client===cli.name);
                          const totalBilled=cliInvs.reduce((s,i)=>s+i.amount,0);
                          const totalPaid=cliInvs.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0);
                          return(
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                              <div style={{background:C.surface,borderRadius:10,padding:"12px 14px"}}>
                                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Total Billed</div>
                                <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Playfair Display',serif"}}>{money(totalBilled,profile?.currency)}</div>
                              </div>
                              <div style={{background:C.surface,borderRadius:10,padding:"12px 14px"}}>
                                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Collected</div>
                                <div style={{fontSize:18,fontWeight:700,color:C.accent,fontFamily:"'Playfair Display',serif"}}>{money(totalPaid,profile?.currency)}</div>
                              </div>
                              <div style={{background:C.surface,borderRadius:10,padding:"12px 14px"}}>
                                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Invoices</div>
                                <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Playfair Display',serif"}}>{cliInvs.length}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>Invoice History</h3>
                      {invoices.filter(i=>i.client_id===selectedClient.id||i.client===selectedClient.name).length===0&&<p style={{color:C.muted,fontSize:13}}>No invoices yet for this client.</p>}
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {invoices.filter(i=>i.client_id===selectedClient.id||i.client===selectedClient.name).map(inv=>(
                          <div key={inv.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>{inv.description||"Invoice"}</div>
                              <div style={{fontSize:12,color:C.muted}}>Due {inv.due_date?fmtDate(inv.due_date):"-"}</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{money(inv.amount,profile?.currency)}</div>
                              <StatusPill status={inv.status}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // ── Clients list view ──
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:12}}>
                        <div>
                          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px"}}>Clients</h1>
                          <p style={{color:C.muted,fontSize:13,margin:0}}>{clients.length} client{clients.length!==1?"s":""}</p>
                        </div>
                        <Btn onClick={()=>setModal("add-client")} style={{padding:"10px 14px",fontSize:13}}>+ Add</Btn>
                      </div>
                      {clientsError&&(
                        <div style={{background:"#3a1a1a",border:`1px solid ${C.danger}44`,borderRadius:10,padding:16,marginBottom:16,fontSize:13,color:C.danger}}>
                          Error loading clients: {clientsError}
                        </div>
                      )}
                      {!clientsError&&clients.length===0&&(
                        <div style={{textAlign:"center",padding:60,color:C.muted}}>
                          <div style={{fontSize:40,marginBottom:12}}>👥</div>
                          <p style={{marginBottom:8}}>No clients yet.</p>
                          <p style={{fontSize:13}}>Add your first client to link invoices and track history.</p>
                        </div>
                      )}
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {(clients||[]).map(c=>{
                          const cliInvs=invoices.filter(i=>i.client_id===c.id||i.client===c.name);
                          const totalBilled=cliInvs.reduce((s,i)=>s+i.amount,0);
                          const unpaid=cliInvs.filter(i=>i.status!=="paid").length;
                          return(
                            <div key={c.id} onClick={()=>setSelectedClient(c)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px",cursor:"pointer",transition:"border-color 0.2s"}}
                              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent+"44"}
                              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
                            >
                              <div style={{display:"flex",alignItems:"center",gap:14}}>
                                <div style={{width:44,height:44,borderRadius:12,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:C.accent,flexShrink:0}}>
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{c.name}</div>
                                  <div style={{fontSize:12,color:C.muted}}>{c.company||c.email||"No details added"}</div>
                                </div>
                                <div style={{textAlign:"right",flexShrink:0}}>
                                  <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{money(totalBilled,profile?.currency)}</div>
                                  {unpaid>0&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"#3a2d1a",color:C.warning}}>{unpaid} unpaid</span>}
                                  {unpaid===0&&cliInvs.length>0&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"#1a3d2b",color:C.accent}}>All paid</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab==="bank"&&(
                <div>
                  <div style={{marginBottom:20}}>
                    <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px"}}>Bank & Transactions</h1>
                    <p style={{color:C.muted,fontSize:13,margin:0}}>Import transactions from your bank statement</p>
                  </div>

                  {/* Two import options */}
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:24}}>
                    <div style={{background:C.card,border:`1px solid ${C.accent}44`,borderRadius:12,padding:20}}>
                      <div style={{fontSize:24,marginBottom:10}}>📄</div>
                      <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>CSV Import</div>
                      <p style={{fontSize:13,color:C.textDim,marginBottom:16,lineHeight:1.6}}>Download your bank statement as CSV and upload it. Works with every bank worldwide.</p>
                      <Btn onClick={()=>setModal("csv-import")} style={{width:"100%",padding:"10px",fontSize:13}}>Upload CSV</Btn>
                    </div>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,opacity:0.6}}>
                      <div style={{fontSize:24,marginBottom:10}}>🔗</div>
                      <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>Auto Sync <span style={{fontSize:10,background:C.border,padding:"2px 7px",borderRadius:4,color:C.muted,fontWeight:600,marginLeft:4}}>COMING SOON</span></div>
                      <p style={{fontSize:13,color:C.textDim,marginBottom:16,lineHeight:1.6}}>Connect your bank directly for automatic transaction sync. US & UK banks supported.</p>
                      <Btn disabled style={{width:"100%",padding:"10px",fontSize:13}}>Coming Soon</Btn>
                    </div>
                  </div>


                </div>
              )}

              {tab==="charts"&&(()=>{
                const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(5-i));return{key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString("en-US",{month:"short",year:"2-digit"})};});
                const mInc=months.map(m=>invoices.filter(i=>i.status==="paid"&&i.due_date?.startsWith(m.key)).reduce((s,i)=>s+i.amount,0));
                const mExp=months.map(m=>expenses.filter(e=>e.date?.startsWith(m.key)).reduce((s,e)=>s+e.amount,0));
                const mNet=months.map((_,i)=>mInc[i]-mExp[i]);
                const maxV=Math.max(...mInc,...mExp,1);
                const H=160,bW=24,gW=bW*2+8,spacing=20,tW=months.length*(gW+spacing)+60;
                const catD=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
                const totCat=catD.reduce((s,[,v])=>s+v,0);
                const PIE=["#4ADE80","#60A5FA","#FBBF24","#F87171","#C084FC","#34D399"];
                const p2c=(cx,cy,r,deg)=>{const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};};
                const arc=(cx,cy,r,s,e)=>{const sp=p2c(cx,cy,r,s),ep=p2c(cx,cy,r,e),l=e-s>180?1:0;return `M ${cx} ${cy} L ${sp.x} ${sp.y} A ${r} ${r} 0 ${l} 1 ${ep.x} ${ep.y} Z`;};
                let cur=0;
                const slices=catD.map(([cat,amt],i)=>{const pct=amt/totCat,s=cur*360;cur+=pct;return{cat,amt,pct,s,e:cur*360,color:PIE[i%PIE.length]};});
                return(
                  <div>
                    <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px"}}>Trends</h1>
                    <p style={{color:C.muted,fontSize:14,marginBottom:24}}>Last 6 months</p>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
                      <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:600}}>Income vs Expenses</h3>
                      <div style={{overflowX:"auto"}}>
                        <svg width={tW} height={H+50}>
                          {[0,0.5,1].map((p,i)=>{const y=H-p*H;return(<g key={i}><line x1={44} y1={y} x2={tW} y2={y} stroke={C.border} strokeWidth={1}/><text x={40} y={y+4} fontSize={9} fill={C.muted} textAnchor="end">{money(p*maxV)}</text></g>);})}
                          {months.map((m,i)=>{const x=i*(gW+spacing)+50;const iH=(mInc[i]/maxV)*H;const eH=(mExp[i]/maxV)*H;return(<g key={m.key}><rect x={x} y={H-iH} width={bW} height={iH} fill={C.accent} rx={3}/><rect x={x+bW+4} y={H-eH} width={bW} height={eH} fill={C.danger} rx={3} opacity={0.85}/><text x={x+bW} y={H+18} textAnchor="middle" fontSize={10} fill={C.muted}>{m.label}</text></g>);})}
                          <polyline points={months.map((_,i)=>`${i*(gW+spacing)+50+bW},${H-(Math.max(0,mNet[i])/maxV)*H}`).join(" ")} fill="none" stroke={C.warning} strokeWidth={2} strokeDasharray="4 2"/>
                        </svg>
                      </div>
                      <div style={{display:"flex",gap:16,marginTop:8}}>
                        {[{c:C.accent,l:"Income"},{c:C.danger,l:"Expenses"},{c:C.warning,l:"Net profit"}].map(x=>(<div key={x.l} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:10,height:10,borderRadius:2,background:x.c}}/><span style={{fontSize:12,color:C.muted}}>{x.l}</span></div>))}
                      </div>
                    </div>
                    {totCat>0&&(
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
                        <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:600}}>Expense Breakdown</h3>
                        <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
                          <svg width={120} height={120} style={{flexShrink:0}}>
                            {slices.map((sl,i)=><path key={i} d={arc(60,60,52,sl.s,sl.e)} fill={sl.color} stroke={C.card} strokeWidth={2}/>)}
                            <circle cx={60} cy={60} r={28} fill={C.card}/>
                            <text x={60} y={65} textAnchor="middle" fontSize={10} fill={C.text} fontWeight="bold">{money(totCat)}</text>
                          </svg>
                          <div style={{flex:1,minWidth:140}}>
                            {slices.map((sl,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:10,height:10,borderRadius:2,background:sl.color,flexShrink:0}}/><div><div style={{fontSize:13,fontWeight:500}}>{sl.cat}</div><div style={{fontSize:11,color:C.muted}}>{Math.round(sl.pct*100)}% · {money(sl.amt)}</div></div></div>))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {isMobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:200}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 4px",border:"none",background:"transparent",color:tab===t.id?C.accent:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
              <span style={{fontSize:9,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>{t.label}</span>
              {t.id==="alerts"&&upcoming.length>0&&<span style={{position:"absolute",top:4,right:"50%",marginRight:-20,background:C.warning,color:"#000",fontSize:8,fontWeight:700,padding:"1px 4px",borderRadius:8}}>{upcoming.length}</span>}
            </button>
          ))}
        </div>
      )}

      {modal==="invoice"&&(<Modal title="New Invoice" onClose={close} footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={addInvoice} style={{flex:1}}>Add Invoice</Btn></div>}>
  {clients.length>0&&<SelectInput label="Pick a Client (optional)" value={newInv.client_id||""} onChange={e=>{const c=clients.find(x=>x.id===e.target.value);setNewInv({...newInv,client_id:e.target.value||null,client:c?c.name:newInv.client})}}><option value="">- Enter manually -</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.company?" · "+c.company:""}</option>)}</SelectInput>}
  <TextInput label="Client Name" value={newInv.client} onChange={e=>setNewInv({...newInv,client:e.target.value,client_id:null})} placeholder="e.g. Acme Corp"/>
  <TextInput label="Amount ($)" type="number" value={newInv.amount} onChange={e=>setNewInv({...newInv,amount:e.target.value})} placeholder="0.00"/>
  <TextInput label="Description" value={newInv.description} onChange={e=>setNewInv({...newInv,description:e.target.value})} placeholder="e.g. Web redesign Q2"/>
  <TextInput label="Due Date" type="date" value={newInv.due_date} onChange={e=>setNewInv({...newInv,due_date:e.target.value})}/>
  <SelectInput label="Type" value={newInv.type} onChange={e=>setNewInv({...newInv,type:e.target.value})}><option value="business">Business</option><option value="personal">Personal</option></SelectInput>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderTop:`1px solid ${C.border}`,marginTop:4}}>
    <div>
      <div style={{fontSize:13,fontWeight:600,color:C.text}}>Recurring invoice</div>
      <div style={{fontSize:12,color:C.muted}}>Auto-generate this invoice on a schedule</div>
    </div>
    <div onClick={()=>setNewInv({...newInv,recurring:!newInv.recurring})} style={{width:44,height:24,borderRadius:12,background:newInv.recurring?C.accent:C.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:newInv.recurring?22:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
    </div>
  </div>
  {newInv.recurring&&<SelectInput label="Frequency" value={newInv.recurring_frequency} onChange={e=>setNewInv({...newInv,recurring_frequency:e.target.value})}>
    <option value="weekly">Weekly</option>
    <option value="monthly">Monthly</option>
    <option value="quarterly">Quarterly</option>
  </SelectInput>}
</Modal>)}
      {modal==="expense"&&(<Modal title="Add Expense" onClose={close} footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={addExpense} style={{flex:1}}>Add Expense</Btn></div>}><TextInput label="Name" value={newExp.name} onChange={e=>setNewExp({...newExp,name:e.target.value})} placeholder="e.g. Figma Pro"/><TextInput label="Amount ($)" type="number" value={newExp.amount} onChange={e=>setNewExp({...newExp,amount:e.target.value})} placeholder="0.00"/><TextInput label="Category" value={newExp.category} onChange={e=>setNewExp({...newExp,category:e.target.value})} placeholder="e.g. Software, Meals"/><TextInput label="Date" type="date" value={newExp.date} onChange={e=>setNewExp({...newExp,date:e.target.value})}/><SelectInput label="Type" value={newExp.type} onChange={e=>setNewExp({...newExp,type:e.target.value})}><option value="business">Business</option><option value="personal">Personal</option></SelectInput></Modal>)}
      {modal==="alert"&&(<Modal title="New Alert" onClose={close} footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={addAlert} style={{flex:1}}>Set Alert</Btn></div>}><TextInput label="Label" value={newAlr.label} onChange={e=>setNewAlr({...newAlr,label:e.target.value})} placeholder="e.g. Rent, Subscription"/><TextInput label="Amount ($) optional" type="number" value={newAlr.amount} onChange={e=>setNewAlr({...newAlr,amount:e.target.value})} placeholder="0.00"/><TextInput label="Due Date" type="date" value={newAlr.due_date} onChange={e=>setNewAlr({...newAlr,due_date:e.target.value})}/><SelectInput label="Type" value={newAlr.type} onChange={e=>setNewAlr({...newAlr,type:e.target.value})}><option value="personal">Personal</option><option value="business">Business</option></SelectInput></Modal>)}
      {modal==="csv-import"&&(
  <Modal title="Import Bank Statement" onClose={()=>{close();setCsvStep(1);setCsvRows([]);setCsvHeaders([]);}}
    footer={
      csvStep===2 ? <div style={{display:"flex",gap:10}}>
        <Btn variant="secondary" onClick={()=>setCsvStep(1)} style={{flex:1}}>Back</Btn>
        <Btn onClick={()=>setCsvStep(3)} disabled={!csvMappings.date||!csvMappings.description||!csvMappings.amount} style={{flex:1}}>Preview -></Btn>
      </div>
      : csvStep===3 ? <div style={{display:"flex",gap:10}}>
        <Btn variant="secondary" onClick={()=>setCsvStep(2)} style={{flex:1}}>Back</Btn>
        <Btn onClick={importCsvTransactions} style={{flex:1}}>Import {csvRows.filter(r=>{const a=parseFloat((r[csvMappings.amount]||"").replace(/[^0-9.-]/g,""));return !isNaN(a)&&a>0;}).length} Transactions</Btn>
      </div>
      : null
    }
  >
    {csvStep===1&&(
      <div>
        <div style={{background:C.surface,borderRadius:10,padding:16,marginBottom:16,fontSize:13,color:C.textDim,lineHeight:1.7}}>
          <strong style={{color:C.text,display:"block",marginBottom:8}}>How to export your bank statement:</strong>
          🇬🇧 <strong>UK banks:</strong> Barclays, HSBC, Lloyds, Monzo, Revolut - go to Transactions -> Export -> CSV<br/>
          🇺🇸 <strong>US banks:</strong> Chase, Bank of America, Wells Fargo - go to Statements, Download -> CSV
        </div>
        <label style={{display:"block",background:C.accentDim,border:`2px dashed ${C.accent}44`,borderRadius:12,padding:"32px 20px",textAlign:"center",cursor:"pointer"}}>
          <div style={{fontSize:32,marginBottom:8}}>📂</div>
          <div style={{fontSize:14,fontWeight:600,color:C.accent,marginBottom:4}}>Click to upload CSV file</div>
          <div style={{fontSize:12,color:C.muted}}>Supports .csv files from any bank</div>
          <input type="file" accept=".csv" onChange={handleCsvUpload} style={{display:"none"}}/>
        </label>
        {csvParsing&&<div style={{textAlign:"center",padding:20,color:C.muted,fontSize:13}}>Parsing CSV...</div>}
      </div>
    )}
    {csvStep===2&&csvHeaders.length>0&&(
      <div>
        <p style={{fontSize:13,color:C.textDim,marginBottom:16}}>Map your CSV columns so Ledgr knows what each column means. Found <strong style={{color:C.text}}>{csvRows.length} rows</strong>.</p>
        {[{key:"date",label:"Date column"},{key:"description",label:"Description / Merchant"},{key:"amount",label:"Amount column"}].map(({key,label})=>(
          <SelectInput key={key} label={label} value={csvMappings[key]} onChange={e=>setCsvMappings({...csvMappings,[key]:e.target.value})}>
            <option value="">- Select column -</option>
            {csvHeaders.map(h=><option key={h} value={h}>{h}</option>)}
          </SelectInput>
        ))}
        <div style={{background:C.surface,borderRadius:8,padding:12,fontSize:12,color:C.muted}}>
          <strong style={{color:C.textDim,display:"block",marginBottom:6}}>Preview (first 3 rows):</strong>
          {csvRows.slice(0,3).map((r,i)=>(
            <div key={i} style={{marginBottom:4,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
              {csvMappings.date&&<span style={{marginRight:12}}>{r[csvMappings.date]}</span>}
              {csvMappings.description&&<span style={{marginRight:12,color:C.textDim}}>{r[csvMappings.description]?.slice(0,30)}</span>}
              {csvMappings.amount&&<span style={{color:C.accent}}>{r[csvMappings.amount]}</span>}
            </div>
          ))}
        </div>
      </div>
    )}
    {csvStep===3&&(
      <div>
        <p style={{fontSize:13,color:C.textDim,marginBottom:12}}>These transactions will be added to your <strong style={{color:C.text}}>Expenses</strong>. Review before importing:</p>
        <div style={{maxHeight:320,overflowY:"auto"}}>
          {csvRows.filter(r=>{const a=parseFloat((r[csvMappings.amount]||"").replace(/[^0-9.-]/g,""));return !isNaN(a)&&a>0;}).slice(0,20).map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
              <div>
                <div style={{fontWeight:600,marginBottom:2}}>{(r[csvMappings.description]||"Transaction").slice(0,35)}</div>
                <div style={{fontSize:11,color:C.muted}}>{r[csvMappings.date]}</div>
              </div>
              <div style={{fontWeight:700,color:C.danger}}>
                {money(Math.abs(parseFloat((r[csvMappings.amount]||"0").replace(/[^0-9.-]/g,""))),profile?.currency)}
              </div>
            </div>
          ))}
          {csvRows.filter(r=>{const a=parseFloat((r[csvMappings.amount]||"").replace(/[^0-9.-]/g,""));return !isNaN(a)&&a>0;}).length > 20 &&
            <p style={{color:C.muted,fontSize:12,padding:"10px 0",textAlign:"center"}}>...and {csvRows.filter(r=>{const a=parseFloat((r[csvMappings.amount]||"").replace(/[^0-9.-]/g,""));return !isNaN(a)&&a>0;}).length - 20} more</p>
          }
        </div>
      </div>
    )}
  </Modal>
)}
{modal==="add-client"&&(<Modal title="New Client" onClose={close} footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={addClient} style={{flex:1}}>Save Client</Btn></div>}>
  <TextInput label="Full Name" value={newClient.name} onChange={e=>setNewClient({...newClient,name:e.target.value})} placeholder="Jane Smith"/>
  <TextInput label="Company (optional)" value={newClient.company} onChange={e=>setNewClient({...newClient,company:e.target.value})} placeholder="Acme Corp"/>
  <TextInput label="Email" value={newClient.email} onChange={e=>setNewClient({...newClient,email:e.target.value})} placeholder="jane@acme.com"/>
  <TextInput label="Phone (optional)" value={newClient.phone} onChange={e=>setNewClient({...newClient,phone:e.target.value})} placeholder="+1 555 000 1234"/>
  <TextInput label="Address (optional)" value={newClient.address} onChange={e=>setNewClient({...newClient,address:e.target.value})} placeholder="New York, NY"/>
  <TextInput label="Notes (optional)" value={newClient.notes} onChange={e=>setNewClient({...newClient,notes:e.target.value})} placeholder="e.g. Net 30 payment terms"/>
</Modal>)}
{modal==="edit-client"&&editClient&&(<Modal title="Edit Client" onClose={close} footer={<div style={{display:"flex",gap:10}}><Btn variant="danger" onClick={()=>delClient(editClient.id)} style={{padding:"11px 16px"}}>Delete</Btn><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={updateClient} style={{flex:1}}>Save</Btn></div>}>
  <TextInput label="Full Name" value={editClient.name} onChange={e=>setEditClient({...editClient,name:e.target.value})} placeholder="Jane Smith"/>
  <TextInput label="Company (optional)" value={editClient.company||""} onChange={e=>setEditClient({...editClient,company:e.target.value})} placeholder="Acme Corp"/>
  <TextInput label="Email" value={editClient.email||""} onChange={e=>setEditClient({...editClient,email:e.target.value})} placeholder="jane@acme.com"/>
  <TextInput label="Phone (optional)" value={editClient.phone||""} onChange={e=>setEditClient({...editClient,phone:e.target.value})} placeholder="+1 555 000 1234"/>
  <TextInput label="Address (optional)" value={editClient.address||""} onChange={e=>setEditClient({...editClient,address:e.target.value})} placeholder="New York, NY"/>
  <TextInput label="Notes (optional)" value={editClient.notes||""} onChange={e=>setEditClient({...editClient,notes:e.target.value})} placeholder="e.g. Net 30 payment terms"/>
</Modal>)}
{modal==="profile"&&(<Modal title="My Profile" onClose={close} wide footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={saveProfile} style={{flex:1}}>Save Profile</Btn></div>}><p style={{color:C.muted,fontSize:13,marginBottom:16,marginTop:-4}}>This info appears on your PDF invoices.</p><TextInput label="Full Name" value={editPro.name||""} onChange={e=>setEditPro({...editPro,name:e.target.value})} placeholder="Jane Doe"/><TextInput label="Email" value={editPro.email||""} onChange={e=>setEditPro({...editPro,email:e.target.value})} placeholder="jane@email.com"/><TextInput label="Phone (optional)" value={editPro.phone||""} onChange={e=>setEditPro({...editPro,phone:e.target.value})} placeholder="+1 555 000 1234"/><TextInput label="Address" value={editPro.address||""} onChange={e=>setEditPro({...editPro,address:e.target.value})} placeholder="New York, NY"/><SelectInput label="Currency" value={editPro.currency||"USD"} onChange={e=>setEditPro({...editPro,currency:e.target.value})}>{CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}</SelectInput></Modal>)}
    </div>
  );
}
