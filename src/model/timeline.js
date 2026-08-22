import { CODE_BADGE } from './clubs.js';
import { M3, fmtAEST, datePartsAEST } from './format.js';

const mon3 = (ts) => M3[+datePartsAEST(ts).month - 1];

/**
 * Attach every label the fixtures and overview surfaces need to a raw timeline
 * row from the Worker. Kickoffs are shown in AEST throughout.
 */
export function decorate(row) {
  const ts = row.ts;
  const badge = CODE_BADGE[row.code] || ['#6CABDD', '#1C2C5B'];
  return {
    ...row,
    isResult: !!row.score,
    isFixture: !row.score,
    bg: row.bg || badge[0],
    fg: row.fg || badge[1],
    dayLabel: fmtAEST(ts, { weekday: 'short', day: '2-digit' }).toUpperCase().replace(',', ''),
    shortLabel: fmtAEST(ts, { day: 'numeric' }) + ' ' + mon3(ts),
    longLabel: fmtAEST(ts, { weekday: 'long', day: 'numeric', month: 'long' }),
    listLabel:
      fmtAEST(ts, { weekday: 'short', day: '2-digit' }).toUpperCase().replace(',', '') + ' ' + mon3(ts),
    monthLabel: fmtAEST(ts, { month: 'long', year: 'numeric' }).toUpperCase(),
    time: row.time || fmtAEST(ts, { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}
