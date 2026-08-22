/**
 * Calendar export.
 *
 * Builds an RFC 5545 iCalendar file in the browser and hands it to the user as
 * a download. No server involved, which suits a static site, and the file works
 * with Apple Calendar, Google Calendar, Outlook and anything else that reads
 * .ics.
 *
 * Kickoff times are written in UTC (the `Z` suffix), so the event lands at the
 * right local time wherever the calendar is read — which matters here, because
 * the dashboard is read in Australia and the fixtures are played in England.
 */

const PRODID = '-//City Hub//Manchester City fixtures//EN';

/** A UTC timestamp in the compact form iCalendar wants: 20260823T230000Z */
const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/**
 * Escape a text value. Commas, semicolons and backslashes are delimiters in
 * iCalendar and corrupt the file if passed through raw.
 */
const esc = (s) =>
  String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/**
 * Fold a content line to 75 octets, as the spec requires. Long venue or
 * competition names would otherwise produce a file some clients reject.
 */
function fold(line) {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest) parts.push(' ' + rest);
  return parts.join('\r\n');
}

/** Most matches run to about two hours including the interval. */
const MATCH_MS = 2 * 60 * 60 * 1000;

/**
 * One fixture as a VEVENT.
 *
 * @param row a decorated timeline row: ts, opp, v, short, ground, fixtureId
 */
function event(row, now) {
  const home = row.v === 'H';
  const title = home ? `Man City v ${row.opp}` : `${row.opp} v Man City`;
  const where = row.ground || (home ? 'Etihad Stadium' : null);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${esc(row.fixtureId ?? row.ts)}@mancity.alecstanley.com`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(row.ts)}`,
    `DTEND:${stamp(row.ts + MATCH_MS)}`,
    `SUMMARY:${esc(title)}`,
  ];
  if (where) lines.push(`LOCATION:${esc(where)}`);
  if (row.short) lines.push(`DESCRIPTION:${esc(row.short)}`);
  lines.push(
    // The button promises a reminder half an hour out; this is what delivers it.
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT'
  );
  return lines;
}

/** A complete .ics document for one or more fixtures. */
export function buildIcs(rows, now = Date.now()) {
  const list = (Array.isArray(rows) ? rows : [rows]).filter((r) => r && Number.isFinite(r.ts));
  if (!list.length) return null;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...list.flatMap((r) => event(r, now)),
    'END:VCALENDAR',
  ];
  // iCalendar is a CRLF format; some clients reject bare newlines.
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** A filename that says what the file is once it is sitting in Downloads. */
export function icsFilename(rows) {
  const list = Array.isArray(rows) ? rows : [rows];
  if (list.length === 1 && list[0]) {
    const d = new Date(list[0].ts).toISOString().slice(0, 10);
    const opp = String(list[0].opp || 'fixture').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `man-city-v-${opp}-${d}.ics`;
  }
  return 'man-city-fixtures.ics';
}

/**
 * Hand the file to the browser.
 *
 * Returns false when there was nothing to export, so the caller can stay quiet
 * rather than claim a download that did not happen.
 */
export function downloadIcs(rows) {
  const text = buildIcs(rows);
  if (!text) return false;

  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFilename(rows);
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}
