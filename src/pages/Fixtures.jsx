import Missing, { orMissing } from '../components/Missing.jsx';
import Badge from '../components/Badge.jsx';

export default function Fixtures(v) {
  const { seasonMeta, compFilters, months, seasonLabel } = v;
  return (
    <main data-m="stack" style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px", minWidth: "0" }}>
          <span data-m="title" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "42px", fontWeight: "700", lineHeight: ".95" }}>FIXTURES &amp; RESULTS</span>
          <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--dim)" }}>{orMissing(seasonLabel)} · all times AEST · {orMissing(seasonMeta)}</span>
        </div>
        <div data-m="chiprow" style={{ marginLeft: "auto", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {!compFilters && <Missing />}
          {(compFilters || []).map((c, cI) => (
            <span key={cI} style={{ fontSize: "11.5px", fontWeight: "700", letterSpacing: ".03em", padding: "9px 14px", borderRadius: "8px", cursor: "pointer", background: c.bg, color: c.fg, border: `1px solid ${c.bd}` }}>{c.label}</span>

    ))}
        </div>
      </div>

      {!months && <Missing />}
      {(months || []).map((mo, moI) => (
        <section key={moI} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", overflow: "hidden" }}>
          <div data-m="mohead" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 24px", background: "var(--panel2)", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "800", letterSpacing: ".14em" }}>{mo.month}</span>
            <span style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--dim)" }}>{mo.note}</span>
          </div>
          <div data-m="mopad" style={{ padding: "6px 24px 14px" }}>
            {(mo.matches || []).map((m, mI) => (
              <div key={mI} data-row data-m="fx" style={{ display: "grid", gridTemplateColumns: "78px 46px minmax(0,1fr) 158px 74px 92px", gap: "16px", alignItems: "center", padding: "14px 10px", margin: "0 -10px", borderRadius: "8px", borderBottom: "1px solid var(--line)" }}>
                <span data-m="fx-d" style={{ fontSize: "11.5px", fontWeight: "800", letterSpacing: ".1em", color: "var(--dim)" }}>{m.date}</span>
                <span data-m="fx-b" style={{ display: "flex" }}><Badge src={m.badge} code={m.code} bg={m.bg} fg={m.fg} size={38} fontSize={14} /></span>
                <span data-m="fx-o" style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
                  <button onClick={m.open} style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", color: "inherit", textAlign: "left", fontSize: "14.5px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }} data-hov="link">{m.opponent}</button>
                  <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: ".06em", color: "var(--dim)" }}>{m.ground}</span>
                </span>
                <span data-m="fx-c" style={{ fontSize: "10.5px", fontWeight: "800", letterSpacing: ".12em", color: "var(--skyText)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.comp}</span>
                <span data-m="fx-v" data-tip={m.venueTip} style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".12em", color: "var(--dim)", textAlign: "center" }}>{m.venue}</span>
                {(m.isResult) && (
                  <span data-m="fx-s" style={{ textAlign: "right", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "24px", fontWeight: "700", lineHeight: "1", color: m.toneFg }}>{m.score}</span>

    )}
                {(m.isFixture) && (
                  <span data-m="fx-s" style={{ textAlign: "right", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "24px", fontWeight: "700", lineHeight: "1" }}>{m.time}</span>

    )}
              </div>

    ))}
          </div>
        </section>

    ))}
    </main>

  );
}
