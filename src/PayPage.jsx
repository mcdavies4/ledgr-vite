import { useState, useEffect } from "react";

const SUPABASE_URL = "https://phjybvphmlzghdebonzy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanlidnBobWx6Z2hkZWJvbnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTI2MDIsImV4cCI6MjA4ODE2ODYwMn0.6r7C6aQPn0YTjmDjRkP8fVd6cQhXJ_L1jBYqsu2qRWM";

const C = {
  bg:"#080B10", card:"#141A22", border:"#1E2535",
  accent:"#4ADE80", accentDim:"#0d2018",
  text:"#F1F5F9", muted:"#4B5563", textDim:"#8B95A8",
  danger:"#F87171",
};

function callEdge(fn, body) {
  return fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${SUPABASE_ANON}`, "apikey": SUPABASE_ANON },
    body: JSON.stringify(body),
  }).then(r => r.json());
}

export default function PayPage() {
  const [inv, setInv] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  const invoiceId = window.location.pathname.replace("/pay/","").split("?")[0];

  useEffect(() => {
    // Check if returning from Stripe with ?paid=true
    if (new URLSearchParams(window.location.search).get("paid") === "true") {
      setPaid(true);
    }
    callEdge("get-payment-link", { invoice_id: invoiceId })
      .then(res => {
        if (res.error) { setError(res.error); }
        else { setInv(res.invoice); setProfile(res.profile); }
        setLoading(false);
      });
  }, []);

  const fmt = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : "";

  if (loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
      Loading invoice...
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center",color:C.danger}}>
        <div style={{fontSize:32,marginBottom:12}}>⚠</div>
        <div style={{fontSize:16}}>{error}</div>
      </div>
    </div>
  );

  if (paid || inv?.status === "paid") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",maxWidth:400}}>
        <div style={{width:72,height:72,background:C.accentDim,border:`2px solid ${C.accent}44`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 24px"}}>✓</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,color:C.text,margin:"0 0 8px"}}>Payment received</h1>
        <p style={{color:C.muted,fontSize:15,margin:"0 0 24px"}}>Thank you — your payment has been processed successfully.</p>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,textAlign:"left"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{color:C.muted,fontSize:13}}>Amount paid</span>
            <span style={{color:C.accent,fontWeight:700,fontSize:15}}>{fmt(inv?.amount)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{color:C.muted,fontSize:13}}>To</span>
            <span style={{color:C.text,fontSize:13}}>{profile?.name || "Business"}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",padding:"40px 20px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1E2535;border-radius:4px}`}</style>

      <div style={{maxWidth:520,margin:"0 auto"}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:20}}>
            <div style={{width:32,height:32,background:"linear-gradient(135deg,#4ADE80,#22c55e)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#060A0E"}}>L</div>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:800,color:C.text}}>Ledgr</span>
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:C.text,margin:"0 0 6px"}}>Invoice from {profile?.name || "your client"}</h1>
          <p style={{color:C.muted,fontSize:14,margin:0}}>Please review and complete your payment below</p>
        </div>

        {/* Invoice card */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,overflow:"hidden",marginBottom:16}}>
          {/* Amount header */}
          <div style={{background:C.accentDim,borderBottom:`1px solid ${C.border}`,padding:"28px 32px",textAlign:"center"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Amount Due</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:52,fontWeight:900,color:C.accent,lineHeight:1}}>{fmt(inv?.amount)}</div>
          </div>

          {/* Invoice details */}
          <div style={{padding:"24px 32px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              {[
                {label:"Invoice to", value: inv?.client},
                {label:"Description", value: inv?.description || "Services rendered"},
                {label:"Due date", value: fmtDate(inv?.due_date)},
                {label:"From", value: profile?.name || "Business"},
              ].map((r,i) => (
                <div key={i}>
                  <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{r.label}</div>
                  <div style={{fontSize:14,color:C.text,fontWeight:500}}>{r.value || "—"}</div>
                </div>
              ))}
            </div>

            {profile?.email && (
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:20,fontSize:12,color:C.muted}}>
                Questions? Contact <span style={{color:C.textDim}}>{profile.email}</span>
              </div>
            )}

            {/* Pay button — redirect to Stripe payment link */}
            <PayButton invoiceId={invoiceId} />
          </div>
        </div>

        <p style={{textAlign:"center",color:C.muted,fontSize:12}}>
          Secured by Stripe · Your payment info is never stored on this site
        </p>
      </div>
    </div>
  );
}

function PayButton({ invoiceId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setLoading(true); setError("");
    try {
      const res = await callEdge("get-payment-link", { invoice_id: invoiceId });
      if (res.error) throw new Error(res.error);
      // We need the stripe URL — fetch from invoices table via edge fn
      const r2 = await fetch(`${SUPABASE_URL}/functions/v1/get-stripe-url`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      const { url, error: e2 } = await r2.json();
      if (e2) throw new Error(e2);
      window.location.href = url;
    } catch(e) { setError(e.message); setLoading(false); }
  };

  return (
    <>
      {error && <div style={{background:"#1f0808",border:"1px solid #F8717144",borderRadius:8,padding:"10px 14px",color:"#F87171",fontSize:12,marginBottom:12}}>{error}</div>}
      <button onClick={handlePay} disabled={loading} style={{width:"100%",background:"#4ADE80",border:"none",color:"#060A0E",padding:"16px",borderRadius:12,cursor:loading?"not-allowed":"pointer",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:loading?0.7:1,boxShadow:"0 8px 32px rgba(74,222,128,0.25)",transition:"all 0.15s"}}
        onMouseEnter={e=>{if(!loading)e.target.style.boxShadow="0 12px 40px rgba(74,222,128,0.4)";}}
        onMouseLeave={e=>e.target.style.boxShadow="0 8px 32px rgba(74,222,128,0.25)"}>
        {loading ? "Redirecting to Stripe..." : "Pay now"}
      </button>
    </>
  );
}
