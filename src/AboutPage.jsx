export default function AboutPage() {
  const C = {
    bg: "#080B10", card: "#141A22", border: "#1E2535",
    text: "#F1F5F9", textDim: "#CBD5E1", muted: "#8B95A8",
    accent: "#4ADE80", accentDim: "#0a2018",
  };

  const features = [
    { icon: "◎", title: "Invoicing", desc: "Professional PDF invoices with payment links clients can pay instantly." },
    { icon: "◉", title: "Expense tracking", desc: "Categorise every expense, separate business from personal, export to CSV." },
    { icon: "⬢", title: "Connected accounts", desc: "Sync Wise, Stripe, PayPal and Revolut — see all your money in one place." },
    { icon: "◐", title: "Smart reminders", desc: "Automatic payment chasers sent on your behalf. 3 days, 1 day, 7 days overdue." },
    { icon: "⬡", title: "Multi-currency", desc: "Invoice in GBP, USD, EUR, NGN and 11 more currencies." },
    { icon: "◭", title: "Charts & reports", desc: "Visual income vs expense charts and profit tracking across 6 months." },
  ];

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
          <a href="/about" style={{ fontSize: 13, color: C.accent }}>About</a>
          <a href="/contact" style={{ fontSize: 13, color: C.muted }}>Contact</a>
          <a href="/privacy" style={{ fontSize: 13, color: C.muted }}>Privacy</a>
          <a href="/" style={{ fontSize: 13, background: C.accent, color: "#060A0E", padding: "7px 16px", borderRadius: 8, fontWeight: 700 }}>Open app</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 32px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Our story</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 24 }}>
            Built for the<br/><em style={{ fontStyle: "italic", color: C.muted }}>independent freelancer</em>
          </h1>
          <p style={{ fontSize: 17, color: C.muted, maxWidth: 580, margin: "0 auto", lineHeight: 1.75, fontWeight: 300 }}>
            Ledgr was built out of frustration. Managing invoices across spreadsheets, chasing payments manually, and losing track of expenses across multiple payment platforms — there had to be a better way.
          </p>
        </div>

        {/* Mission */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 48, marginBottom: 64, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#4ADE80,#22c55e,transparent)" }}/>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Our mission</div>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(20px,3vw,30px)", fontWeight: 700, lineHeight: 1.4, color: C.text, maxWidth: 680 }}>
            "Give every freelancer — wherever they are in the world — the financial tools that used to be reserved for big businesses."
          </p>
          <div style={{ marginTop: 24, fontSize: 13, color: C.muted }}>We're especially focused on freelancers in <span style={{ color: C.accent }}>Africa and emerging markets</span> who are underserved by existing tools.</div>
        </div>

        {/* Features grid */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em" }}>Everything in one place</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 22, marginBottom: 12, color: C.accent }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 48, marginBottom: 64, textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Simple, honest pricing</h2>
          <p style={{ color: C.muted, fontSize: 15, marginBottom: 32 }}>No hidden fees. No per-invoice charges. Just one flat price.</p>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 56, fontWeight: 900, color: C.accent }}>$15</span>
            <span style={{ fontSize: 18, color: C.muted }}>/month</span>
          </div>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 32 }}>After your 14-day free trial. Cancel anytime.</p>
          <a href="/" style={{ display: "inline-block", background: C.accent, color: "#060A0E", padding: "14px 40px", borderRadius: 12, fontSize: 15, fontWeight: 700 }}>Start free trial →</a>
        </div>

        {/* Contact CTA */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Questions?</h2>
          <p style={{ color: C.muted, fontSize: 15, marginBottom: 24 }}>We're a small, approachable team. Reach out anytime.</p>
          <a href="/contact" style={{ display: "inline-block", background: C.card, border: `1px solid ${C.border}`, color: C.textDim, padding: "12px 32px", borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Get in touch →</a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "32px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: C.muted }}>
          © {new Date().getFullYear()} Ledgr · <a href="/contact" style={{ color: C.muted }}>Contact</a> · <a href="/privacy" style={{ color: C.muted }}>Privacy</a> · <a href="/" style={{ color: C.accent }}>Open app</a>
        </div>
      </div>
    </div>
  );
}
