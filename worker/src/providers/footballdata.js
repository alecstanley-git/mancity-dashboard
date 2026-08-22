/**
 * football-data.org v4 adapter.
 *
 * Maps onto the shapes in design-spec.md §9, which the frontend renders directly.
 *
 * What this provider can and cannot do on the free tier:
 *   can  -- current season, Premier League and Champions League fixtures,
 *           results, full standings, scorers, squad roster, crests
 *   cannot -- FA Cup, League Cup, Club World Cup, injuries, transfers,
 *           shirt numbers, per-player appearance stats
 *
 * Anything in the second list is reported as absent rather than filled in, so
 * the site shows "Failed to fetch" instead of inventing a fact.
 */

const BASE = 'https://api.football-data.org/v4';

export const MAN_CITY = 65;

// football-data competition codes -> the dashboard's competition keys.
const COMP_KEY = { PL: 'PL', CL: 'UCL' };

const COMP_META = {
  PL: { label: 'Premier League', short: 'THE LEAGUE' },
  UCL: { label: 'Champions League', short: 'EUROPE' },
};

export const headers = (env) => ({ 'X-Auth-Token': env.FOOTBALL_DATA_TOKEN || env.API_FOOTBALL_KEY || '' });

export const isError = (data) => (data && data.errorCode ? data.message || data.errorCode : null);

export const endpoints = {
  matches: (season) => `${BASE}/teams/${MAN_CITY}/matches?season=${season}`,
  team: () => `${BASE}/teams/${MAN_CITY}`,
  standings: (code) => `${BASE}/competitions/${code}/standings`,
  scorers: (code) => `${BASE}/competitions/${code}/scorers?limit=100`,
  live: () => `${BASE}/teams/${MAN_CITY}/matches?status=IN_PLAY,PAUSED`,
  // One call returns every club in the competition with its ground, which is
  // how fixture rows get a real venue -- matches themselves carry none.
  teams: (code) => `${BASE}/competitions/${code}/teams`,
  club: (id) => `${BASE}/teams/${id}`,
  clubMatches: (id) => `${BASE}/teams/${id}/matches?status=FINISHED&limit=5`,
};

/** club name -> ground, built from a competition's team list. */
export function toVenues(payload) {
  const teams = payload?.teams;
  if (!teams || !teams.length) return null;
  const out = {};
  for (const t of teams) {
    if (t.venue) out[shortName(t)] = t.venue;
  }
  return Object.keys(out).length ? out : null;
}

const FINISHED = new Set(['FINISHED', 'AWARDED']);
const IN_PLAY = new Set(['IN_PLAY', 'PAUSED']);

// Squad positions come back as broad sections.
const POSITION_GROUP = {
  Goalkeeper: 'GOALKEEPERS',
  Defence: 'DEFENDERS',
  Midfield: 'MIDFIELDERS',
  Offence: 'FORWARDS',
};
const GROUP_ORDER = ['GOALKEEPERS', 'DEFENDERS', 'MIDFIELDERS', 'FORWARDS'];

// Nationalities arrive as full country names; the squad card wants three letters.
const NATION = {
  England: 'ENG', Scotland: 'SCO', Wales: 'WAL', 'Northern Ireland': 'NIR', Ireland: 'IRL',
  Spain: 'ESP', Portugal: 'POR', France: 'FRA', Germany: 'GER', Italy: 'ITA', Netherlands: 'NED',
  Belgium: 'BEL', Croatia: 'CRO', Norway: 'NOR', Sweden: 'SWE', Denmark: 'DEN', Switzerland: 'SUI',
  Austria: 'AUT', Poland: 'POL', Ukraine: 'UKR', Serbia: 'SRB', Slovenia: 'SVN', Slovakia: 'SVK',
  Argentina: 'ARG', Brazil: 'BRA', Uruguay: 'URU', Colombia: 'COL', Chile: 'CHI', Ecuador: 'ECU',
  Egypt: 'EGY', Morocco: 'MAR', Algeria: 'ALG', Senegal: 'SEN', Nigeria: 'NGA', Ghana: 'GHA',
  'Ivory Coast': 'CIV', "Cote d'Ivoire": 'CIV', Mali: 'MLI', Cameroon: 'CMR',
  USA: 'USA', 'United States': 'USA', Canada: 'CAN', Mexico: 'MEX', Japan: 'JPN',
  'Korea Republic': 'KOR', Australia: 'AUS', 'New Zealand': 'NZL', Turkey: 'TUR', Greece: 'GRE',
  Uzbekistan: 'UZB', Hungary: 'HUN', 'Czech Republic': 'CZE', Romania: 'ROU', Bulgaria: 'BUL',
};
const nation = (n) => NATION[n] || String(n || '').slice(0, 3).toUpperCase();

// Short display names: "Manchester City FC" -> "Man City". The one club the
// whole site keys on gets its full name, because that is what the app matches
// on when it highlights the City row and opens the City club page.
const shortName = (team) => {
  if (team.id === MAN_CITY) return 'Manchester City';
  return team.shortName || String(team.name || '').replace(/\s+(FC|AFC|CF)$/i, '');
};

const ageFrom = (iso) => {
  if (!iso) return null;
  const born = new Date(iso);
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const m = now.getUTCMonth() - born.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
};

function roundLabel(match, compKey) {
  if (match.matchday && compKey === 'PL') return `MATCHWEEK ${match.matchday}`;
  if (match.matchday && compKey === 'UCL') return `MATCHDAY ${match.matchday}`;
  if (match.stage) return String(match.stage).replace(/_/g, ' ').toUpperCase();
  return null;
}

/** One match -> one timeline row. */
export function toTimelineRow(m) {
  const compKey = COMP_KEY[m.competition.code] || null;
  const cityHome = m.homeTeam.id === MAN_CITY;
  const opponent = cityHome ? m.awayTeam : m.homeTeam;
  const finished = FINISHED.has(m.status);

  const ft = m.score?.fullTime || {};
  const cityGoals = cityHome ? ft.home : ft.away;
  const oppGoals = cityHome ? ft.away : ft.home;

  let tone = null;
  if (finished && cityGoals != null && oppGoals != null) {
    tone = cityGoals > oppGoals ? 'W' : cityGoals < oppGoals ? 'L' : 'D';
  }

  return {
    ts: Date.parse(m.utcDate),
    fixtureId: m.id,
    opp: shortName(opponent),
    // Matches carry no venue; the home club names the ground, resolved against
    // the competition's team list.
    homeClub: shortName(m.homeTeam),
    code: opponent.tla || shortName(opponent).slice(0, 3).toUpperCase(),
    badge: opponent.crest,
    comp: (m.competition.name || '').toUpperCase(),
    short: m.competition.name,
    compKey,
    compLogo: m.competition.emblem,
    v: cityHome ? 'H' : 'A',
    ground: null,
    round: roundLabel(m, compKey),
    score: finished && cityGoals != null ? `${cityGoals} – ${oppGoals}` : null,
    tone,
    status: m.status,
    inPlay: IN_PLAY.has(m.status),
  };
}

export function toTimeline(matches, venues = null) {
  return (matches || [])
    .filter((m) => m.homeTeam?.id === MAN_CITY || m.awayTeam?.id === MAN_CITY)
    .map((m) => {
      const row = toTimelineRow(m);
      if (venues && venues[row.homeClub]) row.ground = venues[row.homeClub];
      return row;
    })
    .sort((a, b) => a.ts - b.ts);
}

/** A club's identity card, from its own team record. */
export function toClubDetail(team) {
  if (!team || !team.id) return null;
  return {
    id: team.id,
    name: shortName(team),
    code: team.tla || null,
    crest: team.crest || null,
    venue: team.venue || null,
    founded: team.founded || null,
    clubColors: team.clubColors || null,
    website: team.website || null,
    coach: team.coach?.name || null,
    squadSize: Array.isArray(team.squad) ? team.squad.length : null,
  };
}

/** A club's last results, newest first, read from that club's point of view. */
export function toClubRecent(payload, clubId) {
  const matches = payload?.matches;
  if (!matches || !matches.length || !clubId) return null;
  const out = matches
    .slice()
    .sort((a, b) => Date.parse(b.utcDate) - Date.parse(a.utcDate))
    .slice(0, 5)
    .map((m) => {
      const home = m.homeTeam.id === clubId;
      const opponent = home ? m.awayTeam : m.homeTeam;
      const ft = m.score?.fullTime || {};
      const own = home ? ft.home : ft.away;
      const against = home ? ft.away : ft.home;
      if (own == null || against == null) return null;
      return {
        code: opponent.tla || shortName(opponent).slice(0, 3).toUpperCase(),
        opponent: shortName(opponent),
        venue: home ? 'H' : 'A',
        score: `${own}–${against}`,
        tone: own > against ? 'W' : own < against ? 'L' : 'D',
      };
    })
    .filter(Boolean);
  return out.length ? out : null;
}

/** Standings -> the rows a table tab renders. */
export function toStandingRows(payload) {
  const total = (payload?.standings || []).find((s) => s.type === 'TOTAL');
  if (!total || !Array.isArray(total.table)) return null;
  return total.table.map((r) => ({
    pos: r.position,
    id: r.team.id,
    club: shortName(r.team),
    badge: r.team.crest,
    played: r.playedGames,
    gd: (r.goalDifference > 0 ? '+' : '') + r.goalDifference,
    pts: r.points,
    // v4 returns form as "W,D,L,W,W"; the dots want bare letters, oldest first.
    form: String(r.form || '').replace(/[^WDL]/g, '').slice(-5),
    city: r.team.id === MAN_CITY,
    w: r.won,
    d: r.draw,
    l: r.lost,
    gf: r.goalsFor,
  }));
}

/** club name -> football-data team id, for the on-demand club detail route. */
export function toTeamIds(rows) {
  if (!rows) return null;
  const out = {};
  for (const r of rows) if (r.id) out[r.club] = r.id;
  return Object.keys(out).length ? out : null;
}

/** The same standings, in the tuple shape the full league table wants. */
export function toPlRaw(rows) {
  if (!rows) return null;
  return rows.map((r) => [r.club, r.played, r.gd, r.pts, r.form, r.w, r.d, r.l, r.gf]);
}

/** Last five in a competition, newest first. */
export function recentIn(timeline, compKey, n = 5) {
  return timeline
    .filter((r) => r.compKey === compKey && r.score)
    .slice(-n)
    .reverse()
    .map((r) => ({
      date: new Date(r.ts)
        .toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'Australia/Sydney' })
        .toUpperCase(),
      venue: r.v,
      opponent: r.opp,
      score: r.score.replace(' – ', '–'),
      tone: r.tone,
    }));
}

/**
 * Squad roster. Appearances, goals and assists are merged in from the scorers
 * table where the player appears there; everyone else is genuinely on zero,
 * which early in a season is the truth rather than a gap.
 *
 * Shirt numbers are not in this API. `num` is null and the card renders a dash
 * rather than a number that would be a guess.
 */
export function toSquad(team, scorers = []) {
  const squad = team?.squad;
  if (!squad || !squad.length) return null;

  const stats = new Map();
  for (const s of scorers) {
    if (s.team?.id !== MAN_CITY) continue;
    stats.set(s.player.id, {
      apps: s.playedMatches || 0,
      goals: s.goals || 0,
      assists: s.assists || 0,
    });
  }

  const buckets = new Map(GROUP_ORDER.map((g) => [g, []]));
  for (const p of squad) {
    const group = POSITION_GROUP[p.position] || 'MIDFIELDERS';
    const stat = stats.get(p.id) || { apps: 0, goals: 0, assists: 0 };
    buckets.get(group).push({
      num: null,
      name: p.name,
      nation: nation(p.nationality),
      age: ageFrom(p.dateOfBirth),
      apps: stat.apps,
      goals: stat.goals,
      assists: stat.assists,
      // Availability needs an injury feed this tier does not have. Null, not
      // 'fit' -- claiming every player is available would be a guess.
      st: null,
    });
  }

  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    players: buckets.get(g).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)),
  })).filter((g) => g.players.length);

  return groups.length ? groups : null;
}

/**
 * player name -> date of birth, which is the key the other providers join on.
 * See worker/src/join.js for why it is date of birth and not name.
 */
export function toDobs(team) {
  const squad = team?.squad;
  if (!squad || !squad.length) return null;
  const out = {};
  for (const p of squad) if (p.name && p.dateOfBirth) out[p.name] = String(p.dateOfBirth).slice(0, 10);
  return Object.keys(out).length ? out : null;
}

/** City's leading scorers. Returns [] rather than null when nobody has scored. */
export function toScorers(scorers) {
  if (!scorers) return null;
  const city = scorers
    .filter((s) => s.team?.id === MAN_CITY && (s.goals || 0) > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 4);
  if (!city.length) return [];

  const max = city[0].goals || 1;
  const POS = { Goalkeeper: 'GK', Defence: 'DF', Midfield: 'MF', Offence: 'FW' };
  return city.map((s) => ({
    num: s.player.shirtNumber ?? null,
    name: s.player.name,
    pos: POS[s.player.section] || 'FW',
    goals: s.goals,
    bar: Math.round((s.goals / max) * 100) + '%',
  }));
}

/** The live bar. Goalscorer detail is not on the free tier, so it may be empty. */
export function toLive(m) {
  if (!m) return null;
  const cityHome = m.homeTeam.id === MAN_CITY;
  const opponent = cityHome ? m.awayTeam : m.homeTeam;
  const ft = m.score?.fullTime || {};
  const cityGoals = cityHome ? ft.home : ft.away;
  const oppGoals = cityHome ? ft.away : ft.home;

  const elapsed =
    m.minute != null ? `${m.minute}'` : m.status === 'PAUSED' ? 'HT' : `${Math.max(0, Math.round((Date.now() - Date.parse(m.utcDate)) / 60000))}'`;

  const scorerNames = (m.goals || []).map((g) => {
    const forCity = g.team?.id === MAN_CITY;
    const surname = String(g.scorer?.name || '').split(' ').slice(-1)[0];
    return {
      text: `⚽ ${surname} ${g.minute}′${forCity ? '' : ` (${opponent.tla || ''})`}`,
      player: forCity ? g.scorer?.name : null,
      club: forCity ? null : shortName(opponent),
    };
  });

  return {
    fixtureId: m.id,
    score: `${cityGoals ?? 0} – ${oppGoals ?? 0}`,
    oppCode: opponent.tla || shortName(opponent).slice(0, 3).toUpperCase(),
    opponent: shortName(opponent),
    minute: elapsed,
    comp: (m.competition?.name || '').toUpperCase(),
    scorerNames,
  };
}

/** Assemble the standings tabs. Cups are absent from this provider entirely. */
export function buildComps(timeline, standings) {
  const out = {};
  for (const [key, meta] of Object.entries(COMP_META)) {
    const rows = standings[key];
    if (!rows) continue;
    const latest = timeline.filter((r) => r.compKey === key && r.score).slice(-1)[0];
    out[key] = {
      label: meta.label,
      short: meta.short,
      updated: latest?.round || meta.label.toUpperCase(),
      isTable: true,
      isPath: false,
      rows,
      path: [],
      recent: recentIn(timeline, key),
    };
  }
  return out;
}

export const TABLE_CODES = { PL: 'PL', UCL: 'CL' };
