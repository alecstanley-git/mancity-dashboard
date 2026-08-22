export const ZONE = 'Australia/Sydney';

export const pad = (n) => String(n).padStart(2, '0');

// Result tones. D is theme-dependent so the grey holds contrast in both modes.
export const toneFor = (dark) => ({ W: '#2FA46A', D: dark ? '#B9CCE6' : '#42537A', L: '#EC3325' });

export function formDots(str, theme) {
  const bg = { W: '#2FA46A', D: theme === 'dark' ? '#2C3C6B' : '#C9D5E6', L: '#EC3325' };
  const tip = { W: 'Win', D: 'Draw', L: 'Defeat' };
  return String(str || '')
    .split('')
    .filter((ch) => bg[ch])
    .map((ch) => ({
      ch,
      bg: bg[ch],
      tip: tip[ch],
      fg: ch === 'D' ? (theme === 'dark' ? '#B9CCE6' : '#42537A') : '#fff',
    }));
}

export const fmtAEST = (ts, opts) =>
  new Intl.DateTimeFormat('en-AU', { timeZone: ZONE, ...opts }).format(new Date(ts));

export const M3 = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const datePartsAEST = (ts) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(ts))
    .reduce((a, p) => ((a[p.type] = p.value), a), {});

// Availability chips. Keys match the raw squad data's `st` field, which the
// Worker maps from the Premier League's own availability codes.
export const statusChip = (dark) => ({
  fit: { label: 'AVAILABLE', fg: '#2FA46A', bg: dark ? 'rgba(47,164,106,.16)' : '#E4F5EC' },
  doubt: { label: 'DOUBTFUL', fg: dark ? '#FFC659' : '#9A7414', bg: dark ? 'rgba(255,198,89,.16)' : '#FBF1DA' },
  out: { label: 'INJURED', fg: '#EC3325', bg: dark ? 'rgba(236,51,37,.16)' : '#FCE8E6' },
  // A ban is not an injury, and reporting one as the other would be wrong.
  susp: { label: 'SUSPENDED', fg: dark ? '#C58AF0' : '#6B3FA0', bg: dark ? 'rgba(197,138,240,.16)' : '#F1E9FB' },
});

/** "3 days ago" for a feed timestamp, or null when there is no timestamp. */
export function agoLabel(ts, now = Date.now()) {
  if (!ts) return null;
  const mins = Math.round((now - ts) / 60000);
  if (!Number.isFinite(mins) || mins < 0) return null;
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : `${Math.round(days / 30)}mo ago`;
}
