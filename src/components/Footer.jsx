export default function Footer({ provider, updated }) {
  const stamp = updated
    ? new Intl.DateTimeFormat('en-AU', {
        hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
        timeZone: 'Australia/Sydney', hour12: false,
      }).format(new Date(updated))
    : null;

  return (
    <footer data-m="page" style={{ maxWidth: "1440px", margin: "40px auto 0", padding: "0 32px" }}>
      <div data-m="foot" style={{ borderTop: "1px solid var(--line)", paddingTop: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
        <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)" }}>CITY HUB · PERSONAL DASHBOARD</span>
        <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "600", color: "var(--dim)" }}>
          {provider ? `${provider} · news from BBC Sport and The Guardian` : 'No data source reachable'}
          {stamp ? ` · updated ${stamp} AEST` : ''} · all times AEST
        </span>
      </div>
    </footer>
  );
}
