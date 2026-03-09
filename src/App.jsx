import { useState, useEffect } from "react";
import PayPage from "./PayPage";
import ContactPage from "./ContactPage";
import AboutPage from "./AboutPage";
import PrivacyPage from "./PrivacyPage";
import { supabase } from "./supabase";
import { startCheckout } from "./stripe";

const C = {
  bg: "#080B10", surface: "#0F1318", card: "#141A22", border: "#1E2535",
  accent: "#4ADE80", accentDim: "#0d2018", accentGlow: "rgba(74,222,128,0.12)",
  warning: "#FBBF24", warningDim: "#2a1f0a",
  danger: "#F87171", dangerDim: "#2a0f0f",
  blue: "#60A5FA", blueDim: "#0f1e35",
  muted: "#4B5563", text: "#F1F5F9", textDim: "#8B95A8",
  surfaceHover: "#141A22",
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
  return <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.1em", padding:"3px 8px", borderRadius:6, background:type==="business"?C.blueDim:"#1e1530", color:type==="business"?C.blue:"#A78BFA", textTransform:"uppercase", border:`1px solid ${type==="business"?"#1e3a5f":"#2d1f4a"}` }}>{type}</span>;
}
function StatusPill({ status }) {
  const map = {
    paid:    { bg:"#0a2018", color:"#4ADE80", border:"#1a4a2a", dot:"#4ADE80", label:"Paid" },
    pending: { bg:"#1f1508", color:"#FBBF24", border:"#3a2a0a", dot:"#FBBF24", label:"Pending" },
    overdue: { bg:"#1f0808", color:"#F87171", border:"#3a1010", dot:"#F87171", label:"Overdue" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px 3px 8px", borderRadius:20, background:s.bg, color:s.color, border:`1px solid ${s.border}`, display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot, display:"inline-block", flexShrink:0 }}/>
      {s.label}
    </span>
  );
}
function Btn({ children, onClick, variant="primary", style={}, disabled=false }) {
  const base = {
    padding:"11px 20px", borderRadius:10, fontSize:14, fontWeight:700,
    cursor:disabled?"not-allowed":"pointer", border:"none",
    fontFamily:"'DM Sans',sans-serif", minHeight:44, opacity:disabled?0.5:1,
    transition:"all 0.15s ease", letterSpacing:"0.01em",
  };
  const variants = {
    primary: { background:C.accent, color:"#060A0E", boxShadow:`0 0 20px ${C.accentGlow}` },
    secondary: { background:C.card, color:C.textDim, border:`1px solid ${C.border}` },
    danger: { background:C.dangerDim, color:C.danger, border:`1px solid #3a1212` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant]||variants.secondary, ...style }}>{children}</button>;
}
function ConnectCard({ icon, name, desc, color, onConnect, comingSoon }) {
  return (
    <div style={{background:"#141A22",border:`1px solid ${comingSoon?"#1E2535":color+"33"}`,borderRadius:16,padding:20,position:"relative",overflow:"hidden",opacity:comingSoon?0.6:1}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:comingSoon?"#1E2535":`linear-gradient(90deg,${color},${color}88)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:12,background:"#0F1318",border:`1px solid ${comingSoon?"#1E2535":color+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{icon}</div>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:"#F1F5F9"}}>{name}</div>
          {comingSoon && <span style={{fontSize:10,background:"#1E2535",padding:"2px 7px",borderRadius:4,color:"#4B5563",fontWeight:600}}>COMING SOON</span>}
        </div>
      </div>
      <p style={{fontSize:13,color:"#8B95A8",marginBottom:16,lineHeight:1.6}}>{desc}</p>
      <button
        onClick={comingSoon?undefined:onConnect}
        disabled={comingSoon}
        style={{width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${comingSoon?"#1E2535":color+"66"}`,background:comingSoon?"transparent":`${color}11`,color:comingSoon?"#4B5563":color,fontSize:13,fontWeight:700,cursor:comingSoon?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}
        onMouseEnter={e=>{if(!comingSoon)e.currentTarget.style.background=`${color}22`}}
        onMouseLeave={e=>{if(!comingSoon)e.currentTarget.style.background=`${color}11`}}
      >
        {comingSoon ? "Coming Soon" : `Connect ${name}`}
      </button>
    </div>
  );
}

function TextInput({ label, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block", color:C.textDim, fontSize:11, fontWeight:700, marginBottom:7, letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</label>}
      <input {...props} style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", color:C.text, fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", transition:"border-color 0.15s", WebkitAppearance:"none" }}
        onFocus={e=>e.target.style.borderColor=C.accent+"88"}
        onBlur={e=>e.target.style.borderColor=C.border}
      />
    </div>
  );
}
function SelectInput({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", color:C.textDim, fontSize:11, fontWeight:700, marginBottom:7, letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</label>
      <select {...props} style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", color:C.text, fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", transition:"border-color 0.15s", WebkitAppearance:"none", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238B95A8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center" }}>{children}</select>
    </div>
  );
}
function Modal({ title, onClose, children, wide=false, footer=null }) {
  const mobile = window.innerWidth < 768;
  if (!document.getElementById("modal-style")) {
    const s = document.createElement("style");
    s.id = "modal-style";
    s.textContent = `.modal-scroll{-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}.modal-scroll::-webkit-scrollbar{display:none;}`;
    document.head.appendChild(s);
  }
  return (
    <div onMouseDown={onClose} style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",display:"flex",alignItems:mobile?"flex-end":"center",justifyContent:"center",zIndex:99999,padding:mobile?0:"20px" }}>
      <div onMouseDown={e=>e.stopPropagation()} style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:mobile?"24px 24px 0 0":"20px",width:"100%",maxWidth:wide?580:500,maxHeight:mobile?"80vh":"88vh",display:"flex",flexDirection:"column",boxShadow:mobile?"0 -32px 80px rgba(0,0,0,0.7)":"0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",overflow:"hidden" }}>
        <div style={{ flexShrink:0,padding:"18px 24px 0",background:C.surface }}>
          {mobile&&<div style={{ width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px",opacity:0.5 }}/>}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:16,borderBottom:`1px solid ${C.border}` }}>
            <h3 style={{ color:C.text,fontSize:17,fontFamily:"'Playfair Display',serif",margin:0,fontWeight:700 }}>{title}</h3>
            <button onClick={onClose} style={{ background:C.card,border:`1px solid ${C.border}`,color:C.textDim,cursor:"pointer",width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,fontWeight:700,transition:"all 0.15s" }}>✕</button>
          </div>
        </div>
        <div className="modal-scroll" style={{ flex:1,overflowY:"scroll",padding:"18px 24px",minHeight:0 }}>{children}</div>
        {footer&&<div style={{ flexShrink:0,padding:"14px 24px",paddingBottom:mobile?"calc(14px + env(safe-area-inset-bottom,0px))":"18px",borderTop:`1px solid ${C.border}`,background:C.surface }}>{footer}</div>}
      </div>
    </div>
  );
}

// ── Paywall Screen ────────────────────────────────────────────────────────────
function PaywallScreen({ session, onSignOut }) {
  const [loading, setLoading] = useState(false);

  const [subError, setSubError] = useState("");
  const handleSubscribe = async () => {
    setLoading(true); setSubError("");
    try {
      await startCheckout(session.user.id, session.user.email);
    } catch (e) {
      setSubError(e.message || "Something went wrong. Please try again.");
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
            {subError && <div style={{background:C.dangerDim,border:`1px solid ${C.danger}44`,borderRadius:8,padding:"10px 14px",color:C.danger,fontSize:12,marginTop:8}}>{subError}</div>}
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
  const [err, setErr] = useState("");
  if (!profile?.trial_ends_at) return null;
  const status = profile?.subscription_status;
  if (status === "active" || status === "past_due") return null;
  const days = daysUntil(profile.trial_ends_at);
  if (days <= 0) return null;
  const urgent = days <= 3;

  const handleUpgrade = async () => {
    setLoading(true); setErr("");
    try { await startCheckout(session.user.id, session.user.email); }
    catch(e) { setErr(e.message || "Unknown error"); setLoading(false); }
  };

  return (
    <div style={{ background: urgent ? "#3a1a0a" : "#1a2a1a", borderBottom:`1px solid ${urgent ? C.danger+"44" : C.accent+"44"}`, padding:"10px 20px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
      <span style={{ fontSize:13, color: urgent ? C.danger : C.accent, fontWeight:500 }}>
        {urgent ? "⚠️" : "⏳"} {days} day{days===1?"":"s"} left in your free trial
      </span>
      {err && <span style={{fontSize:12,color:C.danger,background:C.dangerDim,padding:"3px 10px",borderRadius:6}}>{err}</span>}
      <button onClick={handleUpgrade} disabled={loading} style={{ marginLeft:"auto", background:C.accent, color:"#060A0E", border:"none", borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:loading?"not-allowed":"pointer", whiteSpace:"nowrap", opacity:loading?0.7:1 }}>
        {loading ? "Opening Stripe..." : "Upgrade - $15/mo"}
      </button>
    </div>
  );
}

// ── Landing + Auth wrapper ───────────────────────────────────────────────────
function LandingOrAuth() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  if (showAuth) return <AuthScreen initialMode={authMode}/>;
  return <LandingPage onGetStarted={(mode)=>{ setAuthMode(mode); setShowAuth(true); }}/>;
}

// ── Landing Page ──────────────────────────────────────────────────────────────
function LandingPage({ onGetStarted }) {
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#080B10",color:"#F1F5F9",minHeight:"100vh",overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,400&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes floatUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes countUp{from{opacity:0}to{opacity:1}}
        .lp-fade{animation:floatUp 0.7s ease forwards}
        .lp-fade-2{animation:floatUp 0.7s 0.15s ease forwards;opacity:0}
        .lp-fade-3{animation:floatUp 0.7s 0.3s ease forwards;opacity:0}
        .lp-fade-4{animation:floatUp 0.7s 0.45s ease forwards;opacity:0}
        .lp-card:hover{border-color:#2d3a50!important;transform:translateY(-2px)}
        .lp-card{transition:all 0.2s ease}
        .lp-btn-main:hover{box-shadow:0 8px 40px rgba(74,222,128,0.35)!important;transform:translateY(-1px)}
        .lp-btn-main{transition:all 0.15s ease}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#1E2535;border-radius:4px}
      `}</style>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(8,11,16,0.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid #1E2535",padding:"0 32px",display:"flex",alignItems:"center",height:60}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <div style={{width:30,height:30,background:"linear-gradient(135deg,#4ADE80,#22c55e)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#060A0E"}}>L</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:800,letterSpacing:"-0.01em"}}>Ledgr</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onGetStarted("login")} style={{background:"transparent",border:"1px solid #1E2535",color:"#8B95A8",padding:"8px 18px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.target.style.borderColor="#2d3a50";e.target.style.color="#F1F5F9";}}
            onMouseLeave={e=>{e.target.style.borderColor="#1E2535";e.target.style.color="#8B95A8";}}>
            Log in
          </button>
          <button onClick={()=>onGetStarted("signup")} className="lp-btn-main" style={{background:"#4ADE80",border:"none",color:"#060A0E",padding:"8px 20px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 20px rgba(74,222,128,0.2)"}}>
            Start free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{position:"relative",overflow:"hidden",padding:"100px 32px 80px",textAlign:"center",maxWidth:800,margin:"0 auto"}}>
        {/* Glow blobs */}
        <div style={{position:"absolute",top:"-10%",left:"50%",transform:"translateX(-50%)",width:600,height:400,background:"radial-gradient(ellipse,rgba(74,222,128,0.08) 0%,transparent 70%)",pointerEvents:"none",animation:"glowPulse 6s ease infinite"}}/>
        <div style={{position:"absolute",bottom:0,left:"-10%",width:400,height:300,background:"radial-gradient(ellipse,rgba(96,165,250,0.05) 0%,transparent 70%)",pointerEvents:"none"}}/>

        <div className="lp-fade" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#0d2018",border:"1px solid #4ADE8033",borderRadius:20,padding:"5px 14px 5px 10px",marginBottom:28}}>
          <span style={{background:"#4ADE80",color:"#060A0E",fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:10,letterSpacing:"0.06em"}}>NEW</span>
          <span style={{color:"#4ADE80",fontSize:12,fontWeight:500}}>Recurring invoices now live</span>
        </div>

        <h1 className="lp-fade-2" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,7vw,72px)",fontWeight:900,margin:"0 0 20px",lineHeight:1.05,letterSpacing:"-0.03em"}}>
          Finance tools built<br/>
          <em style={{fontStyle:"italic",color:"#4ADE80"}}>for freelancers</em>
        </h1>

        <p className="lp-fade-3" style={{fontSize:"clamp(15px,2vw,18px)",color:"#8B95A8",marginBottom:36,maxWidth:520,margin:"0 auto 36px",lineHeight:1.7,fontWeight:400}}>
          Invoice clients, track expenses, and see your cash flow — all in one beautifully simple dashboard.
        </p>

        <div className="lp-fade-4" style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>onGetStarted("signup")} className="lp-btn-main" style={{background:"#4ADE80",border:"none",color:"#060A0E",padding:"14px 32px",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 8px 32px rgba(74,222,128,0.25)"}}>
            Start free — 14 days trial
          </button>
          <button onClick={()=>onGetStarted("login")} style={{background:"#141A22",border:"1px solid #1E2535",color:"#F1F5F9",padding:"14px 32px",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:600,fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}
            onMouseEnter={e=>e.target.style.borderColor="#2d3a50"}
            onMouseLeave={e=>e.target.style.borderColor="#1E2535"}>
            Log in
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{borderTop:"1px solid #1E2535",borderBottom:"1px solid #1E2535",background:"#0F1318",padding:"20px 32px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:24,textAlign:"center"}}>
          {[
            {val:"14 days",lbl:"Free trial"},
            {val:"$15/mo",lbl:"After trial"},
            {val:"15",lbl:"Currencies"},
            {val:"PDF",lbl:"Invoice export"},
            {val:"CSV",lbl:"Data export"},
          ].map((s,i)=>(
            <div key={i}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:800,color:"#4ADE80",marginBottom:4}}>{s.val}</div>
              <div style={{fontSize:12,color:"#4B5563",fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div style={{maxWidth:1000,margin:"80px auto",padding:"0 32px"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{fontSize:11,fontWeight:700,color:"#4ADE80",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>Everything you need</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:800,margin:0,letterSpacing:"-0.02em"}}>Stop juggling spreadsheets</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
          {[
            {icon:"◎",title:"Smart Invoicing",desc:"Create professional PDF invoices in seconds. Mark paid, track overdue, and set up recurring billing for retainer clients."},
            {icon:"◉",title:"Expense Tracking",desc:"Log every business cost by category. See exactly where your money goes with beautiful monthly breakdowns."},
            {icon:"◈",title:"Cash Flow Dashboard",desc:"Your income, expenses, and net profit — updated live. Know your numbers without opening a spreadsheet."},
            {icon:"◐",title:"Payment Alerts",desc:"Never miss a due date. Set alerts for subscriptions, tax payments, or any recurring bill."},
            {icon:"◫",title:"Client Management",desc:"Store client contact info, see total billed per client, and view their full invoice history at a glance."},
            {icon:"⬡",title:"Bank Import",desc:"Upload your bank statement CSV and instantly categorise transactions as business expenses."},
          ].map((f,i)=>(
            <div key={i} className="lp-card" style={{background:"#141A22",border:"1px solid #1E2535",borderRadius:16,padding:"24px"}}>
              <div style={{fontSize:28,marginBottom:14,color:"#4ADE80"}}>{f.icon}</div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:8,letterSpacing:"-0.01em"}}>{f.title}</div>
              <div style={{fontSize:13,color:"#4B5563",lineHeight:1.7}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{background:"#0F1318",borderTop:"1px solid #1E2535",borderBottom:"1px solid #1E2535",padding:"80px 32px"}}>
        <div style={{maxWidth:440,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#4ADE80",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>Simple pricing</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:800,margin:"0 0 36px",letterSpacing:"-0.02em"}}>One plan. Everything included.</h2>
          <div style={{background:"#141A22",border:"1px solid #1E2535",borderRadius:20,overflow:"hidden"}}>
            <div style={{background:"#0d2018",borderBottom:"1px solid #1E2535",padding:"32px",textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:56,fontWeight:900,color:"#4ADE80",lineHeight:1}}>$15</div>
              <div style={{color:"#4B5563",fontSize:14,marginTop:8}}>per month, cancel anytime</div>
            </div>
            <div style={{padding:"28px 32px"}}>
              {["14-day free trial, no card required","Unlimited invoices & PDF export","Expense tracking & CSV export","Client management","Bank CSV import","Recurring invoices","Payment alerts","Multi-currency (15 currencies)"].map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <span style={{color:"#4ADE80",fontSize:12,fontWeight:700,width:18,flexShrink:0}}>✓</span>
                  <span style={{fontSize:13,color:"#8B95A8"}}>{f}</span>
                </div>
              ))}
              <button onClick={()=>onGetStarted("signup")} className="lp-btn-main" style={{width:"100%",background:"#4ADE80",border:"none",color:"#060A0E",padding:"14px",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",marginTop:8,boxShadow:"0 8px 32px rgba(74,222,128,0.2)"}}>
                Start 14-day free trial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{padding:"80px 32px",textAlign:"center",maxWidth:600,margin:"0 auto"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,4vw,40px)",fontWeight:800,margin:"0 0 16px",letterSpacing:"-0.02em"}}>
          Ready to take control<br/>of your finances?
        </h2>
        <p style={{color:"#4B5563",fontSize:15,marginBottom:32,lineHeight:1.7}}>Join freelancers who use Ledgr to get paid faster and spend less time on admin.</p>
        <button onClick={()=>onGetStarted("signup")} className="lp-btn-main" style={{background:"#4ADE80",border:"none",color:"#060A0E",padding:"14px 36px",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 8px 32px rgba(74,222,128,0.25)"}}>
          Get started free
        </button>
        <p style={{color:"#4B5563",fontSize:12,marginTop:16}}>No credit card required · Cancel anytime</p>
      </div>

      {/* Footer */}
      <div style={{borderTop:"1px solid #1E2535",padding:"20px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:22,height:22,background:"linear-gradient(135deg,#4ADE80,#22c55e)",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#060A0E"}}>L</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700}}>Ledgr</span>
        </div>
        <div style={{display:"flex",gap:20,alignItems:"center"}}>
          <a href="/about" style={{color:"#4B5563",fontSize:12,textDecoration:"none"}}>About</a>
          <a href="/contact" style={{color:"#4B5563",fontSize:12,textDecoration:"none"}}>Contact</a>
          <a href="/privacy" style={{color:"#4B5563",fontSize:12,textDecoration:"none"}}>Privacy</a>
          <span style={{color:"#4B5563",fontSize:12}}>ledgrapp.co.uk</span>
        </div>
      </div>
    </div>
  );
}


// ── Admin Dashboard ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://phjybvphmlzghdebonzy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanlidnBobWx6Z2hkZWJvbnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTI2MDIsImV4cCI6MjA4ODE2ODYwMn0.6r7C6aQPn0YTjmDjRkP8fVd6cQhXJ_L1jBYqsu2qRWM";
const ADMIN_EMAIL = "azubuikedavies@gmail.com";

function AdminDashboard({ session, onExit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-stats`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON}`, "apikey": SUPABASE_ANON },
          body: JSON.stringify({ email: session.user.email }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch(e) { setError(e.message); }
      setLoading(false);
    };
    load();
  }, []);

  const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "-";
  const statusColor = s => s==="active"?"#4ADE80":s==="trialing"?"#FBBF24":s==="canceled"?"#F87171":"#8B95A8";
  const statusBg = s => s==="active"?"#0a2018":s==="trialing"?"#1f1508":s==="canceled"?"#1f0808":"#141A22";

  const filtered = (data?.users||[]).filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{minHeight:"100vh",background:"#080B10",color:"#F1F5F9",fontFamily:"'DM Sans',sans-serif"}}>
      {/* Header */}
      <div style={{background:"#0F1318",borderBottom:"1px solid #1E2535",padding:"16px 32px",display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:32,height:32,background:"linear-gradient(135deg,#4ADE80,#22c55e)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#060A0E"}}>L</div>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:800}}>Ledgr Admin</div>
          <div style={{fontSize:11,color:"#4B5563"}}>Signed in as {session.user.email}</div>
        </div>
        <button onClick={onExit} style={{marginLeft:"auto",background:"#141A22",border:"1px solid #1E2535",color:"#8B95A8",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
          Back to App
        </button>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
        {loading && <div style={{textAlign:"center",padding:60,color:"#4B5563"}}>Loading users...</div>}
        {error && <div style={{background:"#1f0808",border:"1px solid #F8717144",borderRadius:12,padding:20,color:"#F87171"}}>{error}</div>}

        {data && (
          <>
            {/* Stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:32}}>
              {[
                {label:"Total Users", value:data.stats.total_users, color:"#F1F5F9"},
                {label:"Active Subs", value:data.stats.active_subs, color:"#4ADE80"},
                {label:"On Trial", value:data.stats.trialing, color:"#FBBF24"},
                {label:"Churned", value:data.stats.churned, color:"#F87171"},
                {label:"MRR", value:`$${data.stats.mrr}`, color:"#4ADE80"},
              ].map((s,i) => (
                <div key={i} style={{background:"#141A22",border:"1px solid #1E2535",borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color}55,transparent)`}}/>
                  <div style={{fontSize:9,fontWeight:700,color:"#4B5563",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{s.label}</div>
                  <div style={{fontSize:26,fontWeight:800,color:s.color,fontFamily:"'Playfair Display',serif"}}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{marginBottom:16}}>
              <input
                value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search by email or name..."
                style={{width:"100%",maxWidth:400,background:"#0F1318",border:"1px solid #1E2535",borderRadius:10,padding:"10px 14px",color:"#F1F5F9",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif"}}
                onFocus={e=>e.target.style.borderColor="#4ADE8088"}
                onBlur={e=>e.target.style.borderColor="#1E2535"}
              />
            </div>

            {/* Users table */}
            <div style={{background:"#0F1318",border:"1px solid #1E2535",borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"14px 20px",borderBottom:"1px solid #1E2535",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 80px 80px 80px",gap:12,fontSize:10,fontWeight:700,color:"#4B5563",textTransform:"uppercase",letterSpacing:"0.08em"}}>
                <div>User</div>
                <div>Joined</div>
                <div>Trial ends</div>
                <div>Status</div>
                <div>Invoices</div>
                <div>Expenses</div>
              </div>
              {filtered.length === 0 && (
                <div style={{padding:40,textAlign:"center",color:"#4B5563"}}>No users found.</div>
              )}
              {filtered.map((u,i) => (
                <div key={u.id} style={{padding:"14px 20px",borderBottom:i<filtered.length-1?"1px solid #1E253588":"none",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 80px 80px 80px",gap:12,alignItems:"center",transition:"background 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#141A22"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{u.email}</div>
                    {u.name && <div style={{fontSize:11,color:"#4B5563"}}>{u.name}</div>}
                  </div>
                  <div style={{fontSize:12,color:"#8B95A8"}}>{fmtDate(u.created_at)}</div>
                  <div style={{fontSize:12,color:"#8B95A8"}}>{fmtDate(u.trial_ends_at)}</div>
                  <div>
                    <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:statusBg(u.subscription_status),color:statusColor(u.subscription_status),border:`1px solid ${statusColor(u.subscription_status)}33`,whiteSpace:"nowrap"}}>
                      {u.subscription_status||"trialing"}
                    </span>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:"#8B95A8",textAlign:"center"}}>{u.invoices}</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#8B95A8",textAlign:"center"}}>{u.expenses}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,fontSize:12,color:"#4B5563",textAlign:"right"}}>{filtered.length} of {data.users.length} users</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ initialMode="login" }) {
  const [mode, setMode] = useState(initialMode);
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
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes floatGlow{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:0.8;transform:scale(1.1)}}`}</style>
      <div style={{position:"absolute",top:"-30%",left:"-20%",width:"60%",height:"60%",background:`radial-gradient(circle,rgba(74,222,128,0.07) 0%,transparent 70%)`,pointerEvents:"none",animation:"floatGlow 8s ease infinite"}}/>
      <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:"50%",height:"50%",background:`radial-gradient(circle,rgba(96,165,250,0.05) 0%,transparent 70%)`,pointerEvents:"none",animation:"floatGlow 8s ease infinite",animationDelay:"4s"}}/>
      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:56, height:56, background:`linear-gradient(135deg,${C.accent},#22c55e)`, borderRadius:16, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:900, color:"#060A0E", marginBottom:18, boxShadow:`0 8px 32px rgba(74,222,128,0.25)` }}>L</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:800, color:C.text, letterSpacing:"-0.02em" }}>Ledgr</div>
          <div style={{ color:C.muted, fontSize:13, marginTop:6 }}>Personal & Business Finance</div>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"36px 32px", boxShadow:"0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)" }}>
          <h2 style={{ color:C.text, fontSize:18, fontWeight:700, margin:"0 0 24px", fontFamily:"'Playfair Display',serif" }}>
            {mode==="login"?"Welcome back":mode==="signup"?"Start your 14-day free trial":"Reset password"}
          </h2>
          <TextInput label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" onKeyDown={e=>e.key==="Enter"&&handle()}/>
          {mode!=="reset" && <TextInput label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="min 6 characters" onKeyDown={e=>e.key==="Enter"&&handle()}/>}
          {error && <div style={{ background:C.dangerDim, border:`1px solid ${C.danger}44`, borderRadius:8, padding:"10px 14px", color:C.danger, fontSize:13, marginBottom:16 }}>{error}</div>}
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
function generatePDF(inv, profile={}) {
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
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [accountTxs, setAccountTxs] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [wiseKey, setWiseKey] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [revolutKey, setRevolutKey] = useState("");
  const [revolutType, setRevolutType] = useState("business");
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
  const [newInv, setNewInv] = useState({ client:"", client_id:null, client_email:"", amount:"", due_date:"", type:"business", description:"", status:"pending", recurring:false, recurring_frequency:"monthly" });
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
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = session?.user?.email === ADMIN_EMAIL;
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

  useEffect(() => { if (session) { loadAll(); loadAccounts(); } }, [session]);

  const loadAll = async () => {
    setLoading(true);
    const uid = session?.user?.id;
    if (!uid) { setLoading(false); return; }
    try {
      const [inv, exp, alr, pro, cli] = await Promise.all([
        supabase.from("invoices").select("*").eq("user_id",uid).order("created_at",{ascending:false}),
        supabase.from("expenses").select("*").eq("user_id",uid).order("created_at",{ascending:false}),
        supabase.from("alerts").select("*").eq("user_id",uid).order("created_at",{ascending:false}),
        supabase.from("profiles").select("*").eq("id",uid).single(),
        supabase.from("clients").select("*").eq("user_id",uid).order("name",{ascending:true}),
      ]);
      const today = new Date().toISOString().split("T")[0];
      if (inv.data) {
        // Auto-detect overdue: pending invoices past their due_date
        const marked = inv.data.map(i =>
          i.status === "pending" && i.due_date && i.due_date < today
            ? {...i, status:"overdue"} : i
        );
        setInvoices(marked);
      }
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
    } catch(e) {
      console.error("loadAll error:", e);
    } finally {
      setLoading(false);
    }
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
  const [linkLoading, setLinkLoading] = useState(null); // invoice id being processed
  const [reminderSending, setReminderSending] = useState(null);
  const [linkCopied, setLinkCopied] = useState(null);
  const getOrCreatePayLink = async (inv) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-stripe-url`, {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
      body: JSON.stringify({ invoice_id: inv.id, user_id: session.user.id }),
    });
    const { url, error } = await res.json();
    if (error) throw new Error(error);
    setInvoices(p => p.map(x => x.id===inv.id ? {...x, payment_link: url} : x));
    return url;
  };
  const sendPaymentLink = async (inv) => {
    setLinkLoading(inv.id);
    try {
      const url = await getOrCreatePayLink(inv);
      await navigator.clipboard.writeText(url);
      setLinkCopied(inv.id);
      setTimeout(() => setLinkCopied(null), 3000);
    } catch(e) { alert("Could not generate payment link: " + e.message); }
    setLinkLoading(null);
  };
  const emailPaymentLink = async (inv) => {
    setLinkLoading(inv.id + "-email");
    try {
      const url = await getOrCreatePayLink(inv);
      const businessName = profile?.name || "your service provider";
      const amount = new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(inv.amount);
      const subject = encodeURIComponent(`Invoice for ${amount} from ${businessName}`);
      const body = encodeURIComponent(
`Hi ${inv.client},

Please find your invoice for ${amount} below.

${inv.description ? "Description: " + inv.description + "\n\n" : ""}You can pay securely online here:
${url}

Thank you,
${businessName}`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
    } catch(e) { alert("Could not generate payment link: " + e.message); }
    setLinkLoading(null);
  };
  const sendReminderNow = async (inv, reminderType) => {
    if (!inv.client_email) { alert("Please add the client\'s email address to this invoice first."); return; }
    setReminderSending(inv.id + "-" + reminderType);
    try {
      const senderName = profile?.business_name || profile?.name || "Your freelancer";
      const amount = new Intl.NumberFormat("en-US",{style:"currency",currency:inv.currency||"USD"}).format(inv.amount);
      const dueDateStr = new Date(inv.due_date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
      // Call edge function directly for manual send
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-invoice-reminder-manual`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
        body: JSON.stringify({
          invoice_id: inv.id,
          user_id: session.user.id,
          reminder_type: reminderType,
          client_email: inv.client_email,
          client_name: inv.client,
          sender_name: senderName,
          amount, due_date: dueDateStr,
          description: inv.description || inv.name,
          payment_link: inv.payment_link,
          invoice_number: inv.invoice_number || inv.id.slice(0,8).toUpperCase(),
          reply_to: profile?.email,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert(`Reminder sent to ${inv.client_email}`);
    } catch(e) { alert("Failed to send: " + e.message); }
    setReminderSending(null);
  };


  const delInvoice = async (id) => { await supabase.from("invoices").delete().eq("id",id); setInvoices(p=>p.filter(x=>x.id!==id)); };
  const delExpense = async (id) => { await supabase.from("expenses").delete().eq("id",id); setExpenses(p=>p.filter(x=>x.id!==id)); };
  const delAlert   = async (id) => { await supabase.from("alerts").delete().eq("id",id); setAlerts(p=>p.filter(x=>x.id!==id)); };

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

  // ── Accounts ──────────────────────────────────────────────────────
  const loadAccounts = async () => {
    setAccountsLoading(true);
    const uid = session?.user?.id;
    const [accs, txs] = await Promise.all([
      supabase.from("connected_accounts").select("*").eq("user_id",uid).eq("is_active",true).order("created_at",{ascending:false}),
      supabase.from("account_transactions").select("*").eq("user_id",uid).order("date",{ascending:false}).limit(100),
    ]);
    if (accs.data) setConnectedAccounts(accs.data);
    if (txs.data) setAccountTxs(txs.data);
    setAccountsLoading(false);
  };

  const connectRevolut = async (apiKey, accountType) => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/connect-revolut`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
        body: JSON.stringify({ action:"connect", user_id:session.user.id, api_key:apiKey, account_type:accountType }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await loadAccounts();
    } catch(e) { alert("Revolut connection failed: " + e.message); }
    setAccountsLoading(false);
  };

  const connectPaypal = async (clientId, secret) => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/connect-paypal`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
        body: JSON.stringify({ action:"connect", user_id:session.user.id, client_id:clientId, secret }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await loadAccounts();
    } catch(e) { alert("PayPal connection failed: " + e.message); }
    setAccountsLoading(false);
  };

  const connectWise = async (apiKey) => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/connect-wise`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
        body: JSON.stringify({ action:"connect", user_id:session.user.id, api_key:apiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await loadAccounts();
    } catch(e) { alert("Wise connection failed: " + e.message); }
    setAccountsLoading(false);
  };

  const connectStripe = async (apiKey) => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/connect-stripe`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
        body: JSON.stringify({ action:"connect", user_id:session.user.id, api_key:apiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await loadAccounts();
    } catch(e) { alert("Stripe connection failed: " + e.message); }
    setAccountsLoading(false);
  };

  const syncAccount = async (accountId, provider) => {
    setAccountsLoading(true);
    try {
      const fn = provider === "stripe" ? "connect-stripe" : provider === "paypal" ? "connect-paypal" : provider === "revolut" ? "connect-revolut" : "connect-wise";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
        body: JSON.stringify({ action:"sync", user_id:session.user.id, account_id:accountId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await loadAccounts();
    } catch(e) { alert("Sync failed: " + e.message); }
    setAccountsLoading(false);
  };

  const disconnectAccount = async (accountId, provider) => {
    if (!confirm("Disconnect this account? Your transaction history will be kept.")) return;
    const fn = provider === "stripe" ? "connect-stripe" : provider === "paypal" ? "connect-paypal" : provider === "revolut" ? "connect-revolut" : "connect-wise";
    await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
      body: JSON.stringify({ action:"disconnect", user_id:session.user.id, account_id:accountId }),
    });
    setConnectedAccounts(p => p.filter(a => a.id !== accountId));
  };

  const importTxAsExpense = async (tx) => {
    if (tx.imported_as_expense) return;
    const { data } = await supabase.from("expenses").insert({
      name: tx.description,
      amount: tx.amount,
      category: tx.category || "Bank Transaction",
      date: tx.date,
      type: "business",
      user_id: session.user.id,
    }).select().single();
    if (data) {
      setExpenses(p => [data, ...p]);
      await supabase.from("account_transactions").update({ imported_as_expense: true }).eq("id", tx.id);
      setAccountTxs(p => p.map(t => t.id===tx.id ? {...t, imported_as_expense:true} : t));
    }
  };

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

  // Public pay page - no auth needed
  if (window.location.pathname === "/contact") return <ContactPage/>;
  if (window.location.pathname === "/about") return <AboutPage/>;
  if (window.location.pathname === "/privacy") return <PrivacyPage/>;
  if (window.location.pathname.startsWith("/pay/")) return <PayPage/>;

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
  if (!session) return <LandingOrAuth/>;
  if (isAdmin && showAdmin) return <AdminDashboard session={session} onExit={()=>setShowAdmin(false)}/>;
  if (!loading && profile && !isActive()) return <PaywallScreen session={session} onSignOut={signOut}/>;

  const TABS=[{id:"dashboard",label:"Dashboard"},{id:"invoices",label:"Invoices"},{id:"expenses",label:"Expenses"},{id:"alerts",label:"Alerts"},{id:"clients",label:"Clients"},{id:"accounts",label:"Accounts"},{id:"bank",label:"Bank"},{id:"charts",label:"Charts"},{id:"tax",label:"Tax"}];
  const goTab=(id)=>{setTab(id);setSidebarOpen(false);};

  const ICONS={dashboard:"◈",invoices:"◎",expenses:"◉",alerts:"◐",clients:"◫",accounts:"⬢",bank:"⬡",charts:"◭"};
  const SidebarContent=()=>(
    <>
      <div style={{marginBottom:28,paddingBottom:20,borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:34,height:34,background:`linear-gradient(135deg,${C.accent},#22c55e)`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#060A0E",boxShadow:`0 4px 16px ${C.accentGlow}`}}>L</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,letterSpacing:"-0.01em"}}>Ledgr</span>
          {isMobile&&<button onClick={()=>setSidebarOpen(false)} style={{marginLeft:"auto",background:C.card,border:`1px solid ${C.border}`,color:C.textDim,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>}
        </div>
        <p style={{color:C.muted,fontSize:11,margin:0,paddingLeft:44,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user.email}</p>
      </div>
      <nav style={{flex:1}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>goTab(t.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",borderRadius:10,border:"none",cursor:"pointer",background:tab===t.id?C.accentDim:"transparent",color:tab===t.id?C.accent:C.textDim,fontSize:13,fontWeight:tab===t.id?700:400,marginBottom:2,textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",position:"relative"}}>
            <span style={{fontSize:14,opacity:0.8}}>{ICONS[t.id]||"·"}</span>
            {t.label}
            {tab===t.id&&<span style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:2,background:C.accent,borderRadius:2}}/>}
            {t.id==="alerts"&&upcoming.length>0&&<span style={{marginLeft:"auto",background:C.warning,color:"#000",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:10,letterSpacing:"0.05em"}}>{upcoming.length}</span>}
          </button>
        ))}
      </nav>
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:16}}>
        <p style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,paddingLeft:12}}>Filter</p>
        {["all","business","personal"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{display:"block",width:"100%",padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",background:filter===f?C.card:"transparent",color:filter===f?C.text:C.muted,fontSize:12,fontFamily:"'DM Sans',sans-serif",marginBottom:2,fontWeight:filter===f?600:400,transition:"all 0.15s"}}>
            {f==="all"?"All finances":f==="business"?"Business only":"Personal only"}
          </button>
        ))}
      </div>
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:16}}>
        {profile?.subscription_status==="active"&&<div style={{fontSize:11,color:C.accent,fontWeight:700,padding:"6px 12px",marginBottom:8,background:C.accentDim,borderRadius:8,display:"flex",alignItems:"center",gap:6}}><span>✓</span> Pro</div>}
        <button onClick={()=>{setEditPro(profile||{});setModal("profile");setSidebarOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",background:"transparent",color:C.textDim,fontSize:12,fontFamily:"'DM Sans',sans-serif",marginBottom:2,transition:"all 0.15s"}}>⚙ Profile</button>
        {isAdmin&&<button onClick={()=>setShowAdmin(true)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",background:C.accentDim,color:C.accent,fontSize:12,fontFamily:"'DM Sans',sans-serif",marginBottom:4,fontWeight:700}}>◈ Admin</button>}
        <button onClick={signOut} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",background:"transparent",color:C.danger,fontSize:12,fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>⎋ Sign out</button>
      </div>
    </>
  );

  const totalAccountBalance = connectedAccounts.reduce((s,a)=>s+(a.balance||0),0);
  const stats=[
    {label:"Collected",value:money(totalIncome),color:C.accent},
    {label:"Pending",value:money(totalPending),color:C.warning},
    {label:"Overdue",value:money(totalOverdue),color:C.danger},
    {label:"Expenses",value:money(totalExp),color:"#60A5FA"},
    {label:"Net Profit",value:money(netProfit),color:netProfit>=0?C.accent:C.danger},
    ...(connectedAccounts.length>0?[{label:"Account Balance",value:money(totalAccountBalance),color:"#A78BFA"}]:[]),
  ];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        input::placeholder { color: ${C.muted}; opacity: 0.7; }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .tab-content { animation: fadeSlideUp 0.2s ease; }
      `}</style>

      {profile && <TrialBanner profile={profile} session={session}/>}

      <div style={{display:"flex",flex:1,minHeight:0}}>
        {!isMobile&&(
          <div style={{width:228,background:C.surface,borderRight:`1px solid ${C.border}`,padding:"24px 14px",display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
            <SidebarContent/>
          </div>
        )}
        {isMobile&&sidebarOpen&&(
          <div onMouseDown={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)",zIndex:9998}}>
            <div onMouseDown={e=>e.stopPropagation()} style={{width:260,height:"100%",background:C.surface,borderRight:`1px solid ${C.border}`,padding:"24px 14px",display:"flex",flexDirection:"column",overflowY:"auto"}}>
              <SidebarContent/>
            </div>
          </div>
        )}

        <div style={{flex:1,overflowY:"auto",paddingBottom:isMobile?80:0}}>
          {isMobile&&(
            <div style={{position:"sticky",top:0,zIndex:100,background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,backdropFilter:"blur(20px)"}}>
              <button onClick={()=>setSidebarOpen(true)} style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,borderRadius:9,width:38,height:38,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>☰</button>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>Ledgr</span>
              <span style={{marginLeft:"auto",color:C.muted,fontSize:12,fontWeight:500}}>{TABS.find(t=>t.id===tab)?.label}</span>
            </div>
          )}

          {loading&&<div style={{padding:60,textAlign:"center",color:C.muted}}>Loading your data...</div>}
          {!loading&&(
            <div className="tab-content" style={{padding:isMobile?"16px":"32px 40px",maxWidth:1100,width:"100%"}}>

              {tab==="dashboard"&&(
                <div>
                  <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 6px",fontWeight:800,letterSpacing:"-0.02em"}}>Financial Overview</h1>
                  <p style={{color:C.muted,fontSize:13,marginBottom:28,fontWeight:400}}>Your money, all in one place.</p>

                  {/* Onboarding checklist — show only if not fully set up */}
                  {(()=>{
                    const steps = [
                      { id:"profile", label:"Complete your profile", desc:"Add your name so invoices look professional.", done:!!(profile?.name), action:()=>setModal("profile"), cta:"Set up profile" },
                      { id:"client", label:"Add your first client", desc:"You'll need a client to create an invoice.", done:clients.length>0, action:()=>setModal("client"), cta:"Add client" },
                      { id:"invoice", label:"Create your first invoice", desc:"Send a professional invoice in seconds.", done:invoices.length>0, action:()=>setModal("invoice"), cta:"Create invoice" },
                      { id:"account", label:"Connect a payment account", desc:"See all your money in one place.", done:connectedAccounts.length>0, action:()=>setTab("accounts"), cta:"Connect account" },
                    ];
                    const doneCount = steps.filter(s=>s.done).length;
                    if(doneCount===steps.length) return null; // fully onboarded, hide
                    const pct = Math.round((doneCount/steps.length)*100);
                    return(
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:24,position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.accent},${C.accent} ${pct}%,${C.border} ${pct}%)`}}/>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>Get started with Ledgr</div>
                            <div style={{fontSize:12,color:C.muted}}>{doneCount} of {steps.length} steps complete</div>
                          </div>
                          <div style={{fontSize:22,fontWeight:800,color:C.accent,fontFamily:"'Playfair Display',serif"}}>{pct}%</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {steps.map((s,i)=>(
                            <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:s.done?"transparent":C.bg,borderRadius:10,border:`1px solid ${s.done?C.border:C.border}`,opacity:s.done?0.5:1}}>
                              <div style={{width:22,height:22,borderRadius:"50%",background:s.done?C.accent:C.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:700,color:s.done?"#060A0E":C.muted,transition:"all 0.3s"}}>
                                {s.done?"✓":i+1}
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:s.done?500:700,textDecoration:s.done?"line-through":"none",color:s.done?C.muted:C.text}}>{s.label}</div>
                                {!s.done&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{s.desc}</div>}
                              </div>
                              {!s.done&&<button onClick={s.action} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,color:C.accent,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0,whiteSpace:"nowrap"}}>{s.cta} →</button>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(5,1fr)",gap:10,marginBottom:28}}>
                    {stats.map((s,i)=>(
                      <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",position:"relative",overflow:"hidden",transition:"border-color 0.2s"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color}44,transparent)`}}/>
                        <div style={{color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>{s.label}</div>
                        <div style={{color:s.color,fontSize:isMobile?14:18,fontWeight:800,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px",marginBottom:12}}>
                    <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Recent Invoices</h3>
                    {invoices.length===0&&<p style={{color:C.muted,fontSize:13}}>No invoices yet - create your first one!</p>}
                    {invoices.slice(0,4).map(inv=>(
                      <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:12,marginBottom:12,borderBottom:`1px solid ${C.border}`}}>
                        <div><div style={{fontSize:14,fontWeight:600}}>{inv.client}</div><div style={{fontSize:12,color:C.muted}}>{inv.description}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700}}>{money(inv.amount)}</div><StatusPill status={inv.status}/></div>
                      </div>
                    ))}
                  </div>
                  {upcoming.length>0&&(
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px"}}>
                      <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Upcoming Payments</h3>
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
                    <div><h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Invoices</h1><p style={{color:C.muted,fontSize:13,margin:0}}>{fInvoices.length} invoices</p></div>
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <Btn onClick={()=>setModal("invoice")} style={{padding:"10px 14px",fontSize:13}}>+ New</Btn>
                      <Btn variant="secondary" onClick={()=>exportCSV("invoices",invoices,expenses)} style={{padding:"10px 14px",fontSize:13}}>CSV</Btn>
                    </div>
                  </div>
                  {fInvoices.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:C.muted,background:C.card,borderRadius:16,border:`1px solid ${C.border}`}}>No invoices yet.</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {fInvoices.map(inv=>(
                      <div key={inv.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",transition:"border-color 0.2s,transform 0.15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="#2d3548";e.currentTarget.style.transform="translateY(-1px)";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                              {inv.client}
                              {inv.recurring&&<span style={{fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:5,background:C.blueDim,color:C.blue,letterSpacing:"0.08em",border:`1px solid ${C.blue}33`}}>RECURRING</span>}
                            </div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Badge type={inv.type}/><StatusPill status={inv.status}/></div>
                          </div>
                          <div style={{fontSize:20,fontWeight:800,fontFamily:"'Playfair Display',serif",textAlign:"right"}}>
                            {money(inv.amount)}
                          </div>
                        </div>
                        <div style={{fontSize:12,color:C.muted,marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>{inv.description} · Due {inv.due_date?fmtDate(inv.due_date):"-"}</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          <Btn variant="secondary" onClick={()=>generatePDF(inv,profile||{})} style={{padding:"8px 14px",fontSize:12,color:C.accent,flex:1}}>PDF</Btn>
                          {inv.status!=="paid"&&<Btn onClick={()=>markPaid(inv.id)} style={{padding:"8px 14px",fontSize:12,flex:1}}>Mark Paid</Btn>}
                          {inv.status!=="paid"&&<Btn variant="secondary" onClick={()=>sendPaymentLink(inv)} disabled={!!linkLoading} style={{padding:"8px 14px",fontSize:12,flex:1,color:linkCopied===inv.id?"#4ADE80":C.blue,border:`1px solid ${linkCopied===inv.id?"#4ADE8044":C.blue+"44"}`}}>
                            {linkLoading===inv.id?"..." : linkCopied===inv.id ? "✓ Copied!" : "🔗 Copy Link"}
                          </Btn>}
                          {inv.status!=="paid"&&<Btn variant="secondary" onClick={()=>emailPaymentLink(inv)} disabled={!!linkLoading} style={{padding:"8px 14px",fontSize:12,flex:1,color:"#FBBF24",border:"1px solid #FBBF2444"}}>
                            {linkLoading===inv.id+"-email" ? "..." : "✉ Email"}
                          </Btn>}
                          {inv.status!=="paid"&&inv.client_email&&(
                            <Btn variant="secondary" onClick={()=>setModal("reminder-"+inv.id)} style={{padding:"8px 14px",fontSize:12,color:"#A78BFA",border:"1px solid #A78BFA44"}}>
                              🔔 Remind
                            </Btn>
                          )}
                          {inv.status!=="paid"&&!inv.client_email&&(
                            <Btn variant="secondary" onClick={()=>setModal("add-client-email-"+inv.id)} style={{padding:"8px 14px",fontSize:12,color:C.muted,border:`1px solid ${C.border}`}}>
                              🔔
                            </Btn>
                          )}
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
                    <div><h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Expenses</h1><p style={{color:C.muted,fontSize:13,margin:0}}>{fExpenses.length} entries</p></div>
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <Btn onClick={()=>setModal("expense")} style={{padding:"10px 14px",fontSize:13}}>+ Add</Btn>
                      <Btn variant="secondary" onClick={()=>exportCSV("expenses",invoices,expenses)} style={{padding:"10px 14px",fontSize:13}}>CSV</Btn>
                    </div>
                  </div>
                  {fExpenses.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:C.muted,background:C.card,borderRadius:16,border:`1px solid ${C.border}`}}>No expenses logged yet.</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {[...fExpenses].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(exp=>(
                      <div key={exp.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,transition:"border-color 0.15s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=C.danger+"44"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                            <span style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.name}</span>
                            <Badge type={exp.type}/>
                          </div>
                          <div style={{fontSize:12,color:C.muted}}>{exp.category} · {exp.date?fmtDate(exp.date):"-"}</div>
                        </div>
                        <div style={{fontSize:16,fontWeight:800,color:C.danger,fontFamily:"'Playfair Display',serif",flexShrink:0}}>{money(exp.amount)}</div>
                        <button onClick={()=>delExpense(exp.id)} style={{background:C.dangerDim,border:`1px solid ${C.danger}33`,color:C.danger,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.15s"}}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab==="alerts"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div><h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Alerts</h1><p style={{color:C.muted,fontSize:13,margin:0}}>Never miss a due date</p></div>
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
                  {clientsError&&<div style={{background:C.dangerDim,border:"1px solid #f8717144",borderRadius:10,padding:16,marginBottom:16,fontSize:13,color:"#f87171"}}>Error: {clientsError}</div>}
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
                          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Clients</h1>
                          <p style={{color:C.muted,fontSize:13,margin:0}}>{clients.length} client{clients.length!==1?"s":""}</p>
                        </div>
                        <Btn onClick={()=>setModal("add-client")} style={{padding:"10px 14px",fontSize:13}}>+ Add</Btn>
                      </div>
                      {clientsError&&(
                        <div style={{background:C.dangerDim,border:`1px solid ${C.danger}44`,borderRadius:10,padding:16,marginBottom:16,fontSize:13,color:C.danger}}>
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

              {tab==="accounts"&&(
                <div>
                  <div style={{marginBottom:24}}>
                    <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Connected Accounts</h1>
                    <p style={{color:C.muted,fontSize:13,margin:0}}>Connect your payment accounts to auto-import transactions</p>
                  </div>

                  {/* Connect new account cards */}
                  {connectedAccounts.length < 4 && (
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:28}}>

                      {/* Wise */}
                      {!connectedAccounts.find(a=>a.provider==="wise") && (
                        <ConnectCard
                          icon="🌍"
                          name="Wise"
                          desc="Connect your Wise account to auto-import transfers and see your balance."
                          color="#4ADE80"
                          onConnect={()=>setModal("connect-wise")}
                        />
                      )}

                      {/* Stripe */}
                      {!connectedAccounts.find(a=>a.provider==="stripe") && (
                        <ConnectCard
                          icon="⚡"
                          name="Stripe"
                          desc="Connect your Stripe account to track payouts and match them to invoices."
                          color="#635bff"
                          onConnect={()=>setModal("connect-stripe")}
                        />
                      )}

                      {/* PayPal */}
                      {!connectedAccounts.find(a=>a.provider==="paypal") && (
                        <ConnectCard
                          icon="🅿"
                          name="PayPal"
                          desc="Track PayPal income and auto-import transactions."
                          color="#009cde"
                          onConnect={()=>setModal("connect-paypal")}
                        />
                      )}

                      {/* Revolut */}
                      {!connectedAccounts.find(a=>a.provider==="revolut") && (
                        <ConnectCard
                          icon="🔄"
                          name="Revolut"
                          desc="Connect Revolut Business or Personal to sync multi-currency transactions."
                          color="#7B61FF"
                          onConnect={()=>setModal("connect-revolut")}
                        />
                      )}
                    </div>
                  )}

                  {/* Connected accounts */}
                  {connectedAccounts.length > 0 && (
                    <div style={{marginBottom:28}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Connected</div>
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                        {connectedAccounts.map(acc => (
                          <div key={acc.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,position:"relative",overflow:"hidden"}}>
                            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:acc.provider==="wise"?"#4ADE80":acc.provider==="stripe"?"#635bff":acc.provider==="paypal"?"#009cde":"#7B61FF"}}/>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{width:36,height:36,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                                  {acc.provider==="wise"?"🌍":acc.provider==="stripe"?"⚡":acc.provider==="paypal"?"🅿":"🔄"}
                                </div>
                                <div>
                                  <div style={{fontSize:14,fontWeight:700}}>{acc.account_name}</div>
                                  <div style={{fontSize:11,color:C.muted,textTransform:"capitalize"}}>{acc.provider} · {acc.currency}</div>
                                </div>
                              </div>
                              <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:"#0a2018",color:C.accent,border:`1px solid ${C.accent}33`}}>LIVE</span>
                            </div>
                            <div style={{marginBottom:14}}>
                              <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Available Balance</div>
                              <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:800,color:C.text}}>{new Intl.NumberFormat("en-US",{style:"currency",currency:acc.currency||"USD"}).format(acc.balance||0)}</div>
                              {acc.balance_updated_at && <div style={{fontSize:11,color:C.muted,marginTop:2}}>Updated {new Date(acc.balance_updated_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              <Btn variant="secondary" onClick={()=>syncAccount(acc.id,acc.provider)} disabled={accountsLoading} style={{flex:1,padding:"8px",fontSize:12}}>
                                {accountsLoading?"Syncing...":"↻ Sync"}
                              </Btn>
                              <Btn variant="danger" onClick={()=>disconnectAccount(acc.id,acc.provider)} style={{padding:"8px 12px",fontSize:12}}>Disconnect</Btn>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transactions */}
                  {accountTxs.length > 0 && (
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Recent Transactions</div>
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:12,padding:"10px 16px",borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>
                          <div>Transaction</div>
                          <div>Date</div>
                          <div>Amount</div>
                          <div>Action</div>
                        </div>
                        {accountTxs.slice(0,30).map((tx,i) => (
                          <div key={tx.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:12,padding:"12px 16px",borderBottom:i<Math.min(accountTxs.length,30)-1?`1px solid ${C.border}88`:"none",alignItems:"center",transition:"background 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHover}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <div>
                              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{tx.description}</div>
                              <div style={{fontSize:11,color:C.muted}}>{tx.category}</div>
                            </div>
                            <div style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{tx.date}</div>
                            <div style={{fontSize:13,fontWeight:700,color:tx.type==="credit"?C.accent:C.danger,whiteSpace:"nowrap"}}>
                              {tx.type==="credit"?"+":"-"}{new Intl.NumberFormat("en-US",{style:"currency",currency:tx.currency||"USD"}).format(tx.amount)}
                            </div>
                            <div>
                              {tx.type==="debit" && !tx.imported_as_expense && (
                                <Btn variant="secondary" onClick={()=>importTxAsExpense(tx)} style={{padding:"5px 10px",fontSize:11,whiteSpace:"nowrap"}}>+ Expense</Btn>
                              )}
                              {tx.imported_as_expense && <span style={{fontSize:11,color:C.muted}}>Added</span>}
                              {tx.type==="credit" && <span style={{fontSize:11,color:C.accent}}>Income</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {connectedAccounts.length === 0 && accountTxs.length === 0 && (
                    <div style={{textAlign:"center",padding:"60px 20px",color:C.muted}}>
                      <div style={{fontSize:36,marginBottom:16}}>⬢</div>
                      <div style={{fontSize:16,fontWeight:600,color:C.textDim,marginBottom:8}}>No accounts connected yet</div>
                      <div style={{fontSize:13}}>Connect Wise or Stripe above to auto-import transactions</div>
                    </div>
                  )}
                </div>
              )}

              {tab==="bank"&&(
                <div>
                  <div style={{marginBottom:20}}>
                    <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Bank & Transactions</h1>
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
                    <div style={{background:C.card,border:`1px solid ${C.accent}33`,borderRadius:12,padding:20}}>
                      <div style={{fontSize:24,marginBottom:10}}>⬢</div>
                      <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>Auto Sync <span style={{fontSize:10,background:"#0a2018",padding:"2px 7px",borderRadius:4,color:C.accent,fontWeight:600,marginLeft:4,border:`1px solid ${C.accent}44`}}>NEW</span></div>
                      <p style={{fontSize:13,color:C.textDim,marginBottom:16,lineHeight:1.6}}>Connect Wise or Stripe to automatically import transactions into Ledgr.</p>
                      <Btn onClick={()=>goTab("accounts")} style={{width:"100%",padding:"10px",fontSize:13}}>Connect Accounts →</Btn>
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

              {tab==="tax"&&(()=>{
                const now = new Date();
                const curYear = now.getFullYear();
                // UK tax year: 6 Apr - 5 Apr. If before 6 Apr, current tax year started last calendar year
                const taxYearStart = now >= new Date(curYear, 3, 6) ? new Date(curYear, 3, 6) : new Date(curYear-1, 3, 6);
                const taxYearEnd = new Date(taxYearStart.getFullYear()+1, 3, 5);
                const [taxYear, setTaxYear] = useState(taxYearStart.getFullYear());
                const tyStart = new Date(taxYear, 3, 6);
                const tyEnd = new Date(taxYear+1, 3, 5);
                const fmtD = d => d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
                const inTY = date => { if(!date) return false; const d = new Date(date); return d >= tyStart && d <= tyEnd; };
                const tyInvoices = invoices.filter(i => i.status==="paid" && inTY(i.due_date));
                const tyExpenses = expenses.filter(e => inTY(e.date));
                const totalIncome = tyInvoices.reduce((s,i)=>s+i.amount,0);
                const totalExpenses = tyExpenses.reduce((s,e)=>s+e.amount,0);
                const bizExpenses = tyExpenses.filter(e=>e.type==="business").reduce((s,e)=>s+e.amount,0);
                const netProfit = totalIncome - bizExpenses;
                // UK income tax estimate (simplified 2024/25)
                const personalAllowance = 12570;
                const taxableIncome = Math.max(0, netProfit - personalAllowance);
                const incomeTax = taxableIncome <= 37700 ? taxableIncome * 0.20 : 37700 * 0.20 + (taxableIncome - 37700) * 0.40;
                // Class 4 NI: 9% on profits £12,570-£50,270, 2% above
                const ni = Math.max(0, Math.min(netProfit, 50270) - 12570) * 0.09 + Math.max(0, netProfit - 50270) * 0.02;
                const totalTaxEst = incomeTax + ni;
                // Expense categories
                const expByCat = tyExpenses.filter(e=>e.type==="business").reduce((acc,e)=>{ acc[e.category||"Other"]=(acc[e.category||"Other"]||0)+e.amount; return acc; },{});
                // Income by client
                const incByClient = tyInvoices.reduce((acc,i)=>{ acc[i.client||"Unknown"]=(acc[i.client||"Unknown"]||0)+i.amount; return acc; },{});

                const exportTaxCSV = () => {
                  const rows = [
                    ["LEDGR TAX REPORT"],
                    [`Tax Year: ${taxYear}/${taxYear+1} (6 Apr ${taxYear} – 5 Apr ${taxYear+1})`],
                    [`Generated: ${new Date().toLocaleDateString("en-GB")}`],
                    [],
                    ["SUMMARY"],
                    ["Total Income", money(totalIncome, profile?.currency)],
                    ["Total Business Expenses", money(bizExpenses, profile?.currency)],
                    ["Net Profit", money(netProfit, profile?.currency)],
                    ["Estimated Income Tax", money(incomeTax, profile?.currency)],
                    ["Estimated Class 4 NI", money(ni, profile?.currency)],
                    ["Total Tax Estimate", money(totalTaxEst, profile?.currency)],
                    [],
                    ["INCOME — PAID INVOICES"],
                    ["Date","Client","Description","Amount"],
                    ...tyInvoices.map(i=>[i.due_date,i.client,i.description,i.amount]),
                    [],
                    ["EXPENSES"],
                    ["Date","Name","Category","Type","Amount"],
                    ...tyExpenses.map(e=>[e.date,e.name,e.category,e.type,e.amount]),
                  ];
                  const csv = rows.map(r=>r.join(",")).join("\n");
                  const blob = new Blob([csv], {type:"text/csv"});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href=url; a.download=`ledgr-tax-${taxYear}-${taxYear+1}.csv`; a.click();
                };

                const years = [];
                for(let y=curYear-2; y<=curYear; y++) years.push(y);

                return(
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,gap:12,flexWrap:"wrap"}}>
                      <div>
                        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Tax Report</h1>
                        <p style={{color:C.muted,fontSize:13,margin:0}}>{fmtD(tyStart)} – {fmtD(tyEnd)}</p>
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <select value={taxYear} onChange={e=>setTaxYear(Number(e.target.value))} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                          {years.map(y=><option key={y} value={y}>{y}/{y+1}</option>)}
                        </select>
                        <Btn onClick={exportTaxCSV} style={{padding:"10px 16px",fontSize:13}}>⬇ Export CSV</Btn>
                      </div>
                    </div>

                    {/* UK deadline banner */}
                    <div style={{background:"#1a0f00",border:"1px solid #3a2000",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:18}}>📅</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:C.warning}}>UK Self Assessment deadline: 31 January {taxYear+2}</div>
                        <div style={{fontSize:12,color:C.muted}}>These figures are estimates only — always confirm with your accountant.</div>
                      </div>
                    </div>

                    {/* Summary cards */}
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:20}}>
                      {[
                        {label:"Total Income",val:money(totalIncome,profile?.currency),color:C.accent,sub:`${tyInvoices.length} paid invoices`},
                        {label:"Business Expenses",val:money(bizExpenses,profile?.currency),color:C.danger,sub:`${tyExpenses.filter(e=>e.type==="business").length} items`},
                        {label:"Net Profit",val:money(netProfit,profile?.currency),color:"#60A5FA",sub:`${Math.round(totalIncome>0?(netProfit/totalIncome)*100:0)}% margin`},
                        {label:"Est. Tax + NI",val:money(totalTaxEst,profile?.currency),color:C.warning,sub:"Simplified UK estimate"},
                      ].map((s,i)=>(
                        <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color}55,transparent)`}}/>
                          <div style={{color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>{s.label}</div>
                          <div style={{color:s.color,fontSize:isMobile?15:20,fontWeight:800,fontFamily:"'Playfair Display',serif",lineHeight:1,marginBottom:4}}>{s.val}</div>
                          <div style={{color:C.muted,fontSize:11}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
                      {/* Tax breakdown */}
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                        <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>Tax Estimate Breakdown</h3>
                        {[
                          {label:"Net Profit",val:netProfit,note:""},
                          {label:"Personal Allowance",val:-personalAllowance,note:"2024/25"},
                          {label:"Taxable Income",val:taxableIncome,note:""},
                          {label:"Income Tax (20%/40%)",val:incomeTax,note:""},
                          {label:"Class 4 NI (9%/2%)",val:ni,note:""},
                        ].map((r,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                            <div style={{fontSize:13,color:i===4?C.text:C.muted}}>{r.label}{r.note&&<span style={{fontSize:10,color:C.muted,marginLeft:6}}>{r.note}</span>}</div>
                            <div style={{fontSize:14,fontWeight:700,color:r.val<0?C.accent:r.label.includes("Tax")||r.label.includes("NI")?C.warning:C.text}}>{r.val<0?"−":""}{money(Math.abs(r.val),profile?.currency)}</div>
                          </div>
                        ))}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0 0"}}>
                          <div style={{fontSize:14,fontWeight:700}}>Total Estimated Tax</div>
                          <div style={{fontSize:18,fontWeight:800,color:C.warning,fontFamily:"'Playfair Display',serif"}}>{money(totalTaxEst,profile?.currency)}</div>
                        </div>
                        <div style={{marginTop:12,padding:"10px 12px",background:"#0a0f18",borderRadius:8,fontSize:11,color:C.muted,lineHeight:1.6}}>
                          💡 Set aside <strong style={{color:C.text}}>{Math.round(totalIncome>0?(totalTaxEst/totalIncome)*100:0)}%</strong> of each payment for tax. Consult an accountant for your exact liability.
                        </div>
                      </div>

                      {/* Expense by category */}
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                        <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>Expenses by Category</h3>
                        {Object.keys(expByCat).length===0&&<p style={{color:C.muted,fontSize:13}}>No business expenses this year.</p>}
                        {Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt],i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:8,height:8,borderRadius:2,background:["#4ADE80","#60A5FA","#FBBF24","#F87171","#C084FC","#34D399"][i%6]}}/>
                              <span style={{fontSize:13,color:C.muted}}>{cat}</span>
                            </div>
                            <div style={{fontSize:13,fontWeight:700}}>{money(amt,profile?.currency)}</div>
                          </div>
                        ))}
                        {Object.keys(expByCat).length>0&&(
                          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 0"}}>
                            <span style={{fontSize:13,fontWeight:700}}>Total</span>
                            <span style={{fontSize:14,fontWeight:800,color:C.danger}}>{money(bizExpenses,profile?.currency)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Income by client */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:16}}>
                      <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>Income by Client</h3>
                      {Object.keys(incByClient).length===0&&<p style={{color:C.muted,fontSize:13}}>No paid invoices this tax year yet.</p>}
                      {Object.entries(incByClient).sort((a,b)=>b[1]-a[1]).map(([client,amt],i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                          <div style={{fontSize:14,fontWeight:600}}>{client}</div>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{fontSize:11,color:C.muted}}>{Math.round((amt/totalIncome)*100)}%</div>
                            <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{money(amt,profile?.currency)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Paid invoices list */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                      <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>Paid Invoices This Year ({tyInvoices.length})</h3>
                      {tyInvoices.length===0&&<p style={{color:C.muted,fontSize:13}}>No paid invoices in this tax year.</p>}
                      {tyInvoices.map((inv,i)=>(
                        <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<tyInvoices.length-1?`1px solid ${C.border}`:"none"}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:600}}>{inv.client}</div>
                            <div style={{fontSize:11,color:C.muted}}>{inv.description} · {inv.due_date}</div>
                          </div>
                          <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{money(inv.amount,profile?.currency)}</div>
                        </div>
                      ))}
                    </div>
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
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 4px",border:"none",background:"transparent",color:tab===t.id?C.accent:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"'DM Sans',sans-serif",position:"relative",transition:"color 0.15s"}}>
              <span style={{fontSize:9,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>{t.label}</span>
              {t.id==="alerts"&&upcoming.length>0&&<span style={{position:"absolute",top:4,right:"50%",marginRight:-20,background:C.warning,color:"#000",fontSize:8,fontWeight:700,padding:"1px 4px",borderRadius:8}}>{upcoming.length}</span>}
            </button>
          ))}
        </div>
      )}

      {modal==="invoice"&&(<Modal title="New Invoice" onClose={close} footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={addInvoice} style={{flex:1}}>Add Invoice</Btn></div>}>
  {clients.length>0&&<SelectInput label="Pick a Client (optional)" value={newInv.client_id||""} onChange={e=>{const c=clients.find(x=>x.id===e.target.value);setNewInv({...newInv,client_id:e.target.value||null,client:c?c.name:newInv.client,client_email:c?.email||newInv.client_email})}}><option value="">- Enter manually -</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.company?" · "+c.company:""}</option>)}</SelectInput>}
  <TextInput label="Client Name" value={newInv.client} onChange={e=>setNewInv({...newInv,client:e.target.value,client_id:null})} placeholder="e.g. Acme Corp"/>
  <TextInput label="Client Email (for reminders)" type="email" value={newInv.client_email||""} onChange={e=>setNewInv({...newInv,client_email:e.target.value})} placeholder="client@email.com"/>
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
{modal==="connect-stripe"&&(
        <Modal title="Connect Stripe" onClose={()=>{close();setStripeKey("");}} footer={
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={()=>{close();setStripeKey("");}} style={{flex:1}}>Cancel</Btn>
            <Btn onClick={async()=>{if(!stripeKey.trim()){alert("Please enter your API key");return;}await connectStripe(stripeKey.trim());close();setStripeKey("");}} style={{flex:1,background:"#635bff",boxShadow:"none"}} disabled={accountsLoading}>
              {accountsLoading?"Connecting...":"Connect Stripe"}
            </Btn>
          </div>
        }>
          <div style={{background:"#120f2a",border:"1px solid #635bff44",borderRadius:12,padding:16,marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#a5a0ff",marginBottom:8}}>How to get your Stripe Restricted Key</div>
            <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.7}}>
              1. Log in to your Stripe Dashboard<br/>
              2. Go to <strong style={{color:"#F1F5F9"}}>Developers → API keys</strong><br/>
              3. Click <strong style={{color:"#F1F5F9"}}>Create restricted key</strong><br/>
              4. Enable <strong style={{color:"#F1F5F9"}}>Read</strong> access for: Balance, Payouts<br/>
              5. Copy and paste the key below
            </div>
          </div>
          <TextInput
            label="Stripe Restricted API Key"
            value={stripeKey}
            onChange={e=>setStripeKey(e.target.value)}
            placeholder="rk_live_..."
            type="password"
          />
          <p style={{fontSize:12,color:"#4B5563",marginTop:-8,lineHeight:1.6}}>
            Use a restricted key with read-only access. We only read your balance and payouts — never initiate transfers.
          </p>
        </Modal>
      )}
      
      {/* Reminder modal for each invoice */}
      {modal&&modal.startsWith("reminder-")&&(()=>{
        const invId = modal.replace("reminder-","");
        const inv = invoices.find(x=>x.id===invId);
        if (!inv) return null;
        const daysUntilDue = inv.due_date ? Math.round((new Date(inv.due_date)-new Date())/(1000*60*60*24)) : null;
        const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
        const daysOverdue = isOverdue ? Math.abs(daysUntilDue) : 0;
        return (
          <Modal title="Send Reminder" onClose={close}>
            <div style={{marginBottom:20}}>
              <p style={{fontSize:13,color:C.muted,marginBottom:16}}>Sending to: <strong style={{color:C.text}}>{inv.client_email}</strong></p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#60a5fa"}}>⏰ Due soon reminder</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>Polite heads-up that invoice is due</div>
                    </div>
                    <Btn onClick={()=>{sendReminderNow(inv,"due-soon");close();}} disabled={reminderSending===inv.id+"-due-soon"} style={{padding:"8px 16px",fontSize:12,background:"#1d3a5a",color:"#60a5fa",boxShadow:"none"}}>
                      {reminderSending===inv.id+"-due-soon"?"Sending...":"Send"}
                    </Btn>
                  </div>
                </div>
                <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#FBBF24"}}>⚠️ Overdue reminder</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>Invoice is past due date</div>
                    </div>
                    <Btn onClick={()=>{sendReminderNow(inv,"overdue-1");close();}} disabled={reminderSending===inv.id+"-overdue-1"} style={{padding:"8px 16px",fontSize:12,background:"#2a1f0a",color:"#FBBF24",boxShadow:"none"}}>
                      {reminderSending===inv.id+"-overdue-1"?"Sending...":"Send"}
                    </Btn>
                  </div>
                </div>
                <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#F87171"}}>🚨 Final chase</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>Urgent — 7 days overdue notice</div>
                    </div>
                    <Btn onClick={()=>{sendReminderNow(inv,"overdue-7");close();}} disabled={reminderSending===inv.id+"-overdue-7"} style={{padding:"8px 16px",fontSize:12,background:"#1f0808",color:"#F87171",boxShadow:"none"}}>
                      {reminderSending===inv.id+"-overdue-7"?"Sending...":"Send"}
                    </Btn>
                  </div>
                </div>
              </div>
            </div>
            <p style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Email will appear from <strong>{profile?.business_name||profile?.name||"you"}</strong> via Ledgr. Replies go directly to your email.</p>
          </Modal>
        );
      })()}

      {/* Add client email modal */}
      {modal&&modal.startsWith("add-client-email-")&&(()=>{
        const invId = modal.replace("add-client-email-","");
        const inv = invoices.find(x=>x.id===invId);
        if (!inv) return null;
        const [tempEmail, setTempEmail] = [inv._tempEmail||"", (v)=>{ inv._tempEmail=v; }];
        return (
          <Modal title="Add Client Email" onClose={close} footer={
            <div style={{display:"flex",gap:10}}>
              <Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn>
              <Btn onClick={async()=>{
                const email = document.getElementById("temp-client-email")?.value;
                if (!email) return;
                await supabase.from("invoices").update({client_email:email}).eq("id",invId);
                setInvoices(p=>p.map(x=>x.id===invId?{...x,client_email:email}:x));
                close();
              }} style={{flex:1}}>Save & Remind</Btn>
            </div>
          }>
            <p style={{fontSize:13,color:C.muted,marginBottom:16}}>Add {inv.client}&apos;s email to enable automatic reminders.</p>
            <TextInput id="temp-client-email" label="Client Email" type="email" placeholder="client@email.com"/>
          </Modal>
        );
      })()}

      {modal==="connect-revolut"&&(
        <Modal title="Connect Revolut" onClose={()=>{close();setRevolutKey("");setRevolutType("business");}} footer={
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={()=>{close();setRevolutKey("");setRevolutType("business");}} style={{flex:1}}>Cancel</Btn>
            <Btn onClick={async()=>{
              if(!revolutKey.trim()){alert("Please enter your API key");return;}
              await connectRevolut(revolutKey.trim(), revolutType);
              close();setRevolutKey("");setRevolutType("business");
            }} style={{flex:1,background:"#7B61FF",boxShadow:"none"}} disabled={accountsLoading}>
              {accountsLoading?"Connecting...":"Connect Revolut"}
            </Btn>
          </div>
        }>
          {/* Account type toggle */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {["business","personal"].map(t=>(
              <button key={t} onClick={()=>setRevolutType(t)} style={{padding:"10px",borderRadius:10,border:`1px solid ${revolutType===t?"#7B61FF":"#1E2535"}`,background:revolutType===t?"#1a1630":"transparent",color:revolutType===t?"#a5a0ff":"#8B95A8",fontSize:13,fontWeight:revolutType===t?700:400,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize",transition:"all 0.15s"}}>
                {t==="business"?"🏢 Business":"👤 Personal"}
              </button>
            ))}
          </div>

          {revolutType==="business" ? (
            <div style={{background:"#0f0a1f",border:"1px solid #7B61FF44",borderRadius:12,padding:16,marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,color:"#a5a0ff",marginBottom:8}}>How to get your Revolut Business API key</div>
              <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.7}}>
                1. Log in to <strong style={{color:"#F1F5F9"}}>business.revolut.com</strong><br/>
                2. Go to <strong style={{color:"#F1F5F9"}}>Settings → API</strong><br/>
                3. Click <strong style={{color:"#F1F5F9"}}>Generate API key</strong><br/>
                4. Set access to <strong style={{color:"#F1F5F9"}}>Read only</strong><br/>
                5. Copy and paste the key below
              </div>
            </div>
          ) : (
            <div style={{background:"#0f0a1f",border:"1px solid #7B61FF44",borderRadius:12,padding:16,marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,color:"#a5a0ff",marginBottom:8}}>How to get your Revolut Personal access token</div>
              <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.7}}>
                1. Open the <strong style={{color:"#F1F5F9"}}>Revolut app</strong> on your phone<br/>
                2. Go to <strong style={{color:"#F1F5F9"}}>Profile → Security & Privacy</strong><br/>
                3. Tap <strong style={{color:"#F1F5F9"}}>Open Banking</strong><br/>
                4. Create a new access token and copy it below
              </div>
            </div>
          )}

          <TextInput
            label={revolutType==="business" ? "Revolut Business API Key" : "Revolut Personal Access Token"}
            value={revolutKey}
            onChange={e=>setRevolutKey(e.target.value)}
            placeholder={revolutType==="business" ? "Enter your API key..." : "Enter your access token..."}
            type="password"
          />
          <p style={{fontSize:12,color:"#4B5563",marginTop:-8,lineHeight:1.6}}>
            Read-only access only. We never initiate transfers or payments.
          </p>
        </Modal>
      )}
      {modal==="connect-paypal"&&(
        <Modal title="Connect PayPal" onClose={()=>{close();setPaypalClientId("");setPaypalSecret("");}} footer={
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={()=>{close();setPaypalClientId("");setPaypalSecret("");}} style={{flex:1}}>Cancel</Btn>
            <Btn onClick={async()=>{
              if(!paypalClientId.trim()||!paypalSecret.trim()){alert("Please enter both Client ID and Secret");return;}
              await connectPaypal(paypalClientId.trim(),paypalSecret.trim());
              close();setPaypalClientId("");setPaypalSecret("");
            }} style={{flex:1,background:"#009cde",boxShadow:"none"}} disabled={accountsLoading}>
              {accountsLoading?"Connecting...":"Connect PayPal"}
            </Btn>
          </div>
        }>
          <div style={{background:"#081520",border:"1px solid #009cde44",borderRadius:12,padding:16,marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#009cde",marginBottom:8}}>How to get your PayPal API credentials</div>
            <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.7}}>
              1. Go to <strong style={{color:"#F1F5F9"}}>developer.paypal.com</strong><br/>
              2. Log in and go to <strong style={{color:"#F1F5F9"}}>Apps & Credentials</strong><br/>
              3. Click <strong style={{color:"#F1F5F9"}}>Create App</strong> → name it "Ledgr"<br/>
              4. Switch to <strong style={{color:"#F1F5F9"}}>Live</strong> mode (top right toggle)<br/>
              5. Copy your <strong style={{color:"#F1F5F9"}}>Client ID</strong> and <strong style={{color:"#F1F5F9"}}>Secret</strong> below
            </div>
          </div>
          <TextInput
            label="PayPal Client ID"
            value={paypalClientId}
            onChange={e=>setPaypalClientId(e.target.value)}
            placeholder="AaBbCcDd..."
          />
          <TextInput
            label="PayPal Secret"
            value={paypalSecret}
            onChange={e=>setPaypalSecret(e.target.value)}
            placeholder="EeFfGgHh..."
            type="password"
          />
          <p style={{fontSize:12,color:"#4B5563",marginTop:-8,lineHeight:1.6}}>
            We only read your transaction history and balance. We never initiate payments or transfers.
          </p>
        </Modal>
      )}
      {modal==="connect-wise"&&(
        <Modal title="Connect Wise" onClose={()=>{close();setWiseKey("");}} footer={
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={()=>{close();setWiseKey("");}} style={{flex:1}}>Cancel</Btn>
            <Btn onClick={async()=>{if(!wiseKey.trim()){alert("Please enter your API key");return;}await connectWise(wiseKey.trim());close();setWiseKey("");}} style={{flex:1}} disabled={accountsLoading}>
              {accountsLoading?"Connecting...":"Connect Wise"}
            </Btn>
          </div>
        }>
          <div style={{background:"#0d2018",border:"1px solid #4ADE8044",borderRadius:12,padding:16,marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#4ADE80",marginBottom:8}}>How to get your Wise API key</div>
            <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.7}}>
              1. Log in to your Wise account<br/>
              2. Go to <strong style={{color:"#F1F5F9"}}>Settings → Developer tools → API tokens</strong><br/>
              3. Create a new token with <strong style={{color:"#F1F5F9"}}>Read only</strong> access<br/>
              4. Copy and paste it below
            </div>
          </div>
          <TextInput
            label="Wise API Key"
            value={wiseKey}
            onChange={e=>setWiseKey(e.target.value)}
            placeholder="Paste your Wise API key here"
            type="password"
          />
          <p style={{fontSize:12,color:"#4B5563",marginTop:-8,lineHeight:1.6}}>
            Your key is stored securely and only used to read your balance and transactions. We never initiate transfers.
          </p>
        </Modal>
      )}
      {modal==="profile"&&(<Modal title="My Profile" onClose={close} wide footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={saveProfile} style={{flex:1}}>Save Profile</Btn></div>}><p style={{color:C.muted,fontSize:13,marginBottom:16,marginTop:-4}}>This info appears on your PDF invoices.</p><TextInput label="Full Name" value={editPro.name||""} onChange={e=>setEditPro({...editPro,name:e.target.value})} placeholder="Jane Doe"/><TextInput label="Email" value={editPro.email||""} onChange={e=>setEditPro({...editPro,email:e.target.value})} placeholder="jane@email.com"/><TextInput label="Phone (optional)" value={editPro.phone||""} onChange={e=>setEditPro({...editPro,phone:e.target.value})} placeholder="+1 555 000 1234"/><TextInput label="Address" value={editPro.address||""} onChange={e=>setEditPro({...editPro,address:e.target.value})} placeholder="New York, NY"/><SelectInput label="Currency" value={editPro.currency||"USD"} onChange={e=>setEditPro({...editPro,currency:e.target.value})}>{CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}</SelectInput></Modal>)}
    </div>
  );
}
