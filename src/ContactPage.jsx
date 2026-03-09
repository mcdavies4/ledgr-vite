import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const C = {
    bg: "#080B10", card: "#141A22", border: "#1E2535",
    text: "#F1F5F9", textDim: "#CBD5E1", muted: "#8B95A8",
    accent: "#4ADE80", accentDim: "#0a2018",
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    window.location.href = `mailto:azubuikedavies@gmail.com?subject=Ledgr enquiry from ${form.name}&body=${encodeURIComponent(form.message + "\n\nFrom: " + form.name + "\nEmail: " + form.email)}`;
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } a { color: inherit; text-decoration: none; }`}</style>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#4ADE80,#22c55e)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 900, color: "#060A0E" }}>L</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800 }}>Ledgr</span>
        </a>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/about" style={{ fontSize: 13, color: C.muted }}>About</a>
          <a href="/contact" style={{ fontSize: 13, color: C.accent }}>Contact</a>
          <a href="/privacy" style={{ fontSize: 13, color: C.muted }}>Privacy</a>
          <a href="/" style={{ fontSize: 13, background: C.accent, color: "#060A0E", padding: "7px 16px", borderRadius: 8, fontWeight: 700 }}>Open app</a>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 64, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Get in touch</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 16 }}>
            We'd love to<br/><em style={{ fontStyle: "italic", color: C.muted }}>hear from you</em>
          </h1>
          <p style={{ fontSize: 16, color: C.muted, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>Questions, feedback, or just want to say hello — we're a small team and we reply to everything.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

          {/* Left — contact methods */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Phone / WhatsApp */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Phone & WhatsApp</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 800, marginBottom: 20 }}>07876 135 951</div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href="tel:07876135951" style={{ flex: 1, background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: C.accent }}>
                  📞 Call us
                </a>
                <a href="https://wa.me/447876135951" target="_blank" rel="noreferrer" style={{ flex: 1, background: "#0a1f0d", border: "1px solid #25D36644", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#25D366" }}>
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {/* Email */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Email</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, marginBottom: 20, wordBreak: "break-all" }}>azubuikedavies@gmail.com</div>
              <a href="mailto:azubuikedavies@gmail.com" style={{ display: "block", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: C.textDim }}>
                ✉ Send email
              </a>
            </div>

            {/* Response time */}
            <div style={{ background: C.accentDim, border: `1px solid ${C.accent}33`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 6 }}>⚡ Quick response</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>We typically respond within a few hours during business hours (Mon–Fri, 9am–6pm GMT).</div>
            </div>
          </div>

          {/* Right — message form */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 24 }}>Send a message</div>

            {sent ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Opening your email</div>
                <div style={{ fontSize: 14, color: C.muted }}>Your message is ready to send.</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Your name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe"
                    style={{ width: "100%", background: "#0F1318", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 15, outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                    onFocus={e => e.target.style.borderColor = C.accent + "88"} onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Email address</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@email.com" type="email"
                    style={{ width: "100%", background: "#0F1318", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 15, outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                    onFocus={e => e.target.style.borderColor = C.accent + "88"} onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Message</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us what's on your mind..." rows={5}
                    style={{ width: "100%", background: "#0F1318", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 15, outline: "none", fontFamily: "'DM Sans',sans-serif", resize: "vertical" }}
                    onFocus={e => e.target.style.borderColor = C.accent + "88"} onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
                <button onClick={handleSubmit} style={{ width: "100%", background: C.accent, color: "#060A0E", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  Send message →
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "32px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: C.muted }}>
          © {new Date().getFullYear()} Ledgr · <a href="/about" style={{ color: C.muted }}>About</a> · <a href="/privacy" style={{ color: C.muted }}>Privacy</a> · <a href="/" style={{ color: C.accent }}>Open app</a>
        </div>
      </div>
    </div>
  );
}
