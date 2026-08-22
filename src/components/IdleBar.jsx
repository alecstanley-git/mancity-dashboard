import { orMissing } from './Missing.jsx';
export default function IdleBar(v) {
  const { dateLabel, next, page } = v;
  return (
      <div data-m="page" style={{ background: "var(--panel2)", borderBottom: "1px solid var(--line)", padding: "0 32px" }}>
        <div data-m="idle" style={{ maxWidth: "1440px", margin: "0 auto", height: "48px", display: "flex", alignItems: "center", gap: "22px", color: "var(--dim)", fontSize: "12px", fontWeight: "600", letterSpacing: ".03em" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", lineHeight: "1", color: "var(--skyText)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--sky)" }}></span>
            NO MATCH TODAY
          </span>
          <span data-m="hide" style={{ width: "1px", height: "16px", background: "var(--line)" }}></span>
          <span style={{ lineHeight: "1" }}>Next up · {orMissing(next.tickerLine)}</span>
          <span data-m="hide" style={{ marginLeft: "auto", lineHeight: "1", letterSpacing: ".14em", fontSize: "11px", fontWeight: "700" }}>{dateLabel}</span>
        </div>
      </div>

  );
}
