import { useState, useEffect } from "react";

const SUPABASE_URL = "https://phjybvphmlzghdebonzy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanlidnBobWx6Z2hkZWJvbnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTI2MDIsImV4cCI6MjA4ODE2ODYwMn0.6r7C6aQPn0YTjmDjRkP8fVd6cQhXJ_L1jBYqsu2qRWM";

const C={bg:"#06080D",bgGlow:"#0a1a12",card:"#0E1420",cardHi:"#131C2A",border:"#1A2535",borderHi:"#243448",accent:"#4ADE80",accentDim:"#0d2018",accentLo:"#4ADE8022",text:"#F1F5F9",textDim:"#94A3B8",muted:"#4B5563",danger:"#F87171",blue:"#60A5FA",stripe:"#635BFF"};

function callEdge(fn,body){return fetch(`${SUPABASE_URL}/functions/v1/${fn}`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},body:JSON.stringify(body)}).then(r=>r.json());}

function money(amount,currencyCode){const code=(currencyCode||"USD").toUpperCase();const localeMap={GBP:"en-GB",EUR:"de-DE",NGN:"en-NG",KES:"sw-KE",GHS:"en-GH",ZAR:"en-ZA",USD:"en-US",CAD:"en-CA",AUD:"en-AU"};const locale=localeMap[code]||"en-US";try{return new Intl.NumberFormat(locale,{style:"currency",currency:code}).format(amount||0);}catch{return`${code} ${(amount||0).toFixed(2)}`;}}

function fmtDate(d){if(!d)return"—";return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});}

function isOverdue(dueDate,status){if(status==="paid")return false;if(!dueDate)return false;return new Date(dueDate)<new Date();}

function Fonts(){return<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>;}

function Row({label,value,valueColor,bold}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:13}}>{label}</span><span style={{color:valueColor||C.text,fontSize:13,fontWeight:bold?700:500,maxWidth:"60%",textAlign:"right"}}>{value||"—"}</span></div>);}

function LedgrBadge({style={}}){return(<div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",background:C.card,border:`1px solid ${C.border}`,borderRadius:20,...style}}><div style={{width:18,height:18,background:"linear-gradient(135deg,#4ADE80,#22c55e)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#060A0E"}}>L</div><span style={{color:C.muted,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>Secured by <span style={{color:C.textDim,fontWeight:600}}>Ledgr</span></span></div>);}

function StatusChip({status,dueDate}){const overdue=isOverdue(dueDate,status);const cfg=overdue?{label:"Overdue",bg:"#2a0f0f",border:"#F8717133",color:C.danger}:status==="paid"?{label:"Paid",bg:C.accentDim,border:`${C.accent}33`,color:C.accent}:{label:"Due",bg:"#0f1a2a",border:`${C.blue}33`,color:C.blue};return<span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",padding:"3px 10px",borderRadius:20,background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.color}}>{cfg.label}</span>;}

function Spinner(){return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,fontFamily:"'DM Sans',sans-serif"}}><style>{"@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}"}</style><div style={{width:40,height:40,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><div style={{color:C.muted,fontSize:13,animation:"pulse 1.5s ease infinite"}}>Loading invoice…</div></div>);}

function ErrorScreen({message}){return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}><div style={{textAlign:"center",maxWidth:380}}><div style={{fontSize:40,marginBottom:16}}>⚠</div><h2 style={{color:C.text,fontSize:20,marginBottom:8}}>Invoice not found</h2><p style={{color:C.muted,fontSize:14,lineHeight:1.6}}>{message||"This invoice link may have expired or is invalid. Contact the sender for a new link."}</p></div></div>);}

function PaidScreen({inv,profile}){return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}><Fonts/><style>{"@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}@keyframes checkPop{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}.paid-card{animation:fadeUp 0.5s ease both}.check-icon{animation:checkPop 0.5s cubic-bezier(.34,1.56,.64,1) 0.2s both}"}</style><div className="paid-card" style={{textAlign:"center",maxWidth:440,width:"100%"}}><div className="check-icon" style={{width:80,height:80,background:"linear-gradient(135deg,#0d2a18,#0a2015)",border:`2px solid ${C.accent}55`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 28px",boxShadow:`0 0 40px ${C.accent}22`}}>✓</div><h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:36,color:C.text,margin:"0 0 10px",fontWeight:400}}>Payment received</h1><p style={{color:C.textDim,fontSize:15,margin:"0 0 32px",lineHeight:1.6}}>Thank you — your payment has been processed successfully.</p><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 24px"}}><Row label="Amount paid" value={money(inv?.amount,inv?.currency||profile?.currency)} valueColor={C.accent} bold/>{inv?.description&&<Row label="For" value={inv.description}/>}<Row label="From" value={profile?.business_name||profile?.name||"—"}/>{inv?.invoice_number&&<Row label="Invoice" value={`#${inv.invoice_number}`}/>}</div><p style={{color:C.muted,fontSize:12,marginTop:24,lineHeight:1.6}}>A receipt has been sent to your email by Stripe.</p><LedgrBadge style={{marginTop:32}}/></div></div>);}

function PayButton({invoiceId,inv,profile}){
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const handlePay=async()=>{
    setLoading(true);setError("");
    try{
      if(inv?.payment_link){window.location.href=inv.payment_link;return;}
      const r=await fetch(`${SUPABASE_URL}/functions/v1/get-stripe-url`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${SUPABASE_ANON}`,"apikey":SUPABASE_ANON},body:JSON.stringify({invoice_id:invoiceId})});
      const{url,error:e}=await r.json();
      if(e)throw new Error(e);
      window.location.href=url;
    }catch(e){setError(e.message);setLoading(false);}
  };
  const currency=inv?.currency||profile?.currency||"USD";
  const amountStr=money(inv?.amount,currency);
  return(<div>{error&&<div style={{background:"#1f0808",border:"1px solid #F8717144",borderRadius:10,padding:"10px 14px",color:C.danger,fontSize:13,marginBottom:12,lineHeight:1.5}}>{error}</div>}<button onClick={handlePay} disabled={loading} style={{width:"100%",background:loading?"#1a2a1a":C.accent,border:"none",color:loading?C.muted:"#060A0E",padding:"16px 24px",borderRadius:12,cursor:loading?"not-allowed":"pointer",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:loading?"none":`0 8px 32px ${C.accent}33`,transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}} onMouseEnter={e=>{if(!loading)e.currentTarget.style.boxShadow=`0 12px 40px ${C.accent}55`;}} onMouseLeave={e=>{if(!loading)e.currentTarget.style.boxShadow=`0 8px 32px ${C.accent}33`;}}>{loading?<><div style={{width:16,height:16,border:`2px solid ${C.muted}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>Redirecting to Stripe…</>:<>Pay {amountStr}</>}</button><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:12}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span style={{color:C.muted,fontSize:12}}>Secured by <span style={{color:"#635BFF",fontWeight:600}}>Stripe</span> · Your card details are never stored</span></div></div>);
}

export default function PayPage(){
  const[inv,setInv]=useState(null);
  const[profile,setProfile]=useState(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const[paid,setPaid]=useState(false);
  const invoiceId=window.location.pathname.replace("/pay/","").split("?")[0];

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("paid")==="true")setPaid(true);
    callEdge("get-payment-link",{invoice_id:invoiceId,mark_viewed:true}).then(res=>{
      if(res.error)setError(res.error);
      else{setInv(res.invoice);setProfile(res.profile);}
      setLoading(false);
    });
  },[]);

  if(loading)return<Spinner/>;
  if(error)return<ErrorScreen message={error}/>;
  if(paid||inv?.status==="paid")return<PaidScreen inv={inv} profile={profile}/>;

  const overdue=isOverdue(inv?.due_date,inv?.status);
  const currency=inv?.currency||profile?.currency||"USD";
  const displayName=profile?.business_name||profile?.name||"Your service provider";
  const invNum=inv?.invoice_number?`#${inv.invoice_number}`:`#${invoiceId.slice(0,8).toUpperCase()}`;

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif"}}>
      <Fonts/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1E2535;border-radius:4px}.portal-wrap{animation:fadeUp 0.45s ease both}`}</style>
      <div style={{position:"fixed",top:-200,left:"50%",transform:"translateX(-50%)",width:600,height:600,background:"radial-gradient(ellipse,#4ADE8010 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"relative",zIndex:1,padding:"40px 20px 60px",maxWidth:560,margin:"0 auto"}}>
        <div className="portal-wrap">

          {/* Header */}
          <div style={{textAlign:"center",marginBottom:36}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:20}}>
              <div style={{width:30,height:30,background:"linear-gradient(135deg,#4ADE80,#22c55e)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#060A0E"}}>L</div>
              <span style={{fontFamily:"'Instrument Serif',serif",fontSize:18,color:C.text}}>Ledgr</span>
            </div>
            <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:32,color:C.text,marginBottom:6,fontWeight:400,lineHeight:1.2}}>Invoice from <em>{displayName}</em></h1>
            <p style={{color:C.textDim,fontSize:14}}>Review the details below and complete your payment</p>
          </div>

          {/* Card */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,overflow:"hidden",marginBottom:12}}>

            {/* Amount hero */}
            <div style={{background:"linear-gradient(160deg,#0d2018 0%,#0a1a12 100%)",borderBottom:`1px solid ${C.border}`,padding:"32px 32px 28px",textAlign:"center",position:"relative"}}>
              {overdue&&<div style={{position:"absolute",top:12,left:12,right:12,background:"#2a0f0f",border:"1px solid #F8717133",borderRadius:8,padding:"6px 12px",color:C.danger,fontSize:12,fontWeight:600}}>⚠ This invoice is overdue — please pay as soon as possible</div>}
              <div style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12,marginTop:overdue?28:0}}>Amount Due</div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:56,color:C.accent,lineHeight:1,marginBottom:16}}>{money(inv?.amount,currency)}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <StatusChip status={inv?.status} dueDate={inv?.due_date}/>
                {inv?.due_date&&<span style={{color:C.muted,fontSize:13}}>{overdue?"Was due":"Due"} {fmtDate(inv?.due_date)}</span>}
              </div>
            </div>

            {/* Details */}
            <div style={{padding:"24px 32px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <span style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Invoice Details</span>
                <span style={{fontSize:12,color:C.textDim,background:C.cardHi,border:`1px solid ${C.border}`,padding:"3px 10px",borderRadius:6,fontFamily:"monospace"}}>{invNum}</span>
              </div>

              <div style={{marginBottom:24}}>
                <Row label="Billed to" value={inv?.client}/>
                {inv?.description&&<Row label="Description" value={inv.description}/>}
                {inv?.notes&&<Row label="Notes" value={inv.notes}/>}
                <Row label="From" value={displayName}/>
                {profile?.address&&<Row label="Address" value={profile.address}/>}
              </div>

              {profile?.email&&(
                <div style={{background:C.cardHi,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:24,display:"flex",alignItems:"center",gap:10}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span style={{color:C.muted,fontSize:12}}>Questions? <a href={`mailto:${profile.email}`} style={{color:C.textDim,textDecoration:"none"}}>{profile.email}</a></span>
                </div>
              )}

              <PayButton invoiceId={invoiceId} inv={inv} profile={profile}/>
            </div>
          </div>

          <div style={{textAlign:"center",paddingTop:8}}><LedgrBadge/></div>
        </div>
      </div>
    </div>
  );
}
