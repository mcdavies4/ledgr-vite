// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });

  const url = new URL(req.url);
  const proposalId = url.searchParams.get("id");
  const action = url.searchParams.get("action");
  const token = url.searchParams.get("token");

  if (!proposalId || !action || !["accept", "decline"].includes(action)) {
    return new Response(buildPage("Invalid Request", "This link is invalid or has expired.", "#F87171"), { headers: { "Content-Type": "text/html" }, status: 400 });
  }

  const { data: proposal, error } = await supabase.from("proposals").select("*").eq("id", proposalId).single();

  if (error || !proposal) {
    return new Response(buildPage("Not Found", "This proposal could not be found.", "#F87171"), { headers: { "Content-Type": "text/html" }, status: 404 });
  }

  const expectedToken = btoa(`${proposalId}-ledgr`).replace(/=/g, "").slice(0, 16);
  if (token !== expectedToken) {
    return new Response(buildPage("Invalid Link", "This link is invalid or has expired.", "#F87171"), { headers: { "Content-Type": "text/html" }, status: 403 });
  }

  if (proposal.status === "accepted" || proposal.status === "declined") {
    return new Response(buildPage("Already Responded", `This proposal was already ${proposal.status}. Contact your freelancer if you need to make changes.`, proposal.status === "accepted" ? "#4ADE80" : "#F87171"), { headers: { "Content-Type": "text/html" } });
  }

  const newStatus = action === "accept" ? "accepted" : "declined";
  await supabase.from("proposals").update({ status: newStatus }).eq("id", proposalId);

  const isAccepted = action === "accept";
  return new Response(buildPage(
    isAccepted ? "Proposal Accepted!" : "Proposal Declined",
    isAccepted
      ? `Thank you for accepting <strong>${proposal.title}</strong>. Your freelancer has been notified and will be in touch shortly.`
      : `You have declined <strong>${proposal.title}</strong>. Your freelancer has been notified.`,
    isAccepted ? "#4ADE80" : "#F87171"
  ), { headers: { "Content-Type": "text/html" } });
});

function buildPage(title, message, color) {
  const g = color === "#4ADE80";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} — Ledgr</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}.card{background:#fff;border-radius:20px;padding:48px 40px;max-width:480px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.08)}.logo{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:32px}.li{width:28px;height:28px;background:linear-gradient(135deg,#4ADE80,#16a34a);border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#060A0F}.lt{font-size:18px;font-weight:800;color:#0f172a}.icon{width:72px;height:72px;border-radius:50%;background:${color}22;border:2px solid ${color}66;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px;color:${color};font-weight:900}.badge{display:inline-block;background:${color}18;color:${g?"#16a34a":"#dc2626"};border:1px solid ${color}44;border-radius:20px;padding:5px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:20px}h1{font-size:22px;font-weight:800;color:#0f172a;margin-bottom:14px}p{font-size:14px;color:#475569;line-height:1.75;margin-bottom:28px}.footer{font-size:11px;color:#94a3b8}</style>
</head><body><div class="card"><div class="logo"><div class="li">L</div><div class="lt">Ledgr</div></div><div class="icon">${g?"✓":"✕"}</div><div class="badge">${title}</div><h1>${title}</h1><p>${message}</p><div class="footer">Powered by Ledgr · ledgrapp.co.uk</div></div></body></html>`;
}
