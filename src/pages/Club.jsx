import Missing, { orMissing } from '../components/Missing.jsx';
import Badge from '../components/Badge.jsx';

export default function Club(v) {
  const { injuries, page, nav, club, player, backLabel, goBack, seasonLabel } = v;
  return (
    <main data-m="grid" style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: "20px", alignItems: "start" }}>

      <div data-m="backrow" style={{ gridColumn: "span 12", display: "flex", alignItems: "center", gap: "14px" }}>
        <button onClick={goBack} data-m="tap" style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "1px solid var(--line)", cursor: "pointer", fontFamily: "Archivo,sans-serif", fontSize: "12px", fontWeight: "700", letterSpacing: ".04em", color: "var(--dim)", height: "34px", padding: "0 14px", borderRadius: "8px" }} data-hov="nav">← {backLabel}</button>
        <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".14em", color: "var(--dim)" }}>CLUB PROFILE · {orMissing(seasonLabel)}</span>
      </div>

      <section data-m="col-side" style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }} data-m="card">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Badge src={club.badge} code={club.code} bg={club.bg} fg={club.fg} size={66} fontSize={23} />
          <span style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: "0" }}>
            <span data-m="cname" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "34px", fontWeight: "700", lineHeight: ".95" }}>{club.name}</span>
            <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: ".04em", color: "var(--dim)" }}>{orMissing(club.nick)}</span>
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "18px", borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)", width: "96px", flex: "none" }}>STADIUM</span>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>{orMissing(club.stadium)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)", width: "96px", flex: "none" }}>CAPACITY</span>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>{orMissing(club.capacity)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)", width: "96px", flex: "none" }}>FOUNDED</span>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>{orMissing(club.founded)}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "18px", borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: "10.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)" }}>LEAGUE FORM</span>
          <span style={{ display: "flex", gap: "6px" }}>
            {!club.form && <Missing {...(club.formEmpty || {})} />}
            {(club.form || []).map((d, dI) => (
              <span key={dI} data-tip={d.tip} style={{ width: "26px", height: "26px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", lineHeight: "1", background: d.bg, color: d.fg }}>{d.ch}</span>

    ))}
          </span>
        </div>
      </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>SEASON SPLIT</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>PREMIER LEAGUE</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {!club.splits && <Missing />}
            {(club.splits || []).map((s, sI) => (
              <div key={sI} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", width: "64px", flex: "none" }}>{s.label}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "20px", fontWeight: "700", width: "32px", flex: "none", lineHeight: "1" }}>{orMissing(s.value)}</span>
                <span style={{ flex: "1", height: "8px", borderRadius: "4px", background: "var(--panel2)", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: s.bar, background: s.color, borderRadius: "4px" }}></span>
                </span>
                <span style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--dim)", width: "44px", textAlign: "right", flex: "none" }}>{s.bar}</span>
              </div>

    ))}
          </div>
        </div>

      </section>

      <section data-m="col-main" style={{ gridColumn: "span 7", containerType: "inline-size", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div data-m="stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "16px" }}>
          {!club.headline && <Missing />}
          {(club.headline || []).map((s, sI) => (
            <div key={sI} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "20px", display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
              <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: ".14em", color: "var(--dim)", lineHeight: "1.2", minHeight: "24px" }}>{s.label}</span>
              <span data-m="statbig" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "44px", fontWeight: "700", lineHeight: ".9" }}>{orMissing(s.value)}</span>
              <span style={{ fontSize: "11.5px", fontWeight: "600", lineHeight: "1.35", color: "var(--dim)", minHeight: "31px", textWrap: "pretty" }}>{s.sub}</span>
            </div>

    ))}
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>RECENT FORM</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>LAST FIVE · NEWEST FIRST</span>
          </div>
          {!club.recent && <Missing />}
          {(club.recent || []).map((g, gI) => (
            <div key={gI} data-row data-m="l5" style={{ display: "grid", gridTemplateColumns: "52px 30px 84px minmax(0,1fr)", gap: "12px", alignItems: "center", padding: "12px 10px", margin: "0 -10px", borderRadius: "8px" }}>
              <button onClick={g.open} data-tip="Open club page" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", color: "inherit", textAlign: "left", fontSize: "16px", fontWeight: "700" }} data-hov="link">{g.code}</button>
              <span data-tip={g.venueTip} style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".1em", color: "var(--dim)" }}>{g.venue}</span>
              <span style={{ fontSize: "12.5px", fontWeight: "700", whiteSpace: "nowrap", color: g.fg }}>{g.score}</span>
              <span style={{ textAlign: "right", fontSize: "12px", fontWeight: "600", color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.club}</span>
            </div>

    ))}
        </div>

        <div style={{ containerType: "inline-size", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
          <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>SQUAD</span>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>REGISTERED PLAYERS</span>
        </div>
        <div data-m="facts" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "12px" }}>
          {!club.squadFacts && <Missing />}
          {(club.squadFacts || []).map((s, sI) => (
            <div key={sI} style={{ minWidth: "0", padding: "16px", borderRadius: "10px", background: "var(--panel2)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "30px", fontWeight: "700", lineHeight: "1" }}>{orMissing(s.value)}</span>
              <span style={{ fontSize: "9.5px", fontWeight: "800", letterSpacing: ".1em", color: "var(--dim)", lineHeight: "1.3" }}>{s.label}</span>
            </div>

    ))}
        </div>
        {(club.hasTop) && (
          <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "800", letterSpacing: ".14em", color: "var(--dim)", marginBottom: "8px" }}>TOP CONTRIBUTORS</span>
            {!club.top && <Missing {...(club.topEmpty || {})} />}
            {(club.top || []).map((p, pI) => (
              <div key={pI} data-row style={{ display: "flex", alignItems: "center", gap: "14px", padding: "11px 10px", margin: "0 -10px", borderRadius: "8px" }}>
                <span style={{ width: "32px", height: "32px", borderRadius: "9px", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--chip)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "15px", fontWeight: "700", color: "var(--skyText)" }}>{p.num}</span>
                {p.linkable ? (<button onClick={p.open} data-tip="Open player page" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", color: "inherit", textAlign: "left", fontSize: "13.5px", fontWeight: "700" }} data-hov="link">{p.name}</button>) : (<span style={{ fontFamily: "Archivo,sans-serif", color: "inherit", fontSize: "13.5px", fontWeight: "700" }}>{p.name}</span>)}
                <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "600", color: "var(--dim)" }}>{p.goals}</span>
              </div>

    ))}
          </div>

    )}
        {(club.hasAbsences) && (
          <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "800", letterSpacing: ".14em", color: "var(--dim)", marginBottom: "2px" }}>REPORTED ABSENCES</span>
            {!club.absences && <Missing />}
            {(club.absences || []).map((a, aI) => (
              <div key={aI} data-row data-tip="Latest club fitness update" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", background: "var(--panel2)" }}>
                <span style={{ width: "6px", height: "26px", borderRadius: "3px", background: a.tone, flex: "none" }}></span>
                <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "700" }}>{a.role}</span>
                  <span style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--dim)" }}>{a.issue}</span>
                </span>
                <span style={{ marginLeft: "auto", fontSize: "11.5px", fontWeight: "700", letterSpacing: ".05em", color: a.tone }}>{a.back}</span>
              </div>

    ))}
          </div>

    )}
        {(club.cityInjuries) && (
          <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "800", letterSpacing: ".14em", color: "var(--dim)", marginBottom: "2px" }}>TREATMENT ROOM</span>
            {(injuries || []).map((i, iI) => (
              <div key={iI} data-row style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", background: "var(--panel2)" }}>
                <span style={{ width: "6px", height: "26px", borderRadius: "3px", background: i.tone, flex: "none" }}></span>
                <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
                  <button onClick={i.open} data-tip="Open player page" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", color: "inherit", textAlign: "left", fontSize: "13.5px", fontWeight: "700" }} data-hov="link">{i.name}</button>
                  <span style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--dim)" }}>{i.issue}</span>
                </span>
                <span style={{ marginLeft: "auto", fontSize: "11.5px", fontWeight: "700", letterSpacing: ".05em", color: i.tone }}>{i.back}</span>
              </div>

    ))}
          </div>

    )}
      </div>
      </section>

    </main>

  );
}
