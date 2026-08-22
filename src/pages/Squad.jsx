import Missing, { orMissing } from '../components/Missing.jsx';
export default function Squad(v) {
  const { page, club, player, squad, squadMeta } = v;
  return (
    <main data-m="stack" style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px", display: "flex", flexDirection: "column", gap: "26px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <span data-m="title" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "42px", fontWeight: "700", lineHeight: ".95" }}>FIRST-TEAM SQUAD</span>
          <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--dim)" }}>{orMissing(squadMeta)} · appearances and goals across all competitions</span>
        </div>
        <div data-m="chiprow" style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <span style={{ fontSize: "11.5px", fontWeight: "700", letterSpacing: ".03em", padding: "9px 14px", borderRadius: "8px", background: "#6CABDD", color: "#0E1A38", cursor: "pointer" }}>All positions</span>
          <span style={{ fontSize: "11.5px", fontWeight: "700", letterSpacing: ".03em", padding: "9px 14px", borderRadius: "8px", border: "1px solid var(--line)", color: "var(--dim)", cursor: "pointer" }}>Availability</span>
        </div>
      </div>

      {!squad && <Missing />}
      {(squad || []).map((g, gI) => (
        <section key={gI} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", color: "var(--skyText)" }}>{g.group}</span>
            <span style={{ flex: "1", height: "1px", background: "var(--line)" }}></span>
          </div>
          <div data-m="cards1" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "16px" }}>
            {(g.players || []).map((p, pI) => (
              <div key={pI} data-card style={{ minWidth: "0", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "0" }}>
                  <span style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--chip)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "21px", fontWeight: "700", color: "var(--skyText)" }} data-tip="Shirt number — failed to fetch">{p.num ?? "\u2014"}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
                    <button onClick={p.open} data-tip="Open player page" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", fontSize: "15px", fontWeight: "700", color: "var(--ink)", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{p.name}</button>
                    <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: ".08em", color: "var(--dim)" }}>{p.nation} · {p.age} YRS</span>
                  </span>
                  <span data-tip="Latest club fitness update" style={{ marginLeft: "auto", flex: "none", fontSize: "9.5px", fontWeight: "800", letterSpacing: ".1em", padding: "5px 9px", borderRadius: "5px", background: p.statusBg, color: p.statusFg }}>{orMissing(p.status)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "22px", fontWeight: "700", lineHeight: "1" }}>{p.apps}</span>
                    <span style={{ fontSize: "9.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)" }}>APPS</span>
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "22px", fontWeight: "700", lineHeight: "1", color: "var(--skyText)" }}>{p.goals}</span>
                    <span style={{ fontSize: "9.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)" }}>GOALS</span>
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "22px", fontWeight: "700", lineHeight: "1" }}>{p.assists}</span>
                    <span style={{ fontSize: "9.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)" }}>ASSISTS</span>
                  </span>
                </div>
              </div>

    ))}
          </div>
        </section>

    ))}
    </main>

  );
}
