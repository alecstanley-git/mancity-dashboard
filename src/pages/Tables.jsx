import Missing, { orMissing } from '../components/Missing.jsx';
export default function Tables(v) {
  const { page, club, plTable, otherComps, zones, comp } = v;
  return (
    <main data-m="grid" style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: "20px", alignItems: "start" }}>
      <div style={{ gridColumn: "span 12", display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <span data-m="title" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "42px", fontWeight: "700", lineHeight: ".95" }}>TABLES</span>
          <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--dim)" }}>Full league table, plus where City sit in every other competition</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "18px", flexWrap: "wrap" }}>
          {(zones || []).map((z, zI) => (
            <span key={zI} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11.5px", fontWeight: "600", color: "var(--dim)" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: z.color }}></span>{z.label}
            </span>

    ))}
        </div>
      </div>

      <section style={{ gridColumn: "span 8", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
          <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>PREMIER LEAGUE</span>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>{orMissing(comp.updated)}</span>
        </div>
        <div data-m="table" style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) 40px 46px 46px 118px", gap: "8px", padding: "0 10px 10px", fontSize: "10.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)" }}>
          <span>#</span><span>CLUB</span><span data-m="num" style={{ textAlign: "center" }}>P</span><span data-m="num" style={{ textAlign: "center" }}>GD</span><span style={{ textAlign: "center" }}>PTS</span><span style={{ textAlign: "right" }}>FORM</span>
        </div>
        {!plTable && <Missing />}
        {(plTable || []).map((r, rI) => (
          <div key={rI} data-row data-m="table" style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) 40px 46px 46px 118px", gap: "8px", alignItems: "center", padding: "9px 10px", borderRadius: "8px", background: r.rowBg }}>
            <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <span data-tip={r.zoneTip} style={{ width: "3px", height: "18px", borderRadius: "2px", background: r.zone }}></span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "17px", fontWeight: "700", color: r.rankFg }}>{r.pos}</span>
            </span>
            <button onClick={r.open} data-tip="Open club page" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", color: "inherit", textAlign: "left", fontSize: "13.5px", fontWeight: r.weight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }} data-hov="link">{r.club}</button>
            <span data-m="num" style={{ textAlign: "center", fontSize: "13px", fontWeight: "600", color: "var(--dim)" }}>{r.played}</span>
            <span data-m="num" style={{ textAlign: "center", fontSize: "13px", fontWeight: "600", color: "var(--dim)" }}>{r.gd}</span>
            <span style={{ textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "19px", fontWeight: "700" }}>{r.pts}</span>
            <span style={{ display: "flex", gap: "5px", justifyContent: "flex-end" }}>
              {(r.form || []).map((d, dI) => (
                <span key={dI} data-tip={d.tip} style={{ width: "19px", height: "19px", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800", lineHeight: "1", background: d.bg, color: d.fg }}>{d.ch}</span>

    ))}
            </span>
          </div>

    ))}
      </section>

      <section style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "16px" }}>
        {!otherComps && <Missing />}
        {(otherComps || []).map((c, cI) => (
          <div key={cI} data-card style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.tone }}></span>
              <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".14em", color: "var(--dim)" }}>{c.label}</span>
            </div>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "26px", fontWeight: "700", lineHeight: "1" }}>{c.status}</span>
            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--dim)" }}>{c.detail}</span>
          </div>

    ))}
      </section>
    </main>

  );
}
