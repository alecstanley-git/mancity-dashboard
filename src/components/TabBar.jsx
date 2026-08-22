export default function TabBar(v) {
  const { nav } = v;
  return (
    <nav data-m="tabbar" aria-label="Main" style={{ display: "none", position: "fixed", left: "0", right: "0", bottom: "0", zIndex: "80", background: "var(--panel)", borderTop: "1px solid var(--line)", boxShadow: "0 -8px 26px rgba(0,0,0,.16)", padding: "6px 8px calc(6px + env(safe-area-inset-bottom))" }}>
      <div style={{ display: "flex", gap: "4px" }}>
        {(nav || []).map((t, tI) => (
          <button key={tI} onClick={t.select} style={{ flex: "1 1 0", minWidth: "0", minHeight: "52px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "7px", background: "none", border: "0", borderRadius: "12px", cursor: "pointer", fontFamily: "Archivo,sans-serif", fontSize: "10.5px", fontWeight: "800", letterSpacing: ".09em", textTransform: "uppercase", color: t.fg }}>
            <span style={{ width: "20px", height: "3px", borderRadius: "2px", background: t.bd }}></span>
            {t.label}
          </button>

    ))}
      </div>
    </nav>

  );
}
