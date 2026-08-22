import { formDots, toneFor, statusChip } from './format.js';
import { CLUB_ALIAS, badgeFor } from './clubs.js';

/**
 * Every function here returns real fetched data or `null`. Nothing is derived,
 * estimated, or filled in from a plausible-looking formula: a null tells the
 * component to render the "Failed to fetch" state instead.
 */

// ---------------------------------------------------------------------------
// League table
// ---------------------------------------------------------------------------

export function plFull(dark, nav, rawRows) {
  if (!rawRows || !rawRows.length) return null;
  return rawRows.map((r, i) => {
    const pos = i + 1;
    const zone =
      pos <= 4 ? '#6CABDD' : pos <= 6 ? (dark ? '#FFC659' : '#D4A12A') : pos >= 18 ? '#EC3325' : 'transparent';
    const city = r[0] === 'Manchester City';
    const zoneTip =
      pos <= 4 ? 'Champions League places' : pos <= 6 ? 'Europa League places' : pos >= 18 ? 'Relegation zone' : '';
    const gd = parseInt(r[2], 10) || 0;
    return {
      pos,
      club: r[0],
      played: r[1],
      gd: r[2],
      pts: r[3],
      zone,
      city,
      zoneTip,
      w: r[5],
      d: r[6],
      l: r[7],
      gf: r[8],
      ga: r[8] - gd,
      open: () => nav.openClub(r[0]),
      rowBg: city ? (dark ? 'rgba(108,171,221,.12)' : '#EAF3FB') : 'transparent',
      weight: city ? 800 : 600,
      rankFg: city ? '#6CABDD' : dark ? '#8AA2C6' : '#5D6E90',
      form: formDots(r[4], dark ? 'dark' : 'light'),
    };
  });
}

// ---------------------------------------------------------------------------
// Squad
// ---------------------------------------------------------------------------

export function squadData(dark, groups) {
  if (!groups || !groups.length) return null;
  const S = statusChip(dark);
  return groups.map((g) => ({
    group: g.group,
    players: g.players.map((p) => {
      // Availability needs an injury feed. Without one the chip has nothing
      // truthful to say, so it reports that rather than assuming "available".
      const chip = p.st && S[p.st] ? S[p.st] : null;
      return {
        ...p,
        status: chip ? chip.label : null,
        statusFg: chip ? chip.fg : 'var(--dim)',
        statusBg: chip ? chip.bg : 'transparent',
      };
    }),
  }));
}

export function relatedPlayers(name, dark, nav, groups) {
  const squad = squadData(dark, groups);
  if (!squad) return null;
  const flat = squad.flatMap((g) => g.players);
  const others = flat
    .filter((p) => p.name !== name)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 4);
  if (!others.length) return null;
  return others.map((p) => ({
    num: p.num,
    name: p.name,
    nation: p.nation,
    goals: p.goals + (p.goals === 1 ? ' goal' : ' goals'),
    open: () => nav.openPlayer(p.name),
  }));
}

// ---------------------------------------------------------------------------
// Fixtures & results, grouped by month
// ---------------------------------------------------------------------------

export function seasonData(dark, timeline, nav) {
  if (!timeline || !timeline.rows.length) return null;
  const tone = toneFor(dark);
  const months = [];
  timeline.rows.forEach((r) => {
    let g = months.find((m) => m.month === r.monthLabel);
    if (!g) months.push((g = { month: r.monthLabel, matches: [], played: 0, toPlay: 0 }));
    g.played += r.isResult ? 1 : 0;
    g.toPlay += r.isFixture ? 1 : 0;
    g.matches.push({
      date: r.dayLabel,
      code: r.code,
      badge: r.badge,
      opponent: r.opp,
      comp: r.comp,
      ground: r.ground,
      venue: r.v,
      bg: r.bg,
      fg: r.fg,
      isResult: r.isResult,
      isFixture: r.isFixture,
      score: r.score || '',
      time: r.time,
      toneFg: r.tone ? tone[r.tone] : 'var(--ink)',
      venueTip: r.v === 'H' ? 'Home fixture' : r.v === 'A' ? 'Away fixture' : 'Neutral venue',
      open: () => nav.openClub(r.opp),
    });
  });
  return months.map((m) => ({
    ...m,
    note: [m.played ? m.played + ' played' : '', m.toPlay ? m.toPlay + ' to play' : ''].filter(Boolean).join(' · '),
  }));
}

// ---------------------------------------------------------------------------
// Club profile
// ---------------------------------------------------------------------------

/**
 * Built from the club's standings row plus, when the club page has been opened
 * and its detail fetched, the `/api/club` payload. Anything neither supplies
 * comes back null.
 */
export function clubRecord(rawName, dark, ctx) {
  const { nav, table, detail, cityRecent } = ctx;
  const name = table?.find((r) => r.club === rawName) ? rawName : CLUB_ALIAS[rawName] || rawName;
  const row = table?.find((r) => r.club === name) || null;
  const isCity = name === 'Manchester City';
  const badge = badgeFor(name);
  const tone = toneFor(dark);

  const played = row?.played ?? 0;

  // City's own recent results come from the fixture timeline, which is the same
  // source the Overview renders, so the two can never disagree.
  const recent = isCity && cityRecent?.length
    ? cityRecent.map((g) => ({
        code: g.code,
        club: g.opponent,
        venue: g.venue,
        score: `${g.tone} ${g.score}`,
        fg: tone[g.tone],
        venueTip: g.venue === 'H' ? 'Home fixture' : 'Away fixture',
        open: () => nav.openClub(g.opponent),
      }))
    : detail?.recent?.length
      ? detail.recent.map((g) => ({
          code: g.code,
          club: g.opponent,
          venue: g.venue,
          score: `${g.tone} ${g.score}`,
          fg: tone[g.tone],
          venueTip: g.venue === 'H' ? 'Home fixture' : 'Away fixture',
          open: () => nav.openClub(g.opponent),
        }))
      : null;

  return {
    name,
    code: detail?.code || row?.code || null,
    badge: detail?.crest || row?.badge || null,
    bg: badge[0],
    fg: badge[1],
    isCity,
    // Identity fields come only from a club-detail fetch.
    nick: detail?.clubColors || null,
    stadium: detail?.venue || null,
    capacity: null,
    manager: detail?.coach || null,
    founded: detail?.founded || null,
    website: detail?.website || null,
    headline: row
      ? [
          { label: 'LEAGUE POSITION', value: row.pos, sub: 'Premier League' },
          { label: 'POINTS', value: row.pts, sub: played ? (row.pts / played).toFixed(2) + ' per game' : 'no matches played' },
          { label: 'GOAL DIFFERENCE', value: row.gd, sub: `${row.gf} scored · ${row.ga} conceded` },
          { label: 'RECORD', value: `${row.w}-${row.d}-${row.l}`, sub: `${played} matches played` },
        ]
      : null,
    splits: row
      ? [
          { label: 'Won', value: row.w, bar: Math.round((row.w / Math.max(1, played)) * 100) + '%', color: '#2FA46A' },
          { label: 'Drawn', value: row.d, bar: Math.round((row.d / Math.max(1, played)) * 100) + '%', color: dark ? '#2C3C6B' : '#C9D5E6' },
          { label: 'Lost', value: row.l, bar: Math.round((row.l / Math.max(1, played)) * 100) + '%', color: '#EC3325' },
        ]
      : null,
    form: row && row.form.length ? row.form : null,
    recent,
    // Not available from this provider.
    squadFacts: null,
    h2h: null,
    absences: null,
    top: isCity ? ctx.top || null : null,
    cityInjuries: isCity,
  };
}

// ---------------------------------------------------------------------------
// Player profile
// ---------------------------------------------------------------------------

const ROLE_LABEL = {
  GOALKEEPERS: 'Goalkeeper',
  DEFENDERS: 'Defender',
  MIDFIELDERS: 'Midfielder',
  FORWARDS: 'Forward',
};

export function playerRecord(name, dark, ctx) {
  const { nav, squadGroups, news } = ctx;
  const groups = squadData(dark, squadGroups);
  if (!groups) return null;

  let rec = null;
  let role = '';
  groups.forEach((g) =>
    g.players.forEach((p) => {
      if (p.name === name) {
        rec = p;
        role = g.group;
      }
    })
  );
  if (!rec) return null;

  // News mentioning this player, matched on surname against the live feed.
  // Real coverage or nothing -- never an invented headline.
  const surname = String(rec.name).split(' ').slice(-1)[0];
  const playerNews =
    news && surname.length > 2
      ? news.filter((n) => new RegExp(`\\b${surname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(n.title))
      : null;

  return {
    num: rec.num,
    name: rec.name,
    nation: rec.nation,
    age: rec.age,
    role: ROLE_LABEL[role] || null,
    status: rec.status,
    statusFg: rec.statusFg,
    statusBg: rec.statusBg,
    headline: [
      { label: 'APPEARANCES', value: rec.apps, sub: 'Premier League' },
      { label: 'GOALS', value: rec.goals, sub: rec.goals ? 'this season' : 'no goals this season' },
      { label: 'ASSISTS', value: rec.assists, sub: rec.assists ? 'this season' : 'no assists this season' },
      { label: 'MINUTES', value: null, sub: null },
    ],
    // Per-90 metrics, per-competition splits, contract, height and preferred
    // foot all need a provider tier this project does not have.
    metrics: null,
    comps: null,
    form: null,
    contract: null,
    foot: null,
    height: null,
    joined: null,
    news: playerNews && playerNews.length ? playerNews : null,
    related: relatedPlayers(name, dark, nav, squadGroups),
  };
}
