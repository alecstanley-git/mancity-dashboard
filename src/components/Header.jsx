export default function Header(v) {
  const { greeting, ui, setLight, setDark, page, nav } = v;
  return (
    <header data-m="page" style={{ padding: "0 32px" }}>
      <div data-m="head" style={{ maxWidth: "1440px", margin: "0 auto", height: "88px", display: "flex", alignItems: "center", gap: "18px" }}>
        <img data-m="crest" src="crest.svg" alt="Manchester City" width="46" height="46" style={{ display: "block", flex: "none" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "19px", fontWeight: "800", letterSpacing: "-.01em" }}>CITY HUB</span>
          <span style={{ fontSize: "11.5px", fontWeight: "600", letterSpacing: ".12em", color: "var(--dim)" }}>{greeting}</span>
        </div>
        <nav data-m="hide" style={{ display: "flex", gap: "26px", marginLeft: "44px" }}>
          {(nav || []).map((t, tI) => (
            <button key={tI} onClick={t.select} style={{ background: "none", border: "0", padding: "0 0 3px", cursor: "pointer", fontFamily: "Archivo,sans-serif", fontSize: "13px", fontWeight: t.weight, color: t.fg, borderBottom: `2px solid ${t.bd}` }}>{t.label}</button>

    ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "14px" }}>
          <div data-m="tog" style={{ display: "flex", padding: "3px", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: "999px" }}>
            <button onClick={setLight} aria-label="Light mode" data-tip="Switch to light mode" style={{ border: "0", cursor: "pointer", width: "34px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: ui.lightBg, color: ui.lightFg }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4.2"></circle>
                <line x1="12" y1="2.4" x2="12" y2="4.6"></line>
                <line x1="12" y1="19.4" x2="12" y2="21.6"></line>
                <line x1="2.4" y1="12" x2="4.6" y2="12"></line>
                <line x1="19.4" y1="12" x2="21.6" y2="12"></line>
                <line x1="5.2" y1="5.2" x2="6.8" y2="6.8"></line>
                <line x1="17.2" y1="17.2" x2="18.8" y2="18.8"></line>
                <line x1="18.8" y1="5.2" x2="17.2" y2="6.8"></line>
                <line x1="6.8" y1="17.2" x2="5.2" y2="18.8"></line>
              </svg>
            </button>
            <button onClick={setDark} aria-label="Dark mode" data-tip="Switch to dark mode" style={{ border: "0", cursor: "pointer", width: "34px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: ui.darkBg, color: ui.darkFg }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M20.2 14.9A8.6 8.6 0 0 1 9.1 3.8a7.7 7.7 0 1 0 11.1 11.1z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
