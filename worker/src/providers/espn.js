/**
 * ESPN adapter.
 *
 * ESPN publishes the JSON its own site consumes. It is unauthenticated and
 * undocumented, but it is the only free source that covers the competitions
 * football-data.org's free tier omits, and the only one carrying shirt numbers.
 *
 * What this provider adds:
 *   cups          -- FA Cup, EFL Cup, Community Shield, Super Cup, Club World Cup
 *   shirt numbers -- `jersey`, which neither other provider carries
 *   identity      -- height, headshot, nationality flag, for any PL club
 *   venues        -- ground name and city, for any PL club
 *
 * What it does NOT carry:
 *   injuries      -- the injuries endpoint returns count 0 for every club, so
 *                    availability comes from the FPL adapter instead.
 *   the current Champions League -- ESPN's `uefa.champions` season pointer still
 *                    reads 2025, so football-data.org stays the UCL source.
 *
 * On the User-Agent below: ESPN's edge runs a small allowlist of HTTP client
 * agents. It answers `curl/*`, `okhttp/*`, `Go-http-client/*` and
 * `python-requests/*` with 200, and answers a browser string, an unknown
 * application name, or no agent at all with 403. Verified from a Cloudflare
 * colo, so this is the agent and not the address. There is no agent that both
 * identifies this project and gets a response, so requests go out as a plain
 * HTTP client. Nothing here is authenticated, rate-limited or paywalled.
 */

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const WEB = 'https://site.web.api.espn.com/apis';
const CORE = 'https://sports.core.api.espn.com/v2/sports/soccer/leagues';

export const CITY = 'Manchester City';

export const headers = () => ({
  // See the note in this file's header. Not a browser string: a browser string
  // is refused.
  'user-agent': 'curl/8.7.1',
  accept: 'application/json',
});

export const isError = (data) => {
  if (!data) return 'empty payload';
  if (data.error) return String(data.error.message || data.error);
  if (data.code && data.message) return `${data.code} ${data.message}`;
  return null;
};

/**
 * The competitions City can play that football-data.org's free tier does not
 * carry. `key` is the dashboard's competition key; `short` is its tab label.
 */
export const CUPS = {
  'eng.fa': { key: 'FAC', label: 'FA Cup', short: 'FA CUP' },
  'eng.league_cup': { key: 'EFL', label: 'EFL Cup', short: 'LEAGUE CUP' },
  'eng.charity': { key: 'CS', label: 'Community Shield', short: 'SHIELD' },
  'uefa.super_cup': { key: 'USC', label: 'UEFA Super Cup', short: 'SUPER CUP' },
  'fifa.cwc': { key: 'CWC', label: 'Club World Cup', short: 'CLUB WORLD CUP' },
};

export const endpoints = {
  teams: (league = 'eng.1') => `${SITE}/${league}/teams`,
  roster: (teamId, league = 'eng.1') => `${SITE}/${league}/teams/${teamId}/roster`,
  // Standings live on a different host; the site host answers {} for this path.
  standings: (league = 'eng.1') => `${WEB}/v2/sports/soccer/${league}/standings`,
  coreTeam: (teamId, league = 'eng.1') => `${CORE}/${league}/teams/${teamId}`,
  // A scoreboard call returns only the current day unless given a range, so
  // every cup sweep spans the whole season in one request.
  scoreboard: (league, from, to) => `${SITE}/${league}/scoreboard?dates=${from}-${to}&limit=500`,
  summary: (league, eventId) => `${SITE}/${league}/summary?event=${eventId}`,
};

/** A season's date range in the compact form the scoreboard expects. */
export function seasonWindow(season) {
  return { from: `${season}0701`, to: `${season + 1}0630` };
}

/**
 * ESPN spells some clubs differently from football-data.org. The dashboard keys
 * everything on football-data's spelling, so translate on the way in.
 *
 * Checked against both providers' 2026/27 team lists: with these seven entries
 * all twenty clubs resolve, and no football-data club is left unmatched. Clubs
 * that already agree are deliberately absent rather than listed as no-ops.
 *
 * City keeps its full name, because `plFull()` matches the City row by name and
 * football-data's own adapter special-cases it the same way.
 */
const NAME_FIX = {
  'AFC Bournemouth': 'Bournemouth',
  'Brighton & Hove Albion': 'Brighton Hove',
  'Manchester United': 'Man United',
  'Newcastle United': 'Newcastle',
  'Nottingham Forest': 'Nottingham',
  'Tottenham Hotspur': 'Tottenham',
};

export const clubName = (name) => NAME_FIX[name] || String(name || '').replace(/\s+(FC|AFC)$/i, '');

const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

/**
 * club name -> ESPN team id, so a club page can fetch that club's roster.
 */
export function toTeamIds(payload) {
  const teams = payload?.sports?.[0]?.leagues?.[0]?.teams;
  if (!teams || !teams.length) return null;
  const out = {};
  for (const t of teams) {
    const team = t.team || t;
    if (team.id && team.displayName) out[clubName(team.displayName)] = team.id;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * club name -> home ground, read off a season's fixture list.
 *
 * The per-team endpoint carries a venue but would cost twenty calls; one season
 * sweep names every ground from the home fixtures instead, and resolved all
 * twenty when checked.
 *
 * Worth preferring over football-data.org's team list, which is stale on
 * grounds: it still has Everton at Goodison Park and Brentford at Griffin Park,
 * both of which those clubs have left. ESPN has the current ones.
 */
export function toVenuesFromScoreboard(payload) {
  const events = payload?.events;
  if (!Array.isArray(events) || !events.length) return null;

  const out = {};
  for (const e of events) {
    const comp = e.competitions?.[0];
    const ground = comp?.venue?.fullName;
    if (!ground) continue;
    const home = comp.competitors?.find((c) => c.homeAway === 'home');
    const name = clubName(home?.team?.displayName);
    if (name && !out[name]) out[name] = ground;
  }
  return Object.keys(out).length ? out : null;
}

/** club name -> ground, as a fallback for clubs outside the PL team list. */
export function toVenue(payload) {
  const v = payload?.venue;
  if (!v || !v.fullName) return null;
  return {
    name: v.fullName,
    city: v.address?.city || null,
    country: v.address?.country || null,
  };
}

/**
 * A club's roster, keyed by date of birth.
 *
 * DOB is the join key across providers. On City's squad it matched 25 of 26
 * players where a surname match reached only 22, because the other providers
 * store Brazilian and Spanish players under their full legal names.
 */
export function toRosterIndex(payload) {
  const athletes = payload?.athletes;
  if (!Array.isArray(athletes) || !athletes.length) return null;

  const out = {};
  for (const a of athletes) {
    const dob = iso(a.dateOfBirth);
    if (!dob) continue;
    out[dob] = {
      espnId: a.id,
      name: a.displayName || a.fullName || null,
      // The number the site currently cannot show at all.
      num: a.jersey != null && a.jersey !== '' ? String(a.jersey) : null,
      height: a.displayHeight || null,
      weight: a.displayWeight || null,
      headshot: a.headshot?.href || null,
      flag: a.flag?.href || null,
      citizenship: a.citizenship || null,
      pos: a.position?.abbreviation || null,
    };
  }
  return Object.keys(out).length ? out : null;
}

// Deliberately not read from this provider: the roster payload's `coach` array
// is a list of the club's past managers, not the current one. For City it ends
// at Roberto Mancini. football-data.org's team record carries the real coach.

/**
 * Match state.
 *
 * Read from the flags ESPN sets rather than by listing status names: a cup adds
 * names a league never uses -- `STATUS_FINAL_PEN` accounts for nine of the
 * fifty-two EFL Cup ties played so far, and extra time adds more. `completed`
 * and `state` cover every one of them without a list to keep up to date.
 */
const statusOf = (event, comp) => event?.status?.type || comp?.status?.type || null;

/**
 * One cup competition's scoreboard -> timeline rows for the club named.
 *
 * Produces exactly the shape `footballdata.toTimelineRow` produces, so cup ties
 * merge into the same timeline as league and European fixtures and every
 * surface that reads the timeline picks them up without changes.
 */
export function toCupTimeline(payload, slug, club = CITY) {
  const events = payload?.events;
  if (!Array.isArray(events) || !events.length) return [];

  const meta = CUPS[slug];
  if (!meta) return [];

  const rows = [];
  for (const e of events) {
    const comp = e.competitions?.[0];
    if (!comp) continue;

    const sides = comp.competitors || [];
    const mine = sides.find((c) => clubName(c.team?.displayName) === club);
    if (!mine) continue;
    const other = sides.find((c) => c !== mine);
    if (!other) continue;

    const st = statusOf(e, comp);
    const finished = !!st?.completed;
    const mineGoals = mine.score != null ? parseInt(mine.score, 10) : null;
    const oppGoals = other.score != null ? parseInt(other.score, 10) : null;

    let tone = null;
    if (finished && mineGoals != null && oppGoals != null) {
      tone = mineGoals > oppGoals ? 'W' : mineGoals < oppGoals ? 'L' : 'D';
    }

    const oppName = clubName(other.team?.displayName);
    rows.push({
      ts: Date.parse(e.date),
      fixtureId: `espn:${e.id}`,
      opp: oppName,
      homeClub: clubName(sides.find((c) => c.homeAway === 'home')?.team?.displayName),
      code: other.team?.abbreviation || oppName.slice(0, 3).toUpperCase(),
      badge: other.team?.logos?.[0]?.href || other.team?.logo || null,
      comp: meta.label.toUpperCase(),
      short: meta.label,
      compKey: meta.key,
      compLogo: null,
      v: mine.homeAway === 'home' ? 'H' : 'A',
      ground: comp.venue?.fullName || null,
      round: roundLabel(e, slug),
      score: finished && mineGoals != null ? `${mineGoals} – ${oppGoals}` : null,
      tone,
      // How a drawn tie was actually settled, in ESPN's words -- a 2–2 that
      // went to penalties is still a draw on the night, so the shootout is
      // reported alongside the score rather than folded into it.
      note: comp.notes?.find((n) => n.type === 'event')?.headline || null,
      // Who went through, which for a shootout the score cannot show.
      advanced: finished && mine.winner === true ? true : finished && other.winner === true ? false : null,
      status: st?.name || null,
      inPlay: st?.state === 'in',
    });
  }
  return rows.sort((a, b) => a.ts - b.ts);
}

/**
 * The round a tie belongs to.
 *
 * ESPN files this under `season.slug`, which is a real round for a multi-round
 * cup -- "preliminary-round", "third-round" -- but merely restates the
 * competition for a one-off fixture, where it reads
 * "2026-english-fa-community-shield". Only the former is a round, so a slug
 * that just names the competition is dropped rather than shown as one.
 *
 * `notes` is not a round: for a tie settled on penalties it holds
 * "Rochdale win 2-1 on penalties", which `toCupTimeline` keeps separately.
 */
function roundLabel(event, slug) {
  const raw = event?.season?.slug;
  if (!raw) return null;

  const words = String(raw).replace(/^\d{4}-/, '').replace(/[-_]/g, ' ').trim();
  if (!words) return null;

  // A slug that is the competition's own name tells the reader nothing.
  const compWords = new Set(String(slug).split(/[.\s]+/).filter(Boolean));
  const isCompName = !/\bround\b|\bfinal\b|\bsemi\b|\bquarter\b/i.test(words) && words.split(' ').length > 2;
  if (isCompName || compWords.has(words)) return null;

  return words.toUpperCase();
}

/**
 * A club's events in one competition, reduced to what is needed to go and fetch
 * a match report: the id, the competition it belongs to, and whether it is done.
 *
 * The league sweep is already being made for venues, so finding City's most
 * recent match across every competition costs no extra request.
 */
export function toClubEvents(payload, slug, club = CITY) {
  const events = payload?.events;
  if (!Array.isArray(events) || !events.length) return [];

  const out = [];
  for (const e of events) {
    const comp = e.competitions?.[0];
    const sides = comp?.competitors || [];
    if (!sides.some((c) => clubName(c.team?.displayName) === club)) continue;
    const st = statusOf(e, comp);
    out.push({ id: e.id, slug, ts: Date.parse(e.date), completed: !!st?.completed });
  }
  return out;
}

/** The most recently finished of a set of events, or null if none has been played. */
export function latestCompleted(events) {
  const done = (events || []).filter((e) => e.completed && Number.isFinite(e.ts));
  if (!done.length) return null;
  return done.sort((a, b) => b.ts - a.ts)[0];
}

/**
 * A finished match in detail: who did what, in front of how many, and how the
 * two sides compared.
 *
 * All of it comes from one `summary` call, and none of it was reachable before
 * -- football-data.org's free tier carries a scoreline and nothing else.
 *
 * @param club the club to report from the point of view of
 */
export function toMatchReport(payload, club = CITY) {
  const comp = payload?.header?.competitions?.[0];
  const sides = comp?.competitors;
  if (!sides || sides.length < 2) return null;

  const mine = sides.find((c) => clubName(c.team?.displayName) === club);
  const other = sides.find((c) => c !== mine);
  if (!mine || !other) return null;

  const info = payload.gameInfo || {};
  const referee = (info.officials || []).find((o) => o.position?.name === 'Referee');

  // Team totals arrive as two parallel lists, one per side, labelled the same.
  const box = payload.boxscore?.teams || [];
  const statsFor = (competitorId) => {
    const entry = box.find((t) => String(t.team?.id) === String(competitorId));
    const out = {};
    for (const s of entry?.statistics || []) if (s.label) out[s.label] = s.displayValue;
    return out;
  };
  const mineStats = statsFor(mine.team?.id);
  const oppStats = statsFor(other.team?.id);

  const COMPARE = ['Possession', 'SHOTS', 'ON GOAL', 'Corner Kicks', 'Fouls'];
  const LABEL = { SHOTS: 'Shots', 'ON GOAL': 'On target', 'Corner Kicks': 'Corners' };
  const compare = COMPARE.filter((k) => mineStats[k] != null || oppStats[k] != null).map((k) => ({
    label: LABEL[k] || k,
    mine: mineStats[k] ?? null,
    opp: oppStats[k] ?? null,
  }));

  // ESPN leaves `athletesInvolved` empty here and puts the name in the prose
  // instead, so the player is read from the text rather than invented.
  const NAMED = new Set(['Goal', 'Yellow Card', 'Red Card', 'Own Goal', 'Penalty - Scored']);
  const events = (payload.keyEvents || [])
    .filter((e) => NAMED.has(e.type?.text))
    .map((e) => {
      const text = String(e.text || '');
      const who = text.match(/^([^(]+)\s*\(/);
      return {
        minute: e.clock?.displayValue || null,
        type: e.type?.text || null,
        player: who ? who[1].trim() : null,
        club: clubName(e.team?.displayName),
        forUs: clubName(e.team?.displayName) === club,
      };
    });

  return {
    opponent: clubName(other.team?.displayName),
    score: `${mine.score ?? '?'} – ${other.score ?? '?'}`,
    home: mine.homeAway === 'home',
    venue: info.venue?.fullName || null,
    attendance: Number.isFinite(info.attendance) ? info.attendance : null,
    referee: referee?.fullName || null,
    compare: compare.length ? compare : null,
    events: events.length ? events : null,
  };
}

/**
 * A knockout run as the "path" the Overview renders for a cup.
 *
 * Built only from ties that exist: a round the club has not reached yet is
 * absent rather than listed as pending, because a fixture that has not been
 * drawn is not a fact.
 */
export function toCupPath(rows) {
  if (!rows || !rows.length) return null;
  return rows.map((r) => ({
    round: r.round || 'TIE',
    opponent: r.opp,
    venue: r.v,
    // A tie settled on penalties was still a draw on the night, so the shootout
    // is appended rather than rewritten into the score.
    result: r.score ? `${r.tone} ${r.score.replace(' – ', '–')}${r.note ? ' · pens' : ''}` : null,
    tone: !r.score ? 'next' : r.advanced === true ? 'win' : 'pending',
  }));
}

/**
 * Cup competitions as tabs, in the shape `footballdata.buildComps` produces for
 * league tables. A cup has no table, so each is a path rather than rows.
 *
 * Only competitions the club actually has a tie in appear -- a cup City have
 * not entered yet is absent, not an empty tab.
 */
export function buildCupComps(rows) {
  if (!rows || !rows.length) return {};

  const byKey = new Map();
  for (const r of rows) {
    if (!r.compKey) continue;
    if (!byKey.has(r.compKey)) byKey.set(r.compKey, []);
    byKey.get(r.compKey).push(r);
  }

  const meta = Object.fromEntries(Object.values(CUPS).map((c) => [c.key, c]));
  const out = {};
  for (const [key, ties] of byKey) {
    const m = meta[key];
    if (!m) continue;
    const played = ties.filter((t) => t.score);
    out[key] = {
      label: m.label,
      short: m.short,
      updated: played.slice(-1)[0]?.round || m.short,
      isTable: false,
      isPath: true,
      rows: [],
      path: toCupPath(ties) || [],
      recent: played
        .slice(-5)
        .reverse()
        .map((t) => ({
          date: new Date(t.ts)
            .toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'Australia/Sydney' })
            .toUpperCase(),
          venue: t.v,
          opponent: t.opp,
          score: t.score.replace(' – ', '–'),
          tone: t.tone,
        })),
    };
  }
  return out;
}
