/**
 * Fantasy Premier League adapter.
 *
 * The Premier League's own Fantasy endpoint, unauthenticated and uncapped. It
 * is the only free source that carries player availability, and it carries it
 * for all twenty clubs rather than just City.
 *
 * What this provider adds that football-data.org cannot supply:
 *   injuries      -- `status` plus a plain-English `news` note written by the PL
 *   transfers     -- the same `news` field for players who have left
 *   underlying    -- expected goals / assists and their per-90 variants
 *   stats         -- minutes, starts, cards, saves, clean sheets
 *   identity      -- date of birth, join date, official headshot
 *
 * What it does NOT carry:
 *   shirt numbers -- `squad_number` is null for every player in the payload.
 *                    Those come from the ESPN adapter instead.
 *   any competition other than the Premier League.
 *
 * The bootstrap payload is ~1.5 MB. Parsing it on every request would be
 * wasteful, so `worker/src/derive.js` caches the small shapes built from it and
 * the raw payload is parsed at most once per TTL.
 */

const BASE = 'https://fantasy.premierleague.com/api';

// The PL's short code for City. Team ids are reassigned each season, so the
// club is resolved by code at read time rather than pinned to a number.
export const CITY_CODE = 'MCI';

export const headers = () => ({
  // FPL serves any client; this identifies the caller honestly.
  'user-agent': 'CityHub/1.0 (+https://mancity.alecstanley.com)',
  accept: 'application/json',
});

/**
 * This provider serves two differently shaped payloads: the bootstrap, which
 * has `elements`, and element-summary, which has `history`. Checking for
 * `elements` alone would mark every element-summary response as an upstream
 * failure, so each shape is recognised on its own terms.
 */
export const isError = (data) => {
  if (!data) return 'empty payload';
  if (data.detail) return String(data.detail);
  if (Array.isArray(data.elements) || Array.isArray(data.history)) return null;
  return 'unrecognised payload';
};

export const endpoints = {
  bootstrap: () => `${BASE}/bootstrap-static/`,
  // Per-match history for one player, used by the Player page's last five.
  element: (id) => `${BASE}/element-summary/${id}/`,
};

// FPL availability codes -> the chip vocabulary in src/model/format.js.
// `u` means the player is no longer selectable for the club at all, which is
// how a completed transfer shows up; it is deliberately not a squad status.
const STATUS = { a: 'fit', d: 'doubt', i: 'out', s: 'susp' };
const GONE = 'u';

const POSITION_GROUP = { 1: 'GOALKEEPERS', 2: 'DEFENDERS', 3: 'MIDFIELDERS', 4: 'FORWARDS' };

/** Official player headshot. The payload gives a jpg name for a png asset. */
const photoUrl = (photo) =>
  photo ? `https://resources.premierleague.com/premierleague/photos/players/250x250/p${String(photo).replace(/\.jpg$/, '')}.png` : null;

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// A rate per 90 minutes means nothing until some minutes have been played.
const per90 = (v, minutes) => (num(minutes) ? num(v) : null);

/** Resolve a club's numeric id from its short code, which is stable season to season. */
export function teamIdByCode(payload, code = CITY_CODE) {
  const team = (payload?.teams || []).find((t) => t.short_name === code);
  return team ? team.id : null;
}

/**
 * FPL's three-letter code -> the club name the dashboard keys on, which is
 * football-data.org's `shortName`.
 *
 * Keyed on the code rather than the name deliberately. FPL writes "Spurs",
 * "Nott'm Forest" and "Leeds", and matching those to football-data.org's
 * spellings by string similarity puts Spurs at Sunderland. The codes are stable
 * and unambiguous.
 *
 * City takes its full name for the reason given in footballdata.js: the app
 * matches the City row by name.
 */
const CLUB_BY_CODE = {
  ARS: 'Arsenal',
  AVL: 'Aston Villa',
  BOU: 'Bournemouth',
  BHA: 'Brighton Hove',
  BRE: 'Brentford',
  CHE: 'Chelsea',
  COV: 'Coventry City',
  CRY: 'Crystal Palace',
  EVE: 'Everton',
  FUL: 'Fulham',
  HUL: 'Hull City',
  IPS: 'Ipswich Town',
  LEE: 'Leeds United',
  LIV: 'Liverpool',
  MCI: 'Manchester City',
  MUN: 'Man United',
  NEW: 'Newcastle',
  NFO: 'Nottingham',
  SUN: 'Sunderland',
  TOT: 'Tottenham',
};

export const clubNameFor = (code) => CLUB_BY_CODE[code] || null;

/**
 * FPL team id -> dashboard club name.
 *
 * `element-summary` identifies a player's opponent only by numeric team id, so
 * without this the last-five card would print "12" where a club should be.
 */
export function toTeamNames(payload) {
  const teams = payload?.teams;
  if (!teams?.length) return null;
  const out = {};
  for (const t of teams) {
    const name = clubNameFor(t.short_name);
    if (name) out[t.id] = { name, code: t.short_name };
  }
  return Object.keys(out).length ? out : null;
}

const playersFor = (payload, teamId) =>
  teamId == null ? [] : (payload?.elements || []).filter((e) => e.team === teamId);

/**
 * Every player the club can still pick, keyed by date of birth.
 *
 * DOB is the join key across providers: it matched 25 of City's 26 players
 * against ESPN where a surname match reached only 22, because this payload
 * stores Brazilian and Spanish players under their full legal names.
 */
export function toPlayerIndex(payload, teamId) {
  const players = playersFor(payload, teamId).filter((e) => e.status !== GONE);
  if (!players.length) return null;

  const out = {};
  for (const e of players) {
    if (!e.birth_date) continue;
    out[e.birth_date] = {
      fplId: e.id,
      name: `${e.first_name} ${e.second_name}`.trim(),
      web: e.web_name,
      group: POSITION_GROUP[e.element_type] || null,
      st: STATUS[e.status] || null,
      photo: photoUrl(e.photo),
      joined: e.team_join_date || null,
      minutes: num(e.minutes),
      starts: num(e.starts),
      goals: num(e.goals_scored),
      assists: num(e.assists),
      cleanSheets: num(e.clean_sheets),
      goalsConceded: num(e.goals_conceded),
      yellows: num(e.yellow_cards),
      reds: num(e.red_cards),
      saves: num(e.saves),
      tackles: num(e.tackles),
      recoveries: num(e.recoveries),
      cbi: num(e.clearances_blocks_interceptions),
      bonus: num(e.bonus),
      // Set-piece duty, as an order within the squad: 1 is first choice. Known
      // before a ball is kicked, so unlike the counting stats above these carry
      // real information at the start of a season.
      pens: num(e.penalties_order),
      freeKicks: num(e.direct_freekicks_order),
      corners: num(e.corners_and_indirect_freekicks_order),
      // Underlying numbers. Returned as strings by the API; null when absent
      // rather than coerced to zero, because "no data yet" is not "zero".
      xg: num(e.expected_goals),
      xa: num(e.expected_assists),
      xgi: num(e.expected_goal_involvements),
      // A per-90 rate needs minutes to be a rate at all. The API reports 0 for
      // a player who has not played, which would render as a real measurement
      // of zero threat; null instead, so the panel says it has nothing.
      xg90: per90(e.expected_goals_per_90, e.minutes),
      xa90: per90(e.expected_assists_per_90, e.minutes),
      xgi90: per90(e.expected_goal_involvements_per_90, e.minutes),
    };
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Players the Premier League no longer lists against this club, keyed by date
 * of birth.
 *
 * football-data.org's squad is slow to drop a departure: it still had Rodri,
 * Reijnders and Phillips in City's squad after all three had gone, which would
 * put them on the squad page while the transfer desk reported them leaving.
 * This index is what lets the squad drop them, and it is a real signal -- the
 * PL's own note saying where each went -- not a guess.
 */
export function toDepartedIndex(payload, teamId) {
  const players = playersFor(payload, teamId).filter((e) => e.status === GONE && e.news);
  if (!players.length) return null;

  const out = {};
  for (const e of players) {
    if (!e.birth_date) continue;
    out[e.birth_date] = {
      name: `${e.first_name} ${e.second_name}`.trim(),
      web: e.web_name,
      note: e.news.trim(),
    };
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Split the PL's availability note into the two columns the panel renders.
 *
 * The note is written to a consistent house style -- "Calf injury - Expected
 * back 5 Sep" -- so splitting on its own delimiter is reading the source, not
 * inferring from it. A note that does not follow the pattern is shown whole and
 * the return column reports that it has nothing, rather than guessing a date.
 */
export function splitNote(news) {
  const text = String(news || '').trim();
  if (!text) return { issue: null, back: null };
  const i = text.indexOf(' - ');
  if (i === -1) return { issue: text, back: null };
  return { issue: text.slice(0, i).trim(), back: text.slice(i + 3).trim() || null };
}

/**
 * Unavailable and doubtful players for one club.
 *
 * Returns [] when everyone is fit, which is a real answer and renders as an
 * empty treatment room rather than a failure.
 */
export function toInjuries(payload, teamId) {
  const players = playersFor(payload, teamId);
  if (!players.length) return null;

  return players
    .filter((e) => e.status !== 'a' && e.status !== GONE)
    .map((e) => {
      const { issue, back } = splitNote(e.news);
      return {
        name: `${e.first_name} ${e.second_name}`.trim(),
        web: e.web_name,
        // Carried so the Worker can rename this row to the squad's spelling of
        // the player. Without it the treatment room links "Jérémy Doku" at a
        // squad that calls him "Jeremy Doku", and the link opens nothing.
        dob: e.birth_date || null,
        st: STATUS[e.status] || null,
        issue,
        back,
        chance: e.chance_of_playing_next_round,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The transfer desk.
 *
 * Two real signals, neither of them inferred:
 *   out -- a player carrying status `u`, whose `news` field is the PL's own
 *          sentence about where they went. Rendered verbatim; no attempt is
 *          made to parse a club, fee or date out of the prose.
 *   in  -- `team_join_date` inside the current window.
 *
 * Returns [] in a quiet window, which is a real answer.
 */
export function toTransfers(payload, teamId, windowStart) {
  const players = playersFor(payload, teamId);
  if (!players.length) return null;

  const since = Date.parse(windowStart);

  const out = players
    .filter((e) => e.status === GONE && e.news)
    .map((e) => ({
      dir: 'OUT',
      tag: 'OUT',
      name: `${e.first_name} ${e.second_name}`.trim(),
      web: e.web_name,
      // The Premier League's own wording, unedited.
      text: e.news.trim(),
      ts: e.news_added ? Date.parse(e.news_added) : null,
    }));

  const incoming = players
    .filter((e) => e.status !== GONE && e.team_join_date && Date.parse(e.team_join_date) >= since)
    .map((e) => ({
      dir: 'IN',
      tag: 'IN',
      name: `${e.first_name} ${e.second_name}`.trim(),
      web: e.web_name,
      text: `Joined the squad on ${e.team_join_date}`,
      ts: Date.parse(e.team_join_date),
    }));

  return [...out, ...incoming].sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

/**
 * Squad size, average age and absences for every club in the division.
 *
 * The club page previously had nothing to say about a rival, because the only
 * squad the site fetched was City's. This is one pass over a payload already
 * being read, so twenty clubs cost no more requests than one.
 *
 * City is deliberately excluded: its card is built from the merged squad, which
 * knows about players the other providers add and departures FPL has dropped.
 * Counting it here as well would produce two different numbers for one club.
 */
export function toClubSummaries(payload, exclude = CITY_CODE) {
  const teams = payload?.teams;
  const elements = payload?.elements;
  if (!teams?.length || !elements?.length) return null;

  const byId = new Map();
  for (const t of teams) {
    if (t.short_name === exclude) continue;
    const name = clubNameFor(t.short_name);
    if (name) byId.set(t.id, { name, players: [] });
  }

  for (const e of elements) {
    const club = byId.get(e.team);
    if (club && e.status !== GONE) club.players.push(e);
  }

  const now = Date.now();
  const out = {};
  for (const { name, players } of byId.values()) {
    if (!players.length) continue;

    const keepers = players.filter((p) => p.element_type === 1).length;
    const ages = players
      .filter((p) => p.birth_date)
      .map((p) => (now - Date.parse(p.birth_date)) / (365.25 * 24 * 3600 * 1000))
      .filter(Number.isFinite);

    out[name] = {
      facts: [
        { label: 'SQUAD SIZE', value: String(players.length) },
        { label: 'AVERAGE AGE', value: ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : null },
        { label: 'GOALKEEPERS', value: String(keepers) },
        { label: 'OUTFIELD', value: String(players.length - keepers) },
      ],
      absences: players
        .filter((p) => p.status !== 'a')
        .map((p) => {
          const { issue, back } = splitNote(p.news);
          return { role: `${p.first_name} ${p.second_name}`.trim(), issue, back };
        })
        .sort((a, b) => a.role.localeCompare(b.role)),
    };
  }
  return Object.keys(out).length ? out : null;
}

/**
 * One player's completed matches this season, newest first.
 *
 * Read from /element-summary, which is a small per-player payload, so this is
 * only fetched when a player page is actually opened.
 */
export function toPlayerForm(payload, teamNames = null, limit = 5) {
  const history = payload?.history;
  if (!Array.isArray(history) || !history.length) return null;

  const played = history.filter((h) => h.minutes > 0);
  if (!played.length) return null;

  return played
    .slice(-limit)
    .reverse()
    .map((h) => ({
      opponent: teamNames?.[h.opponent_team]?.name || null,
      code: teamNames?.[h.opponent_team]?.code || null,
      home: !!h.was_home,
      score: h.was_home ? `${h.team_h_score}–${h.team_a_score}` : `${h.team_a_score}–${h.team_h_score}`,
      minutes: h.minutes,
      goals: h.goals_scored,
      assists: h.assists,
      kickoff: h.kickoff_time || null,
    }));
}
