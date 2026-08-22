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
    photo: p.photo || null,
    altPhoto: p.altPhoto || null,
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
  const { nav, table, detail, cityRecent, venues, capacities, squadFacts, injuries, clubs } = ctx;
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

  // The ground the club plays at now. ESPN's map is preferred over the club
  // detail because football-data.org is stale here -- it still has Everton at
  // Goodison Park and Brentford at Griffin Park.
  const stadium = venues?.[name] || detail?.venue || null;
  const capacity = stadium && capacities?.[stadium] ? capacities[stadium].toLocaleString('en-GB') : null;

  return {
    name,
    code: detail?.code || row?.code || null,
    badge: detail?.crest || row?.badge || null,
    bg: badge[0],
    fg: badge[1],
    isCity,
    // Identity fields come only from a club-detail fetch.
    nick: detail?.clubColors || null,
    stadium,
    capacity,
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
    // A club with no form string has played too few league games to have one,
    // which the standings row proves rather than a failed request.
    formEmpty: row && !row.form.length
      ? { label: 'No form yet', note: played ? 'Too few league matches played to show a form guide.' : 'No league matches played yet this season.' }
      : null,
    topEmpty: isCity && ctx.top && !ctx.top.length
      ? { label: 'No goals yet', note: 'Nobody has scored for City in the Premier League this season.' }
      : null,
    recent,
    // City's card is counted off the merged squad, which knows about the
    // players the other providers add; every rival's comes from the league-wide
    // availability feed. Both are real counts, from the best source each has.
    squadFacts: isCity ? squadFacts || null : clubs?.[name]?.facts || null,
    absences: isCity ? absenceRows(injuries) : clubs?.[name]?.absences || null,
    top: isCity ? ctx.top || null : null,
    hasTop: isCity,
    // Every club has an absence list now, not just City.
    hasAbsences: true,
    cityInjuries: isCity,
  };
}

/**
 * The club page's absence list. Same source as the treatment room, shaped for
 * the narrower card: the player, the Premier League's description of the
 * problem, and its return note where the note carries one.
 */
function absenceRows(injuries) {
  if (!injuries) return null;
  if (!injuries.length) return [];
  return injuries.map((i) => ({ role: i.name, issue: i.issue, back: i.back }));
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
    photo: rec.photo || null,
    altPhoto: rec.altPhoto || null,
    headline: [
      { label: 'APPEARANCES', value: rec.apps, sub: 'Premier League' },
      { label: 'GOALS', value: rec.goals, sub: rec.goals ? 'this season' : 'no goals this season' },
      { label: 'ASSISTS', value: rec.assists, sub: rec.assists ? 'this season' : 'no assists this season' },
      {
        label: 'MINUTES',
        value: rec.minutes,
        sub: rec.starts != null ? `${rec.starts} ${rec.starts === 1 ? 'start' : 'starts'}` : null,
      },
    ],
    metrics: metricRows(rec),
    // A panel with nothing in it is not the same as a panel that failed. When
    // the feed reached this player and simply has no minutes behind it yet, say
    // that instead of reporting a fetch that did not fail.
    emptyState:
      rec.minutes === 0
        ? { label: 'No data yet', note: `${rec.name} has not played a Premier League match this season.` }
        : null,
    height: rec.height || null,
    weight: rec.weight || null,
    joined: joinedLabel(rec.joined),
    setPieces: setPieceRows(rec),
    // A goalkeeper taking no set pieces is a fact about the player, not a
    // failed request. Only say "failed" when the feed never reached him.
    setPiecesEmpty:
      rec.fplId && !setPieceRows(rec)
        ? { label: 'No set-piece duty', note: `${rec.name} is not listed for penalties, free kicks or corners.` }
        : null,
    involvement: involvementRows(rec),
    fplId: rec.fplId || null,
    // Filled by /api/player once the page opens; see ctx.form.
    form: formRows(ctx.form, dark, nav),
    news: playerNews && playerNews.length ? playerNews : null,
    // The feed was read; it simply carries nothing about this player. Saying
    // "failed to fetch" under a header already reading "NO STORIES" would have
    // the panel contradict itself.
    newsEmpty: news && (!playerNews || !playerNews.length)
      ? { label: 'No stories', note: `Nothing in today's BBC Sport or Guardian feed mentions ${rec.name}.` }
      : null,
    related: relatedPlayers(name, dark, nav, squadGroups),
  };
}

/**
 * Set-piece duty, as an order within the squad where 1 is first choice.
 *
 * Worth its own card because it is one of the few things about a player that is
 * known before a ball is kicked — unlike every counting stat, it says something
 * real in the first week of a season.
 */
function setPieceRows(rec) {
  const rows = [
    { label: 'Penalties', order: rec.pens },
    { label: 'Direct free kicks', order: rec.freeKicks },
    { label: 'Corners', order: rec.corners },
  ].filter((r) => typeof r.order === 'number' && r.order > 0);

  if (!rows.length) return null;
  return rows.map((r) => ({
    label: r.label,
    value: ordinalShort(r.order),
    note: r.order === 1 ? 'first choice' : `${ordinalShort(r.order)} in the queue`,
  }));
}

/**
 * Involvement and discipline, counted over matches actually played.
 *
 * Gated on minutes for the same reason the per-90 metrics are: before a player
 * has taken the field, "0 tackles" is an absence of measurement dressed up as
 * a measurement.
 */
function involvementRows(rec) {
  if (!rec.minutes) return null;
  const keeper = typeof rec.saves === 'number' && rec.saves > 0;
  const rows = keeper
    ? [
        { label: 'Saves', value: rec.saves },
        { label: 'Clean sheets', value: rec.cleanSheets },
        { label: 'Goals conceded', value: rec.goalsConceded },
      ]
    : [
        { label: 'Tackles', value: rec.tackles },
        { label: 'Clearances, blocks, interceptions', value: rec.cbi },
        { label: 'Recoveries', value: rec.recoveries },
      ];
  rows.push({ label: 'Yellow cards', value: rec.yellows }, { label: 'Red cards', value: rec.reds });

  const kept = rows.filter((r) => typeof r.value === 'number');
  return kept.length ? kept : null;
}

/** One player's last five matches, from /api/player. */
function formRows(form, dark, nav) {
  if (!form || !form.length) return null;
  const tone = toneFor(dark);
  return form.map((g) => {
    const [a, b] = String(g.score).split('–').map((n) => parseInt(n, 10));
    const t = Number.isFinite(a) && Number.isFinite(b) ? (a > b ? 'W' : a < b ? 'L' : 'D') : null;
    const bits = [];
    if (g.goals) bits.push(`${g.goals} ${g.goals === 1 ? 'goal' : 'goals'}`);
    if (g.assists) bits.push(`${g.assists} ${g.assists === 1 ? 'assist' : 'assists'}`);
    bits.push(`${g.minutes} min`);
    return {
      code: g.code || (g.opponent ? g.opponent.slice(0, 3).toUpperCase() : '—'),
      venue: g.home ? 'H' : 'A',
      venueTip: g.home ? 'Home fixture' : 'Away fixture',
      score: g.score,
      note: bits.join(' · '),
      fg: t ? tone[t] : 'var(--ink)',
      open: g.opponent ? () => nav.openClub(g.opponent) : () => {},
    };
  });
}

const ordinalShort = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * The underlying numbers panel.
 *
 * Expected goals and assists, as published by the Premier League. The bar is
 * scaled against a fixed reference of one per 90 rather than against the squad,
 * so the same player reads the same way whoever else is on the page.
 *
 * Returns null until the player has minutes: a per-90 rate with no minutes
 * behind it is not a measurement of zero, it is an absence of measurement.
 */
function metricRows(rec) {
  if (!rec.minutes) return null;

  const rows = [
    { label: 'Expected goals per 90', value: rec.xg90, total: rec.xg, of: 'xG' },
    { label: 'Expected assists per 90', value: rec.xa90, total: rec.xa, of: 'xA' },
  ].filter((r) => typeof r.value === 'number');

  if (!rows.length) return null;

  return rows.map((r) => ({
    label: r.label,
    value: r.value.toFixed(2),
    bar: Math.min(100, Math.round(r.value * 100)) + '%',
    of: typeof r.total === 'number' ? `${r.total.toFixed(2)} ${r.of} across ${rec.minutes} minutes` : null,
  }));
}

/** "Joined Jul 2022" from the Premier League's join date. */
function joinedLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Joined ${d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })}`;
}
