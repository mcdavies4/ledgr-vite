import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0D0F14",
  surface: "#161921",
  card: "#1C2030",
  border: "#252A3A",
  accent: "#4ADE80",
  accentDim: "#1a3d2b",
  warning: "#FBBF24",
  danger: "#F87171",
  muted: "#6B7280",
  text: "#F1F5F9",
  textDim: "#94A3B8",
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const daysUntil = (d) => {
  const diff = new Date(d) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const INITIAL_INVOICES = [
  { id: 1, client: "Acme Corp", amount: 3200, status: "paid", dueDate: "2025-02-10", type: "business", description: "Web redesign Q1" },
  { id: 2, client: "PixelBridge", amount: 1500, status: "pending", dueDate: "2026-03-15", type: "business", description: "Logo & branding" },
  { id: 3, client: "NovaTech", amount: 4800, status: "overdue", dueDate: "2026-02-20", type: "business", description: "App development sprint" },
  { id: 4, client: "Freelance Guild", amount: 750, status: "pending", dueDate: "2026-03-20", type: "business", description: "Workshop facilitation" },
];

const INITIAL_EXPENSES = [
  { id: 1, name: "Adobe Creative Cloud", amount: 54.99, category: "Software", date: "2026-02-28", type: "business" },
  { id: 2, name: "Groceries", amount: 180.5, category: "Personal", date: "2026-03-01", type: "personal" },
  { id: 3, name: "Figma Pro", amount: 15, category: "Software", date: "2026-02-25", type: "business" },
  { id: 4, name: "Electric bill", amount: 92.3, category: "Utilities", date: "2026-03-02", type: "personal" },
  { id: 5, name: "Client lunch", amount: 67, category: "Meals", date: "2026-03-01", type: "business" },
  { id: 6, name: "Gym membership", amount: 40, category: "Health", date: "2026-03-01", type: "personal" },
];

const INITIAL_ALERTS = [
  { id: 1, label: "Rent due", amount: 1850, dueDate: "2026-03-05", type: "personal" },
  { id: 2, label: "Notion subscription", amount: 16, dueDate: "2026-03-08", type: "business" },
  { id: 3, label: "Tax estimated payment", amount: 1200, dueDate: "2026-04-15", type: "business" },
];

const Badge = ({ type }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    padding: "2px 7px", borderRadius: 4,
    background: type === "business" ? "#1e2d4a" : "#2a1e3a",
    color: type === "business" ? "#60A5FA" : "#C084FC",
    textTransform: "uppercase",
  }}>{type}</span>
);

const StatusPill = ({ status }) => {
  const map = {
    paid: { bg: "#1a3d2b", color: "#4ADE80", label: "Paid" },
    pending: { bg: "#3a2d1a", color: "#FBBF24", label: "Pending" },
    overdue: { bg: "#3a1a1a", color: "#F87171", label: "Overdue" },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
  }}>
    <div style={{
      background: COLORS.card, border: `1px solid ${COLORS.border}`,
      borderRadius: 16, padding: 32, width: 420, maxWidth: "90vw",
      boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ color: COLORS.text, fontSize: 18, fontFamily: "'Playfair Display', serif", margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 20 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", color: COLORS.textDim, fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
    <input {...props} style={{
      width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 8, padding: "10px 12px", color: COLORS.text, fontSize: 14,
      outline: "none", boxSizing: "border-box",
      fontFamily: "'DM Sans', sans-serif",
    }} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", color: COLORS.textDim, fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
    <select {...props} style={{
      width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 8, padding: "10px 12px", color: COLORS.text, fontSize: 14,
      outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
    }}>{children}</select>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style = {} }) => (
  <button onClick={onClick} style={{
    padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
    background: variant === "primary" ? COLORS.accent : COLORS.border,
    color: variant === "primary" ? "#0D0F14" : COLORS.textDim,
    ...style
  }}>{children}</button>
);

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [filterType, setFilterType] = useState("all");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ client: "", amount: "", dueDate: "", type: "business", description: "", status: "pending" });
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", category: "", date: "", type: "business" });
  const [newAlert, setNewAlert] = useState({ label: "", amount: "", dueDate: "", type: "personal" });

  // Metrics
  const totalIncome = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - expenses.filter(e => e.type === "business").reduce((s, e) => s + e.amount, 0);

  const filteredInvoices = filterType === "all" ? invoices : invoices.filter(i => i.type === filterType);
  const filteredExpenses = filterType === "all" ? expenses : expenses.filter(e => e.type === filterType);

  const upcomingAlerts = alerts
    .map(a => ({ ...a, days: daysUntil(a.dueDate) }))
    .filter(a => a.days <= 30)
    .sort((a, b) => a.days - b.days);

  const addInvoice = () => {
    if (!newInvoice.client || !newInvoice.amount) return;
    setInvoices(prev => [...prev, { ...newInvoice, id: Date.now(), amount: parseFloat(newInvoice.amount) }]);
    setNewInvoice({ client: "", amount: "", dueDate: "", type: "business", description: "", status: "pending" });
    setShowInvoiceModal(false);
  };

  const addExpense = () => {
    if (!newExpense.name || !newExpense.amount) return;
    setExpenses(prev => [...prev, { ...newExpense, id: Date.now(), amount: parseFloat(newExpense.amount) }]);
    setNewExpense({ name: "", amount: "", category: "", date: "", type: "business" });
    setShowExpenseModal(false);
  };

  const addAlert = () => {
    if (!newAlert.label || !newAlert.dueDate) return;
    setAlerts(prev => [...prev, { ...newAlert, id: Date.now(), amount: parseFloat(newAlert.amount) || 0 }]);
    setNewAlert({ label: "", amount: "", dueDate: "", type: "personal" });
    setShowAlertModal(false);
  };

  const markInvoicePaid = (id) => setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "paid" } : i));
  const deleteInvoice = (id) => setInvoices(prev => prev.filter(i => i.id !== id));
  const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));
  const dismissAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const tabs = ["dashboard", "invoices", "expenses", "alerts"];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div style={{
          width: 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`,
          padding: "28px 16px", display: "flex", flexDirection: "column", flexShrink: 0,
          position: "sticky", top: 0, height: "100vh"
        }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, background: COLORS.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>⚡</span>
              </div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: COLORS.text }}>Ledgr</span>
            </div>
            <p style={{ color: COLORS.muted, fontSize: 11, margin: 0, paddingLeft: 42 }}>Personal & Business</p>
          </div>

          <nav style={{ flex: 1 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: tab === t ? COLORS.accentDim : "transparent",
                color: tab === t ? COLORS.accent : COLORS.textDim,
                fontSize: 14, fontWeight: tab === t ? 600 : 400,
                marginBottom: 4, textAlign: "left", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}>
                <span>{t === "dashboard" ? "◼" : t === "invoices" ? "◈" : t === "expenses" ? "◉" : "◐"}</span>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === "alerts" && upcomingAlerts.length > 0 && (
                  <span style={{ marginLeft: "auto", background: COLORS.warning, color: "#000", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
                    {upcomingAlerts.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Type filter */}
          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, marginTop: 16 }}>
            <p style={{ color: COLORS.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>View</p>
            {["all", "business", "personal"].map(f => (
              <button key={f} onClick={() => setFilterType(f)} style={{
                display: "block", width: "100%", padding: "7px 12px", borderRadius: 6,
                border: "none", cursor: "pointer", textAlign: "left",
                background: filterType === f ? COLORS.border : "transparent",
                color: filterType === f ? COLORS.text : COLORS.muted,
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                marginBottom: 2,
              }}>
                {f === "all" ? "All finances" : f === "business" ? "💼 Business" : "🏠 Personal"}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>

          {/* DASHBOARD */}
          {tab === "dashboard" && (
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, margin: "0 0 6px", color: COLORS.text }}>Financial Overview</h1>
              <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 32 }}>Your money, all in one place.</p>

              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "Income Collected", value: formatCurrency(totalIncome), color: COLORS.accent, icon: "↑" },
                  { label: "Pending Invoices", value: formatCurrency(totalPending), color: COLORS.warning, icon: "⏳" },
                  { label: "Overdue", value: formatCurrency(totalOverdue), color: COLORS.danger, icon: "!" },
                  { label: "Total Expenses", value: formatCurrency(totalExpenses), color: "#60A5FA", icon: "↓" },
                  { label: "Net Profit", value: formatCurrency(netProfit), color: netProfit >= 0 ? COLORS.accent : COLORS.danger, icon: "≈" },
                ].map((s, i) => (
                  <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "20px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ color: COLORS.muted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                      <span style={{ color: s.color, fontSize: 16 }}>{s.icon}</span>
                    </div>
                    <div style={{ color: s.color, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Recent invoices + Alerts side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
                  <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 600, color: COLORS.text }}>Recent Invoices</h3>
                  {invoices.slice(-4).reverse().map(inv => (
                    <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{inv.client}</div>
                        <div style={{ fontSize: 12, color: COLORS.muted }}>{inv.description}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{formatCurrency(inv.amount)}</div>
                        <StatusPill status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
                  <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 600, color: COLORS.text }}>Upcoming Payments</h3>
                  {upcomingAlerts.length === 0 && <p style={{ color: COLORS.muted, fontSize: 13 }}>No upcoming payments in 30 days.</p>}
                  {upcomingAlerts.map(a => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{a.label}</div>
                        <div style={{ fontSize: 12, color: a.days <= 3 ? COLORS.danger : a.days <= 7 ? COLORS.warning : COLORS.muted }}>
                          {a.days <= 0 ? "Due today!" : `Due in ${a.days} day${a.days === 1 ? "" : "s"}`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{formatCurrency(a.amount)}</div>
                        <Badge type={a.type} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense breakdown */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginTop: 24 }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 600, color: COLORS.text }}>Spending by Category</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                    const pct = Math.round((amt / totalExpenses) * 100);
                    return (
                      <div key={cat} style={{ flex: "1 1 180px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: COLORS.textDim }}>{cat}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{formatCurrency(amt)}</span>
                        </div>
                        <div style={{ background: COLORS.border, borderRadius: 4, height: 6 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: COLORS.accent, borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* INVOICES */}
          {tab === "invoices" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, margin: "0 0 4px" }}>Invoices</h1>
                  <p style={{ color: COLORS.muted, fontSize: 14, margin: 0 }}>{filteredInvoices.length} invoices · {formatCurrency(filteredInvoices.reduce((s, i) => s + i.amount, 0))} total</p>
                </div>
                <Btn onClick={() => setShowInvoiceModal(true)}>+ New Invoice</Btn>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredInvoices.map(inv => (
                  <div key={inv.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{inv.client}</span>
                        <Badge type={inv.type} />
                        <StatusPill status={inv.status} />
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.muted }}>{inv.description} · Due {formatDate(inv.dueDate)}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, minWidth: 100, textAlign: "right" }}>
                      {formatCurrency(inv.amount)}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {inv.status !== "paid" && (
                        <Btn onClick={() => markInvoicePaid(inv.id)} style={{ padding: "7px 14px", fontSize: 12 }}>Mark Paid</Btn>
                      )}
                      <Btn onClick={() => deleteInvoice(inv.id)} variant="secondary" style={{ padding: "7px 12px", fontSize: 12, color: COLORS.danger }}>✕</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXPENSES */}
          {tab === "expenses" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, margin: "0 0 4px" }}>Expenses</h1>
                  <p style={{ color: COLORS.muted, fontSize: 14, margin: 0 }}>{filteredExpenses.length} entries · {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))} total</p>
                </div>
                <Btn onClick={() => setShowExpenseModal(true)}>+ Add Expense</Btn>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(exp => (
                  <div key={exp.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{exp.name}</span>
                        <Badge type={exp.type} />
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.muted }}>{exp.category} · {formatDate(exp.date)}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.danger }}>{formatCurrency(exp.amount)}</div>
                    <Btn onClick={() => deleteExpense(exp.id)} variant="secondary" style={{ padding: "6px 10px", fontSize: 12, color: COLORS.muted }}>✕</Btn>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALERTS */}
          {tab === "alerts" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, margin: "0 0 4px" }}>Payment Alerts</h1>
                  <p style={{ color: COLORS.muted, fontSize: 14, margin: 0 }}>Never miss a due date</p>
                </div>
                <Btn onClick={() => setShowAlertModal(true)}>+ Add Alert</Btn>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {alerts.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(a => {
                  const days = daysUntil(a.dueDate);
                  const urgency = days <= 3 ? COLORS.danger : days <= 7 ? COLORS.warning : COLORS.textDim;
                  return (
                    <div key={a.id} style={{
                      background: COLORS.card, borderRadius: 12, padding: "18px 22px",
                      border: `1px solid ${days <= 7 ? urgency + "44" : COLORS.border}`,
                      display: "flex", alignItems: "center", gap: 16
                    }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: urgency + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: urgency, fontSize: 18 }}>{days <= 0 ? "🔴" : days <= 3 ? "🔥" : days <= 7 ? "⚠️" : "📅"}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{a.label}</span>
                          <Badge type={a.type} />
                        </div>
                        <div style={{ fontSize: 13, color: urgency, fontWeight: 500 }}>
                          {days <= 0 ? "Due today!" : days === 1 ? "Due tomorrow!" : `Due in ${days} days — ${formatDate(a.dueDate)}`}
                        </div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, minWidth: 80, textAlign: "right" }}>
                        {a.amount > 0 ? formatCurrency(a.amount) : "—"}
                      </div>
                      <Btn onClick={() => dismissAlert(a.id)} variant="secondary" style={{ padding: "7px 12px", fontSize: 12, color: COLORS.muted }}>Dismiss</Btn>
                    </div>
                  );
                })}
                {alerts.length === 0 && (
                  <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                    <p>No upcoming payment alerts.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showInvoiceModal && (
        <Modal title="New Invoice" onClose={() => setShowInvoiceModal(false)}>
          <Input label="Client Name" value={newInvoice.client} onChange={e => setNewInvoice({ ...newInvoice, client: e.target.value })} placeholder="e.g. Acme Corp" />
          <Input label="Amount ($)" type="number" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })} placeholder="0.00" />
          <Input label="Description" value={newInvoice.description} onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })} placeholder="e.g. Web redesign Q2" />
          <Input label="Due Date" type="date" value={newInvoice.dueDate} onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} />
          <Select label="Type" value={newInvoice.type} onChange={e => setNewInvoice({ ...newInvoice, type: e.target.value })}>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </Select>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</Btn>
            <Btn onClick={addInvoice}>Add Invoice</Btn>
          </div>
        </Modal>
      )}

      {showExpenseModal && (
        <Modal title="Add Expense" onClose={() => setShowExpenseModal(false)}>
          <Input label="Expense Name" value={newExpense.name} onChange={e => setNewExpense({ ...newExpense, name: e.target.value })} placeholder="e.g. Figma Pro" />
          <Input label="Amount ($)" type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="0.00" />
          <Input label="Category" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} placeholder="e.g. Software, Meals, Utilities" />
          <Input label="Date" type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
          <Select label="Type" value={newExpense.type} onChange={e => setNewExpense({ ...newExpense, type: e.target.value })}>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </Select>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Btn>
            <Btn onClick={addExpense}>Add Expense</Btn>
          </div>
        </Modal>
      )}

      {showAlertModal && (
        <Modal title="New Payment Alert" onClose={() => setShowAlertModal(false)}>
          <Input label="Payment Label" value={newAlert.label} onChange={e => setNewAlert({ ...newAlert, label: e.target.value })} placeholder="e.g. Rent, Subscription" />
          <Input label="Amount ($) — optional" type="number" value={newAlert.amount} onChange={e => setNewAlert({ ...newAlert, amount: e.target.value })} placeholder="0.00" />
          <Input label="Due Date" type="date" value={newAlert.dueDate} onChange={e => setNewAlert({ ...newAlert, dueDate: e.target.value })} />
          <Select label="Type" value={newAlert.type} onChange={e => setNewAlert({ ...newAlert, type: e.target.value })}>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </Select>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setShowAlertModal(false)}>Cancel</Btn>
            <Btn onClick={addAlert}>Set Alert</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
