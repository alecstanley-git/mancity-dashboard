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

// Availability chips. Keys match the raw squad data's `st` field.
export const statusChip = (dark) => ({
  fit: { label: 'AVAILABLE', fg: '#2FA46A', bg: dark ? 'rgba(47,164,106,.16)' : '#E4F5EC' },
  doubt: { label: 'DOUBTFUL', fg: dark ? '#FFC659' : '#9A7414', bg: dark ? 'rgba(255,198,89,.16)' : '#FBF1DA' },
  out: { label: 'INJURED', fg: '#EC3325', bg: dark ? 'rgba(236,51,37,.16)' : '#FCE8E6' },
});
