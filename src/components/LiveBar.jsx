export default function LiveBar(v) {
  const { live, page } = v;
  return (
      <div data-m="page" style={{ background: "var(--red)", color: "#fff", padding: "0 32px" }}>
        <div data-m="live" style={{ maxWidth: "1440px", margin: "0 auto", height: "56px", display: "flex", alignItems: "center", gap: "24px" }}>
          <span data-m="livelab" style={{ display: "flex", alignItems: "center", gap: "9px", width: "74px", flex: "none" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#fff", animation: "cityPulse 1.4s ease-in-out infinite" }}></span>
            <span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".18em", lineHeight: "1" }}>LIVE</span>
          </span>
          <span data-m="livescore" style={{ display: "flex", alignItems: "center", gap: "12px", width: "262px", flex: "none", fontFamily: "'Barlow Condensed',Archivo,sans-serif", lineHeight: "1" }}>
            <button onClick={live.openMci} style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "'Barlow Condensed',Archivo,sans-serif", color: "#fff", textAlign: "right", width: "48px", fontSize: "22px", fontWeight: "600", letterSpacing: ".04em" }}>MCI</button>
            <span style={{ width: "76px", textAlign: "center", fontSize: "28px", fontWeight: "700" }}>{live.score}</span>
            <button onClick={live.openOpp} style={{ background: "none", border: "0", padding: "0", cursor: "pointer", fontFamily: "'Barlow Condensed',Archivo,sans-serif", color: "#fff", textAlign: "left", width: "48px", fontSize: "22px", fontWeight: "600", letterSpacing: ".04em" }}>{live.oppCode}</button>
            <span data-tip="Match clock" style={{ marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", height: "26px", minWidth: "44px", padding: "0 8px", fontFamily: "Archivo,sans-serif", fontSize: "12px", fontWeight: "700", letterSpacing: ".04em", border: "1px solid rgba(255,255,255,.5)", borderRadius: "6px" }}>{live.minute}</span>
          </span>
          <span data-m="hide" style={{ width: "1px", height: "24px", background: "rgba(255,255,255,.34)", flex: "none" }}></span>
          <span data-m="hide" style={{ display: "flex", alignItems: "center", gap: "20px", overflow: "hidden", flex: "1", minWidth: "0" }}>
            {(live.scorers || []).map((s, sI) => (
              <button key={sI} onClick={s.open} style={{ background: "none", border: "0", padding: "0", cursor: s.cursor, fontFamily: "Archivo,sans-serif", color: "#fff", textAlign: "left", display: "flex", alignItems: "center", fontSize: "12.5px", fontWeight: "600", lineHeight: "1", whiteSpace: "nowrap", opacity: ".95" }}>{s.text}</button>

    ))}
          </span>
          <span data-m="hide" data-tip="Live from the Etihad" style={{ display: "flex", alignItems: "center", fontSize: "11px", fontWeight: "700", letterSpacing: ".16em", lineHeight: "1", opacity: ".85", flex: "none" }}>{live.comp}</span>
        </div>
      </div>

  );
}
