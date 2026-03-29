import { useState, useEffect } from "react";
import PayPage from "./PayPage";
import ContactPage from "./ContactPage";
import AboutPage from "./AboutPage";
import PrivacyPage from "./PrivacyPage";
import { supabase } from "./supabase";
import { startCheckout, PRICE_MONTHLY, PRICE_ANNUAL } from "./stripe";

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
  // Major global
  { code:"USD", label:"USD - US Dollar",         locale:"en-US" },
  { code:"EUR", label:"EUR - Euro",               locale:"de-DE" },
  { code:"GBP", label:"GBP - British Pound",      locale:"en-GB" },
  // Africa
  { code:"NGN", label:"NGN - Nigerian Naira",     locale:"en-NG" },
  { code:"ZAR", label:"ZAR - South African Rand", locale:"en-ZA" },
  { code:"GHS", label:"GHS - Ghanaian Cedi",      locale:"en-GH" },
  { code:"KES", label:"KES - Kenyan Shilling",    locale:"en-KE" },
  // Americas
  { code:"CAD", label:"CAD - Canadian Dollar",    locale:"en-CA" },
  { code:"AUD", label:"AUD - Australian Dollar",  locale:"en-AU" },
  { code:"BRL", label:"BRL - Brazilian Real",     locale:"pt-BR" },
  { code:"MXN", label:"MXN - Mexican Peso",       locale:"es-MX" },
  // Europe (non-Euro)
  { code:"CHF", label:"CHF - Swiss Franc",        locale:"de-CH" },
  { code:"SEK", label:"SEK - Swedish Krona",      locale:"sv-SE" },
  { code:"NOK", label:"NOK - Norwegian Krone",    locale:"nb-NO" },
  { code:"DKK", label:"DKK - Danish Krone",       locale:"da-DK" },
  { code:"PLN", label:"PLN - Polish Złoty",       locale:"pl-PL" },
  { code:"CZK", label:"CZK - Czech Koruna",       locale:"cs-CZ" },
  { code:"HUF", label:"HUF - Hungarian Forint",   locale:"hu-HU" },
  { code:"RON", label:"RON - Romanian Leu",       locale:"ro-RO" },
  // Asia
  { code:"INR", label:"INR - Indian Rupee",       locale:"en-IN" },
  { code:"JPY", label:"JPY - Japanese Yen",       locale:"ja-JP" },
  { code:"CNY", label:"CNY - Chinese Yuan",       locale:"zh-CN" },
  { code:"SGD", label:"SGD - Singapore Dollar",   locale:"en-SG" },
  { code:"MYR", label:"MYR - Malaysian Ringgit",  locale:"ms-MY" },
  { code:"PHP", label:"PHP - Philippine Peso",    locale:"en-PH" },
  { code:"IDR", label:"IDR - Indonesian Rupiah",  locale:"id-ID" },
  { code:"THB", label:"THB - Thai Baht",          locale:"th-TH" },
  { code:"VND", label:"VND - Vietnamese Dong",    locale:"vi-VN" },
  { code:"PKR", label:"PKR - Pakistani Rupee",    locale:"en-PK" },
  { code:"BDT", label:"BDT - Bangladeshi Taka",   locale:"bn-BD" },
  // Middle East
  { code:"AED", label:"AED - UAE Dirham",         locale:"ar-AE" },
  { code:"SAR", label:"SAR - Saudi Riyal",        locale:"ar-SA" },
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


// ── AI Assistant Tab ──────────────────────────────────────────────────────────
function AITabs({ financeContext, invoices, clients, expenses, profile, session, money, cur, C, isMobile, overdueInvs }) {
  const [subTab, setSubTab] = useState("insights");

  // ── Insights state ──
  const [messages, setMessages] = useState([
    { role:"assistant", content:"Hi! I have access to your live financial data — invoices, expenses, cash flow, and overdue payments. Ask me anything about your finances, or try one of the suggestions below." }
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // ── Email state ──
  const [emailClient, setEmailClient] = useState("");
  const [emailIntent, setEmailIntent] = useState("chase");
  const [emailContext, setEmailContext] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // ── Statement state ──
  const [statementText, setStatementText] = useState("");
  const [statementResult, setStatementResult] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanlidnBobWx6Z2hkZWJvbnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTI2MDIsImV4cCI6MjA4ODE2ODYwMn0.6r7C6aQPn0YTjmDjRkP8fVd6cQhXJ_L1jBYqsu2qRWM";
  const SUPABASE_URL_AI = "https://phjybvphmlzghdebonzy.supabase.co";

  const callClaude = async (systemPrompt, userMessage, history=[]) => {
    const msgs = [...history, { role:"user", content: userMessage }];
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:1000,
        system: systemPrompt,
        messages: msgs,
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "Sorry, I couldn't generate a response.";
  };

  // ── Insights: send message ──
  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || thinking) return;
    setInput("");
    const history = messages.filter(m=>m.role!=="assistant"||messages.indexOf(m)>0).map(m=>({role:m.role,content:m.content}));
    setMessages(prev=>[...prev,{role:"user",content:userMsg}]);
    setThinking(true);
    try {
      const reply = await callClaude(financeContext, userMsg, history.slice(-6));
      setMessages(prev=>[...prev,{role:"assistant",content:reply}]);
    } catch(e) {
      setMessages(prev=>[...prev,{role:"assistant",content:"Sorry, something went wrong. Please try again."}]);
    }
    setThinking(false);
  };

  // ── Email: generate draft ──
  const generateEmail = async () => {
    if (!emailClient) return;
    setEmailLoading(true); setEmailDraft(""); setEmailSent(false);
    const clientObj = clients.find(c=>c.id===emailClient);
    const clientInvoices = invoices.filter(i=>i.client_id===emailClient);
    const overdueClient = clientInvoices.filter(i=>i.status!=="paid"&&i.due_date&&new Date(i.due_date)<new Date());

    const intentMap = {
      chase: `Write a polite but firm payment chase email. The client has ${overdueClient.length} overdue invoice(s) totalling ${money(overdueClient.reduce((s,i)=>s+(parseFloat(i.amount)||0),0),cur)}. Oldest is ${overdueClient[0]?.due_date||"unknown"} due date.`,
      intro: `Write a professional introductory email to a new client. Freelancer name: ${profile?.name||"the sender"}.`,
      receipt: `Write a payment receipt / thank you email for recent payment.`,
      proposal: `Write a project proposal follow-up email.`,
      reminder: `Write a friendly upcoming payment reminder (invoice not yet overdue).`,
    };

    const system = `You are an expert email writer for freelancers. Write professional, concise emails in a warm but confident tone. Output ONLY the email body (no subject line, no "Here is the email:" preamble). Use the client name ${clientObj?.name||"Client"} naturally. The freelancer's name is ${profile?.name||""}. ${emailContext ? "Additional context: " + emailContext : ""}`;

    try {
      const draft = await callClaude(system, intentMap[emailIntent]||intentMap.chase);
      setEmailDraft(draft);
    } catch(e) { setEmailDraft("Failed to generate email. Please try again."); }
    setEmailLoading(false);
  };

  // ── Email: send via Brevo ──
  const sendEmail = async () => {
    const clientObj = clients.find(c=>c.id===emailClient);
    if (!clientObj?.email || !emailDraft) return;
    setSendingEmail(true);
    const subjectMap = { chase:"Following up on outstanding invoice(s)", intro:"Nice to meet you", receipt:"Thank you for your payment", proposal:"Project proposal follow-up", reminder:"Upcoming payment reminder" };
    try {
      const sendRes = await fetch(`${SUPABASE_URL_AI}/functions/v1/send-email`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${SUPABASE_ANON}`, "apikey":SUPABASE_ANON },
        body: JSON.stringify({
          to_email: clientObj.email,
          to_name: clientObj.name,
          from_name: profile?.name||"Ledgr User",
          subject: subjectMap[emailIntent]||"Message from your freelancer",
          body: emailDraft,
        }),
      });
      const sendData = await sendRes.json();
      if (sendData.error) throw new Error(sendData.error);
      setEmailSent(true);
    } catch(e) { alert("Failed to send email: " + e.message); }
    setSendingEmail(false);
  };

  // ── Statement: analyse ──
  const analyseStatement = async () => {
    if (!statementText.trim()) return;
    setStatementLoading(true); setStatementResult(null);
    const system = `You are a financial analyst reviewing a freelancer's bank statement. Analyse the transactions and return a JSON object with this exact structure (no markdown, no explanation, just JSON):
{
  "summary": "2-3 sentence plain English summary",
  "totalIn": number,
  "totalOut": number,
  "categories": [{"name": string, "amount": number, "count": number}],
  "insights": ["insight 1", "insight 2", "insight 3", "insight 4"],
  "flags": ["anything unusual or worth attention"],
  "currency": "detected currency code e.g. GBP"
}`;
    try {
      const raw = await callClaude(system, `Analyse this bank statement data:\n\n${statementText.slice(0,4000)}`);
      const clean = raw.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setStatementResult(parsed);
    } catch(e) {
      setStatementResult({ summary:"Could not parse statement. Try pasting fewer rows or a cleaner CSV format.", totalIn:0, totalOut:0, categories:[], insights:["Make sure your data is formatted clearly — one transaction per line with date, description, amount."], flags:[], currency:cur });
    }
    setStatementLoading(false);
  };

  const subTabs = [{id:"insights",label:"💡 Finance Insights"},{id:"email",label:"✉️ Email Assistant"},{id:"statement",label:"📊 Statement Analysis"}];

  const inputStyle = {width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"};

  return (
    <div>
      {/* Sub-tab pills */}
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {subTabs.map(t=>(
          <button key={t.id} onClick={()=>setSubTab(t.id)} style={{
            padding:"8px 16px",borderRadius:20,border:`1px solid ${subTab===t.id?C.accent+"44":C.border}`,
            background:subTab===t.id?"rgba(74,222,128,0.08)":C.card,
            color:subTab===t.id?C.accent:C.textDim,
            fontSize:13,fontWeight:subTab===t.id?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── INSIGHTS ── */}
      {subTab==="insights"&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",height:isMobile?500:600}}>
          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"20px 20px 0"}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:16,flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-start"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:m.role==="user"?"rgba(74,222,128,0.2)":"rgba(96,165,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>
                  {m.role==="user"?"👤":"✦"}
                </div>
                <div style={{maxWidth:"80%",background:m.role==="user"?C.surface:C.bg,border:`1px solid ${C.border}`,borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",fontSize:13,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                  {m.content}
                </div>
              </div>
            ))}
            {thinking&&(
              <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"flex-start"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(96,165,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✦</div>
                <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:"16px 16px 16px 4px",padding:"10px 14px",color:C.muted,fontSize:13}}>Thinking...</div>
              </div>
            )}
          </div>

          {/* Suggested prompts */}
          {messages.length<=1&&(
            <div style={{padding:"0 20px 12px",display:"flex",flexWrap:"wrap",gap:8}}>
              {[
                "How am I doing financially this month?",
                "Which clients owe me the most?",
                "What are my biggest expenses?",
                overdueInvs.length>0?`I have ${overdueInvs.length} overdue invoices — what should I do?`:"Am I on track to hit my income goal?",
                "Where am I spending too much?",
              ].map((s,i)=>(
                <button key={i} onClick={()=>sendMessage(s)} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.textDim,padding:"6px 12px",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent+"66";e.currentTarget.style.color=C.accent;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textDim;}}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            <input
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
              placeholder="Ask anything about your finances..."
              style={{...inputStyle,flex:1}}
            />
            <button onClick={()=>sendMessage()} disabled={!input.trim()||thinking} style={{background:C.accent,border:"none",color:"#060A0F",borderRadius:10,padding:"10px 16px",cursor:(!input.trim()||thinking)?"not-allowed":"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:(!input.trim()||thinking)?0.5:1,whiteSpace:"nowrap"}}>
              Send →
            </button>
          </div>
        </div>
      )}

      {/* ── EMAIL ASSISTANT ── */}
      {subTab==="email"&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
          {/* Left — config */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,display:"flex",flexDirection:"column",gap:14}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:C.text}}>Compose</h3>

            <div>
              <label style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Client</label>
              <select value={emailClient} onChange={e=>setEmailClient(e.target.value)} style={{...inputStyle}}>
                <option value="">Select a client…</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.email?" · "+c.email:""}</option>)}
              </select>
            </div>

            <div>
              <label style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Email Type</label>
              <select value={emailIntent} onChange={e=>setEmailIntent(e.target.value)} style={{...inputStyle}}>
                <option value="chase">💸 Chase overdue invoice</option>
                <option value="reminder">🔔 Payment reminder (upcoming)</option>
                <option value="receipt">✅ Payment received — thank you</option>
                <option value="intro">👋 Introduction to new client</option>
                <option value="proposal">📋 Project proposal follow-up</option>
              </select>
            </div>

            <div>
              <label style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Additional context (optional)</label>
              <textarea value={emailContext} onChange={e=>setEmailContext(e.target.value)} placeholder="e.g. Invoice #INV-004, £1,200 for branding project, sent 3 weeks ago…" rows={3} style={{...inputStyle,resize:"vertical"}}/>
            </div>

            <button onClick={generateEmail} disabled={!emailClient||emailLoading} style={{background:C.accent,border:"none",color:"#060A0F",borderRadius:10,padding:"11px",cursor:(!emailClient||emailLoading)?"not-allowed":"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:(!emailClient||emailLoading)?0.5:1}}>
              {emailLoading?"Generating…":"✦ Generate Email"}
            </button>
          </div>

          {/* Right — draft */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,display:"flex",flexDirection:"column",gap:14}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:C.text}}>Draft</h3>
            {!emailDraft&&!emailLoading&&(
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13,textAlign:"center",padding:20,border:`1px dashed ${C.border}`,borderRadius:10}}>
                Select a client and email type,<br/>then click Generate.
              </div>
            )}
            {emailLoading&&(
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13}}>Writing your email…</div>
            )}
            {emailDraft&&(
              <>
                <textarea value={emailDraft} onChange={e=>setEmailDraft(e.target.value)} rows={12} style={{...inputStyle,flex:1,resize:"vertical",lineHeight:1.7}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={generateEmail} disabled={emailLoading} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,color:C.textDim,borderRadius:10,padding:"10px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
                    ↻ Regenerate
                  </button>
                  {clients.find(c=>c.id===emailClient)?.email ? (
                    <button onClick={sendEmail} disabled={sendingEmail||emailSent} style={{flex:2,background:emailSent?"#166534":C.accent,border:"none",color:"#060A0F",borderRadius:10,padding:"10px",cursor:(sendingEmail||emailSent)?"not-allowed":"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:sendingEmail?0.7:1}}>
                      {emailSent?"✓ Sent!":sendingEmail?"Sending…":"Send via Brevo →"}
                    </button>
                  ) : (
                    <button onClick={()=>{navigator.clipboard?.writeText(emailDraft);}} style={{flex:2,background:C.accent,border:"none",color:"#060A0F",borderRadius:10,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
                      Copy to clipboard
                    </button>
                  )}
                </div>
                {!clients.find(c=>c.id===emailClient)?.email&&<p style={{fontSize:11,color:C.muted,margin:0}}>Add an email address to this client to send directly.</p>}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STATEMENT ANALYSIS ── */}
      {subTab==="statement"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
            <h3 style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:C.text}}>Paste your bank statement</h3>
            <p style={{color:C.muted,fontSize:12,margin:"0 0 14px",lineHeight:1.6}}>Paste CSV data or copy-paste rows from your online banking. Works with any format — the AI will interpret it.</p>
            <textarea value={statementText} onChange={e=>setStatementText(e.target.value)} rows={8} placeholder={"Date,Description,Amount\n01/03/2025,Adobe Creative Cloud,-54.99\n02/03/2025,Client payment - Acme Corp,1200.00\n05/03/2025,AWS hosting,-23.40\n..."} style={{...inputStyle,resize:"vertical",lineHeight:1.6,marginBottom:12}}/>
            <button onClick={analyseStatement} disabled={!statementText.trim()||statementLoading} style={{background:C.accent,border:"none",color:"#060A0F",borderRadius:10,padding:"11px 24px",cursor:(!statementText.trim()||statementLoading)?"not-allowed":"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:(!statementText.trim()||statementLoading)?0.5:1}}>
              {statementLoading?"Analysing…":"✦ Analyse Statement"}
            </button>
          </div>

          {statementResult&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {/* Summary */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                <div style={{fontSize:11,fontWeight:700,color:C.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Summary</div>
                <p style={{fontSize:14,color:C.text,lineHeight:1.75,margin:"0 0 16px"}}>{statementResult.summary}</p>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:12}}>
                  {[
                    {label:"Money In",value:money(statementResult.totalIn||0,statementResult.currency||cur),color:C.accent},
                    {label:"Money Out",value:money(statementResult.totalOut||0,statementResult.currency||cur),color:"#F87171"},
                    {label:"Net",value:money((statementResult.totalIn||0)-(statementResult.totalOut||0),statementResult.currency||cur),color:(statementResult.totalIn||0)>=(statementResult.totalOut||0)?C.accent:"#F87171"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:C.surface,borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{s.label}</div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:800,color:s.color}}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {statementResult.categories?.length>0&&(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Spending by Category</div>
                  {statementResult.categories.map((cat,i)=>{
                    const max = Math.max(...statementResult.categories.map(c=>c.amount));
                    const pct = max>0?Math.round((cat.amount/max)*100):0;
                    return(
                      <div key={i} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:13,fontWeight:500,color:C.text}}>{cat.name}</span>
                          <span style={{fontSize:13,color:C.muted}}>{money(cat.amount,statementResult.currency||cur)} · {cat.count} txn{cat.count!==1?"s":""}</span>
                        </div>
                        <div style={{height:4,background:C.surface,borderRadius:4,overflow:"hidden"}}>
                          <div style={{width:`${pct}%`,height:"100%",background:C.accent,borderRadius:4,transition:"width 0.6s ease"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Insights + Flags */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                {statementResult.insights?.length>0&&(
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>Insights</div>
                    {statementResult.insights.map((ins,i)=>(
                      <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                        <span style={{color:C.accent,fontSize:12,marginTop:1,flexShrink:0}}>→</span>
                        <span style={{fontSize:13,color:C.textDim,lineHeight:1.6}}>{ins}</span>
                      </div>
                    ))}
                  </div>
                )}
                {statementResult.flags?.length>0&&(
                  <div style={{background:C.card,border:`1px solid #F59E0B33`,borderRadius:16,padding:20}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>Worth Noting</div>
                    {statementResult.flags.map((f,i)=>(
                      <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                        <span style={{color:"#F59E0B",fontSize:12,marginTop:1,flexShrink:0}}>⚠</span>
                        <span style={{fontSize:13,color:C.textDim,lineHeight:1.6}}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Paywall Screen ────────────────────────────────────────────────────────────
function PaywallScreen({ session, onSignOut }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("annual"); // default to annual — better value
  const [subError, setSubError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true); setSubError("");
    try {
      await startCheckout(session.user.id, session.user.email, plan === "annual" ? PRICE_ANNUAL : PRICE_MONTHLY);
    } catch (e) {
      setSubError(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{ width:"100%", maxWidth:460 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:52, height:52, background:C.accent, borderRadius:14, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"#0D0F14", marginBottom:16 }}>L</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.text, margin:"0 0 8px" }}>Ledgr Pro</h1>
          <p style={{ color:C.muted, fontSize:15, margin:0 }}>Your free trial has ended. Choose a plan to continue.</p>
        </div>

        {/* Plan toggle */}
        <div style={{ display:"flex", gap:8, marginBottom:16, background:C.surface, borderRadius:12, padding:4, border:`1px solid ${C.border}` }}>
          {[
            { id:"monthly", label:"Monthly", price:"$15/mo", sub:"Billed monthly" },
            { id:"annual",  label:"Annual",  price:"$120/yr", sub:"Save $60 — 2 months free", badge:"BEST VALUE" },
          ].map(p=>(
            <button key={p.id} onClick={()=>setPlan(p.id)} style={{
              flex:1, padding:"12px 8px", borderRadius:9, border:"none", cursor:"pointer",
              background: plan===p.id ? C.card : "transparent",
              boxShadow: plan===p.id ? `0 0 0 1px ${C.accent}44, inset 0 0 0 1px ${C.accent}22` : "none",
              fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s", position:"relative",
            }}>
              {p.badge && plan===p.id && <span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:C.accent,color:"#060A0F",fontSize:8,fontWeight:800,padding:"2px 8px",borderRadius:8,letterSpacing:"0.08em",whiteSpace:"nowrap"}}>{p.badge}</span>}
              <div style={{ fontSize:13, fontWeight:700, color: plan===p.id ? C.text : C.muted, marginBottom:2 }}>{p.label}</div>
              <div style={{ fontSize:15, fontWeight:800, color: plan===p.id ? C.accent : C.textDim, fontFamily:"'Playfair Display',serif" }}>{p.price}</div>
              <div style={{ fontSize:10, color: plan===p.id ? C.muted : "#2A3A4A", marginTop:2 }}>{p.sub}</div>
            </button>
          ))}
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, overflow:"hidden", marginBottom:16 }}>
          <div style={{ background:C.accentDim, borderBottom:`1px solid ${C.border}`, padding:isMobile?"16px 20px":"20px 32px", textAlign:"center" }}>
            <div style={{ color:C.accent, fontSize:40, fontWeight:700, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>
              {plan === "annual" ? "$120" : "$15"}
            </div>
            <div style={{ color:C.textDim, fontSize:13, marginTop:4 }}>
              {plan === "annual" ? "per year — save $60 vs monthly" : "per month · cancel anytime"}
            </div>
          </div>

          <div style={{ padding:isMobile?"16px 20px":"24px 32px" }}>
            {[
              "Unlimited invoices & PDF export",
              "Stripe payment links (money direct to you)",
              "Expense tracking & bank CSV import",
              "Tax estimates for 18 countries",
              "VAT returns & quarterly tracking",
              "32 currencies · Client portal",
            ].map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:C.accentDim, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ color:C.accent, fontSize:10, fontWeight:700 }}>✓</span>
                </div>
                <span style={{ fontSize:13, color:C.textDim }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ padding:isMobile?"0 20px 20px":"0 32px 28px" }}>
            <Btn onClick={handleSubscribe} disabled={loading} style={{ width:"100%", fontSize:15, padding:"14px" }}>
              {loading ? "Redirecting to Stripe..." : plan === "annual" ? "Subscribe — $120/year →" : "Subscribe — $15/month →"}
            </Btn>
            {subError && <div style={{background:C.dangerDim,border:`1px solid ${C.danger}44`,borderRadius:8,padding:"10px 14px",color:C.danger,fontSize:12,marginTop:8}}>{subError}</div>}
            <p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:12, marginBottom:0 }}>
              Secured by Stripe · Cancel anytime · No hidden fees
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
  const [loading, setLoading] = useState(null);
  const [err, setErr] = useState("");
  if (!profile?.trial_ends_at) return null;
  const status = profile?.subscription_status;
  if (status === "active" || status === "past_due") return null;
  const days = daysUntil(profile.trial_ends_at);
  if (days <= 0) return null;
  const urgent = days <= 3;

  const handleUpgrade = async (priceId, label) => {
    setLoading(label); setErr("");
    try { await startCheckout(session.user.id, session.user.email, priceId); }
    catch(e) { setErr(e.message || "Unknown error"); setLoading(null); }
  };

  return (
    <div style={{ background: urgent ? "#3a1a0a" : "#0d1a0f", borderBottom:`1px solid ${urgent ? C.danger+"44" : C.accent+"22"}`, padding:"8px 20px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
      <span style={{ fontSize:13, color: urgent ? C.danger : C.accent, fontWeight:500 }}>
        {urgent ? "⚠️" : "⏳"} {days} day{days===1?"":"s"} left in your trial
      </span>
      {err && <span style={{fontSize:12,color:C.danger,background:C.dangerDim,padding:"3px 10px",borderRadius:6}}>{err}</span>}
      <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={()=>handleUpgrade(PRICE_ANNUAL,"annual")} disabled={!!loading} style={{ background:C.accent, color:"#060A0E", border:"none", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:loading?"not-allowed":"pointer", whiteSpace:"nowrap", opacity:loading?0.7:1, display:"flex", alignItems:"center", gap:6 }}>
          {loading==="annual" ? "Opening Stripe..." : <><span style={{background:"rgba(0,0,0,0.15)",borderRadius:4,padding:"1px 5px",fontSize:9,fontWeight:800,letterSpacing:"0.06em"}}>SAVE $60</span> $120/year</>}
        </button>
        <button onClick={()=>handleUpgrade(PRICE_MONTHLY,"monthly")} disabled={!!loading} style={{ background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:loading?"not-allowed":"pointer", whiteSpace:"nowrap", opacity:loading?0.7:1 }}>
          {loading==="monthly" ? "..." : "$15/mo"}
        </button>
      </div>
    </div>
  );
}

// ── Landing + Auth wrapper ───────────────────────────────────────────────────
// ── Demo App ─────────────────────────────────────────────────────────────────
const DEMO_DATA = {
  profile: { name:"Alex Johnson", currency:"GBP", email:"alex@demo.com", business_name:"Alex Johnson Design", subscription_status:"active" },
  invoices: [
    { id:"d1", invoice_number:7, client:"Acme Corp", description:"Brand identity redesign", amount:3200, status:"paid", due_date:"2026-02-15", type:"business", currency:"GBP", date:"2026-02-01" },
    { id:"d2", invoice_number:8, client:"TechStart Ltd", description:"Website development — Phase 1", amount:4800, status:"paid", due_date:"2026-02-28", type:"business", currency:"GBP", date:"2026-02-10" },
    { id:"d3", invoice_number:9, client:"Morrison & Co", description:"Monthly retainer — March", amount:1500, status:"pending", due_date:"2026-03-31", type:"business", currency:"GBP", date:"2026-03-01" },
    { id:"d4", invoice_number:10, client:"BlueSky Agency", description:"Social media graphics pack", amount:950, status:"overdue", due_date:"2026-03-10", type:"business", currency:"GBP", date:"2026-02-25" },
    { id:"d5", invoice_number:11, client:"Nexus Group", description:"UI/UX audit & recommendations", amount:2100, status:"pending", due_date:"2026-04-15", type:"business", currency:"GBP", date:"2026-03-15" },
  ],
  expenses: [
    { id:"e1", name:"Adobe Creative Cloud", amount:54.99, category:"Software", date:"2026-03-01", type:"business" },
    { id:"e2", name:"AWS Hosting", amount:23.40, category:"Hosting", date:"2026-03-01", type:"business" },
    { id:"e3", name:"Client lunch — Acme Corp", amount:68, category:"Entertainment", date:"2026-02-20", type:"business" },
    { id:"e4", name:"MacBook Pro keyboard repair", amount:180, category:"Equipment", date:"2026-02-14", type:"business" },
    { id:"e5", name:"Figma Pro", amount:15, category:"Software", date:"2026-03-01", type:"business" },
    { id:"e6", name:"Train to client meeting", amount:34.50, category:"Travel", date:"2026-02-28", type:"business" },
  ],
  clients: [
    { id:"c1", name:"Acme Corp", email:"billing@acme.com", company:"Acme Corporation" },
    { id:"c2", name:"TechStart Ltd", email:"accounts@techstart.io", company:"TechStart Ltd" },
    { id:"c3", name:"Morrison & Co", email:"finance@morrison.co.uk", company:"Morrison & Co" },
    { id:"c4", name:"BlueSky Agency", email:"hello@bluesky.agency", company:"BlueSky Agency" },
  ],
  alerts: [
    { id:"a1", label:"VAT Return Q1", amount:1240, due_date:"2026-04-07", type:"business" },
    { id:"a2", label:"Self Assessment", amount:3800, due_date:"2026-01-31", type:"business" },
  ],
};

function DemoApp({ onExit }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("dashboard");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const { invoices, expenses, clients, alerts, profile } = DEMO_DATA;
  const C = { bg:"#080B10", surface:"#0D1117", card:"#0F1520", border:"#1E2535", text:"#F1F5F9", textDim:"#C8D3DF", muted:"#6B7A8D", accent:"#4ADE80", accentDim:"#0d2018", warning:"#FBBF24", danger:"#F87171", dangerDim:"#3a1a0a", blue:"#60A5FA", blueDim:"#0a1f3a" };
  const money = (n, cur="GBP") => { try { return new Intl.NumberFormat("en-GB",{style:"currency",currency:cur||"GBP",minimumFractionDigits:2}).format(n||0); } catch { return `£${(n||0).toFixed(2)}`; }};
  const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "-";
  const now = new Date();
  const totalIncome = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0);
  const totalPending = invoices.filter(i=>i.status==="pending").reduce((s,i)=>s+i.amount,0);
  const totalOverdue = invoices.filter(i=>i.status==="overdue").reduce((s,i)=>s+i.amount,0);
  const totalExp = expenses.reduce((s,e)=>s+e.amount,0);
  const netProfit = totalIncome - totalExp;
  const upcoming = alerts.map(a=>({...a,days:Math.ceil((new Date(a.due_date)-now)/86400000)})).filter(a=>a.days<=60).sort((a,b)=>a.days-b.days);
  const TABS=[{id:"dashboard",label:"Dashboard"},{id:"invoices",label:"Invoices"},{id:"expenses",label:"Expenses"},{id:"clients",label:"Clients"}];
  const stats = [
    {label:"Collected",value:money(totalIncome),color:"#4ADE80"},
    {label:"Pending",value:money(totalPending),color:"#FBBF24"},
    {label:"Overdue",value:money(totalOverdue),color:"#F87171"},
    {label:"Expenses",value:money(totalExp),color:"#60A5FA"},
    {label:"Net Profit",value:money(netProfit),color:"#A78BFA"},
  ];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg,color:C.text,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      {/* Demo banner */}
      <div style={{background:"linear-gradient(90deg,#7c3aed,#4f46e5)",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",zIndex:200}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>✦ Demo mode — explore Ledgr with sample data. No account needed.</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onExit} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",padding:"6px 16px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>← Back</button>
          <button onClick={()=>{window.location.href="/?signup=true";}} style={{background:"#4ADE80",border:"none",color:"#060A0F",padding:"6px 16px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>Sign up free →</button>
        </div>
      </div>
      {/* Nav */}
      <nav style={{background:"#0D1117",borderBottom:`1px solid ${C.border}`,padding:"0 24px",display:"flex",alignItems:"center",height:52,gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
          <div style={{width:26,height:26,background:"linear-gradient(135deg,#4ADE80,#16a34a)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#060A0F"}}>L</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:800}}>Ledgr</span>
          <span style={{fontSize:11,color:"#7c3aed",fontWeight:700,background:"#2d1f4a",padding:"2px 8px",borderRadius:8,marginLeft:4}}>DEMO</span>
        </div>
        {!isMobile&&TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",color:tab===t.id?C.accent:C.muted,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent"}}>
            {t.label}
          </button>
        ))}
      </nav>

      <div style={{flex:1,padding:isMobile?"16px":"32px 40px",maxWidth:1100,width:"100%",margin:"0 auto"}}>
        {/* Dashboard */}
        {tab==="dashboard"&&(
          <div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px",fontWeight:800}}>Financial Overview</h1>
            <p style={{color:C.muted,fontSize:13,marginBottom:24}}>Sample data for Alex Johnson Design · GBP</p>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(5,1fr)",gap:10,marginBottom:24}}>
              {stats.map((s,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color}44,transparent)`}}/>
                  <div style={{color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{s.label}</div>
                  <div style={{color:s.color,fontSize:isMobile?14:18,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Recent Invoices</div>
                {invoices.slice(0,4).map(inv=>(
                  <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10,marginBottom:10,borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{inv.client}</div><div style={{fontSize:11,color:C.muted}}>{inv.description.slice(0,30)}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700}}>{money(inv.amount)}</div><span style={{fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:6,background:inv.status==="paid"?C.accentDim:inv.status==="overdue"?C.dangerDim:"#1f1508",color:inv.status==="paid"?C.accent:inv.status==="overdue"?C.danger:C.warning}}>{inv.status}</span></div>
                  </div>
                ))}
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Upcoming Payments</div>
                {upcoming.map(a=>(
                  <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10,marginBottom:10,borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{a.label}</div><div style={{fontSize:11,color:a.days<=7?C.danger:C.muted}}>Due in {a.days} days</div></div>
                    <div style={{fontSize:13,fontWeight:700}}>{money(a.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Invoices */}
        {tab==="invoices"&&(
          <div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 20px",fontWeight:800}}>Invoices</h1>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {invoices.map(inv=>(
                <div key={inv.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
                    <div><div style={{fontSize:14,fontWeight:700}}>{inv.client}</div><div style={{fontSize:12,color:C.muted}}>INV-{String(inv.invoice_number).padStart(3,"0")} · {inv.description}</div></div>
                    <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:18,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{money(inv.amount)}</div><span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,background:inv.status==="paid"?C.accentDim:inv.status==="overdue"?C.dangerDim:"#1f1508",color:inv.status==="paid"?C.accent:inv.status==="overdue"?C.danger:C.warning}}>{inv.status}</span></div>
                  </div>
                  <div style={{fontSize:12,color:C.muted}}>Due {fmtDate(inv.due_date)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Expenses */}
        {tab==="expenses"&&(
          <div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 20px",fontWeight:800}}>Expenses</h1>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {expenses.map(exp=>(
                <div key={exp.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:13,fontWeight:600}}>{exp.name}</div><div style={{fontSize:11,color:C.muted}}>{exp.category} · {exp.date}</div></div>
                  <div style={{fontSize:14,fontWeight:700,color:C.danger}}>−{money(exp.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Clients */}
        {tab==="clients"&&(
          <div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 20px",fontWeight:800}}>Clients</h1>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {clients.map(c=>{
                const cliInvs=invoices.filter(i=>i.client===c.name);
                const total=cliInvs.reduce((s,i)=>s+i.amount,0);
                const health=getClientHealth(cliInvs);
                return(
                  <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:42,height:42,borderRadius:10,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:C.accent,flexShrink:0}}>{c.name.charAt(0)}</div>
                    <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{c.name}</div><div style={{fontSize:12,color:C.muted}}>{c.company}</div></div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{money(total)}</div>
                      <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,background:`${health.color}22`,color:health.color,border:`1px solid ${health.color}44`}}>{health.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* CTA */}
        <div style={{marginTop:40,background:"linear-gradient(135deg,#0d2018,#0a1a0f)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:16,padding:"28px 24px",textAlign:"center"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?20:24,fontWeight:800,marginBottom:8}}>Ready to use Ledgr for real?</div>
          <p style={{color:C.muted,fontSize:14,marginBottom:20}}>14-day free trial · No credit card · $15/month after</p>
          <button onClick={onExit} style={{background:"#4ADE80",border:"none",color:"#060A0F",padding:"13px 32px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>Start free trial →</button>
        </div>
      </div>

      {isMobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:200}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"transparent",color:tab===t.id?C.accent:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",fontFamily:"'DM Sans',sans-serif",transition:"color 0.15s",position:"relative"}}>
              <span style={{fontSize:9,fontWeight:tab===t.id?700:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>{t.label}</span>
              {tab===t.id&&<div style={{position:"absolute",bottom:0,left:"20%",right:"20%",height:2,background:C.accent,borderRadius:2}}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LandingOrAuth() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [demoMode, setDemoMode] = useState(false);
  if (demoMode) return <DemoApp onExit={()=>setDemoMode(false)}/>;
  if (showAuth) return <AuthScreen initialMode={authMode}/>;
  return <LandingPage onGetStarted={(mode)=>{ setAuthMode(mode); setShowAuth(true); }} onTryDemo={()=>setDemoMode(true)}/>;
}

// ── Landing Page ──────────────────────────────────────────────────────────────
function LandingPage({ onGetStarted, onTryDemo }) {
  const [activeFaq, setActiveFaq] = useState(null);
  const [billing, setBilling] = useState("annual"); // default annual
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#060A0F",color:"#F1F5F9",minHeight:"100vh",overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes rise{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{opacity:0.4}50%{opacity:0.9}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        .r1{animation:rise 0.6s ease forwards}
        .r2{animation:rise 0.6s 0.12s ease forwards;opacity:0}
        .r3{animation:rise 0.6s 0.24s ease forwards;opacity:0}
        .r4{animation:rise 0.6s 0.36s ease forwards;opacity:0}
        .r5{animation:rise 0.6s 0.48s ease forwards;opacity:0}
        .feat-card{transition:all 0.2s ease;cursor:default}
        .feat-card:hover{transform:translateY(-3px);border-color:#2a3a2a!important;box-shadow:0 12px 40px rgba(74,222,128,0.07)}
        .cta-btn{transition:all 0.18s ease}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 48px rgba(74,222,128,0.4)!important}
        .sec-btn{transition:all 0.15s ease}
        .sec-btn:hover{border-color:#3a4a3a!important;background:#0d1a10!important;color:#F1F5F9!important}
        .ticker-wrap{overflow:hidden;white-space:nowrap;mask-image:linear-gradient(90deg,transparent,black 10%,black 90%,transparent)}
        .ticker-inner{display:inline-flex;animation:ticker 30s linear infinite}
        .faq-item{transition:all 0.2s ease}
        .shine-text{background:linear-gradient(90deg,#4ADE80,#86efac,#4ADE80,#22c55e);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite}
        .social-card{transition:all 0.2s ease}
        .social-card:hover{border-color:#2a3a2a!important;transform:translateY(-2px)}
        @media(max-width:640px){.hero-grid{flex-direction:column!important}.nav-links{display:none!important}}
      `}</style>

      {/* ── Nav ── */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(6,10,15,0.9)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"0 24px",display:"flex",alignItems:"center",height:58,gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:9,flex:1}}>
          <div style={{width:28,height:28,background:"linear-gradient(135deg,#4ADE80,#16a34a)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#060A0F",boxShadow:"0 4px 14px rgba(74,222,128,0.3)"}}>L</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:800,letterSpacing:"-0.01em"}}>Ledgr</span>
        </div>
        <div className="nav-links" style={{display:"flex",gap:24,alignItems:"center"}}>
          {["Features","Pricing","FAQ"].map(l=>(
            <a key={l} href={`#${l.toLowerCase()}`} style={{color:"#6B7A8D",fontSize:13,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}
              onMouseEnter={e=>e.target.style.color="#F1F5F9"} onMouseLeave={e=>e.target.style.color="#6B7A8D"}>{l}</a>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onGetStarted("login")} className="sec-btn" style={{background:"transparent",border:"1px solid rgba(255,255,255,0.08)",color:"#8B95A8",padding:"7px 16px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
            Log in
          </button>
          <button onClick={()=>onGetStarted("signup")} className="cta-btn" style={{background:"#4ADE80",border:"none",color:"#060A0F",padding:"7px 18px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 20px rgba(74,222,128,0.25)"}}>
            Start free →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{position:"relative",overflow:"hidden",padding:"96px 24px 80px",textAlign:"center"}}>
        {/* Background atmosphere */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
          <div style={{position:"absolute",top:"5%",left:"50%",transform:"translateX(-50%)",width:"70vw",height:"50vh",background:"radial-gradient(ellipse,rgba(74,222,128,0.07) 0%,transparent 65%)",animation:"glow 8s ease infinite"}}/>
          <div style={{position:"absolute",bottom:"10%",right:"-5%",width:"30vw",height:"30vh",background:"radial-gradient(ellipse,rgba(96,165,250,0.04) 0%,transparent 70%)"}}/>
          {/* Grid lines */}
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.03}} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#4ADE80" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>

        <div style={{position:"relative",maxWidth:760,margin:"0 auto"}}>
          {/* Pill badge */}
          <div className="r1" style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:20,padding:"5px 14px 5px 8px",marginBottom:32}}>
            <span style={{background:"#4ADE80",color:"#060A0F",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:10,letterSpacing:"0.08em"}}>NEW</span>
            <span style={{color:"#4ADE80",fontSize:12,fontWeight:500}}>VAT returns & 18 country tax support just launched</span>
          </div>

          {/* Main headline */}
          <h1 className="r2" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(38px,6.5vw,76px)",fontWeight:900,margin:"0 0 8px",lineHeight:1.04,letterSpacing:"-0.03em"}}>
            Stop losing money<br/>to admin chaos.
          </h1>
          <h2 className="r3" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,4.5vw,52px)",fontWeight:700,margin:"0 0 28px",lineHeight:1.1,letterSpacing:"-0.02em",color:"transparent",WebkitTextStroke:"1px rgba(74,222,128,0.5)"}}>
            <span className="shine-text">Get paid. Stay legal.</span>
          </h2>

          <p className="r4" style={{fontSize:"clamp(15px,2vw,18px)",color:"#6B7A8D",maxWidth:500,margin:"0 auto 40px",lineHeight:1.75,fontWeight:400}}>
            Ledgr is the finance dashboard built for freelancers — invoicing, expenses, tax estimates, and VAT returns in one place. Works in <strong style={{color:"#8B95A8",fontWeight:600}}>18 countries, 32 currencies.</strong>
          </p>

          {/* CTA buttons */}
          <div className="r5" style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
            <button onClick={()=>onGetStarted("signup")} className="cta-btn" style={{background:"#4ADE80",border:"none",color:"#060A0F",padding:"15px 36px",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 8px 36px rgba(74,222,128,0.3)"}}>
              Start free — 14 days, no card
            </button>
            <button onClick={()=>onTryDemo()} className="sec-btn" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#8B95A8",padding:"15px 28px",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
              Try demo →
            </button>
          </div>
          <p style={{color:"#3D4A5C",fontSize:12,margin:0}}>No credit card · Cancel anytime · £15/mo after trial</p>
        </div>
      </div>

      {/* ── Social proof ticker ── */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)",padding:"14px 0",marginBottom:80}}>
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {[
              "🇬🇧 UK Self Assessment","🇩🇪 German Einkommensteuer","🇫🇷 French Déclaration","🇳🇱 Dutch Box 1 Tax","🇸🇬 Singapore IRAS","🇮🇳 India ITR","🇳🇬 Nigeria FIRS","🇿🇦 South Africa SARS",
              "💳 Stripe Payment Links","📄 PDF Invoices","💱 32 Currencies","🔁 Recurring Invoices","📊 Cash Flow Charts","🏦 Bank CSV Import","🧾 VAT Returns","👥 Client Portal",
              "🇬🇧 UK Self Assessment","🇩🇪 German Einkommensteuer","🇫🇷 French Déclaration","🇳🇱 Dutch Box 1 Tax","🇸🇬 Singapore IRAS","🇮🇳 India ITR","🇳🇬 Nigeria FIRS","🇿🇦 South Africa SARS",
              "💳 Stripe Payment Links","📄 PDF Invoices","💱 32 Currencies","🔁 Recurring Invoices","📊 Cash Flow Charts","🏦 Bank CSV Import","🧾 VAT Returns","👥 Client Portal",
            ].map((t,i)=>(
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0 28px",color:"#3D4A5C",fontSize:12,fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
                {t}<span style={{color:"#1E2535",marginLeft:4}}>·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pain → Solution ── */}
      <div style={{maxWidth:960,margin:"0 auto 100px",padding:"0 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:2}}>
          {[
            {before:"Chasing clients for payment",after:"Send a payment link. Get paid instantly.",icon:"💸"},
            {before:"Tax panic every January",after:"See your tax estimate update in real time.",icon:"😰"},
            {before:"Spreadsheets for invoices",after:"PDF invoices in one click, client portal included.",icon:"📊"},
            {before:"No idea what VAT you owe",after:"Quarterly VAT return prepared automatically.",icon:"🧾"},
          ].map((p,i)=>(
            <div key={i} style={{background:i%2===0?"#080D12":"#090E14",border:"1px solid rgba(255,255,255,0.04)",padding:"28px 24px"}}>
              <div style={{fontSize:28,marginBottom:16}}>{p.icon}</div>
              <div style={{fontSize:13,color:"#3D4A5C",marginBottom:10,fontWeight:500,textDecoration:"line-through",lineHeight:1.5}}>{p.before}</div>
              <div style={{fontSize:15,color:"#E2E8F0",fontWeight:600,lineHeight:1.5}}>{p.after}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Testimonials ── */}
      <div style={{maxWidth:960,margin:"0 auto 100px",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:10,fontWeight:700,color:"#4ADE80",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>From freelancers</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,3.5vw,40px)",fontWeight:800,margin:0,letterSpacing:"-0.02em"}}>Real people, real results</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
          {[
            {quote:"I used to dread sending invoices. Now I do it in 30 seconds and clients can pay with a card instantly. Game changer.",name:"James T.",role:"Freelance Web Developer · London",flag:"🇬🇧"},
            {quote:"The tax estimate alone saves me hours with my accountant. I always know roughly what I owe — no end-of-year surprises.",name:"Amara O.",role:"Brand Designer · Lagos",flag:"🇳🇬"},
            {quote:"Finally a tool that understands European VAT. The quarterly return export is exactly what I needed for my Belastingdienst filing.",name:"Sven K.",role:"UX Consultant · Amsterdam",flag:"🇳🇱"},
          ].map((t,i)=>(
            <div key={i} className="social-card" style={{background:"#0C1118",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"24px"}}>
              <div style={{color:"#4ADE80",fontSize:20,marginBottom:14,fontFamily:"Georgia,serif",lineHeight:1}}>"</div>
              <p style={{fontSize:14,color:"#8B95A8",lineHeight:1.75,marginBottom:20,fontStyle:"italic"}}>{t.quote}</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#1a2a1a,#0d2018)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,border:"1px solid rgba(74,222,128,0.15)"}}>{t.flag}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:"#E2E8F0"}}>{t.name}</div><div style={{fontSize:11,color:"#3D4A5C"}}>{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <div id="features" style={{maxWidth:960,margin:"0 auto 100px",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{fontSize:10,fontWeight:700,color:"#4ADE80",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>Built for how you work</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,3.5vw,40px)",fontWeight:800,margin:"0 0 12px",letterSpacing:"-0.02em"}}>Every tool a freelancer needs</h2>
          <p style={{color:"#3D4A5C",fontSize:15,maxWidth:440,margin:"0 auto"}}>Not a watered-down version of enterprise software. Built from scratch for independent workers.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
          {[
            {icon:"📄",title:"Professional PDF Invoices",desc:"Create, send and track invoices in seconds. Clients get a branded payment page with card payment built in.",hot:true},
            {icon:"💰",title:"Expense Tracking",desc:"Log costs by category, import bank statements via CSV, and see exactly where your money goes month by month."},
            {icon:"📊",title:"Live Cash Flow Dashboard",desc:"Income, expenses, net profit — updated the moment you log anything. No spreadsheets, no manual maths."},
            {icon:"🧾",title:"VAT Returns",desc:"Track output and input VAT, prepare quarterly returns by the box numbers, and export CSV for your accountant.",hot:true},
            {icon:"🌍",title:"Tax in 18 Countries",desc:"From UK Self Assessment to German Einkommensteuer to Singapore IRAS — accurate tax estimates wherever you are.",hot:true},
            {icon:"💱",title:"32 Currencies",desc:"Invoice in any currency. EUR, GBP, USD, NGN, SGD, THB, PLN and 25 more — all with correct locale formatting."},
            {icon:"🔁",title:"Recurring Invoices",desc:"Set up weekly, monthly or quarterly invoices for retainer clients. They generate automatically, you just approve."},
            {icon:"👥",title:"Client Portal",desc:"Clients get a branded page to view and pay their invoice. You see when they've opened it."},
            {icon:"⚡",title:"Stripe Payment Links",desc:"Connect your Stripe account and every invoice gets a payment link. Money goes straight to you — not through us."},
          ].map((f,i)=>(
            <div key={i} className="feat-card" style={{background:"#0C1118",border:`1px solid ${f.hot?"rgba(74,222,128,0.12)":"rgba(255,255,255,0.05)"}`,borderRadius:14,padding:"22px 20px",position:"relative"}}>
              {f.hot&&<span style={{position:"absolute",top:14,right:14,fontSize:9,fontWeight:800,color:"#4ADE80",background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:8,padding:"2px 7px",letterSpacing:"0.06em"}}>NEW</span>}
              <div style={{fontSize:24,marginBottom:12}}>{f.icon}</div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:7,letterSpacing:"-0.01em",color:"#E2E8F0"}}>{f.title}</div>
              <div style={{fontSize:12,color:"#4B5A6A",lineHeight:1.7}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Global section ── */}
      <div style={{background:"#080D12",borderTop:"1px solid rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.04)",padding:"80px 24px",marginBottom:100}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",gap:60,alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"#4ADE80",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:16}}>Built for the world</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,3.5vw,40px)",fontWeight:800,margin:"0 0 16px",letterSpacing:"-0.02em",lineHeight:1.15}}>Your finances,<br/>any country.</h2>
            <p style={{color:"#4B5A6A",fontSize:14,lineHeight:1.8,marginBottom:28}}>Most finance tools are built for one country. Ledgr works wherever you are — with accurate tax calculations, the right currency formatting, and VAT support for European freelancers.</p>
            <button onClick={()=>onGetStarted("signup")} className="cta-btn" style={{background:"#4ADE80",border:"none",color:"#060A0F",padding:"12px 28px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 6px 24px rgba(74,222,128,0.25)"}}>
              Try free for 14 days →
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {flag:"🇬🇧",country:"United Kingdom",detail:"Self Assessment · NI"},
              {flag:"🇩🇪",country:"Germany",detail:"Einkommensteuer · Solidarity"},
              {flag:"🇫🇷",country:"France",detail:"IRPF · Social charges"},
              {flag:"🇳🇱",country:"Netherlands",detail:"Box 1 · MKB deduction"},
              {flag:"🇳🇬",country:"Nigeria",detail:"FIRS · CRA relief"},
              {flag:"🇮🇳",country:"India",detail:"ITR · New regime"},
              {flag:"🇸🇬",country:"Singapore",detail:"IRAS progressive"},
              {flag:"🇯🇵",country:"Japan",detail:"確定申告 · Resident tax"},
            ].map((c,i)=>(
              <div key={i} style={{background:"#0C1118",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>{c.flag}</span>
                <div><div style={{fontSize:12,fontWeight:600,color:"#C8D3DF"}}>{c.country}</div><div style={{fontSize:10,color:"#3D4A5C"}}>{c.detail}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pricing ── */}
      <div id="pricing" style={{maxWidth:480,margin:"0 auto 100px",padding:"0 24px",textAlign:"center"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#4ADE80",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:16}}>Pricing</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,3.5vw,40px)",fontWeight:800,margin:"0 0 32px",letterSpacing:"-0.02em"}}>One plan.<br/>Everything included.</h2>

        {/* Billing toggle */}
        <div style={{display:"flex",gap:4,marginBottom:24,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4,border:"1px solid rgba(255,255,255,0.06)",maxWidth:280,margin:"0 auto 24px"}}>
          {[
            {id:"monthly",label:"Monthly"},
            {id:"annual", label:"Annual"},
          ].map(b=>(
            <button key={b.id} onClick={()=>setBilling(b.id)} style={{
              flex:1,padding:"8px 12px",borderRadius:9,border:"none",cursor:"pointer",
              background:billing===b.id?"#0C1118":"transparent",
              color:billing===b.id?"#F1F5F9":"#3D4A5C",
              fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",
              boxShadow:billing===b.id?"0 0 0 1px rgba(74,222,128,0.2)":"none",
              transition:"all 0.15s",
            }}>{b.label}{b.id==="annual"&&<span style={{fontSize:9,fontWeight:800,background:billing==="annual"?"#4ADE80":"#1a2a1a",color:billing==="annual"?"#060A0F":"#4ADE80",borderRadius:6,padding:"1px 5px",marginLeft:6,letterSpacing:"0.06em"}}>-33%</span>}</button>
          ))}
        </div>

        <div style={{background:"#0C1118",border:"1px solid rgba(74,222,128,0.15)",borderRadius:20,overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
          <div style={{background:"linear-gradient(160deg,#0d2018,#0a1a0f)",borderBottom:"1px solid rgba(74,222,128,0.1)",padding:"36px 32px",textAlign:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:"-30%",left:"50%",transform:"translateX(-50%)",width:200,height:200,background:"radial-gradient(ellipse,rgba(74,222,128,0.12) 0%,transparent 70%)"}}/>
            <div style={{fontSize:11,fontWeight:700,color:"#4ADE80",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Pro Plan</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:64,fontWeight:900,color:"#4ADE80",lineHeight:1,position:"relative"}}>
              {billing==="annual" ? "$120" : "$15"}
            </div>
            <div style={{color:"#3D4A5C",fontSize:13,marginTop:8}}>
              {billing==="annual" ? "per year — save $60 vs monthly" : "per month · cancel anytime"}
            </div>
            {billing==="annual"&&<div style={{marginTop:10,display:"inline-block",background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:8,padding:"3px 10px",fontSize:11,color:"#4ADE80",fontWeight:600}}>That's just $10/month</div>}
          </div>
          <div style={{padding:"28px 32px"}}>
            {[
              "14-day free trial — no card required",
              "Unlimited invoices & PDF export",
              "Stripe payment links (direct to you)",
              "Client portal with view tracking",
              "Expense tracking & bank CSV import",
              "Recurring invoices on autopilot",
              "Tax estimates for 18 countries",
              "VAT returns & quarterly tracking",
              "32 currencies with correct formatting",
              "Cash flow charts & client analytics",
            ].map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:11}}>
                <span style={{color:"#4ADE80",fontSize:11,fontWeight:800,width:16,flexShrink:0,marginTop:2}}>✓</span>
                <span style={{fontSize:13,color:"#6B7A8D",lineHeight:1.5}}>{f}</span>
              </div>
            ))}
            <button onClick={()=>onGetStarted("signup")} className="cta-btn" style={{width:"100%",background:"#4ADE80",border:"none",color:"#060A0F",padding:"15px",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",marginTop:12,boxShadow:"0 8px 32px rgba(74,222,128,0.25)"}}>
              Start 14-day free trial →
            </button>
            <p style={{color:"#2A3A4A",fontSize:11,marginTop:12,textAlign:"center"}}>No card needed · Choose plan after trial</p>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="faq" style={{maxWidth:640,margin:"0 auto 100px",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:10,fontWeight:700,color:"#4ADE80",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>FAQ</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,3vw,36px)",fontWeight:800,margin:0,letterSpacing:"-0.02em"}}>Common questions</h2>
        </div>
        {[
          {q:"Is there really no credit card required for the trial?",a:"Correct — start your 14-day free trial with just an email address. We only ask for payment details if you decide to continue after the trial ends."},
          {q:"Which countries are supported for tax calculations?",a:"18 countries including UK, USA, Germany, France, Netherlands, Spain, Sweden, Switzerland, Canada, Australia, Nigeria, South Africa, Kenya, Ghana, India, Singapore, Japan and Malaysia. More added regularly."},
          {q:"How does VAT tracking work?",a:"Enable VAT registration in your profile, add your VAT number and default rate. Invoices will show subtotal + VAT breakdown. The VAT Return tab tracks output VAT (charged to clients) vs input VAT (paid on expenses) and produces a UK MTD-compatible summary you can file directly or send to your accountant."},
          {q:"Can I get paid directly through Ledgr?",a:"Yes — connect your Stripe account in Profile settings and every invoice gets a payment link. When clients pay, the money goes directly to your Stripe account. Ledgr never touches your funds."},
          {q:"What currencies does Ledgr support?",a:"32 currencies including GBP, EUR, USD, NGN, CAD, AUD, ZAR, INR, JPY, SGD, MYR, PHP, IDR, THB, VND, CHF, SEK, NOK, DKK, PLN and more — each with correct locale formatting."},
          {q:"Can I cancel anytime?",a:"Yes. Cancel from your account settings or email us. No questions asked, no lock-in, no cancellation fees."},
        ].map((f,i)=>(
          <div key={i} className="faq-item" style={{borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"0"}}>
            <button onClick={()=>setActiveFaq(activeFaq===i?null:i)} style={{width:"100%",background:"transparent",border:"none",padding:"20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left",gap:16,fontFamily:"'DM Sans',sans-serif"}}>
              <span style={{fontSize:14,fontWeight:600,color:"#C8D3DF",lineHeight:1.4}}>{f.q}</span>
              <span style={{color:"#4ADE80",fontSize:18,fontWeight:300,flexShrink:0,transition:"transform 0.2s",transform:activeFaq===i?"rotate(45deg)":"rotate(0deg)"}}>+</span>
            </button>
            {activeFaq===i&&(
              <div style={{paddingBottom:20,fontSize:13,color:"#4B5A6A",lineHeight:1.8,animation:"rise 0.2s ease forwards"}}>{f.a}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── Final CTA ── */}
      <div style={{textAlign:"center",padding:"80px 24px 100px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(74,222,128,0.05) 0%,transparent 60%)",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,5vw,56px)",fontWeight:900,margin:"0 0 16px",letterSpacing:"-0.03em",lineHeight:1.1}}>
            Your finances.<br/><em style={{fontStyle:"italic",color:"#4ADE80"}}>Finally sorted.</em>
          </h2>
          <p style={{color:"#4B5A6A",fontSize:15,marginBottom:36,lineHeight:1.7,maxWidth:400,margin:"0 auto 36px"}}>
            Join freelancers in 18 countries who use Ledgr to get paid faster, track smarter, and file stress-free.
          </p>
          <button onClick={()=>onGetStarted("signup")} className="cta-btn" style={{background:"#4ADE80",border:"none",color:"#060A0F",padding:"16px 44px",borderRadius:14,cursor:"pointer",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 12px 48px rgba(74,222,128,0.3)"}}>
            Start free — no card needed →
          </button>
          <p style={{color:"#1E2A38",fontSize:12,marginTop:16}}>14-day trial · £15/mo after · Cancel anytime</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",padding:"24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,background:"#040608"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:22,height:22,background:"linear-gradient(135deg,#4ADE80,#16a34a)",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#060A0F"}}>L</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700}}>Ledgr</span>
          <span style={{color:"#1E2A38",fontSize:12,marginLeft:8}}>© 2025</span>
        </div>
        <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
          <a href="/about" style={{color:"#2A3A4A",fontSize:12,textDecoration:"none",transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color="#6B7A8D"} onMouseLeave={e=>e.target.style.color="#2A3A4A"}>About</a>
          <a href="/contact" style={{color:"#2A3A4A",fontSize:12,textDecoration:"none",transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color="#6B7A8D"} onMouseLeave={e=>e.target.style.color="#2A3A4A"}>Contact</a>
          <a href="/privacy" style={{color:"#2A3A4A",fontSize:12,textDecoration:"none",transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color="#6B7A8D"} onMouseLeave={e=>e.target.style.color="#2A3A4A"}>Privacy</a>
          <span style={{color:"#1E2A38",fontSize:12}}>ledgrapp.co.uk</span>
        </div>
      </div>
    </div>
  );
}


// ── Admin Dashboard ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://phjybvphmlzghdebonzy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanlidnBobWx6Z2hkZWJvbnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTI2MDIsImV4cCI6MjA4ODE2ODYwMn0.6r7C6aQPn0YTjmDjRkP8fVd6cQhXJ_L1jBYqsu2qRWM";
const ADMIN_EMAIL = "azubuikedavies@gmail.com";

function exportUsersCsv(users, label, brevoFormat=false) {
  let rows;
  if (brevoFormat) {
    // Brevo import format: EMAIL, FIRSTNAME, LASTNAME + custom attrs
    rows = [
      ["EMAIL", "FIRSTNAME", "LASTNAME", "LEDGR_STATUS", "LEDGR_TRIAL_ENDS", "LEDGR_JOINED", "LEDGR_INVOICES", "LEDGR_CURRENCY"],
      ...users.map(u => {
        const nameParts = (u.name || "").split(" ");
        return [
          u.email,
          nameParts[0] || "",
          nameParts.slice(1).join(" ") || "",
          u.subscription_status || "trialing",
          u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString("en-GB") : "",
          u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB") : "",
          u.invoices || 0,
          u.currency || "USD",
        ];
      })
    ];
  } else {
    rows = [
      ["Email", "Name", "Status", "Trial Ends", "Joined", "Invoices", "Expenses", "Currency"],
      ...users.map(u => [
        u.email,
        u.name || "",
        u.subscription_status || "trialing",
        u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString("en-GB") : "",
        u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB") : "",
        u.invoices || 0,
        u.expenses || 0,
        u.currency || "USD",
      ])
    ];
  }
  const csv = rows.map(r => r.map(v => `"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: `ledgr-users-${label}${brevoFormat?"-brevo":""}-${new Date().toISOString().slice(0,10)}.csv`,
  });
  a.click();
}

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
        <div style={{marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap"}}>
          {data&&(
            <>
              {/* Standard CSV exports */}
              <button onClick={()=>exportUsersCsv(data.users,"all")} style={{background:"#0d2018",border:"1px solid #4ADE8033",color:"#4ADE80",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
                ↓ All Users
              </button>
              <button onClick={()=>exportUsersCsv(data.users.filter(u=>u.subscription_status==="trialing"||!u.subscription_status),"trial")} style={{background:"#1f1508",border:"1px solid #FBBF2433",color:"#FBBF24",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
                ↓ Trial Users
              </button>
              <button onClick={()=>exportUsersCsv(data.users.filter(u=>u.subscription_status==="active"),"active")} style={{background:"#0a2018",border:"1px solid #4ADE8033",color:"#4ADE80",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
                ↓ Paid Users
              </button>
              {/* Brevo-ready exports */}
              <button onClick={()=>exportUsersCsv(data.users,"all",true)} style={{background:"#1a0a2e",border:"1px solid #A78BFA44",color:"#A78BFA",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}} title="Brevo-formatted CSV — import directly into Brevo contacts">
                ↓ Brevo: All
              </button>
              <button onClick={()=>exportUsersCsv(data.users.filter(u=>u.subscription_status==="trialing"||!u.subscription_status),"trial",true)} style={{background:"#1a0a2e",border:"1px solid #A78BFA44",color:"#A78BFA",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}} title="Brevo-formatted CSV of trial users only">
                ↓ Brevo: Trial
              </button>
            </>
          )}
          <button onClick={onExit} style={{background:"#141A22",border:"1px solid #1E2535",color:"#8B95A8",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
            Back to App
          </button>
        </div>
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
        // Capture referral code from URL
        const refCode = new URLSearchParams(window.location.search).get("ref") || "";
        const { data: signUpData, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { referred_by: refCode || null } }
        });
        if (error) setError(error.message);
        else {
          // Save referral code to profile if present
          if (refCode && signUpData?.user?.id) {
            setTimeout(async () => {
              await supabase.from("profiles").update({ referred_by: refCode }).eq("id", signUpData.user.id);
            }, 2000);
          }
          setMessage("Check your email to confirm your account, then log in.");
        }
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
  const num = inv.invoice_number ? `INV-${String(inv.invoice_number).padStart(3,"0")}` : `INV-${inv.id.slice(-8,-3).toUpperCase()}`;
  const currCode = inv.currency || profile.currency || "USD";
  const m = (n) => new Intl.NumberFormat(CURRENCIES.find(c=>c.code===currCode)?.locale||"en-US",{style:"currency",currency:currCode}).format(n);
  const d = (v) => v ? new Date(v).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "N/A";
  const hasVat = inv.vat_rate && inv.vat_amount;
  const subtotal = inv.subtotal || inv.amount;
  const vatTotalRow = hasVat ? `
    <tr><td colspan="2" style="text-align:right;color:#6B7280;font-size:13px">Subtotal</td><td>${m(subtotal)}</td></tr>
    <tr><td colspan="2" style="text-align:right;color:#6B7280;font-size:13px">VAT (${inv.vat_rate}%)</td><td>${m(inv.vat_amount)}</td></tr>
  ` : "";
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
  td{padding:14px 0;border-bottom:1px solid #f0f0f0;font-size:14px}td:last-child{text-align:right;font-weight:700}
  .total{display:flex;justify-content:flex-end;margin-bottom:48px}.tbox{background:#111;color:#fff;padding:22px 32px;border-radius:12px}
  .tlbl{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px}
  .tamt{font-family:'Playfair Display',serif;font-size:30px;color:#4ade80}
  .vat-notice{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 16px;margin-bottom:32px;font-size:12px;color:#166534}
  .foot{text-align:center;padding-top:24px;border-top:1px solid #eee;font-size:12px;color:#9CA3AF}
  .pbtn{position:fixed;bottom:24px;right:24px;background:#16a34a;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
  @media print{.pbtn{display:none}}</style></head>
  <body><button class="pbtn" onclick="window.print()">Save as PDF</button>
  <div class="top"><div class="logo">Ledgr<span>.</span></div><div style="text-align:right"><h2 style="font-size:24px;font-weight:700">Invoice</h2><div style="color:#6B7280;font-size:13px">${num}</div></div></div>
  <div class="stripe-bar" style="height:3px;background:linear-gradient(90deg,#16a34a,#4ade80);margin-bottom:40px"></div>
  <div class="grid2">
    <div><div class="lbl">From</div><div class="val">${profile.business_name||profile.name||"Your Name"}</div>
    <div class="sub">${profile.email||""}${profile.phone?"<br/>"+profile.phone:""}${profile.address?"<br/>"+profile.address:""}${profile.vat_number?"<br/>VAT No: "+profile.vat_number:""}</div></div>
    <div><div class="lbl">Bill To</div><div class="val">${inv.client}</div>${inv.client_email?`<div class="sub">${inv.client_email}</div>`:""}</div>
  </div>
  <div class="meta">
    <div><div class="lbl">Date</div><div class="val" style="font-size:13px">${d(new Date().toISOString())}</div></div>
    <div><div class="lbl">Due</div><div class="val" style="font-size:13px">${d(inv.due_date)}</div></div>
    <div><div class="lbl">Status</div><div class="val" style="font-size:13px;color:${inv.status==="paid"?"#16a34a":inv.status==="overdue"?"#dc2626":"#d97706"}">${inv.status.charAt(0).toUpperCase()+inv.status.slice(1)}</div></div>
  </div>
  ${hasVat && profile.vat_number ? `<div class="vat-notice">VAT Registered Business · VAT Number: ${profile.vat_number} · VAT Rate: ${inv.vat_rate}%</div>` : ""}
  <table><thead><tr><th style="width:55%">Description</th><th>Type</th><th>${hasVat?"Subtotal (excl. VAT)":"Amount"}</th></tr></thead>
  <tbody>
    <tr><td>${inv.description||"Services rendered"}</td><td style="color:#6B7280">${inv.type}</td><td>${m(subtotal)}</td></tr>
    ${vatTotalRow}
  </tbody></table>
  <div class="total"><div class="tbox"><div class="tlbl">Total Due${hasVat?" (inc. VAT)":""}</div><div class="tamt">${m(inv.amount)}</div></div></div>
  ${inv.notes?`<div style="margin-bottom:32px;padding:16px;background:#F9FAFB;border-radius:8px;font-size:13px;color:#555"><strong>Notes:</strong> ${inv.notes}</div>`:""}
  <div class="foot">Thank you for your business · Generated by Ledgr</div></body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close();
}

function exportCSV(type, invoices, expenses) {
  let rows, filename;
  if (type==="invoices") { rows=[["Invoice #","Client","Description","Amount","Status","Due Date","Type"],...invoices.map(i=>[i.id.slice(-8).toUpperCase(),i.client,i.description,i.amount,i.status,i.due_date,i.type])]; filename="ledgr-invoices.csv"; }
  else { rows=[["Name","Amount","Category","Date","Type"],...expenses.map(e=>[e.name,e.amount,e.category,e.date,e.type])]; filename="ledgr-expenses.csv"; }
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:filename}); a.click();
}

function exportAccountantPack(invoices, expenses, profile) {
  const now = new Date();
  const year = now.getFullYear();
  const cur = profile?.currency || "USD";
  const fmt = (n) => new Intl.NumberFormat("en-GB", { style:"currency", currency:cur, minimumFractionDigits:2 }).format(n || 0);

  // Income summary
  const paidInvs = invoices.filter(i => i.status === "paid");
  const unpaidInvs = invoices.filter(i => i.status !== "paid");
  const totalIncome = paidInvs.reduce((s,i) => s + (parseFloat(i.amount)||0), 0);
  const totalUnpaid = unpaidInvs.reduce((s,i) => s + (parseFloat(i.amount)||0), 0);
  const totalExpenses = expenses.reduce((s,e) => s + (parseFloat(e.amount)||0), 0);
  const netProfit = totalIncome - totalExpenses;

  // Expense categories
  const catMap = {};
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category]||0) + (parseFloat(e.amount)||0); });
  const catRows = Object.entries(catMap).sort((a,b) => b[1]-a[1]);

  // Build CSV with multiple sections
  const sections = [];

  sections.push(["LEDGR ACCOUNTANT PACK", "", "", "", ""]);
  sections.push([`Generated: ${now.toLocaleDateString("en-GB")}`, "", "", "", ""]);
  sections.push([`Freelancer: ${profile?.name || ""}`, "", "", "", ""]);
  sections.push([`VAT Number: ${profile?.vat_number || "N/A"}`, "", "", "", ""]);
  sections.push(["", "", "", "", ""]);

  sections.push(["=== INCOME SUMMARY ===", "", "", "", ""]);
  sections.push(["Total Invoiced", "", "", fmt(paidInvs.reduce((s,i)=>s+(parseFloat(i.amount)||0),0) + totalUnpaid), ""]);
  sections.push(["Total Collected", "", "", fmt(totalIncome), ""]);
  sections.push(["Total Outstanding", "", "", fmt(totalUnpaid), ""]);
  sections.push(["Total Expenses", "", "", fmt(totalExpenses), ""]);
  sections.push(["Net Profit", "", "", fmt(netProfit), ""]);
  sections.push(["", "", "", "", ""]);

  sections.push(["=== ALL INVOICES ===", "", "", "", ""]);
  sections.push(["Invoice #", "Client", "Description", "Amount", "Status", "Due Date", "VAT Amount"]);
  invoices.forEach(i => {
    const num = i.invoice_number ? `INV-${String(i.invoice_number).padStart(3,"0")}` : i.id.slice(-8).toUpperCase();
    sections.push([num, i.client||"", i.description||"", fmt(i.amount), i.status, i.due_date||"", i.vat_amount ? fmt(i.vat_amount) : ""]);
  });
  sections.push(["", "", "", "", ""]);

  sections.push(["=== ALL EXPENSES ===", "", "", "", ""]);
  sections.push(["Date", "Name", "Category", "Amount", "Type", "VAT Amount"]);
  [...expenses].sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(e => {
    sections.push([e.date||"", e.name||"", e.category||"", fmt(e.amount), e.type||"", e.vat_amount ? fmt(e.vat_amount) : ""]);
  });
  sections.push(["", "", "", "", ""]);

  sections.push(["=== EXPENSES BY CATEGORY ===", "", "", "", ""]);
  sections.push(["Category", "Total", "", "", ""]);
  catRows.forEach(([cat, amt]) => sections.push([cat, fmt(amt), "", "", ""]));

  const csv = sections.map(r => r.map(v => `"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], {type:"text/csv"})),
    download: `ledgr-accountant-pack-${year}.csv`
  });
  a.click();
}

function getClientHealth(clientInvoices) {
  if (!clientInvoices || clientInvoices.length === 0) return { score: null, label: "New", color: "#6B7A8D" };
  const now = new Date();
  const paid = clientInvoices.filter(i => i.status === "paid");
  const overdue = clientInvoices.filter(i => i.status !== "paid" && i.due_date && new Date(i.due_date) < now);
  const total = clientInvoices.length;
  const payRate = paid.length / total;
  const avgDaysOverdue = overdue.length > 0
    ? overdue.reduce((s,i) => s + Math.floor((now - new Date(i.due_date)) / 86400000), 0) / overdue.length
    : 0;
  let score = Math.round(payRate * 70);
  if (avgDaysOverdue === 0) score += 30;
  else if (avgDaysOverdue < 7) score += 20;
  else if (avgDaysOverdue < 14) score += 10;
  else if (avgDaysOverdue < 30) score += 5;
  score = Math.max(0, Math.min(100, score));
  if (score >= 85) return { score, label: "Excellent", color: "#4ADE80" };
  if (score >= 65) return { score, label: "Good", color: "#86efac" };
  if (score >= 45) return { score, label: "Average", color: "#FBBF24" };
  if (score >= 25) return { score, label: "At Risk", color: "#F97316" };
  return { score, label: "Poor", color: "#F87171" };
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
  const [flutterwaveKey, setFlutterwaveKey] = useState("");
  const [paystackKey, setPaystackKey] = useState("");
  const [selectedClient, setSelectedClient] = useState(null); // for client detail view
  // ── Referral state ──
  const [referralCopied, setReferralCopied] = useState(false);
  const referralLink = session ? `https://ledgrapp.co.uk?ref=${session.user.id.slice(0,8).toUpperCase()}` : "";
  const copyReferral = () => {
    navigator.clipboard?.writeText(referralLink);
    setReferralCopied(true);
    setTimeout(()=>setReferralCopied(false), 3000);
  };
  // ── Income Pots state ──
  const [pots, setPots] = useState({ tax: 0, buffer: 0, savings: 0 });
  const [potSettings, setPotSettings] = useState({ taxPct: 25, bufferPct: 10, savingsPct: 5 });
  const [potsLoaded, setPotsLoaded] = useState(false);
  // ── Proposals state ──
  const [proposals, setProposals] = useState([]);
  const [newProposal, setNewProposal] = useState({ client:"", client_id:null, title:"", description:"", amount:"", currency:"", valid_until:"", status:"draft" });
  const [proposalLoading, setProposalLoading] = useState(false);
  // ── Time Tracker state ──
  const [timeEntries, setTimeEntries] = useState([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerClient, setTimerClient] = useState("");
  const [timerProject, setTimerProject] = useState("");
  const [timerRate, setTimerRate] = useState(""); 
  const [fxRates, setFxRates] = useState({});
  const [fxLoading, setFxLoading] = useState(false);
  const [fxHistory, setFxHistory] = useState({}); // { "GBP_NGN": [{date, rate}, ...] }
  const [fxHistoryLoading, setFxHistoryLoading] = useState(false);
  const [fxAlertThreshold, setFxAlertThreshold] = useState({});
  const [fxCalcAmount, setFxCalcAmount] = useState("");
  const [fxCalcFrom, setFxCalcFrom] = useState("GBP");
  const [fxCalcTo, setFxCalcTo] = useState("NGN");

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
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const close = () => setModal(null);
  const [newInv, setNewInv] = useState({ client:"", client_id:null, client_email:"", amount:"", due_date:"", type:"business", description:"", status:"pending", recurring:false, recurring_frequency:"monthly" });
  const [newExp, setNewExp] = useState({ name:"", amount:"", category:"", date:"", type:"business" });
  const [newAlr, setNewAlr] = useState({ label:"", amount:"", due_date:"", type:"personal" });
  const [editPro, setEditPro] = useState({ name:"", email:"", phone:"", address:"" });
  const [vatQuarter, setVatQuarter] = useState(() => { const n=new Date(); return `${n.getFullYear()}-Q${Math.ceil((n.getMonth()+1)/3)}`; });
  const _now = new Date(); const _curY = _now.getFullYear();
  const [taxYear, setTaxYear] = useState(_now >= new Date(_curY,3,6) ? _curY : _curY-1);
  const [taxCountry, setTaxCountry] = useState("GB");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Handle ?success=true from Stripe redirect - poll until subscription is active
  const [stripeSuccess, setStripeSuccess] = useState(false);
  const [stripeConnectSuccess, setStripeConnectSuccess] = useState(false);
  const [stripeConnectError, setStripeConnectError] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
      setStripeSuccess(true);
    }
    if (params.get("stripe_connect") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      setStripeConnectSuccess(true);
      // Reload profile to pick up new stripe_account_id
      setTimeout(() => loadAll(), 1500);
    }
    if (params.get("stripe_connect") === "error") {
      window.history.replaceState({}, "", window.location.pathname);
      setStripeConnectError(params.get("msg") || "Stripe connection failed.");
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

  useEffect(() => { if (session) { loadAll(); loadAccounts(); loadPots(); loadProposals(); loadTimeEntries(); loadFxRates(); loadFxHistory(); } }, [session]);

  // Timer tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerStart]);

  // Timer tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerStart]);

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

  // ── Income Pots ──────────────────────────────────────────────────────────
  const loadPots = async () => {
    const { data } = await supabase.from("profiles").select("pots_data, pot_settings").eq("id", session.user.id).single();
    if (data?.pots_data) setPots(data.pots_data);
    if (data?.pot_settings) setPotSettings(data.pot_settings);
    setPotsLoaded(true);
  };
  const savePots = async (newPots, newSettings) => {
    const p = newPots || pots; const s = newSettings || potSettings;
    setPots(p); if (newSettings) setPotSettings(s);
    await supabase.from("profiles").update({ pots_data: p, pot_settings: s }).eq("id", session.user.id);
  };
  const allocateToPots = (amount) => {
    const taxAmt = parseFloat(((amount * potSettings.taxPct) / 100).toFixed(2));
    const bufferAmt = parseFloat(((amount * potSettings.bufferPct) / 100).toFixed(2));
    const savingsAmt = parseFloat(((amount * potSettings.savingsPct) / 100).toFixed(2));
    const newPots = { tax: parseFloat((pots.tax + taxAmt).toFixed(2)), buffer: parseFloat((pots.buffer + bufferAmt).toFixed(2)), savings: parseFloat((pots.savings + savingsAmt).toFixed(2)) };
    savePots(newPots, null);
    return { taxAmt, bufferAmt, savingsAmt };
  };

  // ── Proposals ────────────────────────────────────────────────────────────
  const loadProposals = async () => {
    const { data } = await supabase.from("proposals").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
    if (data) setProposals(data);
  };
  const addProposal = async () => {
    if (!newProposal.title || !newProposal.amount) return;
    setProposalLoading(true);
    const row = { ...newProposal, amount: parseFloat(newProposal.amount), user_id: session.user.id, status: "draft" };
    const { data } = await supabase.from("proposals").insert(row).select().single();
    if (data) setProposals(p => [data, ...p]);
    setNewProposal({ client:"", client_id:null, title:"", description:"", amount:"", currency:"", valid_until:"", status:"draft" });
    setProposalLoading(false); close();
  };
  const convertProposalToInvoice = async (proposal) => {
    const { data: seqData } = await supabase.rpc("get_next_invoice_number", { p_user_id: session.user.id });
    const row = {
      client: proposal.client, client_id: proposal.client_id, amount: proposal.amount,
      description: proposal.title + (proposal.description ? " — " + proposal.description : ""),
      currency: proposal.currency || profile?.currency, type: "business", status: "pending",
      user_id: session.user.id, invoice_number: seqData || 1,
      due_date: new Date(Date.now() + 14*24*60*60*1000).toISOString().split("T")[0],
    };
    const { data } = await supabase.from("invoices").insert(row).select().single();
    if (data) {
      setInvoices(p => [data, ...p]);
      await supabase.from("proposals").update({ status: "converted" }).eq("id", proposal.id);
      setProposals(p => p.map(x => x.id===proposal.id ? {...x, status:"converted"} : x));
      setTab("invoices");
    }
  };
  const deleteProposal = async (id) => {
    await supabase.from("proposals").delete().eq("id", id);
    setProposals(p => p.filter(x => x.id !== id));
  };

  // ── Time Tracker ─────────────────────────────────────────────────────────
  const loadTimeEntries = async () => {
    const { data } = await supabase.from("time_entries").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(50);
    if (data) setTimeEntries(data);
  };
  const startTimer = () => { setTimerStart(Date.now() - timerElapsed * 1000); setTimerRunning(true); };
  const pauseTimer = () => { setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000)); setTimerRunning(false); };
  const resetTimer = () => { setTimerRunning(false); setTimerStart(null); setTimerElapsed(0); };
  const saveTimeEntry = async () => {
    const elapsed = timerRunning ? Math.floor((Date.now() - timerStart) / 1000) : timerElapsed;
    if (elapsed < 60 || !timerClient) return;
    const hours = parseFloat((elapsed / 3600).toFixed(2));
    const rate = parseFloat(timerRate) || 0;
    const amount = parseFloat((hours * rate).toFixed(2));
    const row = { user_id: session.user.id, client: timerClient, project: timerProject, duration_seconds: elapsed, hours, rate, amount, currency: profile?.currency||"USD", date: new Date().toISOString().split("T")[0] };
    const { data } = await supabase.from("time_entries").insert(row).select().single();
    if (data) setTimeEntries(p => [data, ...p]);
    resetTimer(); setTimerClient(""); setTimerProject(""); setTimerRate("");
  };
  const convertTimeToInvoice = async (entries) => {
    if (!entries.length) return;
    const totalAmount = entries.reduce((s,e) => s + (e.amount||0), 0);
    const clientName = entries[0].client;
    const clientObj = clients.find(c => c.name === clientName);
    const { data: seqData } = await supabase.rpc("get_next_invoice_number", { p_user_id: session.user.id });
    const desc = entries.length === 1 ? `${entries[0].project||"Work"} — ${entries[0].hours}h @ ${money(entries[0].rate, entries[0].currency)}/hr` : `${entries.length} time entries — ${entries.reduce((s,e)=>s+e.hours,0).toFixed(2)} hours total`;
    const row = { client: clientName, client_id: clientObj?.id||null, amount: totalAmount, description: desc, currency: entries[0].currency||profile?.currency, type:"business", status:"pending", user_id: session.user.id, invoice_number: seqData||1, due_date: new Date(Date.now()+14*24*60*60*1000).toISOString().split("T")[0] };
    const { data } = await supabase.from("invoices").insert(row).select().single();
    if (data) { setInvoices(p => [data, ...p]); setTab("invoices"); }
  };

  // ── FX Rates ─────────────────────────────────────────────────────────────
  const loadFxRates = async () => {
    if (fxLoading) return;
    setFxLoading(true);
    try {
      // Fetch current rates for all NGN pairs + base currency
      const pairs = ["GBP","EUR","USD"];
      const allRates = {};
      for (const base of pairs) {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
        if (res.ok) {
          const d = await res.json();
          allRates[base] = d.rates || {};
        }
      }
      // Also fetch user base currency
      const userBase = profile?.currency || "USD";
      if (!pairs.includes(userBase)) {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${userBase}`);
        if (res.ok) { const d = await res.json(); allRates[userBase] = d.rates || {}; }
      }
      setFxRates(allRates);
      // Store today's rates in Supabase for history
      await storeDailyRates(allRates);
    } catch(e) { console.error("FX fetch failed:", e); }
    setFxLoading(false);
  };

  const storeDailyRates = async (allRates) => {
    const today = new Date().toISOString().split("T")[0];
    const pairs = [["GBP","NGN"],["USD","NGN"],["EUR","NGN"]];
    for (const [from, to] of pairs) {
      const rate = allRates[from]?.[to];
      if (!rate) continue;
      await supabase.from("fx_rates_history").upsert({
        pair: `${from}_${to}`, date: today, rate, from_currency: from, to_currency: to
      }, { onConflict: "pair,date" });
    }
  };

  const loadFxHistory = async () => {
    setFxHistoryLoading(true);
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().split("T")[0];
    const { data } = await supabase.from("fx_rates_history")
      .select("*")
      .gte("date", thirtyDaysAgo)
      .order("date", { ascending: true });
    if (data) {
      const grouped = {};
      data.forEach(r => {
        if (!grouped[r.pair]) grouped[r.pair] = [];
        grouped[r.pair].push({ date: r.date, rate: r.rate });
      });
      setFxHistory(grouped);
    }
    setFxHistoryLoading(false);
  };

  const getFxSignal = (pair) => {
    const history = fxHistory[pair] || [];
    if (history.length < 5) return null;
    const rates = history.map(h => h.rate);
    const current = rates[rates.length - 1];
    const max30 = Math.max(...rates);
    const min30 = Math.min(...rates);
    const avg30 = rates.reduce((s,r) => s+r, 0) / rates.length;
    const range = max30 - min30;
    const pctFromMax = range > 0 ? ((max30 - current) / range) * 100 : 50;
    // Higher rate = better for sender (more NGN per GBP/USD/EUR)
    if (pctFromMax <= 10) return { label: "Excellent", desc: "Rate near 30-day high — great time to convert", color: "#4ADE80", score: 95 };
    if (pctFromMax <= 25) return { label: "Good", desc: "Rate above average — favourable to convert now", color: "#86efac", score: 75 };
    if (pctFromMax <= 50) return { label: "Average", desc: "Rate around the monthly average", color: "#FBBF24", score: 50 };
    if (pctFromMax <= 75) return { label: "Wait", desc: "Rate below average — consider holding", color: "#F97316", score: 25 };
    return { label: "Poor", desc: "Rate near 30-day low — wait if you can", color: "#F87171", score: 10 };
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
    // VAT: amount field = subtotal (excl VAT), total = subtotal + vat_amount
    const subtotal = parseFloat(newInv.amount);
    const vat_rate = newInv.vat_rate ? parseFloat(newInv.vat_rate) : 0;
    const vat_amount = parseFloat(((subtotal * vat_rate) / 100).toFixed(2));
    const total_amount = parseFloat((subtotal + vat_amount).toFixed(2));
    // Get next sequential invoice number for this user
    const { data: seqData } = await supabase.rpc("get_next_invoice_number", { p_user_id: session.user.id });
    const invoice_number = seqData || 1;
    const row = {
      ...newInv,
      amount: total_amount,
      subtotal: subtotal,
      vat_rate: vat_rate || null,
      vat_amount: vat_amount || null,
      user_id: session.user.id,
      recurring_next_date,
      invoice_number,
    };
    const { data } = await supabase.from("invoices").insert(row).select().single();
    if (data) setInvoices(p=>[data,...p]);
    setNewInv({client:"",client_id:null,client_email:"",amount:"",due_date:"",type:"business",description:"",status:"pending",recurring:false,recurring_frequency:"monthly",vat_rate:"",currency:""}); close();
  };
  const addExpense = async () => {
    if (!newExp.name||!newExp.amount) return;
    const row = {
      ...newExp,
      amount: parseFloat(newExp.amount),
      vat_amount: newExp.vat_amount ? parseFloat(newExp.vat_amount) : null,
      user_id: session.user.id,
    };
    const { data } = await supabase.from("expenses").insert(row).select().single();
    if (data) setExpenses(p=>[data,...p]);
    setNewExp({name:"",amount:"",category:"",date:"",type:"business",vat_amount:""}); close();
  };
  const addAlert = async () => {
    if (!newAlr.label||!newAlr.due_date) return;
    const { data } = await supabase.from("alerts").insert({...newAlr,amount:parseFloat(newAlr.amount)||0,user_id:session.user.id}).select().single();
    if (data) setAlerts(p=>[data,...p]);
    setNewAlr({label:"",amount:"",due_date:"",type:"personal"}); close();
  };
  const markPaid = async (id) => {
    await supabase.from("invoices").update({status:"paid"}).eq("id",id);
    setInvoices(p=>p.map(x=>x.id===id?{...x,status:"paid"}:x));
    // Auto-allocate to income pots
    const inv = invoices.find(i => i.id === id);
    if (inv && (potSettings.taxPct > 0 || potSettings.bufferPct > 0 || potSettings.savingsPct > 0)) {
      const alloc = allocateToPots(parseFloat(inv.amount)||0);
      if (alloc.taxAmt > 0 || alloc.bufferAmt > 0 || alloc.savingsAmt > 0) {
        const cur = inv.currency || profile?.currency || "USD";
        const fmt = (n) => new Intl.NumberFormat("en-GB",{style:"currency",currency:cur,minimumFractionDigits:2}).format(n);
        setTimeout(() => alert(`💰 Income pots updated!

Tax pot: +${fmt(alloc.taxAmt)}
Buffer pot: +${fmt(alloc.bufferAmt)}
Savings pot: +${fmt(alloc.savingsAmt)}

View in the Pots tab.`), 300);
      }
    }
  };
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
      const amount = money(inv.amount, inv.currency || profile?.currency);
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
          invoice_number: inv.invoice_number ? `INV-${String(inv.invoice_number).padStart(3,"0")}` : `INV-${inv.id.slice(0,8).toUpperCase()}`,
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

  const connectStripeOAuth = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-connect-onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON}`, "apikey": SUPABASE_ANON },
        body: JSON.stringify({ user_id: session.user.id }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url; // redirect to Stripe OAuth
    } catch(e) { alert("Could not start Stripe Connect: " + e.message); }
  };

  const disconnectStripeConnect = async () => {
    if (!confirm("Disconnect your Stripe account? Payment links will stop working until you reconnect.")) return;
    await supabase.from("profiles").update({
      stripe_account_id: null,
      stripe_access_token: null,
      stripe_connected_at: null,
      stripe_account_name: null,
    }).eq("id", session.user.id);
    setProfile(p => ({ ...p, stripe_account_id: null, stripe_account_name: null }));
  };

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

  const connectPaystack = async (apiKey) => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/connect-paystack`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
        body: JSON.stringify({ action:"connect", user_id:session.user.id, api_key:apiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await loadAccounts();
    } catch(e) { alert("Paystack connection failed: " + e.message); }
    setAccountsLoading(false);
  };

  const connectFlutterwave = async (apiKey) => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/connect-flutterwave`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
        body: JSON.stringify({ action:"connect", user_id:session.user.id, api_key:apiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await loadAccounts();
    } catch(e) { alert("Flutterwave connection failed: " + e.message); }
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
      const fn = provider === "stripe" ? "connect-stripe" : provider === "paypal" ? "connect-paypal" : provider === "revolut" ? "connect-revolut" : provider === "flutterwave" ? "connect-flutterwave" : provider === "paystack" ? "connect-paystack" : "connect-wise";
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
    const fn = provider === "stripe" ? "connect-stripe" : provider === "paypal" ? "connect-paypal" : provider === "revolut" ? "connect-revolut" : provider === "flutterwave" ? "connect-flutterwave" : provider === "paystack" ? "connect-paystack" : "connect-wise";
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
    if (status === "active" || status === "past_due") return true;
    if (status === "expired" || status === "canceled" || status === "unpaid") return false;
    if (status === "trialing" || !status) {
      if (!profile.trial_ends_at) return false;
      return new Date(profile.trial_ends_at) > new Date();
    }
    return false;
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

  const TABS=[{id:"dashboard",label:"Dashboard"},{id:"invoices",label:"Invoices"},{id:"expenses",label:"Expenses"},{id:"alerts",label:"Alerts"},{id:"clients",label:"Clients"},{id:"accounts",label:"Accounts"},{id:"bank",label:"Bank"},{id:"charts",label:"Charts"},{id:"tax",label:"Tax"},{id:"vat",label:"VAT"},{id:"pots",label:"💰 Pots"},{id:"proposals",label:"Proposals"},{id:"time",label:"⏱ Time"},{id:"ai",label:"✦ AI"}];
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
  const pc = profile?.currency;
  const stats=[
    {label:"Collected",value:money(totalIncome,pc),color:C.accent},
    {label:"Pending",value:money(totalPending,pc),color:C.warning},
    {label:"Overdue",value:money(totalOverdue,pc),color:C.danger},
    {label:"Expenses",value:money(totalExp,pc),color:"#60A5FA"},
    {label:"Net Profit",value:money(netProfit,pc),color:netProfit>=0?C.accent:C.danger},
    ...(connectedAccounts.length>0?[{label:"Account Balance",value:money(totalAccountBalance,pc),color:"#A78BFA"}]:[]),
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
                    steps.sort((a,b)=>a.done===b.done?0:a.done?1:-1); // incomplete first
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
                              {!s.done&&<button onClick={s.action} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:8,padding:isMobile?"5px 8px":"6px 12px",fontSize:isMobile?11:12,fontWeight:700,color:C.accent,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0,whiteSpace:"nowrap"}}>{s.cta} →</button>}
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
                        <div style={{color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</div>
                        <div style={{color:s.color,fontSize:isMobile?14:18,fontWeight:800,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Referral card */}
                  <div style={{background:"linear-gradient(135deg,#1a0a2e,#0d1a0f)",border:"1px solid #A78BFA33",borderRadius:16,padding:"16px 20px",marginBottom:12,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:200}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#A78BFA",marginBottom:4}}>💜 Give a friend 1 month free</div>
                      <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>Share your link — they get 1 month free, you get 1 month free when they subscribe.</div>
                    </div>
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:11,color:C.muted,fontFamily:"'DM Mono',monospace",maxWidth:isMobile?140:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{referralLink}</div>
                      <button onClick={copyReferral} style={{background:"#A78BFA22",border:"1px solid #A78BFA44",color:"#A78BFA",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                        {referralCopied?"✓ Copied!":"Copy link"}
                      </button>
                    </div>
                  </div>

                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px",marginBottom:12}}>
                    <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Recent Invoices</h3>
                    {invoices.length===0&&<p style={{color:C.muted,fontSize:13}}>No invoices yet - create your first one!</p>}
                    {invoices.slice(0,4).map(inv=>(
                      <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:12,marginBottom:12,borderBottom:`1px solid ${C.border}`}}>
                        <div><div style={{fontSize:14,fontWeight:600}}>{inv.client}</div><div style={{fontSize:12,color:C.muted}}>{inv.description}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700}}>{money(inv.amount, inv.currency||profile?.currency)}</div><StatusPill status={inv.status}/></div>
                      </div>
                    ))}
                  </div>
                  {upcoming.length>0&&(
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px"}}>
                      <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Upcoming Payments</h3>
                      {upcoming.map(a=>(
                        <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:12,marginBottom:12,borderBottom:`1px solid ${C.border}`}}>
                          <div><div style={{fontSize:14,fontWeight:600}}>{a.label}</div><div style={{fontSize:12,color:a.days<=3?C.danger:a.days<=7?C.warning:C.muted}}>{a.days<=0?"Due today!":`Due in ${a.days} days`}</div></div>
                          <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700}}>{money(a.amount, profile?.currency)}</div><Badge type={a.type}/></div>
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
                    <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap"}}>
                      <Btn onClick={()=>setModal("invoice")} style={{padding:"10px 14px",fontSize:13}}>+ New</Btn>
                      <Btn variant="secondary" onClick={()=>exportCSV("invoices",invoices,expenses)} style={{padding:"10px 14px",fontSize:13}}>CSV</Btn>
                      <Btn variant="secondary" onClick={()=>exportAccountantPack(invoices,expenses,profile)} style={{padding:"10px 14px",fontSize:13,color:"#A78BFA",border:"1px solid #A78BFA44"}} title="Download full accountant-ready CSV pack">📦 Pack</Btn>
                    </div>
                  </div>
                  {fInvoices.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:C.muted,background:C.card,borderRadius:16,border:`1px solid ${C.border}`}}>No invoices yet.</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {fInvoices.map(inv=>(
                      <div key={inv.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",transition:"border-color 0.2s,transform 0.15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="#2d3548";e.currentTarget.style.transform="translateY(-1px)";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                              {inv.client}
                              {inv.recurring&&<span style={{fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:5,background:C.blueDim,color:C.blue,letterSpacing:"0.08em",border:`1px solid ${C.blue}33`}}>RECURRING</span>}
                              {inv.client_viewed_at&&inv.status!=="paid"&&(
                                <span title={`Viewed by client ${new Date(inv.client_viewed_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}`} style={{fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:5,background:"#0f1f30",color:C.blue,letterSpacing:"0.08em",border:`1px solid ${C.blue}33`,cursor:"default"}}>
                                  👁 VIEWED
                                </span>
                              )}
                            </div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Badge type={inv.type}/><StatusPill status={inv.status}/></div>
                          </div>
                          <div style={{fontSize:isMobile?15:20,fontWeight:800,fontFamily:"'Playfair Display',serif",textAlign:"right",flexShrink:0}}>
                            {money(inv.amount, inv.currency||profile?.currency)}
                          </div>
                        </div>
                        <div style={{fontSize:12,color:C.muted,marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>{inv.description} · Due {inv.due_date?fmtDate(inv.due_date):"-"}</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          <Btn variant="secondary" onClick={()=>generatePDF(inv,profile||{})} style={{padding:"8px 14px",fontSize:12,color:C.accent,flex:1}}>PDF</Btn>
                          <Btn variant="secondary" onClick={()=>{
                            const num = inv.invoice_number ? `INV-${String(inv.invoice_number).padStart(3,"0")}` : `INV-${inv.id.slice(-8,-3).toUpperCase()}`;
                            const cur = inv.currency || profile?.currency || "USD";
                            const m = (n) => new Intl.NumberFormat("en-GB",{style:"currency",currency:cur}).format(n||0);
                            const d = (v) => v ? new Date(v).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : "N/A";
                            const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Preview: ${num}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;background:#f8fafc;padding:20px;color:#111}.card{background:#fff;max-width:680px;margin:0 auto;border-radius:16px;box-shadow:0 4px 40px rgba(0,0,0,0.08);overflow:hidden}.header{background:#060A0F;padding:28px 36px;display:flex;justify-content:space-between;align-items:flex-start}.logo{font-family:'Playfair Display',serif;font-size:24px;color:#F1F5F9}.logo span{color:#4ADE80}.inv-label{text-align:right;color:#6B7A8D;font-size:13px}.inv-num{font-size:20px;font-weight:700;color:#F1F5F9;margin-top:4px}.stripe{height:3px;background:linear-gradient(90deg,#4ADE80,#22c55e)}.body{padding:36px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:28px}.lbl{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px}.val{font-size:15px;font-weight:700;color:#0f172a}.sub{font-size:13px;color:#64748b;margin-top:3px;line-height:1.5}.dates{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:28px}table{width:100%;border-collapse:collapse;margin-bottom:24px}thead tr{border-bottom:2px solid #0f172a}th{text-align:left;padding:0 0 10px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8}th:last-child{text-align:right}td{padding:14px 0;border-bottom:1px solid #f1f5f9;font-size:14px}td:last-child{text-align:right;font-weight:700}.total-box{background:#0f172a;color:#fff;padding:20px 28px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.total-lbl{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}.total-amt{font-family:'Playfair Display',serif;font-size:28px;color:#4ADE80}.pay-btn{display:block;background:#4ADE80;color:#060A0F;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:24px}.foot{text-align:center;font-size:12px;color:#94a3b8;padding-top:20px;border-top:1px solid #f1f5f9}.preview-bar{background:#7c3aed;color:#fff;text-align:center;padding:10px;font-size:13px;font-weight:600}@media(max-width:500px){.meta{grid-template-columns:1fr}.header{flex-direction:column;gap:12px}}</style></head><body><div class="preview-bar">👁 Client Preview — this is what your client will see</div><div class="card"><div class="header"><div class="logo">Ledgr<span>.</span></div><div class="inv-label">Invoice<div class="inv-num">${num}</div></div></div><div class="stripe"></div><div class="body"><div class="meta"><div><div class="lbl">From</div><div class="val">${profile?.business_name||profile?.name||"Your Name"}</div>${profile?.email?`<div class="sub">${profile.email}</div>`:""}</div><div><div class="lbl">Bill To</div><div class="val">${inv.client}</div>${inv.client_email?`<div class="sub">${inv.client_email}</div>`:""}</div></div><div class="dates"><div><div class="lbl">Issue Date</div><div class="val" style="font-size:13px">${d(new Date().toISOString())}</div></div><div><div class="lbl">Due Date</div><div class="val" style="font-size:13px">${d(inv.due_date)}</div></div><div><div class="lbl">Status</div><div class="val" style="font-size:13px;color:${inv.status==="paid"?"#16a34a":"#d97706"}">${inv.status.charAt(0).toUpperCase()+inv.status.slice(1)}</div></div></div><table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody><tr><td>${inv.description||"Services rendered"}</td><td style="text-align:right;font-weight:700">${m(inv.amount)}</td></tr></tbody></table><div class="total-box"><div><div class="total-lbl">Total Due</div></div><div class="total-amt">${m(inv.amount)}</div></div><a href="#" class="pay-btn" onclick="alert('In the real invoice, this button links to your Stripe payment page.');return false;">Pay Now →</a>${inv.notes?`<div style="margin-bottom:20px;padding:14px;background:#f8fafc;border-radius:8px;font-size:13px;color:#475569"><strong>Notes:</strong> ${inv.notes}</div>`:""}<div class="foot">Powered by Ledgr · ledgrapp.co.uk</div></div></div></body></html>`;
                            const w = window.open("","_blank"); w.document.write(html); w.document.close();
                          }} style={{padding:"8px 12px",fontSize:12,color:"#A78BFA",border:"1px solid #A78BFA44",flex:1}}>👁 Preview</Btn>
                          {inv.status!=="paid"&&<Btn onClick={()=>markPaid(inv.id)} style={{padding:"8px 14px",fontSize:12,flex:1}}>Mark Paid</Btn>}
                          {inv.status!=="paid"&&!profile?.stripe_account_id&&(
                            <Btn variant="secondary" onClick={()=>setModal("profile")} style={{padding:"8px 14px",fontSize:12,flex:1,color:"#FBBF24",border:"1px solid #FBBF2444"}} title="Connect Stripe in Profile to enable payment links">
                              ⚡ Connect Stripe
                            </Btn>
                          )}
                          {inv.status!=="paid"&&profile?.stripe_account_id&&<Btn variant="secondary" onClick={()=>sendPaymentLink(inv)} disabled={!!linkLoading} style={{padding:"8px 14px",fontSize:12,flex:1,color:linkCopied===inv.id?"#4ADE80":C.blue,border:`1px solid ${linkCopied===inv.id?"#4ADE8044":C.blue+"44"}`}}>
                            {linkLoading===inv.id?"..." : linkCopied===inv.id ? "✓ Copied!" : "🔗 Copy Link"}
                          </Btn>}
                          {inv.status!=="paid"&&profile?.stripe_account_id&&<Btn variant="secondary" onClick={()=>emailPaymentLink(inv)} disabled={!!linkLoading} style={{padding:"8px 14px",fontSize:12,flex:1,color:"#FBBF24",border:"1px solid #FBBF2444"}}>
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
                          {inv.status!=="paid"&&inv.due_date&&new Date(inv.due_date)<new Date()&&(
                            <Btn variant="secondary" onClick={()=>{
                              const daysLate = Math.floor((new Date()-new Date(inv.due_date))/86400000);
                              const feeRate = 0.02; // 2% late fee
                              const lateFee = parseFloat(((parseFloat(inv.amount)||0)*feeRate).toFixed(2));
                              const newAmount = parseFloat(((parseFloat(inv.amount)||0)+lateFee).toFixed(2));
                              if(window.confirm(`Add 2% late fee of ${new Intl.NumberFormat("en-GB",{style:"currency",currency:inv.currency||profile?.currency||"USD"}).format(lateFee)}?\n\nInvoice total: ${new Intl.NumberFormat("en-GB",{style:"currency",currency:inv.currency||profile?.currency||"USD"}).format(inv.amount)} → ${new Intl.NumberFormat("en-GB",{style:"currency",currency:inv.currency||profile?.currency||"USD"}).format(newAmount)}\n(${daysLate} days overdue)`)){
                                supabase.from("invoices").update({amount:newAmount,description:(inv.description||"")+" + 2% late fee"}).eq("id",inv.id).then(()=>{
                                  setInvoices(p=>p.map(x=>x.id===inv.id?{...x,amount:newAmount,description:(inv.description||"")+" + 2% late fee"}:x));
                                });
                              }
                            }} style={{padding:"8px 12px",fontSize:12,color:"#FBBF24",border:"1px solid #FBBF2444"}} title="Add 2% late fee to this overdue invoice">
                              +Fee
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
                        <div style={{fontSize:16,fontWeight:800,color:C.danger,fontFamily:"'Playfair Display',serif",flexShrink:0}}>{money(exp.amount, profile?.currency)}</div>
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
                            <div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{a.amount>0?money(a.amount,profile?.currency):"-"}</div><button onClick={()=>delAlert(a.id)} style={{background:C.border,border:"none",color:C.muted,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}>Dismiss</button></div>
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
                          const health=getClientHealth(cliInvs);
                          return(
                            <div style={{display:"flex",flexDirection:"column",gap:10}}>
                              {cliInvs.length>0&&(
                                <div style={{background:`${health.color}11`,border:`1px solid ${health.color}33`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                  <div>
                                    <div style={{fontSize:10,fontWeight:700,color:health.color,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Client Health Score</div>
                                    <div style={{fontSize:13,color:health.color,fontWeight:600}}>{health.label} — pays {Math.round((cliInvs.filter(i=>i.status==="paid").length/cliInvs.length)*100)}% of invoices on time</div>
                                  </div>
                                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,color:health.color}}>{health.score}</div>
                                </div>
                              )}
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
                                {(()=>{
                                  const health=getClientHealth(cliInvs);
                                  return(
                                    <div style={{textAlign:"right",flexShrink:0}}>
                                      <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{money(totalBilled,profile?.currency)}</div>
                                      {cliInvs.length>0&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:health.color+"22",color:health.color,border:`1px solid ${health.color}44`}}>{health.label}</span>}
                                      {unpaid>0&&<span style={{fontSize:11,fontWeight:600,padding:"2px 6px",borderRadius:20,background:"#3a2d1a",color:C.warning,marginLeft:4}}>{unpaid} unpaid</span>}
                                    </div>
                                  );
                                })()}
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
                  {connectedAccounts.length < 6 && (
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

                      {/* Stripe — now via Connect OAuth in Profile settings */}
                      {!profile?.stripe_account_id && (
                        <ConnectCard
                          icon="⚡"
                          name="Stripe"
                          desc="Connect Stripe to enable payment links on invoices. Set up in your Profile settings."
                          color="#635bff"
                          onConnect={()=>setModal("profile")}
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
                          desc="Connect Revolut Business to sync multi-currency transactions."
                          color="#7B61FF"
                          onConnect={()=>setModal("connect-revolut")}
                        />
                      )}

                      {/* Flutterwave */}
                      {!connectedAccounts.find(a=>a.provider==="flutterwave") && (
                        <ConnectCard
                          icon="🦋"
                          name="Flutterwave"
                          desc="Nigerian freelancers — connect Flutterwave to sync NGN collections and balance."
                          color="#F5A623"
                          onConnect={()=>setModal("connect-flutterwave")}
                        />
                      )}

                      {/* Paystack */}
                      {!connectedAccounts.find(a=>a.provider==="paystack") && (
                        <ConnectCard
                          icon="🟢"
                          name="Paystack"
                          desc="Connect Paystack to sync your NGN payments and account balance."
                          color="#00C3F7"
                          onConnect={()=>setModal("connect-paystack")}
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
                            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:acc.provider==="wise"?"#4ADE80":acc.provider==="stripe"?"#635bff":acc.provider==="paypal"?"#009cde":acc.provider==="flutterwave"?"#F5A623":acc.provider==="paystack"?"#00C3F7":"#7B61FF"}}/>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{width:36,height:36,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                                  {acc.provider==="wise"?"🌍":acc.provider==="stripe"?"⚡":acc.provider==="paypal"?"🅿":acc.provider==="flutterwave"?"🦋":acc.provider==="paystack"?"🟢":"🔄"}
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
                              <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:800,color:C.text}}>{money(acc.balance||0, acc.currency)}</div>
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
                              {tx.type==="credit"?"+":"-"}{money(tx.amount, tx.currency)}
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
                          {[0,0.5,1].map((p,i)=>{const y=H-p*H;return(<g key={i}><line x1={44} y1={y} x2={tW} y2={y} stroke={C.border} strokeWidth={1}/><text x={40} y={y+4} fontSize={9} fill={C.muted} textAnchor="end">{money(p*maxV,profile?.currency)}</text></g>);})}
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
                            <text x={60} y={65} textAnchor="middle" fontSize={10} fill={C.text} fontWeight="bold">{money(totCat,profile?.currency)}</text>
                          </svg>
                          <div style={{flex:1,minWidth:140}}>
                            {slices.map((sl,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:10,height:10,borderRadius:2,background:sl.color,flexShrink:0}}/><div><div style={{fontSize:13,fontWeight:500}}>{sl.cat}</div><div style={{fontSize:11,color:C.muted}}>{Math.round(sl.pct*100)}% · {money(sl.amt,profile?.currency)}</div></div></div>))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {tab==="tax"&&(()=>{
                // ── Country tax rules ──────────────────────────────────────────
                const TAX_COUNTRIES = {
                  GB: { flag:"🇬🇧", name:"United Kingdom", currency:"GBP",
                    yearLabel: y=>`${y}/${y+1} (6 Apr – 5 Apr)`,
                    yearStart: y=>new Date(y,3,6), yearEnd: y=>new Date(y+1,3,5),
                    deadline: y=>`31 Jan ${y+2}`, deadlineNote:"Self Assessment",
                    calc: p=>{ const pa=12570,ti=Math.max(0,p-pa),it=ti<=37700?ti*0.20:37700*0.20+(ti-37700)*0.40,ni=Math.max(0,Math.min(p,50270)-12570)*0.09+Math.max(0,p-50270)*0.02; return{rows:[{l:"Net Profit",v:p},{l:"Personal Allowance (−)",v:-pa,note:"2024/25"},{l:"Taxable Income",v:ti},{l:"Income Tax (20%/40%)",v:it},{l:"Class 4 NI (9%/2%)",v:ni}],total:it+ni}; }
                  },
                  US: { flag:"🇺🇸", name:"United States", currency:"USD",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`15 Apr ${y+1}`, deadlineNote:"Federal Tax Return",
                    calc: p=>{ const se=p*0.9235,seTax=se*0.153,ded=seTax/2,ti=Math.max(0,p-ded-13850),it=ti<=11000?ti*0.10:ti<=44725?1100+(ti-11000)*0.12:ti<=95375?5147+(ti-44725)*0.22:ti<=100525?16290+(ti-95375)*0.24:17652+(ti-100525)*0.32; return{rows:[{l:"Gross Income",v:p},{l:"SE Tax Deduction (−)",v:-ded,note:"half of 15.3%"},{l:"Standard Deduction (−)",v:-13850,note:"2024"},{l:"Taxable Income",v:ti},{l:"Federal Income Tax",v:it},{l:"Self-Employment Tax (15.3%)",v:seTax}],total:it+seTax}; }
                  },
                  NG: { flag:"🇳🇬", name:"Nigeria", currency:"NGN",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`31 Mar ${y+1}`, deadlineNote:"FIRS Annual Return",
                    calc: p=>{ const cra=Math.max(200000,p*0.01)+Math.min(p*0.20,p);const ti=Math.max(0,p-cra);let it=0,rem=ti;const bands=[[300000,0.07],[300000,0.11],[500000,0.15],[500000,0.19],[1600000,0.21],[Infinity,0.24]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}return{rows:[{l:"Gross Income",v:p},{l:"Consolidated Relief (−)",v:-(p-ti),note:"CRA"},{l:"Taxable Income",v:ti},{l:"Personal Income Tax",v:it}],total:it};}
                  },
                  ZA: { flag:"🇿🇦", name:"South Africa", currency:"ZAR",
                    yearLabel: y=>`Mar ${y} – Feb ${y+1}`,
                    yearStart: y=>new Date(y,2,1), yearEnd: y=>new Date(y+1,1,28),
                    deadline: y=>`31 Jan ${y+1}`, deadlineNote:"SARS eFiling",
                    calc: p=>{ let it=0;const bands=[[237100,0.18],[111300,0.26],[165300,0.31],[284400,0.36],[185500,0.39],[321600,0.41],[Infinity,0.45]];let rem=p,base=0;for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}const rebate=17235;it=Math.max(0,it-rebate);return{rows:[{l:"Taxable Income",v:p},{l:"Income Tax (graduated)",v:it},{l:"Primary Rebate (−)",v:-rebate,note:"2024/25"}],total:it};}
                  },
                  KE: { flag:"🇰🇪", name:"Kenya", currency:"KES",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`30 Jun ${y+1}`, deadlineNote:"KRA iTax",
                    calc: p=>{ let it=0,rem=p;const bands=[[288000,0.10],[100000,0.25],[Infinity,0.30]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}const relief=28800;it=Math.max(0,it-relief);return{rows:[{l:"Gross Income",v:p},{l:"Income Tax (graduated)",v:it},{l:"Personal Relief (−)",v:-relief}],total:it};}
                  },
                  GH: { flag:"🇬🇭", name:"Ghana", currency:"GHS",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`30 Apr ${y+1}`, deadlineNote:"GRA Annual Return",
                    calc: p=>{ let it=0,rem=p;const bands=[[4380,0],[1320,0.05],[1560,0.10],[38000,0.175],[Infinity,0.25]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}return{rows:[{l:"Gross Income",v:p},{l:"Income Tax (graduated)",v:it}],total:it};}
                  },
                  CA: { flag:"🇨🇦", name:"Canada", currency:"CAD",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`15 Jun ${y+1}`, deadlineNote:"CRA T1 Return",
                    calc: p=>{ const ba=15705,ti=Math.max(0,p-ba);let fed=0,rem=ti;const bands=[[55867,0.15],[55866,0.205],[64533,0.26],[70039,0.29],[Infinity,0.33]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);fed+=chunk*rate;rem-=chunk;}const cpp=Math.min(Math.max(0,p-3500),65700)*0.1188;return{rows:[{l:"Net Income",v:p},{l:"Basic Personal Amount (−)",v:-ba,note:"2024"},{l:"Taxable Income",v:ti},{l:"Federal Income Tax",v:fed},{l:"CPP Contributions",v:cpp,note:"self-employed"}],total:fed+cpp};}
                  },
                  AU: { flag:"🇦🇺", name:"Australia", currency:"AUD",
                    yearLabel: y=>`1 Jul ${y} – 30 Jun ${y+1}`,
                    yearStart: y=>new Date(y,6,1), yearEnd: y=>new Date(y+1,5,30),
                    deadline: y=>`31 Oct ${y+1}`, deadlineNote:"ATO Tax Return",
                    calc: p=>{ let it=0;const bands=[[18200,0],[26800,0.19],[45000,0.325],[90000,0.37],[Infinity,0.45]];let rem=p;for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}const medicare=p>26000?p*0.02:0;return{rows:[{l:"Taxable Income",v:p},{l:"Income Tax (graduated)",v:it},{l:"Medicare Levy (2%)",v:medicare}],total:it+medicare};}
                  },

                  // ── Europe ──────────────────────────────────────────────
                  DE: { flag:"🇩🇪", name:"Germany", currency:"EUR",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`31 Jul ${y+1}`, deadlineNote:"Steuererklärung",
                    calc: p=>{ const pa=11604;const ti=Math.max(0,p-pa);let it=0;if(ti<=0)it=0;else if(ti<=17005){const y=(ti-9984)/10000;it=(979.18*y+1400)*y;}else if(ti<=66760){const y=(ti-14926)/10000;it=(192.59*y+2397)*y+966.53;}else if(ti<=277825)it=ti*0.42-10602.13;else it=ti*0.45-18307.73;const sol=it>18130?it*0.055:0;const kv=p*0.073;const rv=Math.min(p,87600)*0.093;return{rows:[{l:"Gross Income",v:p},{l:"Basic Allowance (−)",v:-pa,note:"Grundfreibetrag 2024"},{l:"Taxable Income",v:ti},{l:"Income Tax (Einkommensteuer)",v:it},{l:"Solidarity Surcharge (5.5%)",v:sol,note:"if applicable"},{l:"Health Insurance est. (7.3%)",v:kv},{l:"Pension Insurance est. (9.3%)",v:rv}],total:it+sol};}
                  },
                  FR: { flag:"🇫🇷", name:"France", currency:"EUR",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`May/Jun ${y+1}`, deadlineNote:"Déclaration des revenus",
                    calc: p=>{ let it=0,rem=p;const bands=[[11294,0],[16532,0.11],[49623,0.30],[89981,0.41],[Infinity,0.45]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}const css=p*0.22;return{rows:[{l:"Gross Income",v:p},{l:"Income Tax (Impôt sur le revenu)",v:it},{l:"Social Charges (22%)",v:css,note:"CSG/CRDS/SS auto-entrepreneur"}],total:it+css};}
                  },
                  NL: { flag:"🇳🇱", name:"Netherlands", currency:"EUR",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`1 May ${y+1}`, deadlineNote:"Belastingdienst aangifte",
                    calc: p=>{ const box1Limit=75518;let it=0;if(p<=38441)it=p*0.3697;else if(p<=box1Limit)it=38441*0.3697+(p-38441)*0.3697;else it=box1Limit*0.3697+(p-box1Limit)*0.495;const mkb=Math.min(p*0.1277,7280);const av=Math.min(3070,Math.max(0,p<=24813?p*0.03:3070-(p-24813)*0.06));const taxable=Math.max(0,it-mkb-av);return{rows:[{l:"Gross Income",v:p},{l:"Box 1 Tax (36.97%/49.5%)",v:it},{l:"MKB-winstvrijstelling (−)",v:-mkb,note:"12.7% self-employed deduction"},{l:"Arbeidskorting (−)",v:-av,note:"Employment credit"},{l:"Estimated Tax",v:taxable}],total:taxable};}
                  },
                  ES: { flag:"🇪🇸", name:"Spain", currency:"EUR",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`30 Jun ${y+1}`, deadlineNote:"Declaración de la Renta",
                    calc: p=>{ let it=0,rem=p;const bands=[[12450,0.19],[7750,0.24],[15000,0.30],[24800,0.37],[Infinity,0.47]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}const ss=Math.min(p,56700)*0.063;return{rows:[{l:"Gross Income",v:p},{l:"Income Tax (IRPF)",v:it},{l:"Social Security (6.3%)",v:ss,note:"Autónomos"}],total:it+ss};}
                  },
                  SE: { flag:"🇸🇪", name:"Sweden", currency:"SEK",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`2 May ${y+1}`, deadlineNote:"Inkomstdeklaration",
                    calc: p=>{ const mun=p*0.32;let state=0;if(p>598500)state=(p-598500)*0.20;const ea=p*0.2825;return{rows:[{l:"Gross Income",v:p},{l:"Municipal Tax (~32%)",v:mun,note:"varies by municipality"},{l:"State Tax (20% above 598,500 SEK)",v:state},{l:"Egenavgifter (28.25%)",v:ea,note:"Self-employed social contributions"}],total:mun+state+ea};}
                  },
                  CH: { flag:"🇨🇭", name:"Switzerland", currency:"CHF",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`31 Mar ${y+1}`, deadlineNote:"Steuererklärung",
                    calc: p=>{ let fed=0,rem=p;const bands=[[17800,0],[914,0.0077],[4721,0.0088],[782,0.0264],[28367,0.0296],[Infinity,0.1132]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);fed+=chunk*rate;rem-=chunk;}const cantonal=p*0.10;const ahv=p*0.10;return{rows:[{l:"Gross Income",v:p},{l:"Federal Tax (Direkte Bundessteuer)",v:fed},{l:"Cantonal/Municipal Tax (est. 10%)",v:cantonal,note:"varies by canton"},{l:"AHV/IV/EO (10%)",v:ahv,note:"Social insurance — self-employed"}],total:fed+cantonal+ahv};}
                  },

                  // ── Asia ────────────────────────────────────────────────
                  IN: { flag:"🇮🇳", name:"India", currency:"INR",
                    yearLabel: y=>`Apr ${y} – Mar ${y+1}`,
                    yearStart: y=>new Date(y,3,1), yearEnd: y=>new Date(y+1,2,31),
                    deadline: y=>`31 Jul ${y+1}`, deadlineNote:"ITR Filing",
                    calc: p=>{ const pa=300000;const ti=Math.max(0,p-pa);let it=0,rem=ti;const bands=[[300000,0.05],[300000,0.10],[300000,0.15],[300000,0.20],[Infinity,0.30]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}const cess=it*0.04;return{rows:[{l:"Gross Income",v:p},{l:"Basic Exemption (−)",v:-pa,note:"New regime 2024-25"},{l:"Taxable Income",v:ti},{l:"Income Tax",v:it},{l:"Health & Education Cess (4%)",v:cess}],total:it+cess};}
                  },
                  SG: { flag:"🇸🇬", name:"Singapore", currency:"SGD",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`18 Apr ${y+1}`, deadlineNote:"IRAS e-Filing",
                    calc: p=>{ let it=0,rem=p;const bands=[[20000,0],[10000,0.02],[10000,0.035],[40000,0.07],[40000,0.115],[40000,0.15],[40000,0.18],[40000,0.19],[40000,0.195],[40000,0.20],[Infinity,0.22]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}return{rows:[{l:"Chargeable Income",v:p},{l:"Income Tax",v:it,note:"Resident rates 2024"}],total:it};}
                  },
                  JP: { flag:"🇯🇵", name:"Japan", currency:"JPY",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`15 Mar ${y+1}`, deadlineNote:"確定申告 (Kakutei Shinkoku)",
                    calc: p=>{ const ded=480000;const ti=Math.max(0,p-ded);let it=0,rem=ti;const bands=[[1950000,0.05],[1950000,0.10],[1950000,0.20],[9000000,0.23],[4000000,0.33],[18000000,0.40],[Infinity,0.45]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}const residentTax=ti*0.10;const復興=it*0.021;return{rows:[{l:"Gross Income",v:p},{l:"Basic Deduction (−)",v:-ded},{l:"Taxable Income",v:ti},{l:"National Income Tax",v:it},{l:"Reconstruction Surtax (2.1%)",v:復興},{l:"Resident Tax (~10%)",v:residentTax}],total:it+復興+residentTax};}
                  },
                  MY: { flag:"🇲🇾", name:"Malaysia", currency:"MYR",
                    yearLabel: y=>`Jan – Dec ${y}`,
                    yearStart: y=>new Date(y,0,1), yearEnd: y=>new Date(y,11,31),
                    deadline: y=>`30 Jun ${y+1}`, deadlineNote:"LHDN e-Filing",
                    calc: p=>{ let it=0,rem=p;const bands=[[5000,0],[15000,0.01],[15000,0.03],[15000,0.06],[20000,0.11],[30000,0.19],[30000,0.25],[Infinity,0.26]];for(const [lim,rate] of bands){if(rem<=0)break;const chunk=Math.min(rem,lim);it+=chunk*rate;rem-=chunk;}return{rows:[{l:"Chargeable Income",v:p},{l:"Income Tax",v:it,note:"Resident rates 2024"}],total:it};}
                  },
                };
                const country = TAX_COUNTRIES[taxCountry]||TAX_COUNTRIES.GB;
                const tyStart = country.yearStart(taxYear);
                const tyEnd = country.yearEnd(taxYear);
                const fmtD = d=>d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
                const inTY = date=>{ if(!date) return false; const d=new Date(date); return d>=tyStart&&d<=tyEnd; };
                const tyInvoices = invoices.filter(i=>i.status==="paid"&&inTY(i.due_date));
                const tyExpenses = expenses.filter(e=>inTY(e.date));
                const totalIncome = tyInvoices.reduce((s,i)=>s+i.amount,0);
                const bizExpenses = tyExpenses.filter(e=>e.type==="business").reduce((s,e)=>s+e.amount,0);
                const netProfit = totalIncome - bizExpenses;
                const taxCalc = country.calc(netProfit);
                const totalTaxEst = taxCalc.total;
                const expByCat = tyExpenses.filter(e=>e.type==="business").reduce((acc,e)=>{ acc[e.category||"Other"]=(acc[e.category||"Other"]||0)+e.amount; return acc; },{});
                const incByClient = tyInvoices.reduce((acc,i)=>{ acc[i.client||"Unknown"]=(acc[i.client||"Unknown"]||0)+i.amount; return acc; },{});
                const years=[]; for(let y=_curY-2;y<=_curY;y++) years.push(y);
                const cur = country.currency || profile?.currency;

                const exportTaxCSV = () => {
                  const rows=[
                    ["LEDGR TAX REPORT"],
                    [`Country: ${country.flag} ${country.name}`],
                    [`Tax Year: ${country.yearLabel(taxYear)}`],
                    [`Generated: ${new Date().toLocaleDateString("en-GB")}`],
                    [],["SUMMARY"],
                    ["Total Income",money(totalIncome,cur)],
                    ["Business Expenses",money(bizExpenses,cur)],
                    ["Net Profit",money(netProfit,cur)],
                    ["Estimated Tax",money(totalTaxEst,cur)],
                    [],["INCOME — PAID INVOICES"],["Date","Client","Description","Amount"],
                    ...tyInvoices.map(i=>[i.due_date,i.client,i.description,i.amount]),
                    [],["EXPENSES"],["Date","Name","Category","Type","Amount"],
                    ...tyExpenses.map(e=>[e.date,e.name,e.category,e.type,e.amount]),
                  ];
                  const csv=rows.map(r=>r.join(",")).join("\n");
                  const blob=new Blob([csv],{type:"text/csv"});
                  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`ledgr-tax-${taxYear}-${taxCountry}.csv`; a.click();
                };

                return(
                  <div>
                    {/* Header row */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:12,flexWrap:"wrap"}}>
                      <div>
                        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Tax Report</h1>
                        <p style={{color:C.muted,fontSize:13,margin:0}}>{fmtD(tyStart)} – {fmtD(tyEnd)}</p>
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <select value={taxCountry} onChange={e=>setTaxCountry(e.target.value)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                          {Object.entries(TAX_COUNTRIES).map(([k,v])=><option key={k} value={k}>{v.flag} {v.name}</option>)}
                        </select>
                        <select value={taxYear} onChange={e=>setTaxYear(Number(e.target.value))} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                          {years.map(y=><option key={y} value={y}>{country.yearLabel(y)}</option>)}
                        </select>
                        <Btn onClick={exportTaxCSV} style={{padding:"10px 16px",fontSize:13}}>⬇ CSV</Btn>
                      </div>
                    </div>

                    {/* Deadline banner */}
                    <div style={{background:"#1a0f00",border:"1px solid #3a2000",borderRadius:12,padding:"12px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:16}}>📅</span>
                      <div style={{flex:1}}>
                        <span style={{fontSize:13,fontWeight:700,color:C.warning}}>{country.deadlineNote} deadline: {country.deadline(taxYear)}</span>
                        <span style={{fontSize:12,color:C.muted,marginLeft:10}}>Estimates only — confirm with your accountant.</span>
                      </div>
                    </div>

                    {/* Summary cards */}
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:18}}>
                      {[
                        {label:"Total Income",val:money(totalIncome,cur),color:C.accent,sub:`${tyInvoices.length} paid invoices`},
                        {label:"Business Expenses",val:money(bizExpenses,cur),color:C.danger,sub:`${tyExpenses.filter(e=>e.type==="business").length} items`},
                        {label:"Net Profit",val:money(netProfit,cur),color:"#60A5FA",sub:`${Math.round(totalIncome>0?(netProfit/totalIncome)*100:0)}% margin`},
                        {label:"Est. Tax",val:money(totalTaxEst,cur),color:C.warning,sub:`~${Math.round(netProfit>0?(totalTaxEst/netProfit)*100:0)}% of profit`},
                      ].map((s,i)=>(
                        <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color}55,transparent)`}}/>
                          <div style={{color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>{s.label}</div>
                          <div style={{color:s.color,fontSize:isMobile?14:19,fontWeight:800,fontFamily:"'Playfair Display',serif",lineHeight:1,marginBottom:4}}>{s.val}</div>
                          <div style={{color:C.muted,fontSize:11}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
                      {/* Tax breakdown */}
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                        <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>{country.flag} Tax Breakdown</h3>
                        {taxCalc.rows.map((r,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                            <div style={{fontSize:13,color:C.muted}}>{r.l}{r.note&&<span style={{fontSize:10,color:"#3a3a3a",marginLeft:6}}>({r.note})</span>}</div>
                            <div style={{fontSize:13,fontWeight:700,color:r.v<0?C.accent:r.l.toLowerCase().includes("tax")||r.l.toLowerCase().includes("ni")||r.l.toLowerCase().includes("cpp")||r.l.toLowerCase().includes("levy")||r.l.toLowerCase().includes("medicare")||r.l.toLowerCase().includes("se ")?C.warning:C.text}}>{r.v<0?"−":""}{money(Math.abs(r.v),cur)}</div>
                          </div>
                        ))}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0 0"}}>
                          <div style={{fontSize:14,fontWeight:700}}>Total Estimated Tax</div>
                          <div style={{fontSize:18,fontWeight:800,color:C.warning,fontFamily:"'Playfair Display',serif"}}>{money(totalTaxEst,cur)}</div>
                        </div>
                        <div style={{marginTop:12,padding:"10px 12px",background:"#0a0f18",borderRadius:8,fontSize:11,color:C.muted,lineHeight:1.6}}>
                          💡 Set aside <strong style={{color:C.text}}>{Math.round(totalIncome>0?(totalTaxEst/totalIncome)*100:0)}%</strong> of each payment. Always verify with a local accountant.
                        </div>
                      </div>

                      {/* Expenses by category */}
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                        <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>Expenses by Category</h3>
                        {Object.keys(expByCat).length===0&&<p style={{color:C.muted,fontSize:13}}>No business expenses this period.</p>}
                        {Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt],i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:8,height:8,borderRadius:2,background:["#4ADE80","#60A5FA","#FBBF24","#F87171","#C084FC","#34D399"][i%6]}}/>
                              <span style={{fontSize:13,color:C.muted}}>{cat}</span>
                            </div>
                            <div style={{fontSize:13,fontWeight:700}}>{money(amt,cur)}</div>
                          </div>
                        ))}
                        {Object.keys(expByCat).length>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 0"}}><span style={{fontSize:13,fontWeight:700}}>Total</span><span style={{fontSize:14,fontWeight:800,color:C.danger}}>{money(bizExpenses,cur)}</span></div>}
                      </div>
                    </div>

                    {/* Income by client */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:16}}>
                      <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>Income by Client</h3>
                      {Object.keys(incByClient).length===0&&<p style={{color:C.muted,fontSize:13}}>No paid invoices this period.</p>}
                      {Object.entries(incByClient).sort((a,b)=>b[1]-a[1]).map(([client,amt],i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                          <div style={{fontSize:14,fontWeight:600}}>{client}</div>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{fontSize:11,color:C.muted}}>{Math.round(totalIncome>0?(amt/totalIncome)*100:0)}%</div>
                            <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{money(amt,cur)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Paid invoices */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                      <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>Paid Invoices ({tyInvoices.length})</h3>
                      {tyInvoices.length===0&&<p style={{color:C.muted,fontSize:13}}>No paid invoices in this period.</p>}
                      {tyInvoices.map((inv,i)=>(
                        <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<tyInvoices.length-1?`1px solid ${C.border}`:"none"}}>
                          <div><div style={{fontSize:13,fontWeight:600}}>{inv.client}</div><div style={{fontSize:11,color:C.muted}}>{inv.description} · {inv.due_date}</div></div>
                          <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{money(inv.amount,cur)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ── VAT Return Tab ── */}
              {tab==="vat"&&(()=>{
                if (!profile?.vat_registered) return (
                  <div style={{textAlign:"center",padding:"60px 20px",color:C.muted}}>
                    <div style={{fontSize:40,marginBottom:16}}>🧾</div>
                    <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:8}}>VAT not enabled</div>
                    <div style={{fontSize:13,marginBottom:20,maxWidth:340,margin:"0 auto 20px"}}>Enable VAT registration in your Profile to track output and input VAT and prepare quarterly returns.</div>
                    <Btn onClick={()=>setModal("profile")} style={{padding:"10px 24px"}}>Open Profile Settings</Btn>
                  </div>
                );

                // Quarter parsing
                const [qYear, qLabel] = vatQuarter.split("-");
                const qNum = parseInt(qLabel.replace("Q",""));
                const qStartMonth = (qNum-1)*3;
                const qStart = new Date(parseInt(qYear), qStartMonth, 1);
                const qEnd = new Date(parseInt(qYear), qStartMonth+3, 0);
                const inQ = date => { if(!date) return false; const d=new Date(date); return d>=qStart&&d<=qEnd; };

                // Output VAT — collected on paid invoices in this quarter
                const qInvoices = invoices.filter(i => i.status==="paid" && inQ(i.due_date) && i.vat_amount>0);
                const outputVat = qInvoices.reduce((s,i) => s+(i.vat_amount||0), 0);
                const vatableSales = qInvoices.reduce((s,i) => s+(i.subtotal||i.amount), 0);

                // Input VAT — paid on expenses in this quarter
                const qExpenses = expenses.filter(e => inQ(e.date) && e.vat_amount>0);
                const inputVat = qExpenses.reduce((s,e) => s+(e.vat_amount||0), 0);
                const vatableExpenses = qExpenses.reduce((s,e) => s+e.amount, 0);

                const netVat = outputVat - inputVat;
                const cur = profile?.currency;

                // Generate available quarters (last 8)
                const quarters = [];
                const now = new Date();
                for (let i=0; i<8; i++) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i*3, 1);
                  const y = d.getFullYear(); const q = Math.ceil((d.getMonth()+1)/3);
                  quarters.push(`${y}-Q${q}`);
                }

                const exportVatCSV = () => {
                  const rows = [
                    ["Ledgr VAT Return", `${vatQuarter}`],
                    ["VAT Number", profile?.vat_number||""],
                    ["Period", `${qStart.toLocaleDateString("en-GB")} – ${qEnd.toLocaleDateString("en-GB")}`],
                    [],
                    ["OUTPUT TAX (Box 1)"],
                    ["Invoice #","Client","Description","Invoice Date","Net Amount","VAT Rate","VAT Amount"],
                    ...qInvoices.map(i=>[i.id.slice(-8).toUpperCase(), i.client, i.description, i.due_date, i.subtotal||i.amount, `${i.vat_rate}%`, i.vat_amount]),
                    [],
                    ["Total Vatable Sales", vatableSales, "Total Output VAT", outputVat],
                    [],
                    ["INPUT TAX (Box 4)"],
                    ["Expense","Category","Date","Total Amount","VAT Amount"],
                    ...qExpenses.map(e=>[e.name, e.category, e.date, e.amount, e.vat_amount]),
                    [],
                    ["Total Vatable Expenses", vatableExpenses, "Total Input VAT", inputVat],
                    [],
                    ["NET VAT DUE (Box 1 - Box 4)", netVat],
                  ];
                  const csv = rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
                  const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:`ledgr-vat-${vatQuarter}.csv`}); a.click();
                };

                return (
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:12,flexWrap:"wrap"}}>
                      <div>
                        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>VAT Return</h1>
                        <p style={{color:C.muted,fontSize:13,margin:0}}>
                          {profile?.vat_number ? `VAT No: ${profile.vat_number}` : "Add your VAT number in Profile"}
                        </p>
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <select value={vatQuarter} onChange={e=>setVatQuarter(e.target.value)}
                          style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                          {quarters.map(q=><option key={q} value={q}>{q.replace("-"," ").replace("Q","Q")}</option>)}
                        </select>
                        <Btn onClick={exportVatCSV} style={{padding:"10px 16px",fontSize:13}}>⬇ Export</Btn>
                      </div>
                    </div>

                    {/* Period banner */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 20px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <div style={{fontSize:13,color:C.muted}}>Period: <strong style={{color:C.text}}>{qStart.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})} – {qEnd.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</strong></div>
                      {!profile?.vat_number && <Btn variant="secondary" onClick={()=>setModal("profile")} style={{padding:"6px 14px",fontSize:12,color:C.warning,border:`1px solid ${C.warning}44`}}>⚠ Add VAT Number</Btn>}
                    </div>

                    {/* Summary boxes */}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
                      {[
                        {label:"Output VAT (Box 1)",sub:"VAT charged to clients",value:outputVat,color:C.danger},
                        {label:"Input VAT (Box 4)",sub:"VAT on your expenses",value:inputVat,color:C.accent},
                        {label:"Net VAT Due",sub:netVat>=0?"Amount to pay HMRC":"Refund owed to you",value:Math.abs(netVat),color:netVat>=0?C.warning:C.accent,prefix:netVat<0?"Refund: ":""},
                      ].map((b,i)=>(
                        <div key={i} style={{background:C.card,border:`1px solid ${b.color}33`,borderRadius:14,padding:"16px"}}>
                          <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{b.label}</div>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?18:22,fontWeight:800,color:b.color,marginBottom:3}}>{b.prefix||""}{money(b.value,cur)}</div>
                          <div style={{fontSize:11,color:C.muted}}>{b.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* VAT Return box numbers */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:16}}>
                      <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>VAT Return Summary (UK MTD format)</h3>
                      {[
                        {box:"Box 1", label:"VAT due on sales and outputs", value:outputVat, color:C.danger},
                        {box:"Box 2", label:"VAT due on acquisitions from EC", value:0, color:C.muted, note:"if applicable"},
                        {box:"Box 3", label:"Total VAT due (Box 1 + Box 2)", value:outputVat, color:C.danger},
                        {box:"Box 4", label:"VAT reclaimed on purchases/expenses", value:inputVat, color:C.accent},
                        {box:"Box 5", label:"Net VAT to pay / reclaim", value:netVat, color:netVat>=0?C.warning:C.accent, bold:true},
                        {box:"Box 6", label:"Total value of sales (excl. VAT)", value:vatableSales, color:C.text},
                        {box:"Box 7", label:"Total value of purchases (excl. VAT)", value:vatableExpenses, color:C.text},
                      ].map((r,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                          <div style={{display:"flex",gap:10,alignItems:"center"}}>
                            <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,background:C.surface,color:C.muted,fontFamily:"monospace"}}>{r.box}</span>
                            <span style={{fontSize:13,color:C.muted}}>{r.label}{r.note&&<span style={{fontSize:10,color:"#333",marginLeft:6}}>({r.note})</span>}</span>
                          </div>
                          <span style={{fontSize:r.bold?15:13,fontWeight:r.bold?800:700,color:r.color,fontFamily:r.bold?"'Playfair Display',serif":"inherit"}}>
                            {r.value<0?"−":""}{money(Math.abs(r.value),cur)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Invoices with VAT */}
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                        <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>Invoices with VAT ({qInvoices.length})</h3>
                        {qInvoices.length===0 ? <p style={{color:C.muted,fontSize:13}}>No VAT invoices this quarter.</p> :
                          qInvoices.map((inv,i)=>(
                            <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<qInvoices.length-1?`1px solid ${C.border}`:"none"}}>
                              <div><div style={{fontSize:13,fontWeight:600}}>{inv.client}</div><div style={{fontSize:11,color:C.muted}}>{inv.vat_rate}% VAT · {inv.due_date}</div></div>
                              <div style={{textAlign:"right"}}><div style={{fontSize:12,color:C.danger,fontWeight:700}}>+{money(inv.vat_amount,cur)}</div><div style={{fontSize:11,color:C.muted}}>{money(inv.subtotal||inv.amount,cur)} net</div></div>
                            </div>
                          ))
                        }
                      </div>
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                        <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textDim}}>Expenses with VAT ({qExpenses.length})</h3>
                        {qExpenses.length===0 ? <p style={{color:C.muted,fontSize:13}}>No VAT expenses this quarter.<br/><span style={{fontSize:11}}>Add VAT amounts when logging expenses to track input tax.</span></p> :
                          qExpenses.map((exp,i)=>(
                            <div key={exp.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<qExpenses.length-1?`1px solid ${C.border}`:"none"}}>
                              <div><div style={{fontSize:13,fontWeight:600}}>{exp.name}</div><div style={{fontSize:11,color:C.muted}}>{exp.category} · {exp.date}</div></div>
                              <div style={{textAlign:"right"}}><div style={{fontSize:12,color:C.accent,fontWeight:700}}>−{money(exp.vat_amount,cur)}</div><div style={{fontSize:11,color:C.muted}}>of {money(exp.amount,cur)}</div></div>
                            </div>
                          ))
                        }
                      </div>
                    </div>

                    {/* Tip */}
                    <div style={{padding:"14px 18px",background:"#0d1f14",border:"1px solid #4ADE8022",borderRadius:12,fontSize:12,color:C.muted,lineHeight:1.8}}>
                      💡 <strong style={{color:C.text}}>How to file:</strong> Export the CSV above, then enter the Box figures directly into your HMRC MTD portal, accounting software (Xero, QuickBooks), or send to your accountant. Always verify figures before submitting.
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

              {/* ── INCOME POTS TAB ── */}
              {tab==="pots"&&(()=>{
                const cur = profile?.currency||"USD";
                const totalPots = (pots.tax||0)+(pots.buffer||0)+(pots.savings||0);
                const inputStyle = {width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"};
                return(
                  <div>
                    <div style={{marginBottom:28}}>
                      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Income Pots</h1>
                      <p style={{color:C.muted,fontSize:13,margin:0}}>Automatically set aside tax, buffer, and savings every time you get paid.</p>
                    </div>
                    {/* Total bar */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 24px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Total Set Aside</div>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?28:36,fontWeight:900,color:C.accent}}>{money(totalPots,cur)}</div>
                      </div>
                      <div style={{fontSize:40}}>🏦</div>
                    </div>
                    {/* Pot cards */}
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12,marginBottom:24}}>
                      {[
                        {key:"tax",label:"Tax Pot",icon:"🧾",desc:"Set aside for your tax bill",color:"#F87171",pct:potSettings.taxPct},
                        {key:"buffer",label:"Slow Month Buffer",icon:"🛡",desc:"Emergency fund for quiet months",color:"#FBBF24",pct:potSettings.bufferPct},
                        {key:"savings",label:"Savings",icon:"💎",desc:"Long-term savings goal",color:"#A78BFA",pct:potSettings.savingsPct},
                      ].map(pot=>(
                        <div key={pot.key} style={{background:C.card,border:`1px solid ${pot.color}22`,borderRadius:14,padding:"18px 20px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                            <div>
                              <div style={{fontSize:22,marginBottom:6}}>{pot.icon}</div>
                              <div style={{fontSize:13,fontWeight:700,color:C.text}}>{pot.label}</div>
                              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{pot.desc}</div>
                            </div>
                            <div style={{fontSize:11,fontWeight:700,background:`${pot.color}22`,color:pot.color,padding:"3px 8px",borderRadius:8}}>{pot.pct}%</div>
                          </div>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:800,color:pot.color,marginBottom:12}}>{money(pots[pot.key]||0,cur)}</div>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>{
                              const withdraw = parseFloat(prompt(`Withdraw from ${pot.label}?
Current balance: ${money(pots[pot.key]||0,cur)}

Enter amount to withdraw:`)||"0");
                              if(withdraw>0&&withdraw<=(pots[pot.key]||0)){
                                const newPots={...pots,[pot.key]:parseFloat(((pots[pot.key]||0)-withdraw).toFixed(2))};
                                savePots(newPots,null);
                              }
                            }} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"7px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Withdraw</button>
                            <button onClick={()=>{
                              const add = parseFloat(prompt(`Add to ${pot.label}:

Enter amount to add:`)||"0");
                              if(add>0){const newPots={...pots,[pot.key]:parseFloat(((pots[pot.key]||0)+add).toFixed(2))};savePots(newPots,null);}
                            }} style={{flex:1,background:`${pot.color}22`,border:`1px solid ${pot.color}44`,color:pot.color,borderRadius:8,padding:"7px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Add</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Settings */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px 24px"}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Allocation Settings</div>
                      <p style={{fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>These percentages are automatically applied every time you mark an invoice as paid.</p>
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12}}>
                        {[
                          {key:"taxPct",label:"Tax %",color:"#F87171"},
                          {key:"bufferPct",label:"Buffer %",color:"#FBBF24"},
                          {key:"savingsPct",label:"Savings %",color:"#A78BFA"},
                        ].map(s=>(
                          <div key={s.key}>
                            <label style={{fontSize:11,fontWeight:700,color:s.color,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</label>
                            <input type="number" min="0" max="50" value={potSettings[s.key]} onChange={e=>setPotSettings(p=>({...p,[s.key]:parseFloat(e.target.value)||0}))} style={{...inputStyle}} onBlur={()=>savePots(null,potSettings)}/>
                          </div>
                        ))}
                      </div>
                      <div style={{marginTop:12,fontSize:12,color:C.muted}}>
                        Total allocation: <strong style={{color:(potSettings.taxPct+potSettings.bufferPct+potSettings.savingsPct)>100?C.danger:C.accent}}>{potSettings.taxPct+potSettings.bufferPct+potSettings.savingsPct}%</strong> of each payment
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── PROPOSALS TAB ── */}
              {tab==="proposals"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,gap:12}}>
                    <div>
                      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Proposals</h1>
                      <p style={{color:C.muted,fontSize:13,margin:0}}>Draft proposals and convert them to invoices in one click.</p>
                    </div>
                    <button onClick={()=>setModal("proposal")} style={{background:C.accent,border:"none",color:"#060A0F",padding:"10px 18px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>+ New Proposal</button>
                  </div>
                  {proposals.length===0&&(
                    <div style={{textAlign:"center",padding:"60px 20px",color:C.muted,background:C.card,borderRadius:16,border:`1px solid ${C.border}`}}>
                      <div style={{fontSize:40,marginBottom:12}}>📋</div>
                      <p style={{marginBottom:4}}>No proposals yet.</p>
                      <p style={{fontSize:13}}>Create a proposal, send it to a client, then convert it to an invoice when accepted.</p>
                    </div>
                  )}
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {proposals.map(p=>{
                      const statusColors={draft:C.muted,sent:"#FBBF24",accepted:C.accent,declined:C.danger,converted:"#A78BFA"};
                      const statusBgs={draft:C.surface,sent:"#1f1508",accepted:C.accentDim,declined:C.dangerDim,converted:"#1a0a2e"};
                      return(
                        <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{p.title}</div>
                              <div style={{fontSize:12,color:C.muted}}>{p.client||"No client"}{p.valid_until?` · Valid until ${fmtDate(p.valid_until)}`:""}</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:800,marginBottom:6}}>{money(p.amount,p.currency||profile?.currency)}</div>
                              <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,background:statusBgs[p.status]||C.surface,color:statusColors[p.status]||C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{p.status}</span>
                            </div>
                          </div>
                          {p.description&&<div style={{fontSize:13,color:C.textDim,marginBottom:14,lineHeight:1.6,borderTop:`1px solid ${C.border}`,paddingTop:10}}>{p.description}</div>}
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            {p.status!=="converted"&&(
                              <button onClick={()=>convertProposalToInvoice(p)} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,color:C.accent,padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
                                → Convert to Invoice
                              </button>
                            )}
                            {["draft","sent"].includes(p.status)&&(
                              <>
                                <button onClick={async()=>{await supabase.from("proposals").update({status:"sent"}).eq("id",p.id);setProposals(pr=>pr.map(x=>x.id===p.id?{...x,status:"sent"}:x));}} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.muted,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Mark Sent</button>
                                <button onClick={async()=>{await supabase.from("proposals").update({status:"accepted"}).eq("id",p.id);setProposals(pr=>pr.map(x=>x.id===p.id?{...x,status:"accepted"}:x));}} style={{background:C.surface,border:`1px solid ${C.accent}44`,color:C.accent,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Mark Accepted</button>
                                <button onClick={async()=>{await supabase.from("proposals").update({status:"declined"}).eq("id",p.id);setProposals(pr=>pr.map(x=>x.id===p.id?{...x,status:"declined"}:x));}} style={{background:C.surface,border:`1px solid ${C.danger}44`,color:C.danger,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Mark Declined</button>
                              </>
                            )}
                            <button onClick={()=>deleteProposal(p.id)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"8px 10px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",marginLeft:"auto"}}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── TIME TRACKER TAB ── */}
              {tab==="time"&&(()=>{
                const cur = profile?.currency||"USD";
                const elapsed = timerRunning ? Math.floor((Date.now()-timerStart)/1000) : timerElapsed;
                const hh = String(Math.floor(elapsed/3600)).padStart(2,"0");
                const mm = String(Math.floor((elapsed%3600)/60)).padStart(2,"0");
                const ss = String(elapsed%60).padStart(2,"0");
                const totalByClient = timeEntries.reduce((acc,e)=>{acc[e.client]=(acc[e.client]||0)+(e.amount||0);return acc;},{});
                const inputStyle = {width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"};
                return(
                  <div>
                    <div style={{marginBottom:24}}>
                      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>Time Tracker</h1>
                      <p style={{color:C.muted,fontSize:13,margin:0}}>Track billable hours and convert directly to invoices.</p>
                    </div>
                    {/* Timer */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"24px",marginBottom:20,textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:isMobile?48:64,fontWeight:500,color:timerRunning?C.accent:C.text,letterSpacing:"0.05em",marginBottom:20,lineHeight:1}}>
                        {hh}:{mm}:{ss}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16,maxWidth:400,margin:"0 auto 16px"}}>
                        <div>
                          <label style={{fontSize:11,fontWeight:600,color:C.muted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Client</label>
                          <select value={timerClient} onChange={e=>setTimerClient(e.target.value)} style={{...inputStyle}}>
                            <option value="">Select client…</option>
                            {clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                            <option value="__custom">Other…</option>
                          </select>
                          {timerClient==="__custom"&&<input value={timerClient} onChange={e=>setTimerClient(e.target.value)} placeholder="Client name" style={{...inputStyle,marginTop:6}}/>}
                        </div>
                        <div>
                          <label style={{fontSize:11,fontWeight:600,color:C.muted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Project</label>
                          <input value={timerProject} onChange={e=>setTimerProject(e.target.value)} placeholder="e.g. Website redesign" style={{...inputStyle}}/>
                        </div>
                        <div>
                          <label style={{fontSize:11,fontWeight:600,color:C.muted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Hourly Rate ({cur})</label>
                          <input type="number" value={timerRate} onChange={e=>setTimerRate(e.target.value)} placeholder="0.00" style={{...inputStyle}}/>
                        </div>
                        <div style={{display:"flex",alignItems:"flex-end"}}>
                          {timerRate&&elapsed>0&&<div style={{fontSize:12,color:C.accent,fontWeight:600,padding:"10px 0"}}>≈ {money(parseFloat(timerRate)*(elapsed/3600),cur)}</div>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                        {!timerRunning?(
                          <button onClick={startTimer} disabled={!timerClient} style={{background:C.accent,border:"none",color:"#060A0F",padding:"12px 28px",borderRadius:10,cursor:timerClient?"pointer":"not-allowed",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:timerClient?1:0.5}}>
                            ▶ {elapsed>0?"Resume":"Start"}
                          </button>
                        ):(
                          <button onClick={pauseTimer} style={{background:"#FBBF2422",border:"1px solid #FBBF2444",color:"#FBBF24",padding:"12px 28px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
                            ⏸ Pause
                          </button>
                        )}
                        {elapsed>0&&(
                          <>
                            <button onClick={saveTimeEntry} disabled={!timerClient||elapsed<60} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,color:C.accent,padding:"12px 24px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
                              ✓ Log Entry
                            </button>
                            <button onClick={resetTimer} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.muted,padding:"12px 20px",borderRadius:10,cursor:"pointer",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>
                              ✕ Reset
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* FX Rates panel */}
                    {/* ── FX Rate Advisor ── */}
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 24px",marginBottom:20}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                        <div>
                          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:2}}>💱 FX Rate Advisor</div>
                          <div style={{fontSize:12,color:C.muted}}>Best time to convert your foreign earnings to NGN</div>
                        </div>
                        <button onClick={()=>{loadFxRates();loadFxHistory();}} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.muted,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{fxLoading?"Updating…":"↻ Refresh"}</button>
                      </div>

                      {/* Signal cards for each NGN pair */}
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:10,marginBottom:20}}>
                        {[["GBP","NGN"],["USD","NGN"],["EUR","NGN"]].map(([from,to])=>{
                          const pair = `${from}_${to}`;
                          const rate = fxRates[from]?.[to];
                          const signal = getFxSignal(pair);
                          const history = fxHistory[pair] || [];
                          const rates = history.map(h=>h.rate);
                          const max30 = rates.length ? Math.max(...rates) : null;
                          const min30 = rates.length ? Math.min(...rates) : null;
                          return(
                            <div key={pair} style={{background:C.surface,border:`1px solid ${signal?signal.color+"33":C.border}`,borderRadius:12,padding:"14px 16px"}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                                <div style={{fontSize:12,fontWeight:700,color:C.muted}}>{from} → {to}</div>
                                {signal&&<span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:8,background:`${signal.color}22`,color:signal.color,border:`1px solid ${signal.color}44`}}>{signal.label}</span>}
                              </div>
                              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>
                                {rate ? rate.toLocaleString("en-GB",{maximumFractionDigits:2}) : "—"}
                              </div>
                              <div style={{fontSize:11,color:C.muted,marginBottom:8}}>1 {from} = {rate?.toLocaleString("en-GB",{maximumFractionDigits:0})} {to}</div>
                              {signal&&<div style={{fontSize:11,color:signal.color,lineHeight:1.5}}>{signal.desc}</div>}
                              {max30&&min30&&(
                                <div style={{marginTop:8,display:"flex",gap:12,fontSize:10,color:C.muted}}>
                                  <span>30d high: <strong style={{color:C.accent}}>{max30.toLocaleString("en-GB",{maximumFractionDigits:0})}</strong></span>
                                  <span>30d low: <strong style={{color:C.danger}}>{min30.toLocaleString("en-GB",{maximumFractionDigits:0})}</strong></span>
                                </div>
                              )}
                              {/* Mini sparkline */}
                              {rates.length>1&&(()=>{
                                const w=200,h=32;
                                const minR=Math.min(...rates),maxR=Math.max(...rates),range=maxR-minR||1;
                                const pts=rates.map((r,i)=>`${Math.round((i/(rates.length-1))*w)},${Math.round(h-((r-minR)/range)*h)}`).join(" ");
                                const lastX=Math.round(w); const lastY=Math.round(h-((rates[rates.length-1]-minR)/range)*h);
                                return(
                                  <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{marginTop:8,display:"block"}} preserveAspectRatio="none">
                                    <polyline points={pts} fill="none" stroke={signal?.color||C.accent} strokeWidth="1.5" strokeLinejoin="round"/>
                                    <circle cx={lastX} cy={lastY} r="3" fill={signal?.color||C.accent}/>
                                  </svg>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>

                      {/* Calculator */}
                      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",marginBottom:16}}>
                        <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:12}}>How much would you get today?</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                          <div style={{flex:1,minWidth:100}}>
                            <label style={{fontSize:10,fontWeight:700,color:C.muted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Amount</label>
                            <input type="number" value={fxCalcAmount} onChange={e=>setFxCalcAmount(e.target.value)} placeholder="e.g. 1000" style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                          </div>
                          <div>
                            <label style={{fontSize:10,fontWeight:700,color:C.muted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>From</label>
                            <select value={fxCalcFrom} onChange={e=>setFxCalcFrom(e.target.value)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                              {["GBP","USD","EUR"].map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div style={{fontSize:18,color:C.muted,paddingBottom:6}}>→</div>
                          <div>
                            <label style={{fontSize:10,fontWeight:700,color:C.muted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>To</label>
                            <select value={fxCalcTo} onChange={e=>setFxCalcTo(e.target.value)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                              {["NGN","GHS","KES","ZAR","INR","GBP","EUR","USD"].map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        {fxCalcAmount&&parseFloat(fxCalcAmount)>0&&fxRates[fxCalcFrom]?.[fxCalcTo]&&(
                          <div style={{marginTop:14,padding:"12px 16px",background:C.card,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>You would receive approximately</div>
                              <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:800,color:C.accent}}>
                                {(parseFloat(fxCalcAmount)*fxRates[fxCalcFrom][fxCalcTo]).toLocaleString("en-GB",{maximumFractionDigits:0})} {fxCalcTo}
                              </div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Rate</div>
                              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{fxRates[fxCalcFrom][fxCalcTo]?.toLocaleString("en-GB",{maximumFractionDigits:2})}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Platform comparison */}
                      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 18px"}}>
                        <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:10}}>Platform comparison · GBP → NGN</div>
                        <div style={{fontSize:11,color:C.muted,marginBottom:10}}>Typical spreads vs mid-market rate (approximate)</div>
                        {(()=>{
                          const midRate = fxRates["GBP"]?.["NGN"] || 0;
                          return [
                            {name:"Grey",spread:0.005,note:"Best for NGN · used by diaspora"},
                            {name:"Wise",spread:0.007,note:"Low fees · transparent pricing"},
                            {name:"Payoneer",spread:0.02,note:"Good for freelance payments"},
                            {name:"Bank transfer",spread:0.04,note:"Avoid — worst rates"},
                          ].map((p,i)=>{
                            const effectiveRate = midRate*(1-p.spread);
                            const barPct = 100 - (p.spread*500);
                            return(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                                <div style={{width:80,fontSize:12,fontWeight:600,color:i===0?C.accent:C.text,flexShrink:0}}>{p.name}</div>
                                <div style={{flex:1,height:6,background:C.card,borderRadius:3,overflow:"hidden"}}>
                                  <div style={{width:`${Math.max(10,barPct)}%`,height:"100%",background:i===0?C.accent:i===3?C.danger:"#60A5FA",borderRadius:3}}/>
                                </div>
                                <div style={{fontSize:11,color:C.muted,minWidth:90,textAlign:"right"}}>{midRate>0?effectiveRate.toLocaleString("en-GB",{maximumFractionDigits:0})+" NGN":p.note}</div>
                              </div>
                            );
                          });
                        })()}
                        <div style={{fontSize:10,color:C.muted,marginTop:8}}>* Rates are indicative. Always verify before transferring.</div>
                      </div>
                    </div>

                    {/* Time entries log */}
                    {timeEntries.length>0&&(
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                          <div style={{fontSize:14,fontWeight:700,color:C.text}}>Recent Entries</div>
                          {Object.keys(totalByClient).length>0&&(
                            <button onClick={()=>{
                              const clientName = Object.keys(totalByClient)[0];
                              const entries = timeEntries.filter(e=>e.client===clientName);
                              convertTimeToInvoice(entries);
                            }} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,color:C.accent,padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
                              → Invoice All
                            </button>
                          )}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {timeEntries.slice(0,20).map(e=>(
                            <div key={e.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{e.project||e.client}</div>
                                <div style={{fontSize:11,color:C.muted}}>{e.client} · {e.hours}h · {e.date}</div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{e.amount>0?money(e.amount,e.currency||cur):"-"}</div>
                                {e.rate>0&&<div style={{fontSize:10,color:C.muted}}>{money(e.rate,e.currency||cur)}/hr</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {tab==="ai"&&(()=>{
                const now = new Date();
                const thisMonth = now.toISOString().slice(0,7);
                const mthInvoices = invoices.filter(inv=>inv.date?.startsWith(thisMonth));
                const overdueInvs = invoices.filter(inv=>inv.status!=="paid"&&inv.due_date&&new Date(inv.due_date)<now);
                const mthExpenses = expenses.filter(e=>e.date?.startsWith(thisMonth));
                const totalInvoiced = mthInvoices.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
                const totalPaid = mthInvoices.filter(i=>i.status==="paid").reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
                const totalExpenses = mthExpenses.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
                const expCats = mthExpenses.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+(parseFloat(e.amount)||0);return acc;},{});
                const topCats = Object.entries(expCats).sort((a,b)=>b[1]-a[1]).slice(0,5);
                const clientBalances = clients.map(c=>({name:c.name,outstanding:invoices.filter(i=>i.client_id===c.id&&i.status!=="paid").reduce((s,i)=>s+(parseFloat(i.amount)||0),0)})).filter(c=>c.outstanding>0).sort((a,b)=>b.outstanding-a.outstanding);
                const cur = profile?.currency||"USD";
                const financeContext = `You are an AI finance assistant inside Ledgr, a freelance finance tracker. You have access to the user's real financial data. Answer helpfully and concisely in plain English. Use currency ${cur} unless specified.\n\n=== THIS MONTH (${now.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}) ===\nInvoiced: ${money(totalInvoiced,cur)} | Paid: ${money(totalPaid,cur)} | Unpaid: ${money(totalInvoiced-totalPaid,cur)} | Expenses: ${money(totalExpenses,cur)} | Net: ${money(totalPaid-totalExpenses,cur)}\n\n=== OVERDUE INVOICES (${overdueInvs.length}) ===\n${overdueInvs.slice(0,10).map(i=>`${i.client||"Unknown"}: ${money(parseFloat(i.amount)||0,cur)} — ${Math.floor((now-new Date(i.due_date))/86400000)} days overdue`).join("\n")||"None"}\n\n=== TOP EXPENSE CATEGORIES ===\n${topCats.map(([cat,amt])=>`${cat}: ${money(amt,cur)}`).join("\n")||"No expenses"}\n\n=== CLIENTS WITH OUTSTANDING BALANCES ===\n${clientBalances.slice(0,8).map(c=>`${c.name}: ${money(c.outstanding,cur)}`).join("\n")||"All up to date"}\n\n=== RECENT INVOICES ===\n${invoices.slice(0,15).map(i=>`${i.client||"?"}: ${money(parseFloat(i.amount)||0,cur)} | ${i.status} | due ${i.due_date||"n/a"} | ${i.description||""}`).join("\n")}`;
                return (
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
                      <div style={{flex:1}}>
                        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,margin:"0 0 4px",fontWeight:800,letterSpacing:"-0.02em"}}>AI Assistant</h1>
                        <p style={{color:C.muted,fontSize:13,margin:0}}>Powered by Claude · Your data stays private</p>
                      </div>
                      <div style={{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,color:C.accent,letterSpacing:"0.06em"}}>BETA</div>
                    </div>
                    <AITabs financeContext={financeContext} invoices={invoices} clients={clients} expenses={expenses} profile={profile} session={session} money={money} cur={cur} C={C} isMobile={isMobile} overdueInvs={overdueInvs}/>
                  </div>
                );
              })()}
        </div>
      </div>

      {isMobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,zIndex:200,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
          {/* Primary nav — 5 key tabs always visible */}
          <div style={{display:"flex"}}>
            {[
              {id:"dashboard",label:"Home",icon:"◈"},
              {id:"invoices",label:"Invoices",icon:"◎"},
              {id:"expenses",label:"Expenses",icon:"◉"},
              {id:"clients",label:"Clients",icon:"◫"},
              {id:"ai",label:"✦ AI",icon:null},
            ].map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setMobileMoreOpen&&setMobileMoreOpen(false);}} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"transparent",color:tab===t.id?C.accent:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"'DM Sans',sans-serif",transition:"color 0.15s",position:"relative"}}>
                {t.icon&&<span style={{fontSize:14,lineHeight:1}}>{t.icon}</span>}
                <span style={{fontSize:9,fontWeight:tab===t.id?700:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>{t.label}</span>
                {t.id==="alerts"&&upcoming.length>0&&<span style={{position:"absolute",top:4,right:"50%",marginRight:-16,background:C.warning,color:"#000",fontSize:7,fontWeight:700,padding:"1px 4px",borderRadius:8}}>{upcoming.length}</span>}
                {tab===t.id&&<div style={{position:"absolute",bottom:0,left:"20%",right:"20%",height:2,background:C.accent,borderRadius:2}}/>}
              </button>
            ))}
            {/* More button */}
            <button onClick={()=>setMobileMoreOpen(o=>!o)} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"transparent",color:["alerts","accounts","bank","charts","tax","vat"].includes(tab)?C.accent:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"'DM Sans',sans-serif",transition:"color 0.15s"}}>
              <span style={{fontSize:14,lineHeight:1}}>⋯</span>
              <span style={{fontSize:9,fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>More</span>
            </button>
          </div>
          {/* More drawer */}
          {mobileMoreOpen&&(
            <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 16px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,background:C.surface}}>
              {[
                {id:"alerts",label:"Alerts"},
                {id:"accounts",label:"Accounts"},
                {id:"bank",label:"Bank"},
                {id:"charts",label:"Charts"},
                {id:"tax",label:"Tax"},
                {id:"vat",label:"VAT"},
                {id:"pots",label:"💰 Pots"},
                {id:"proposals",label:"Proposals"},
                {id:"time",label:"⏱ Time"},
              ].map(t=>(
                <button key={t.id} onClick={()=>{setTab(t.id);setMobileMoreOpen(false);}} style={{padding:"10px 8px",border:`1px solid ${tab===t.id?C.accent+"44":C.border}`,borderRadius:10,background:tab===t.id?"rgba(74,222,128,0.08)":C.card,color:tab===t.id?C.accent:C.textDim,cursor:"pointer",fontSize:11,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>
                  {t.label}
                  {t.id==="alerts"&&upcoming.length>0&&<span style={{marginLeft:4,background:C.warning,color:"#000",fontSize:8,fontWeight:700,padding:"1px 4px",borderRadius:6}}>{upcoming.length}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {modal==="proposal"&&(
        <Modal title="New Proposal" onClose={close} footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={addProposal} disabled={proposalLoading} style={{flex:1}}>{proposalLoading?"Saving…":"Create Proposal"}</Btn></div>}>
          {clients.length>0&&<SelectInput label="Client" value={newProposal.client_id||""} onChange={e=>{const c=clients.find(x=>x.id===e.target.value);setNewProposal({...newProposal,client_id:e.target.value||null,client:c?c.name:newProposal.client})}}><option value="">— Select or type below —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</SelectInput>}
          <TextInput label="Client Name" value={newProposal.client} onChange={e=>setNewProposal({...newProposal,client:e.target.value,client_id:null})} placeholder="e.g. Acme Corp"/>
          <TextInput label="Proposal Title" value={newProposal.title} onChange={e=>setNewProposal({...newProposal,title:e.target.value})} placeholder="e.g. Brand identity redesign"/>
          <TextInput label="Description / Scope" value={newProposal.description} onChange={e=>setNewProposal({...newProposal,description:e.target.value})} placeholder="What's included in this proposal…"/>
          <TextInput label="Amount" type="number" value={newProposal.amount} onChange={e=>setNewProposal({...newProposal,amount:e.target.value})} placeholder="0.00"/>
          <SelectInput label="Currency" value={newProposal.currency||profile?.currency||"USD"} onChange={e=>setNewProposal({...newProposal,currency:e.target.value})}>
            {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
          </SelectInput>
          <TextInput label="Valid Until" type="date" value={newProposal.valid_until} onChange={e=>setNewProposal({...newProposal,valid_until:e.target.value})}/>
        </Modal>
      )}

      {modal==="invoice"&&(
        <Modal title="New Invoice" onClose={close} footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={addInvoice} style={{flex:1}}>Add Invoice</Btn></div>}>
          {clients.length>0&&<SelectInput label="Pick a Client (optional)" value={newInv.client_id||""} onChange={e=>{const c=clients.find(x=>x.id===e.target.value);setNewInv({...newInv,client_id:e.target.value||null,client:c?c.name:newInv.client,client_email:c?.email||newInv.client_email})}}><option value="">- Enter manually -</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.company?" · "+c.company:""}</option>)}</SelectInput>}
          <TextInput label="Client Name" value={newInv.client} onChange={e=>setNewInv({...newInv,client:e.target.value,client_id:null})} placeholder="e.g. Acme Corp"/>
          <TextInput label="Client Email (for reminders)" type="email" value={newInv.client_email||""} onChange={e=>setNewInv({...newInv,client_email:e.target.value})} placeholder="client@email.com"/>
          <TextInput label={newInv.vat_rate?"Amount (excl. VAT)":"Amount"} type="number" value={newInv.amount} onChange={e=>setNewInv({...newInv,amount:e.target.value})} placeholder="0.00"/>
          <TextInput label="Description" value={newInv.description} onChange={e=>setNewInv({...newInv,description:e.target.value})} placeholder="e.g. Web redesign Q2"/>
          <TextInput label="Notes (optional)" value={newInv.notes||""} onChange={e=>setNewInv({...newInv,notes:e.target.value})} placeholder="Payment terms, bank details…"/>
          <TextInput label="Due Date" type="date" value={newInv.due_date} onChange={e=>setNewInv({...newInv,due_date:e.target.value})}/>
          <SelectInput label="Currency" value={newInv.currency||profile?.currency||"USD"} onChange={e=>setNewInv({...newInv,currency:e.target.value})}>
            {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
          </SelectInput>
          <SelectInput label="Type" value={newInv.type} onChange={e=>setNewInv({...newInv,type:e.target.value})}><option value="business">Business</option><option value="personal">Personal</option></SelectInput>

          {/* VAT Section */}
          {profile?.vat_registered && (
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginTop:4}}>
              <div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.06em"}}>VAT</div>
              <SelectInput label="VAT Rate" value={newInv.vat_rate||""} onChange={e=>setNewInv({...newInv,vat_rate:e.target.value})}>
                <option value="">No VAT</option>
                <option value="5">5% — Reduced rate</option>
                <option value="9">9% — EU reduced</option>
                <option value="10">10% — Austria / Japan</option>
                <option value="19">19% — Germany standard</option>
                <option value="20">20% — UK / France / Austria</option>
                <option value="21">21% — Netherlands / Belgium / Spain</option>
                <option value="23">23% — Poland / Ireland</option>
                <option value="25">25% — Sweden / Denmark / Norway</option>
                <option value="0">0% — Zero rated / exempt</option>
              </SelectInput>
              {newInv.vat_rate && parseFloat(newInv.amount) > 0 && (
                <div style={{marginTop:10,padding:"10px 14px",background:C.card,borderRadius:8,fontSize:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:C.muted}}>Subtotal (excl. VAT)</span>
                    <span style={{color:C.text}}>{money(parseFloat(newInv.amount)||0, newInv.currency||profile?.currency)}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:C.muted}}>VAT ({newInv.vat_rate}%)</span>
                    <span style={{color:C.warning}}>{money((parseFloat(newInv.amount)||0)*parseFloat(newInv.vat_rate)/100, newInv.currency||profile?.currency)}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:4}}>
                    <span style={{color:C.text,fontWeight:700}}>Total (inc. VAT)</span>
                    <span style={{color:C.accent,fontWeight:700}}>{money((parseFloat(newInv.amount)||0)*(1+parseFloat(newInv.vat_rate)/100), newInv.currency||profile?.currency)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

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
        </Modal>
      )}
      {modal==="expense"&&(
        <Modal title="Add Expense" onClose={close} footer={<div style={{display:"flex",gap:10}}><Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn><Btn onClick={addExpense} style={{flex:1}}>Add Expense</Btn></div>}>
          <TextInput label="Name" value={newExp.name} onChange={e=>setNewExp({...newExp,name:e.target.value})} placeholder="e.g. Figma Pro"/>
          <TextInput label="Amount (total inc. VAT if applicable)" type="number" value={newExp.amount} onChange={e=>setNewExp({...newExp,amount:e.target.value})} placeholder="0.00"/>
          {profile?.vat_registered && (
            <TextInput label="VAT Amount (input tax you can reclaim)" type="number" value={newExp.vat_amount||""} onChange={e=>setNewExp({...newExp,vat_amount:e.target.value})} placeholder="0.00"/>
          )}
          <TextInput label="Category" value={newExp.category} onChange={e=>setNewExp({...newExp,category:e.target.value})} placeholder="e.g. Software, Meals"/>
          <TextInput label="Date" type="date" value={newExp.date} onChange={e=>setNewExp({...newExp,date:e.target.value})}/>
          <SelectInput label="Type" value={newExp.type} onChange={e=>setNewExp({...newExp,type:e.target.value})}><option value="business">Business</option><option value="personal">Personal</option></SelectInput>
        </Modal>
      )}
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
              await connectRevolut(revolutKey.trim(), "business");
              close();setRevolutKey("");setRevolutType("business");
            }} style={{flex:1,background:"#7B61FF",boxShadow:"none"}} disabled={accountsLoading}>
              {accountsLoading?"Connecting...":"Connect Revolut Business"}
            </Btn>
          </div>
        }>
          {/* Business only info */}
          <div style={{background:"#0f0a1f",border:"1px solid #7B61FF44",borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:"#a5a0ff",marginBottom:8}}>How to get your Revolut Business API key</div>
            <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.7}}>
              1. Log in to <strong style={{color:"#F1F5F9"}}>business.revolut.com</strong><br/>
              2. Go to <strong style={{color:"#F1F5F9"}}>Settings → API</strong><br/>
              3. Click <strong style={{color:"#F1F5F9"}}>Generate API key</strong><br/>
              4. Set access to <strong style={{color:"#F1F5F9"}}>Read only</strong><br/>
              5. Copy and paste the key below
            </div>
          </div>

          {/* Personal account notice */}
          <div style={{background:"#1a0f00",border:"1px solid #3a2000",borderRadius:12,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0}}>ℹ️</span>
            <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.7}}>
              <strong style={{color:"#FBBF24"}}>Revolut Personal not supported.</strong><br/>
              Revolut's Personal API requires regulated financial institution certificates (OBIE/eIDAS) — it's not accessible to individual users. Only <strong style={{color:"#F1F5F9"}}>Revolut Business</strong> accounts can connect to Ledgr. You can upgrade to a free Revolut Business account at <strong style={{color:"#F1F5F9"}}>business.revolut.com</strong>.
            </div>
          </div>

          <TextInput
            label="Revolut Business API Key"
            value={revolutKey}
            onChange={e=>setRevolutKey(e.target.value)}
            placeholder="Enter your Business API key..."
            type="password"
          />
          <p style={{fontSize:12,color:"#4B5563",marginTop:-8,lineHeight:1.6}}>
            Read-only access only. We never initiate transfers or payments.
          </p>
        </Modal>
      )}
      {modal==="connect-flutterwave"&&(
        <Modal title="Connect Flutterwave" onClose={()=>{close();setFlutterwaveKey("");}} footer={
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={()=>{close();setFlutterwaveKey("");}} style={{flex:1}}>Cancel</Btn>
            <Btn onClick={async()=>{
              if(!flutterwaveKey.trim()){alert("Please enter your secret key");return;}
              await connectFlutterwave(flutterwaveKey.trim());
              close();setFlutterwaveKey("");
            }} style={{flex:1,background:"#F5A623",color:"#000",boxShadow:"none"}} disabled={accountsLoading}>
              {accountsLoading?"Connecting...":"Connect Flutterwave"}
            </Btn>
          </div>
        }>
          {/* How to get key */}
          <div style={{background:"#1a1000",border:"1px solid #F5A62344",borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:"#F5A623",marginBottom:8}}>How to get your Flutterwave secret key</div>
            <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.8}}>
              1. Log in to <strong style={{color:"#F1F5F9"}}>dashboard.flutterwave.com</strong><br/>
              2. Go to <strong style={{color:"#F1F5F9"}}>Settings → API Keys</strong><br/>
              3. Copy your <strong style={{color:"#F1F5F9"}}>Secret Key</strong> (starts with <code style={{color:"#F5A623",fontSize:11}}>FLWSECK_</code>)<br/>
              4. Make sure you're using your <strong style={{color:"#F1F5F9"}}>Live</strong> key, not Test
            </div>
          </div>

          {/* Security notice */}
          <div style={{background:"#0d1a0d",border:"1px solid #1a3a1a",borderRadius:12,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0}}>🔒</span>
            <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.7}}>
              <strong style={{color:"#4ADE80"}}>Read-only use only.</strong><br/>
              Ledgr uses your key to fetch your NGN balance and incoming transactions. We <strong style={{color:"#F1F5F9"}}>never</strong> initiate payouts, transfers, or any transaction on your behalf. Your key is stored encrypted.
            </div>
          </div>

          <TextInput
            label="Flutterwave Secret Key"
            value={flutterwaveKey}
            onChange={e=>setFlutterwaveKey(e.target.value)}
            placeholder="FLWSECK_live_XXXXXXXXXXXX"
            type="password"
          />
          <p style={{fontSize:12,color:"#4B5563",marginTop:-8,lineHeight:1.6}}>
            Syncs your NGN collections and available balance from Flutterwave.
          </p>
        </Modal>
      )}
      {modal==="connect-paystack"&&(
        <Modal title="Connect Paystack" onClose={()=>{close();setPaystackKey("");}} footer={
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={()=>{close();setPaystackKey("");}} style={{flex:1}}>Cancel</Btn>
            <Btn onClick={async()=>{
              if(!paystackKey.trim()){alert("Please enter your secret key");return;}
              await connectPaystack(paystackKey.trim());
              close();setPaystackKey("");
            }} style={{flex:1,background:"#00C3F7",color:"#000",boxShadow:"none"}} disabled={accountsLoading}>
              {accountsLoading?"Connecting...":"Connect Paystack"}
            </Btn>
          </div>
        }>
          {/* How to get key */}
          <div style={{background:"#001a20",border:"1px solid #00C3F744",borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:"#00C3F7",marginBottom:8}}>How to get your Paystack secret key</div>
            <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.8}}>
              1. Log in to <strong style={{color:"#F1F5F9"}}>dashboard.paystack.com</strong><br/>
              2. Go to <strong style={{color:"#F1F5F9"}}>Settings → API Keys & Webhooks</strong><br/>
              3. Copy your <strong style={{color:"#F1F5F9"}}>Live Secret Key</strong> (starts with <code style={{color:"#00C3F7",fontSize:11}}>sk_live_</code>)<br/>
              4. Make sure you use <strong style={{color:"#F1F5F9"}}>Live</strong>, not Test key
            </div>
          </div>

          {/* Security notice */}
          <div style={{background:"#0d1a0d",border:"1px solid #1a3a1a",borderRadius:12,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0}}>🔒</span>
            <div style={{fontSize:12,color:"#8B95A8",lineHeight:1.7}}>
              <strong style={{color:"#4ADE80"}}>Read-only use only.</strong><br/>
              Ledgr uses your key to fetch your NGN balance and incoming payments. We <strong style={{color:"#F1F5F9"}}>never</strong> initiate charges, transfers, or any transaction on your behalf. Your key is stored encrypted.
            </div>
          </div>

          <TextInput
            label="Paystack Secret Key"
            value={paystackKey}
            onChange={e=>setPaystackKey(e.target.value)}
            placeholder="sk_live_XXXXXXXXXXXX"
            type="password"
          />
          <p style={{fontSize:12,color:"#4B5563",marginTop:-8,lineHeight:1.6}}>
            Syncs your NGN balance and last 90 days of successful payments.
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
      {modal==="profile"&&(
        <Modal title="My Profile" onClose={close} wide footer={
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={close} style={{flex:1}}>Cancel</Btn>
            <Btn onClick={saveProfile} style={{flex:1}}>Save Profile</Btn>
          </div>
        }>
          <p style={{color:C.muted,fontSize:13,marginBottom:16,marginTop:-4}}>This info appears on your PDF invoices.</p>
          <TextInput label="Full Name" value={editPro.name||""} onChange={e=>setEditPro({...editPro,name:e.target.value})} placeholder="Jane Doe"/>
          <TextInput label="Business Name (optional)" value={editPro.business_name||""} onChange={e=>setEditPro({...editPro,business_name:e.target.value})} placeholder="Jane Doe Creative Ltd"/>
          <TextInput label="Email" value={editPro.email||""} onChange={e=>setEditPro({...editPro,email:e.target.value})} placeholder="jane@email.com"/>
          <TextInput label="Phone (optional)" value={editPro.phone||""} onChange={e=>setEditPro({...editPro,phone:e.target.value})} placeholder="+1 555 000 1234"/>
          <TextInput label="Address" value={editPro.address||""} onChange={e=>setEditPro({...editPro,address:e.target.value})} placeholder="New York, NY"/>
          <SelectInput label="Currency" value={editPro.currency||"USD"} onChange={e=>setEditPro({...editPro,currency:e.target.value})}>
            {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
          </SelectInput>

          {/* ── Stripe Connect ── */}
          <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:20}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:6}}>Payment Collection</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:14}}>
              Connect your Stripe account so clients can pay your invoices directly to you. Money goes straight to your Stripe — not through Ledgr.
            </div>

            {stripeConnectSuccess && (
              <div style={{background:"#0d2018",border:"1px solid #4ADE8033",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:C.accent}}>
                ✓ Stripe account connected successfully!
              </div>
            )}
            {stripeConnectError && (
              <div style={{background:"#2a0f0f",border:"1px solid #F8717133",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:C.danger}}>
                ✕ {stripeConnectError}
              </div>
            )}

            {profile?.stripe_account_id ? (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"#0d2018",border:`1px solid ${C.accent}33`,borderRadius:12,marginBottom:10}}>
                  <span style={{fontSize:18}}>⚡</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.accent}}>Stripe Connected</div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:2}}>
                      {profile.stripe_account_name || profile.stripe_account_id}
                    </div>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:"#0a2018",color:C.accent,border:`1px solid ${C.accent}33`}}>LIVE</span>
                </div>
                <div style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.6}}>
                  Payment links on your invoices go directly to this Stripe account.
                </div>
                <Btn variant="danger" onClick={disconnectStripeConnect} style={{fontSize:12,padding:"8px 16px"}}>
                  Disconnect Stripe
                </Btn>
              </div>
            ) : (
              <div>
                <div style={{padding:"12px 16px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:12}}>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                    <strong style={{color:C.text}}>How it works:</strong><br/>
                    1. Click Connect Stripe below<br/>
                    2. Sign in to your Stripe account (or create one free)<br/>
                    3. Authorise Ledgr — takes 30 seconds<br/>
                    4. All invoice payment links charge directly to your Stripe
                  </div>
                </div>
                <Btn onClick={connectStripeOAuth} style={{background:"#635bff",boxShadow:"none",width:"100%"}}>
                  ⚡ Connect Stripe Account
                </Btn>
                <p style={{fontSize:11,color:C.muted,marginTop:8,lineHeight:1.6}}>
                  Don't have Stripe? You'll be able to create a free account during the flow. Stripe is available in 46 countries.
                </p>
              </div>
            )}
          </div>

          {/* ── VAT Settings ── */}
          <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:20}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>VAT / Sales Tax</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:14}}>
              Enable to add VAT to invoices and track it in the VAT Return tab. Required for UK VAT-registered businesses and EU freelancers.
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>VAT Registered</div>
                <div style={{fontSize:12,color:C.muted}}>Show VAT fields on invoices</div>
              </div>
              <div onClick={()=>setEditPro({...editPro,vat_registered:!editPro.vat_registered})}
                style={{width:44,height:24,borderRadius:12,background:editPro.vat_registered?C.accent:C.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left:editPro.vat_registered?22:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
              </div>
            </div>
            {editPro.vat_registered && (<>
              <TextInput label="VAT Number" value={editPro.vat_number||""} onChange={e=>setEditPro({...editPro,vat_number:e.target.value})} placeholder="e.g. GB123456789 / DE123456789"/>
              <SelectInput label="Default VAT Rate" value={editPro.default_vat_rate||"20"} onChange={e=>setEditPro({...editPro,default_vat_rate:e.target.value})}>
                <option value="5">5% — UK reduced rate</option>
                <option value="9">9% — EU reduced rate</option>
                <option value="10">10% — Austria / Japan</option>
                <option value="19">19% — Germany standard</option>
                <option value="20">20% — UK / France / Austria</option>
                <option value="21">21% — Netherlands / Belgium / Spain</option>
                <option value="23">23% — Poland / Ireland</option>
                <option value="25">25% — Sweden / Denmark / Norway</option>
                <option value="0">0% — Zero rated / exempt</option>
              </SelectInput>
              <div style={{padding:"12px 14px",background:"#0d1f14",border:"1px solid #4ADE8022",borderRadius:10,fontSize:12,color:C.muted,lineHeight:1.7,marginTop:4}}>
                💡 Your VAT number will appear on all PDF invoices. Use the <strong style={{color:C.text}}>VAT tab</strong> to file your quarterly return and see output vs input VAT.
              </div>
            </>)}
          </div>
        </Modal>
      )}
    </div>
  );
}
