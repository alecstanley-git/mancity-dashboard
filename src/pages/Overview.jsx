import Missing, { orMissing } from '../components/Missing.jsx';
import Badge from '../components/Badge.jsx';

export default function Overview(v) {
  const { ui, cd, next, comp, tabs, news, fixtures, transfers, transferMeta, scorers, scorersEmpty, injuries, injuryCount, report, page, club, player } = v;
  return (
    <main data-m="grid" style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: "20px", alignItems: "start" }}>

      <section style={{ gridColumn: "span 8", background: "var(--heroBg)", color: "var(--heroInk)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow)", position: "relative" }}>
        <div style={{ position: "absolute", inset: "0", background: "repeating-linear-gradient(115deg,rgba(108,171,221,.10) 0 1px,transparent 1px 26px)", pointerEvents: "none" }}></div>
        <div data-m="hero" style={{ position: "relative", padding: "26px 32px 30px", display: "flex", flexDirection: "column", gap: "26px" }}>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".18em", color: "var(--navy)", background: "var(--sky)", padding: "5px 10px", borderRadius: "4px" }}>{orMissing(next.comp)}</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".16em", color: "var(--heroDim)" }}>{orMissing(next.round)}</span>
            <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "700", letterSpacing: ".14em", color: "var(--heroDim)" }}>MATCH CENTRE</span>
          </div>

          <div data-m="hero-teams" style={{ display: "flex", alignItems: "center", gap: "34px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "120px" }}>
              <img src="crest.svg" alt="Manchester City" width="84" height="84" style={{ display: "block" }} />
              <button onClick={next.openSelf} style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", color: "var(--heroInk)", textAlign: "left", fontSize: "12.5px", fontWeight: "700", letterSpacing: ".04em" }} data-hov="sky">Man City</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: "none" }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "34px", fontWeight: "600", color: "var(--heroDim)", letterSpacing: ".06em" }}>VS</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "120px" }}>
              <Badge src={next.oppBadge} code={next.oppCode} bg={next.oppBg} fg={next.oppFg} size={76} fontSize={26} border="4px solid rgba(255,255,255,.55)" />
              <button onClick={next.openOpp} data-tip="Open club page" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", color: "var(--heroInk)", textAlign: "left", fontSize: "12.5px", fontWeight: "700", letterSpacing: ".04em" }} data-hov="sky">{orMissing(next.opponent)}</button>
            </div>

            <div data-m="hero-kick" style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".16em", color: "var(--heroDim)" }}>KICKOFF · AEST</span>
              <span data-m="kick" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "44px", fontWeight: "700", lineHeight: ".9", letterSpacing: ".01em" }}>{orMissing(next.kickTime)}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--heroDim)" }}>{orMissing(next.kickDate)}</span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--heroDim)" }}>{orMissing(next.venue)}</span>
            </div>
          </div>

          <div data-m="cd-wrap" style={{ display: "flex", alignItems: "flex-end", gap: "22px", borderTop: "1px solid var(--heroLine)", paddingTop: "22px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".16em", color: "var(--heroDim)" }}>COUNTDOWN TO KICKOFF</span>
              <div data-m="cd-row" style={{ display: "flex", gap: "10px" }}>
                <div data-m="cd" style={{ width: "74px", padding: "10px 0", background: "rgba(255,255,255,.08)", border: "1px solid var(--heroLine)", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "34px", fontWeight: "700", lineHeight: "1" }}>{orMissing(cd.d)}</span>
                  <span style={{ fontSize: "9.5px", fontWeight: "700", letterSpacing: ".14em", color: "var(--heroDim)" }}>DAYS</span>
                </div>
                <div data-m="cd" style={{ width: "74px", padding: "10px 0", background: "rgba(255,255,255,.08)", border: "1px solid var(--heroLine)", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "34px", fontWeight: "700", lineHeight: "1" }}>{orMissing(cd.h)}</span>
                  <span style={{ fontSize: "9.5px", fontWeight: "700", letterSpacing: ".14em", color: "var(--heroDim)" }}>HRS</span>
                </div>
                <div data-m="cd" style={{ width: "74px", padding: "10px 0", background: "rgba(255,255,255,.08)", border: "1px solid var(--heroLine)", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "34px", fontWeight: "700", lineHeight: "1" }}>{orMissing(cd.m)}</span>
                  <span style={{ fontSize: "9.5px", fontWeight: "700", letterSpacing: ".14em", color: "var(--heroDim)" }}>MIN</span>
                </div>
                <div data-m="cd" style={{ width: "74px", padding: "10px 0", background: "var(--gold)", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "34px", fontWeight: "700", lineHeight: "1", color: "#1C2C5B" }}>{orMissing(cd.s)}</span>
                  <span style={{ fontSize: "9.5px", fontWeight: "700", letterSpacing: ".14em", color: "rgba(28,44,91,.7)" }}>SEC</span>
                </div>
              </div>
            </div>
            <div data-m="cd-act" style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
              {next.addToCalendar && (<button onClick={next.addToCalendar} data-toast="Calendar file downloaded — reminder 30 min before kickoff" data-toast-tone="gold" style={{ border: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", fontSize: "12.5px", fontWeight: "700", letterSpacing: ".04em", height: "44px", padding: "0 20px", borderRadius: "8px", background: "var(--sky)", color: "#0E1A38" }} data-hov="btn">Add to calendar</button>)}
            </div>
          </div>
        </div>
      </section>

      <section style={{ gridColumn: "span 4", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px 24px 8px", display: "flex", flexDirection: "column" }} data-m="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
          <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>FIXTURE RAIL</span>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>{fixtures ? `NEXT ${fixtures.length}` : "NEXT UP"}</span>
        </div>
        {!fixtures && <Missing />}
        {(fixtures || []).map((f, fI) => (
          <div key={fI} data-row data-tip="Kickoff shown in AEST" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 10px", margin: "0 -10px", borderRadius: "8px", borderBottom: "1px solid var(--line)" }}>
            <Badge src={f.badge} code={f.code} bg={f.bg} fg={f.fg} size={38} fontSize={14} />
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
              <button onClick={f.open} style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", color: "inherit", textAlign: "left", fontSize: "13.5px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }} data-hov="link">{f.opponent}</button>
              <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: ".06em", color: "var(--dim)" }}>{f.comp} · {f.venue}</span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "17px", fontWeight: "700", letterSpacing: ".02em" }}>{f.time}</span>
              <span style={{ fontSize: "10.5px", fontWeight: "700", letterSpacing: ".08em", color: "var(--dim)" }}>{f.date}</span>
            </div>
          </div>

    ))}
        <div style={{ padding: "14px 0 12px", textAlign: "center" }}>
          <span data-toast="Jumped to the full fixture list" style={{ fontSize: "12px", fontWeight: "700", color: "var(--skyText)", cursor: "pointer" }}>Full fixture list →</span>
        </div>
      </section>

      <section style={{ gridColumn: "span 7", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
          <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>STANDINGS</span>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>{orMissing(comp.updated)}</span>
        </div>
        <div data-m="chiprow" style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
          {!tabs && <Missing />}
          {(tabs || []).map((t, tI) => (
            <button key={tI} onClick={t.select} style={{ cursor: "pointer", fontFamily: "Archivo,sans-serif", fontSize: "12px", fontWeight: "700", letterSpacing: ".04em", padding: "9px 14px", borderRadius: "8px", background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}>{t.label}</button>

    ))}
        </div>

        {(comp.isTable) && (
          <div>
            <div data-m="table" style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) 40px 46px 46px 118px", gap: "8px", padding: "0 10px 10px", fontSize: "10.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)" }}>
              <span>#</span><span>CLUB</span><span data-m="num" style={{ textAlign: "center" }}>P</span><span data-m="num" style={{ textAlign: "center" }}>GD</span><span style={{ textAlign: "center" }}>PTS</span><span style={{ textAlign: "right" }}>FORM</span>
            </div>
            {!comp.rows && <Missing />}
            {(comp.rows || []).map((r, rI) => (
              <div key={rI} data-row data-m="table" style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) 40px 46px 46px 118px", gap: "8px", alignItems: "center", padding: "9px 10px", borderRadius: "8px", background: r.rowBg }}>
                <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <span data-tip={r.zoneTip} style={{ width: "3px", height: "18px", borderRadius: "2px", background: r.mark }}></span>
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
          </div>

    )}

        {(comp.isPath) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {!comp.path && <Missing />}
            {(comp.path || []).map((p, pI) => (
              <div key={pI} data-row data-m="path" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 16px", borderRadius: "10px", background: "var(--panel2)", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".12em", color: "var(--dim)", width: "86px", flex: "none" }}>{p.round}</span>
                <button onClick={p.open} style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", color: "inherit", textAlign: "left", fontSize: "14px", fontWeight: "700" }} data-hov="link">{p.opponent}</button>
                <span style={{ fontSize: "11.5px", fontWeight: "700", letterSpacing: ".08em", color: "var(--dim)" }}>{p.venue}</span>
                <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "800", letterSpacing: ".06em", padding: "6px 11px", borderRadius: "6px", background: p.bg, color: p.fg }}>{p.result}</span>
              </div>

    ))}
          </div>

    )}

        <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "14px" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".14em", color: "var(--dim)" }}>CITY · LAST FIVE IN {orMissing(comp.shortLabel)}</span>
            <span data-toast="Loading every result from this season" style={{ fontSize: "11px", fontWeight: "700", color: "var(--skyText)", cursor: "pointer" }}>All results →</span>
          </div>
          <div data-m="five" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: "10px" }}>
            {!comp.recent && <Missing {...(comp.recentEmpty || {})} />}
            {(comp.recent || []).map((g, gI) => (
              <div key={gI} data-row style={{ minWidth: "0", padding: "12px", borderRadius: "10px", background: "var(--panel2)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>{g.date} · {g.venue}</span>
                <button onClick={g.open} style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", color: "inherit", textAlign: "left", fontSize: "12.5px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }} data-hov="link">{g.opponent}</button>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "22px", fontWeight: "700", lineHeight: "1", color: g.fg }}>{g.score}</span>
              </div>

    ))}
          </div>
        </div>
      </section>

      <section style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>TOP SCORERS</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>ALL COMPS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {!scorers && <Missing {...(scorersEmpty || {})} />}
            {(scorers || []).map((p, pI) => (
              <div key={pI} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--chip)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "15px", fontWeight: "700", color: "var(--skyText)" }}>{p.num}</span>
                </div>
                <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {p.linkable ? (<button onClick={p.open} data-tip="Open player page" data-hov="link" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", fontSize: "13.5px", fontWeight: "700", color: "var(--ink)", textAlign: "left" }}>{p.name}</button>) : (<span style={{ fontFamily: "Archivo,sans-serif", fontSize: "13.5px", fontWeight: "700", color: "var(--ink)" }}>{p.name}</span>)}
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--dim)" }}>{p.pos}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "20px", fontWeight: "700", color: "var(--skyText)" }}>{p.goals}</span>
                  </div>
                  <div style={{ height: "5px", borderRadius: "3px", background: "var(--panel2)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: p.bar, background: "var(--sky)", borderRadius: "3px" }}></div>
                  </div>
                </div>
              </div>

    ))}
          </div>
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>LAST MATCH</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>{report ? report.score : ""}</span>
          </div>
          {!report && <Missing />}
          {report && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={report.openOpp} data-tip="Open club page" data-hov="link" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", color: "inherit", fontSize: "14px", fontWeight: "700" }}>{report.heading}</button>
                <span style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--dim)" }}>{report.venue}</span>
              </div>

              <div style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
                {report.attendance && (
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "24px", fontWeight: "700", lineHeight: "1" }}>{report.attendance}</span>
                    <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: ".12em", color: "var(--dim)" }}>ATTENDANCE</span>
                  </span>
                )}
                {report.referee && (
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", lineHeight: "1.6" }}>{report.referee}</span>
                    <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: ".12em", color: "var(--dim)" }}>REFEREE</span>
                  </span>
                )}
              </div>

              {report.compare && (
                <div style={{ display: "flex", flexDirection: "column", gap: "7px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
                  {report.compare.map((c, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "48px minmax(0,1fr) 48px", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "17px", fontWeight: "700", color: "var(--skyText)" }}>{c.mine}</span>
                      <span style={{ textAlign: "center", fontSize: "11px", fontWeight: "700", letterSpacing: ".08em", color: "var(--dim)" }}>{c.label}</span>
                      <span style={{ textAlign: "right", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "17px", fontWeight: "700" }}>{c.opp}</span>
                    </div>
                  ))}
                </div>
              )}

              {report.events && report.events.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
                  {report.events.map((e, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: "10px", alignItems: "baseline" }}>
                      <span style={{ fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: "11px", color: "var(--dim)" }}>{e.minute}</span>
                      <span style={{ fontSize: "12.5px", fontWeight: e.forUs ? 700 : 600, color: e.fg }}>{e.label} · {e.player}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>TREATMENT ROOM</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>{orMissing(injuryCount)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            {!injuries && <Missing />}
            {(injuries || []).map((i, iI) => (
              <div key={iI} data-row data-tip="Latest club fitness update" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", background: "var(--panel2)" }}>
                <span style={{ width: "6px", height: "26px", borderRadius: "3px", background: i.tone, flex: "none" }}></span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {i.linkable ? (<button onClick={i.open} data-tip="Open player page" data-hov="link" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "Archivo,sans-serif", fontSize: "13.5px", fontWeight: "700", color: "var(--ink)", textAlign: "left" }}>{i.name}</button>) : (<span style={{ fontFamily: "Archivo,sans-serif", fontSize: "13.5px", fontWeight: "700", color: "var(--ink)" }}>{i.name}</span>)}
                  <span style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--dim)" }}>{i.issue}</span>
                </div>
                <span style={{ marginLeft: "auto", fontSize: "11.5px", fontWeight: "700", letterSpacing: ".05em", color: i.tone }}>{i.back}</span>
              </div>

    ))}
          </div>
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>TRANSFER DESK</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>{orMissing(transferMeta)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {!transfers && <Missing />}
            {(transfers || []).map((t, tI) => (
              <div key={tI} style={{ display: "flex", flexDirection: "column", gap: "5px", paddingBottom: "12px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: ".12em", padding: "3px 7px", borderRadius: "4px", background: t.bg, color: t.fg }}>{t.tag}</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--dim)" }}>{t.source} · {t.time}</span>
                </div>
                <span style={{ fontSize: "13.5px", fontWeight: "600", lineHeight: "1.4", textWrap: "pretty" }}>{t.text}</span>
              </div>

    ))}
          </div>
        </div>
      </section>

      <section style={{ gridColumn: "span 12", marginTop: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
          <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>NEWS &amp; MEDIA</span>
          <div data-m="scrollx" style={{ display: "flex", gap: "16px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink)", borderBottom: "2px solid var(--sky)", paddingBottom: "2px" }}>All</span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--dim)" }}>Video</span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--dim)" }}>Match reports</span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--dim)" }}>Transfers</span>
          </div>
        </div>
        <div data-m="cards1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px" }}>
          {!news && <Missing />}
          {(news || []).map((n, nI) => (
            <article key={nI} data-card {...(n.url ? {} : { "data-toast": "Opened in City+ — added to your watch list" })} style={{ position: "relative", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", cursor: "pointer" }}>
              {/* A real headline gets a real link, covering the whole card so it
                  stays one target and reaches the keyboard. */}
              {n.url && <a href={n.url} target="_blank" rel="noreferrer noopener" aria-label={n.title} style={{ position: "absolute", inset: 0, zIndex: 1 }} />}
              <div style={{ position: "relative", aspectRatio: "16/10", background: "var(--stripeBg)", backgroundImage: n.image ? `url(${n.image})` : "repeating-linear-gradient(135deg,var(--stripe) 0 2px,transparent 2px 11px)", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "12px" }}>
                {!n.image && (<span style={{ fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: "10px", letterSpacing: ".06em", color: "var(--dim)", background: "var(--panel)", padding: "3px 7px", borderRadius: "4px" }}>{n.slot}</span>)}
                {(n.isVideo) && (
                  <span style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "var(--red)", color: "#fff", fontSize: "10px", fontWeight: "800", letterSpacing: ".1em", padding: "4px 9px", borderRadius: "4px" }}>
                    <span style={{ width: "0", height: "0", borderLeft: "6px solid #fff", borderTop: "4px solid transparent", borderBottom: "4px solid transparent" }}></span>
                    {n.duration}
                  </span>

    )}
              </div>
              <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: "10px", flex: "1" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: ".14em", color: "var(--skyText)" }}>{n.kicker}</span>
                <span style={{ fontSize: "15px", fontWeight: "700", lineHeight: "1.32", textWrap: "pretty" }}>{n.title}</span>
                <span style={{ marginTop: "auto", fontSize: "11px", fontWeight: "600", letterSpacing: ".04em", color: "var(--dim)" }}>{n.source} · {n.time}</span>
              </div>
            </article>

    ))}
        </div>
      </section>

    </main>

  );
}
