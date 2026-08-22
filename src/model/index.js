import { decorate } from './timeline.js';
import { plFull, squadData, seasonData, clubRecord, playerRecord } from './records.js';
import { formDots, pad, toneFor } from './format.js';

/**
 * The whole view model, in one object.
 *
 * Every field is either data that was actually fetched, or `null`. There is no
 * sample data and no derived stand-in: a null means the component renders its
 * "Failed to fetch" state. Components render; they compute nothing.
 */
export function buildModel({ theme, supporterName, now, state, nav, feed }) {
  const dark = theme === 'dark';
  const page = state.page;
  const f = feed || {};

  const timeline = buildTimeline(f.timeline);
  const nextUp = timeline?.fixtures[0] || null;
  const table = plFull(dark, nav, f.table);
  const squadGroups = f.squad || null;
  const compsAll = f.comps || null;

  const key = state.comp;
  const active = (compsAll && (compsAll[key] || compsAll[Object.keys(compsAll)[0]])) || null;

  // Countdown to the next kickoff.
  const diff = nextUp ? Math.max(0, nextUp.ts - now) : 0;
  const cd = {
    hasData: !!nextUp,
    d: nextUp ? pad(Math.floor(diff / 86400000)) : null,
    h: nextUp ? pad(Math.floor(diff / 3600000) % 24) : null,
    m: nextUp ? pad(Math.floor(diff / 60000) % 60) : null,
    s: nextUp ? pad(Math.floor(diff / 1000) % 60) : null,
  };

  const rowCityBg = dark ? 'rgba(108,171,221,.12)' : '#EAF3FB';
  const resFg = toneFor(dark);
  const openC = (n) => () => nav.openClub(n);

  const comp = {
        hasData: !!active,
        updated: active ? active.updated : null,
        shortLabel: active ? active.short : null,
        recent: active && active.recent && active.recent.length
          ? active.recent.map((g) => ({
              date: g.date, venue: g.venue, opponent: g.opponent, score: g.score, fg: resFg[g.tone],
              open: () => nav.openClub(g.opponent),
            }))
          : null,
        isTable: !!(active && active.isTable),
        isPath: !!(active && active.isPath),
        rows: !active || !active.rows || !active.rows.length ? null : active.rows.map((r) => ({
          pos: r.pos, club: r.club, played: r.played, gd: r.gd, pts: r.pts, badge: r.badge,
          rowBg: r.city ? rowCityBg : 'transparent',
          mark: r.city ? '#6CABDD' : 'transparent',
          zoneTip: r.city ? 'Your club' : '',
          rankFg: r.city ? '#6CABDD' : dark ? '#8AA2C6' : '#5D6E90',
          nameFg: 'inherit',
          weight: r.city ? 800 : 600,
          open: () => nav.openClub(r.club),
          form: formDots(r.form, theme),
        })),
        path: !active || !active.path || !active.path.length ? null : active.path.map((p) => {
          const tones = {
            win: { bg: dark ? 'rgba(47,164,106,.18)' : '#E4F5EC', fg: '#2FA46A' },
            pending: { bg: dark ? 'rgba(138,162,198,.14)' : '#EDF1F7', fg: dark ? '#8AA2C6' : '#5D6E90' },
            next: { bg: dark ? 'rgba(255,198,89,.16)' : '#FBF1DA', fg: dark ? '#FFC659' : '#9A7414' },
          }[p.tone] || { bg: 'transparent', fg: 'var(--dim)' };
          return { round: p.round, opponent: p.opponent, venue: p.venue, result: p.result, bg: tones.bg, fg: tones.fg, open: () => nav.openClub(p.opponent) };
        }),
  };

  const tabs = compsAll
    ? Object.keys(compsAll).map((k) => ({
        label: compsAll[k].label,
        bg: k === key ? '#6CABDD' : 'transparent',
        fg: k === key ? '#0E1A38' : dark ? '#8AA2C6' : '#5D6E90',
        bd: k === key ? '#6CABDD' : 'var(--line)',
        select: () => nav.setComp(k),
      }))
    : null;

  const fixtures = timeline
    ? timeline.fixtures.slice(0, 4).map((r) => ({
        code: r.code, opponent: r.opp, comp: r.short, venue: r.ground || (r.v === 'H' ? 'Etihad Stadium' : 'Away'),
        time: r.time, date: r.listLabel, bg: r.bg, fg: r.fg, badge: r.badge, open: openC(r.opp),
      }))
    : null;

  const squad = squadData(dark, squadGroups);
  const liveRaw = f.live || null;
  const news = f.news || null;

  const cityRecent = timeline
    ? timeline.results.slice(-5).reverse().map((r) => ({
        code: r.code, opponent: r.opp, venue: r.v, score: String(r.score).replace(' – ', '–'), tone: r.tone,
      }))
    : null;

  const ctx = { nav, table, squadGroups, news, cityRecent, detail: f.clubDetail || null, top: f.scorers ? f.scorers.map((p) => ({ num: p.num, name: p.name, nation: null, goals: p.goals + ' goals', open: () => nav.openPlayer(p.name) })) : null };

  const results = timeline ? timeline.results : [];
  const seasonMeta = timeline
    ? `${results.length} played · ${results.filter((r) => r.tone === 'W').length}W ${results.filter((r) => r.tone === 'D').length}D ${results.filter((r) => r.tone === 'L').length}L`
    : null;

  const squadMeta = squad
    ? (() => {
        const all = squad.flatMap((g) => g.players);
        const ages = all.map((p) => p.age).filter((a) => typeof a === 'number');
        const avg = ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : null;
        return `${all.length} players${avg ? ` · avg age ${avg}` : ''}`;
      })()
    : null;

  return {
    theme,
    provider: f.provider || null,
    seasonLabel: f.season ? `${f.season}/${String(f.season + 1).slice(-2)}` : null,
    updated: f.updated || null,
    isLive: !!liveRaw,
    isUpcoming: !liveRaw,
    greeting: 'GOOD EVENING, ' + String(supporterName || 'Alec').toUpperCase(),
    dateLabel: new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Australia/Sydney' })
      .format(new Date())
      .toUpperCase(),
    ui: {
      lightBg: dark ? 'transparent' : '#6CABDD',
      lightFg: dark ? '#8AA2C6' : '#0E1A38',
      darkBg: dark ? '#6CABDD' : 'transparent',
      darkFg: dark ? '#0E1A38' : '#5D6E90',
    },
    setLight: () => nav.setTheme('light'),
    setDark: () => nav.setTheme('dark'),
    cd,
    next: {
          hasData: !!nextUp,
          comp: nextUp ? nextUp.comp : null,
          round: nextUp ? nextUp.round || 'NEXT FIXTURE' : null,
          opponent: nextUp ? nextUp.opp : null,
          oppCode: nextUp ? nextUp.code : null,
          oppBg: nextUp ? nextUp.bg : 'var(--panel2)',
          oppFg: nextUp ? nextUp.fg : 'var(--dim)',
          oppBadge: nextUp ? nextUp.badge : null,
          venue: nextUp ? nextUp.ground : null,
          // No provider on this tier carries broadcaster listings.
          broadcast: null,
          openOpp: nextUp ? openC(nextUp.opp) : () => {},
          openSelf: openC('Manchester City'),
          kickTime: nextUp ? nextUp.time : null,
          kickDate: nextUp ? nextUp.longLabel : null,
          tickerLine: nextUp
            ? `${nextUp.opp} (${nextUp.v}) · ${nextUp.short} · ${nextUp.longLabel} ${nextUp.time} AEST`
            : null,
    },
    live: liveRaw
      ? {
          score: liveRaw.score,
          oppCode: liveRaw.oppCode,
          minute: liveRaw.minute,
          comp: liveRaw.comp,
          openMci: openC('Manchester City'),
          openOpp: openC(liveRaw.opponent),
          scorers: (liveRaw.scorerNames || []).map((s) => ({
            text: s.text,
            cursor: 'pointer',
            open: s.player ? () => nav.openPlayer(s.player) : openC(s.club),
          })),
        }
      : null,
    comp,
    tabs,
    fixtures,
    news,
    // This provider carries neither, and neither is guessed at.
    transfers: f.transfers || null,
    scorers: f.scorers && f.scorers.length ? f.scorers.map((p) => ({ ...p, open: () => nav.openPlayer(p.name) })) : null,
    injuries: f.injuries || null,
    injuryCount: f.injuries ? f.injuries.length + ' OUT' : null,
    page,
    nav: ['Overview', 'Fixtures', 'Squad', 'Tables'].map((p) => ({
      label: p,
      weight: p === page ? 700 : 600,
      fg: p === page ? 'var(--ink)' : 'var(--dim)',
      bd: p === page ? '#6CABDD' : 'transparent',
      select: () => nav.go({ page: p }),
    })),
    isOverview: page === 'Overview',
    isFixtures: page === 'Fixtures',
    isSquad: page === 'Squad',
    isTables: page === 'Tables',
    isPlayer: page === 'Player',
    isClub: page === 'Club',
    club: clubRecord(state.club, dark, ctx),
    openCity: openC('Manchester City'),
    player: playerRecord(state.player, dark, ctx) || EMPTY_PLAYER,
    backLabel: 'Back to ' + (state.fromPage || 'Squad'),
    goBack: () => nav.goBack(),
    seasonMeta,
    compFilters: null,
    months: seasonData(dark, timeline, nav),
    squad: squad
      ? squad.map((g) => ({
          group: g.group,
          players: g.players.map((p) => ({ ...p, open: () => nav.openPlayer(p.name) })),
        }))
      : null,
    squadMeta,
    plTable: table,
    otherComps: compsAll && Object.keys(compsAll).some((k) => k !== 'PL')
      ? Object.keys(compsAll)
          .filter((k) => k !== 'PL')
          .map((k) => {
            const c = compsAll[k];
            const cityRow = (c.rows || []).find((r) => r.city);
            return {
              label: c.label.toUpperCase(),
              status: cityRow ? `${ordinal(cityRow.pos)} · ${cityRow.played} played` : c.updated,
              detail: cityRow ? `${cityRow.pts} pts · ${cityRow.gd} GD` : null,
              tone: k === 'UCL' ? '#6CABDD' : dark ? '#FFC659' : '#D4A12A',
            };
          })
      : null,
    zones: [
      { label: 'Champions League', color: '#6CABDD' },
      { label: 'Europa League', color: dark ? '#FFC659' : '#D4A12A' },
      { label: 'Relegation', color: '#EC3325' },
    ],
  };
}

/** Decorate the Worker's timeline rows with the labels the surfaces need. */
function buildTimeline(rows) {
  if (!rows || !rows.length) return null;
  const decorated = rows.map((r) => {
    const row = decorate(r);
    return row;
  });
  const sorted = decorated.sort((a, b) => a.ts - b.ts);
  return {
    rows: sorted,
    results: sorted.filter((r) => r.isResult),
    fixtures: sorted.filter((r) => r.isFixture),
  };
}

// Shape the Player page reads when the squad feed is unavailable: present, so
// nothing crashes, and entirely null, so every field reports the failure.
const EMPTY_PLAYER = {
  num: null, name: null, nation: null, age: null, role: null,
  status: null, statusFg: 'var(--dim)', statusBg: 'transparent',
  headline: null, metrics: null, comps: null, form: null,
  contract: null, foot: null, height: null, joined: null,
  news: null, related: null,
};

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
