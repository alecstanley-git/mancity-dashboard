import Missing, { orMissing } from '../components/Missing.jsx';
export default function Player(v) {
  const { ui, page, nav, club, player, backLabel, goBack, seasonLabel } = v;
  return (
    <main data-m="grid" style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: "20px", alignItems: "start" }}>

      <div data-m="backrow" style={{ gridColumn: "span 12", display: "flex", alignItems: "center", gap: "14px" }}>
        <button onClick={goBack} data-m="tap" style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "1px solid var(--line)", cursor: "pointer", fontFamily: "Archivo,sans-serif", fontSize: "12px", fontWeight: "700", letterSpacing: ".04em", color: "var(--dim)", height: "34px", padding: "0 14px", borderRadius: "8px" }} data-hov="nav">← {backLabel}</button>
        <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".14em", color: "var(--dim)" }}>PLAYER PROFILE · {orMissing(seasonLabel)}</span>
      </div>

      <section data-m="col-side" style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ position: "relative", aspectRatio: "3/4", borderRadius: "12px", overflow: "hidden", background: "var(--stripeBg)", backgroundImage: "repeating-linear-gradient(135deg,var(--stripe) 0 2px,transparent 2px 12px)" }}>
          <span style={{ position: "absolute", top: "12px", left: "12px", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: "10px", letterSpacing: ".06em", color: "var(--dim)", background: "var(--panel)", padding: "4px 8px", borderRadius: "5px" }}>player portrait 3:4</span>
          <span style={{ position: "absolute", left: "0", right: "0", bottom: "0", height: "52%", background: "linear-gradient(180deg,rgba(4,10,26,0) 0%,rgba(4,10,26,.22) 34%,rgba(4,10,26,.66) 68%,rgba(4,10,26,.94) 100%)" }}></span>
          <span data-m="shirt" style={{ position: "absolute", left: "0", right: "0", bottom: "10px", textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "92px", fontWeight: "700", lineHeight: ".8", letterSpacing: ".01em", color: "var(--sky)", textShadow: "0 2px 20px rgba(0,0,0,.7)" }}>{orMissing(player.num)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span data-m="pname" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "40px", fontWeight: "700", lineHeight: ".95" }}>{player.name}</span>
            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--dim)" }}>{orMissing(player.role)} · {player.nation} · {player.age} years</span>
          </div>
          <span data-tip="Latest club fitness update" style={{ alignSelf: "flex-start", fontSize: "9.5px", fontWeight: "800", letterSpacing: ".1em", padding: "6px 10px", borderRadius: "5px", background: player.statusBg, color: player.statusFg }}>{orMissing(player.status)}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "10px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--dim)" }}>{orMissing(player.height)}</span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--dim)" }}>{orMissing(player.foot)}</span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--dim)" }}>{orMissing(player.joined)}</span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--dim)" }}>{orMissing(player.contract)}</span>
          </div>
        </div>
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>UNDERLYING NUMBERS</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>THIS SEASON</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {!player.metrics && <Missing />}
            {(player.metrics || []).map((m, mI) => (
              <div key={mI} style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "600" }}>{m.label}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "20px", fontWeight: "700", lineHeight: "1" }}>{m.value}</span>
                </div>
                <div style={{ height: "5px", borderRadius: "3px", background: "var(--panel2)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: m.bar, background: "var(--sky)", borderRadius: "3px" }}></div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--dim)" }}>{m.of}</span>
              </div>

    ))}
          </div>
        </div>
      </section>

      <section data-m="col-main" style={{ gridColumn: "span 8", containerType: "inline-size", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div data-m="stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "16px" }}>
          {!player.headline && <Missing />}
          {(player.headline || []).map((s, sI) => (
            <div key={sI} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "20px", display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
              <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: ".14em", color: "var(--dim)", lineHeight: "1.2", minHeight: "24px" }}>{s.label}</span>
              <span data-m="statbig" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "46px", fontWeight: "700", lineHeight: ".9" }}>{orMissing(s.value)}</span>
              <span style={{ fontSize: "11.5px", fontWeight: "600", lineHeight: "1.35", color: "var(--dim)", minHeight: "31px", textWrap: "pretty" }}>{s.sub}</span>
            </div>

    ))}
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>BY COMPETITION</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>{orMissing(seasonLabel)}</span>
          </div>
          <div data-m="pc" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 62px 62px 72px 82px", gap: "8px", padding: "0 10px 10px", fontSize: "10.5px", fontWeight: "700", letterSpacing: ".12em", color: "var(--dim)" }}>
            <span>COMPETITION</span><span style={{ textAlign: "center" }}>APPS</span><span style={{ textAlign: "center" }}>GOALS</span><span style={{ textAlign: "center" }}>ASSISTS</span><span data-m="pc-min" style={{ textAlign: "right" }}>MINUTES</span>
          </div>
          {!player.comps && <Missing />}
          {(player.comps || []).map((c, cI) => (
            <div key={cI} data-row data-m="pc" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 62px 62px 72px 82px", gap: "8px", alignItems: "center", padding: "11px 10px", borderRadius: "8px" }}>
              <span style={{ fontSize: "13.5px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.comp}</span>
              <span style={{ textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "19px", fontWeight: "700" }}>{c.apps}</span>
              <span style={{ textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "19px", fontWeight: "700", color: "var(--skyText)" }}>{c.goals}</span>
              <span style={{ textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "19px", fontWeight: "700" }}>{c.assists}</span>
              <span data-m="pc-min" style={{ textAlign: "right", fontSize: "13px", fontWeight: "600", color: "var(--dim)" }}>{c.mins}</span>
            </div>

    ))}
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow)", padding: "24px" }} data-m="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>LAST FIVE</span>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>CONTRIBUTIONS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {!player.form && <Missing />}
            {(player.form || []).map((g, gI) => (
              <div key={gI} data-row data-m="l5" style={{ display: "grid", gridTemplateColumns: "52px 30px 84px minmax(0,1fr)", gap: "10px", alignItems: "center", padding: "11px 10px", margin: "0 -10px", borderRadius: "8px" }}>
                <button onClick={g.open} data-tip="Open club page" style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", color: "inherit", textAlign: "left", fontSize: "16px", fontWeight: "700" }} data-hov="link">{g.code}</button>
                <span data-tip={g.venueTip} style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".1em", color: "var(--dim)" }}>{g.venue}</span>
                <span style={{ fontSize: "12.5px", fontWeight: "700", whiteSpace: "nowrap", color: g.fg }}>{g.score}</span>
                <span style={{ textAlign: "right", fontSize: "11.5px", fontWeight: "600", color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.note}</span>
              </div>

    ))}
          </div>
        </div>
      </section>

      <section style={{ gridColumn: "span 12", marginTop: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
          <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>{player.name} · NEWS &amp; MEDIA</span>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>{player.news ? `${player.news.length} ${player.news.length === 1 ? "STORY" : "STORIES"}` : "NO STORIES"}</span>
        </div>
        <div data-m="cards1" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "20px" }}>
          {!player.news && <Missing />}
          {(player.news || []).map((n, nI) => (
            <article key={nI} data-card data-toast="Opened in City+ — added to your watch list" style={{ minWidth: "0", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", cursor: "pointer" }}>
              <div style={{ position: "relative", aspectRatio: "16/9", background: "var(--stripeBg)", backgroundImage: n.image ? `url(${n.image})` : "repeating-linear-gradient(135deg,var(--stripe) 0 2px,transparent 2px 11px)", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "flex-end", padding: "12px" }}>
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

      <section style={{ gridColumn: "span 12", marginTop: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "26px", marginBottom: "18px" }}>
          <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: ".06em" }}>MORE FROM THE SQUAD</span>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "var(--dim)" }}>TAP A PLAYER</span>
        </div>
        <div data-m="cards2" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "20px" }}>
          {!player.related && <Missing />}
          {(player.related || []).map((r, rI) => (
            <div key={rI} data-card onClick={r.open} style={{ minWidth: "0", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow)", cursor: "pointer" }}>
              <div style={{ position: "relative", aspectRatio: "4/3", background: "var(--stripeBg)", backgroundImage: "repeating-linear-gradient(135deg,var(--stripe) 0 2px,transparent 2px 12px)" }}>
                <span style={{ position: "absolute", left: "0", right: "0", bottom: "0", height: "56%", background: "linear-gradient(180deg,rgba(4,10,26,0) 0%,rgba(4,10,26,.24) 36%,rgba(4,10,26,.7) 72%,rgba(4,10,26,.95) 100%)" }}></span>
                <span style={{ position: "absolute", left: "0", right: "0", bottom: "6px", textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "42px", fontWeight: "700", lineHeight: ".82", color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,.6)" }}>{r.num}</span>
              </div>
              <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                <span style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--dim)" }}>{r.nation} · {r.goals}</span>
              </div>
            </div>

    ))}
        </div>
      </section>
    </main>

  );
}
