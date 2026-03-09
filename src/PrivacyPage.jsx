export default function PrivacyPage() {
  const C = {
    bg: "#080B10", card: "#141A22", border: "#1E2535",
    text: "#F1F5F9", textDim: "#CBD5E1", muted: "#8B95A8",
    accent: "#4ADE80",
  };

  const sections = [
    {
      title: "What data we collect",
      content: `When you create a Ledgr account, we collect your email address and name. When you use the app, we store the financial data you enter — invoices, expenses, client details, and connected account information. We do not collect payment card details; all payments are handled by Stripe.`
    },
    {
      title: "How we use your data",
      content: `Your data is used solely to provide the Ledgr service. We use it to display your financial information, send invoice reminders on your behalf, and send transactional emails (welcome, trial reminders, payment confirmations). We do not sell your data to third parties. We do not use your data for advertising.`
    },
    {
      title: "Data storage",
      content: `Your data is stored securely in Supabase (hosted on AWS). All data is encrypted at rest and in transit. We use row-level security to ensure your data is only accessible to you. Backups are taken regularly.`
    },
    {
      title: "Connected accounts",
      content: `When you connect a third-party account (Wise, Stripe, PayPal, Revolut), we store your API key or access token encrypted in our database. We use these credentials only to read your balance and transactions — we never initiate transfers or payments on your behalf.`
    },
    {
      title: "Cookies",
      content: `Ledgr uses minimal cookies necessary for authentication (to keep you logged in). We use Google Analytics to understand how users interact with the app — this data is anonymous and aggregated. You can opt out of Google Analytics via your browser settings.`
    },
    {
      title: "Third-party services",
      content: `We use the following third-party services: Supabase (database and authentication), Stripe (subscription billing), Brevo (transactional email), Google Analytics (anonymous usage analytics). Each of these services has their own privacy policy.`
    },
    {
      title: "Your rights",
      content: `You have the right to access, correct, or delete your personal data at any time. To delete your account and all associated data, contact us at azubuikedavies@gmail.com or via WhatsApp on 07876 135 951. We will process your request within 30 days.`
    },
    {
      title: "Data retention",
      content: `We retain your data for as long as your account is active. If you cancel your subscription, your data remains accessible until you choose to delete your account. After account deletion, all personal data is permanently removed within 30 days.`
    },
    {
      title: "Contact",
      content: `If you have any questions about this privacy policy or how we handle your data, please contact us at azubuikedavies@gmail.com or call/WhatsApp 07876 135 951. We're happy to answer any questions.`
    },
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
          <a href="/about" style={{ fontSize: 13, color: C.muted }}>About</a>
          <a href="/contact" style={{ fontSize: 13, color: C.muted }}>Contact</a>
          <a href="/privacy" style={{ fontSize: 13, color: C.accent }}>Privacy</a>
          <a href="/" style={{ fontSize: 13, background: C.accent, color: "#060A0E", padding: "7px 16px", borderRadius: 8, fontWeight: 700 }}>Open app</a>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Legal</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 16 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: C.muted }}>Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>

        {/* Intro */}
        <div style={{ background: C.accentDim || "#0a2018", border: `1px solid ${C.accent}33`, borderRadius: 16, padding: 24, marginBottom: 40 }}>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75 }}>
            Ledgr (<strong style={{ color: C.text }}>ledgrapp.co.uk</strong>) is a finance tool for freelancers. We take your privacy seriously. This policy explains what data we collect, how we use it, and your rights. If you have any questions, <a href="/contact" style={{ color: C.accent }}>contact us</a>.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: i === 0 ? "16px 16px 4px 4px" : i === sections.length - 1 ? "4px 4px 16px 16px" : 4, padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace", minWidth: 24 }}>{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8 }}>{s.content}</p>
            </div>
          ))}
        </div>

        {/* Contact block */}
        <div style={{ marginTop: 40, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Questions about your data?</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>We're happy to help — reach out anytime.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:azubuikedavies@gmail.com" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 20px", fontSize: 13, color: C.textDim, fontWeight: 600 }}>✉ azubuikedavies@gmail.com</a>
            <a href="https://wa.me/447876135951" target="_blank" rel="noreferrer" style={{ background: "#0a1f0d", border: "1px solid #25D36644", borderRadius: 8, padding: "10px 20px", fontSize: 13, color: "#25D366", fontWeight: 600 }}>💬 WhatsApp</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "32px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: C.muted }}>
          © {new Date().getFullYear()} Ledgr · <a href="/about" style={{ color: C.muted }}>About</a> · <a href="/contact" style={{ color: C.muted }}>Contact</a> · <a href="/" style={{ color: C.accent }}>Open app</a>
        </div>
      </div>
    </div>
  );
}
