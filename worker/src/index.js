/**
 * City Hub API proxy.
 *
 * The frontend is static on GitHub Pages, so it cannot hold an API key. This
 * Worker does: it holds the token as a secret, fetches upstream on the site's
 * behalf, caches hard enough to sit inside a free tier, and hands back shapes
 * the frontend renders directly.
 *
 * Routes
 *   GET /api/bootstrap  everything the dashboard needs, in one response
 *   GET /api/live       just the match in play, for fast polling
 *   GET /api/health     token, cache and budget diagnostics
 *
 * Anything no provider can supply is reported as `null`, never filled in with
 * plausible-looking data. The site shows "Failed to fetch" in its place.
 *
 * Four providers, each owning what it is actually best at:
 *
 *   football-data.org  the spine -- PL and UCL tables, fixtures, results, squad
 *                      membership, the coach. The only one with a token.
 *   FPL                availability, transfers and the underlying numbers, for
 *                      all twenty clubs. The only free source of injuries.
 *   ESPN               the cups football-data.org's free tier omits, shirt
 *                      numbers, heights, headshots and current grounds.
 *   Wikidata           ground capacity, which no football provider carries.
 *
 * Every provider other than football-data.org is optional: each is wrapped so a
 * failure yields null and the panels it feeds report that, while everything the
 * spine supplies keeps working.
 */

import { fetchUpstream, budgetStatus, currentSeason } from './upstream.js';
import { derived } from './derive.js';
import { fetchNews } from './news.js';
import { mergeSquad, joinReport, squadFacts, attachSquadNames, markLinkable } from './join.js';
import * as fd from './providers/footballdata.js';
import * as fpl from './providers/fpl.js';
import * as espn from './providers/espn.js';
import * as wd from './providers/wikidata.js';

// How long each upstream answer stays fresh.
const TTL = {
  matches: 3 * 3600,
  teams: 24 * 3600,
  club: 12 * 3600,
  standings: 3 * 3600,
  team: 24 * 3600,
  scorers: 6 * 3600,
  live: 55,
  // FPL republishes availability a few times a day around team news.
  fpl: 6 * 3600,
  // Rosters and shirt numbers move only in a transfer window.
  espnRoster: 24 * 3600,
  espnTeams: 24 * 3600,
  // A cup sweep is a whole season of fixtures; rounds are drawn weeks apart.
  espnCups: 12 * 3600,
  // Grounds are rebuilt on a timescale of decades.
  capacity: 7 * 24 * 3600,
};

const ALLOWED = [
  'https://mancity.alecstanley.com',
  'https://alecstanley-git.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allow = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

const json = (request, body, { status = 200, maxAge = 60 } = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${maxAge}`,
      ...corsHeaders(request),
    },
  });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method !== 'GET') return json(request, { error: 'method not allowed' }, { status: 405 });

    try {
      if (url.pathname === '/api/health') return json(request, await health(env), { maxAge: 0 });
      if (url.pathname === '/api/live') return json(request, await live(env, ctx), { maxAge: 30 });
      if (url.pathname === '/api/bootstrap') return json(request, await bootstrap(env, ctx), { maxAge: 120 });
      if (url.pathname === '/api/club') return json(request, await club(env, ctx, url.searchParams.get('id')), { maxAge: 600 });
      if (url.pathname === '/api/player') return json(request, await player(env, ctx, url.searchParams.get('id')), { maxAge: 600 });
      return json(request, { error: 'not found', routes: ['/api/bootstrap', '/api/live', '/api/club?id=', '/api/player?id=', '/api/health'] }, { status: 404 });
    } catch (err) {
      // Never 500 at the browser. The frontend renders its "Failed to fetch"
      // state per card, which is more useful to a reader than a stack trace.
      return json(request, { error: 'upstream failure', detail: String(err && err.message) }, { status: 502, maxAge: 0 });
    }
  },
};

const get = (env, ctx, url, ttl, reserve = 0) =>
  fetchUpstream(env, ctx, { url, headers: fd.headers(env), ttl, reserve, isError: fd.isError });

/** The same cached fetch, against a provider other than the spine. */
const getFrom = (provider) => (env, ctx, url, ttl, reserve = 0) =>
  fetchUpstream(env, ctx, { url, headers: provider.headers(env), ttl, reserve, isError: provider.isError });

const getFpl = getFrom(fpl);
const getEspn = getFrom(espn);
const getWd = getFrom(wd);

/**
 * Run a supporting provider, absorbing any failure.
 *
 * A provider that throws must not take the page down with it: the spine's data
 * still renders and the panels this one would have filled report that they have
 * nothing, which is the same thing they did before it existed.
 */
async function optional(label, sources, fn) {
  try {
    const value = await fn();
    sources[label] = value == null ? 'empty' : 'ok';
    return value;
  } catch (err) {
    sources[label] = `failed: ${String(err && err.message).slice(0, 120)}`;
    return null;
  }
}

async function health(env) {
  return {
    ok: true,
    providers: {
      spine: 'football-data.org',
      availability: 'fantasy.premierleague.com',
      cups: 'site.api.espn.com',
      capacity: 'query.wikidata.org',
    },
    season: currentSeason(),
    hasToken: !!(env.FOOTBALL_DATA_TOKEN || env.API_FOOTBALL_KEY),
    hasKv: !!env.HUB_KV,
    budget: await budgetStatus(env),
    time: new Date().toISOString(),
  };
}

/**
 * Everything read out of the FPL payload, reduced once and cached small.
 *
 * Shared by /api/bootstrap and /api/player: the raw payload is 1.5 MB, so a
 * player page must not re-fetch and re-parse it just to name an opponent.
 */
const leagueData = (env, ctx, season) =>
  derived(env, ctx, {
    name: `fpl:city:${season}`,
    ttl: TTL.fpl,
    build: async () => {
      const res = await getFpl(env, ctx, fpl.endpoints.bootstrap(), TTL.fpl, 20);
      const data = res.data;
      if (!data) return null;
      const teamId = fpl.teamIdByCode(data);
      if (teamId == null) return null;
      return {
        players: fpl.toPlayerIndex(data, teamId),
        departed: fpl.toDepartedIndex(data, teamId),
        injuries: fpl.toInjuries(data, teamId),
        transfers: fpl.toTransfers(data, teamId, `${season}-06-01`),
        // Squad size and absences for the other nineteen clubs.
        clubs: fpl.toClubSummaries(data),
        // Needed to turn a numeric opponent id into a club name.
        teamNames: fpl.toTeamNames(data),
      };
    },
  }).then((r) => r.data);

/** The one call that fills every card. */
async function bootstrap(env, ctx) {
  const season = currentSeason();
  const sources = {};

  const [matchesRes, teamsRes] = await Promise.all([
    get(env, ctx, fd.endpoints.matches(season), TTL.matches, 20),
    get(env, ctx, fd.endpoints.teams('PL'), TTL.teams, 20),
  ]);
  sources.matches = matchesRes.source;
  sources.venues = teamsRes.source;

  // Matches carry no venue, so grounds come from a club-to-ground map. ESPN's
  // is preferred because football-data.org's is stale -- it still has Everton
  // at Goodison Park and Brentford at Griffin Park.
  // City's ESPN event ids, gathered from the same sweeps as everything else so
  // the match report costs one extra call rather than a set of them.
  const espnEvents = [];

  const espnVenues = await optional('venues:espn', sources, async () => {
    const win = espn.seasonWindow(season);
    const res = await getEspn(env, ctx, espn.endpoints.scoreboard('eng.1', win.from, win.to), TTL.espnTeams, 20);
    espnEvents.push(...espn.toClubEvents(res.data, 'eng.1'));
    return espn.toVenuesFromScoreboard(res.data);
  });
  const venues = { ...(fd.toVenues(teamsRes.data) || {}), ...(espnVenues || {}) };

  const leagueTimeline = fd.toTimeline(matchesRes.data?.matches, Object.keys(venues).length ? venues : null);

  // The cups football-data.org's free tier does not carry at any price.
  const cupRows = await optional('cups:espn', sources, async () => {
    const win = espn.seasonWindow(season);
    const out = [];
    for (const slug of Object.keys(espn.CUPS)) {
      const res = await getEspn(env, ctx, espn.endpoints.scoreboard(slug, win.from, win.to), TTL.espnCups, 20);
      espnEvents.push(...espn.toClubEvents(res.data, slug));
      out.push(...espn.toCupTimeline(res.data, slug));
    }
    return out.length ? out : null;
  });

  const timeline = [...leagueTimeline, ...(cupRows || [])].sort((a, b) => a.ts - b.ts);

  // Only fetch a table for a competition City are actually in this season.
  const played = new Set(timeline.map((r) => r.compKey).filter(Boolean));
  const standings = {};
  let plScorers = null;

  for (const [key, code] of Object.entries(fd.TABLE_CODES)) {
    if (!played.has(key)) continue;
    const res = await get(env, ctx, fd.endpoints.standings(code), TTL.standings, 20);
    sources[`standings:${key}`] = res.source;
    const rows = fd.toStandingRows(res.data);
    if (rows) standings[key] = rows;
  }

  const [teamRes, scorersRes, news] = await Promise.all([
    get(env, ctx, fd.endpoints.team(), TTL.team, 20),
    played.has('PL') ? get(env, ctx, fd.endpoints.scorers('PL'), TTL.scorers, 20) : Promise.resolve({ data: null, source: 'skipped' }),
    fetchNews(ctx).catch(() => null),
  ]);
  sources.team = teamRes.source;
  sources.scorers = scorersRes.source;
  plScorers = scorersRes.data?.scorers || null;

  // Everything read out of the FPL payload, reduced once and cached small. The
  // raw payload is 1.5 MB, so parsing it per request would cost more CPU than a
  // Worker invocation is given.
  const league = await optional('fpl', sources, () => leagueData(env, ctx, season));

  // Shirt numbers, heights and headshots.
  const roster = await optional('roster:espn', sources, async () => {
    const ids = await getEspn(env, ctx, espn.endpoints.teams(), TTL.espnTeams, 20);
    const byName = espn.toTeamIds(ids.data);
    const cityId = byName?.[espn.CITY];
    if (!cityId) return null;
    const res = await getEspn(env, ctx, espn.endpoints.roster(cityId), TTL.espnRoster, 20);
    return { index: espn.toRosterIndex(res.data), teamIds: byName };
  });

  const dobs = fd.toDobs(teamRes.data);
  const baseSquad = fd.toSquad(teamRes.data, plScorers || []);
  const squad = mergeSquad(baseSquad, dobs, roster?.index || null, league?.players || null, league?.departed || null);
  sources.join = joinReport(baseSquad, dobs, roster?.index || null, league?.players || null);

  // Ground capacity, asked for once across every ground on the page.
  const capacities = await optional('capacity:wikidata', sources, async () => {
    const names = [...new Set(Object.values(venues))].filter(Boolean);
    const url = wd.endpoint(names);
    if (!url) return null;
    const res = await getWd(env, ctx, url, TTL.capacity, 20);
    return wd.toCapacities(res.data, names);
  });

  // League and European tables from the spine, cup runs from ESPN. Tables come
  // first so the Premier League stays the tab the page opens on.
  // How the last match actually went -- attendance, referee, goals, cards and
  // the two sides' totals. None of it is on football-data.org's free tier.
  const report = await optional('report:espn', sources, async () => {
    const last = espn.latestCompleted(espnEvents);
    if (!last) return null;
    const res = await getEspn(env, ctx, espn.endpoints.summary(last.slug, last.id), TTL.espnCups, 20);
    return espn.toMatchReport(res.data);
  });

  const comps = { ...fd.buildComps(timeline, standings), ...espn.buildCupComps(cupRows) };

  return {
    provider: 'football-data.org',
    // Everything that contributed, for the footer's attribution line. A source
    // that failed this request is left out rather than credited for nothing.
    providers: [
      'football-data.org',
      league ? 'Fantasy PL' : null,
      roster || cupRows ? 'ESPN' : null,
      capacities ? 'Wikidata' : null,
    ].filter(Boolean),
    season,
    updated: new Date().toISOString(),
    timeline: timeline.length ? timeline : null,
    table: standings.PL ? fd.toPlRaw(standings.PL) : null,
    teamIds: fd.toTeamIds(standings.PL),
    comps: Object.keys(comps).length ? comps : null,
    squad,
    scorers: markLinkable(fd.toScorers(plScorers), squad),
    news,
    live: await currentLive(env, ctx, timeline),
    // Renamed to the squad's spelling so the treatment room's links resolve.
    injuries: attachSquadNames(league?.injuries ?? null, squad, dobs),
    transfers: league?.transfers ?? null,
    // Counted off the merged squad so the card and the list agree.
    squadFacts: squadFacts(squad),
    clubs: league?.clubs ?? null,
    report,
    venues: Object.keys(venues).length ? venues : null,
    capacities: capacities || null,
    // What no provider on a free tier reaches. Contract detail and preferred
    // foot need a paid feed; broadcaster listings are licensed separately. The
    // panels holding them keep their place and report the gap.
    unavailable: ['contracts', 'preferredFoot', 'broadcasters'],
    sources,
    budget: await budgetStatus(env),
  };
}

/** One club's identity and recent results, fetched when a club page opens. */
async function club(env, ctx, id) {
  const clubId = parseInt(id, 10);
  if (!clubId) return { error: 'missing id', detail: null, recent: null };

  const [teamRes, matchesRes] = await Promise.all([
    get(env, ctx, fd.endpoints.club(clubId), TTL.club, 10),
    get(env, ctx, fd.endpoints.clubMatches(clubId), TTL.club, 10),
  ]);

  return {
    detail: fd.toClubDetail(teamRes.data),
    recent: fd.toClubRecent(matchesRes.data, clubId),
    sources: { detail: teamRes.source, recent: matchesRes.source },
  };
}

/**
 * One player's match-by-match season, fetched when a player page opens.
 *
 * Kept off /api/bootstrap deliberately: it is one call per player, so paying
 * for it up front would mean thirty calls to render a page showing one.
 */
async function player(env, ctx, id) {
  const fplId = parseInt(id, 10);
  if (!fplId) return { error: 'missing id', form: null };

  const [res, league] = await Promise.all([
    getFpl(env, ctx, fpl.endpoints.element(fplId), TTL.fpl, 10),
    leagueData(env, ctx, currentSeason()).catch(() => null),
  ]);
  return { form: fpl.toPlayerForm(res.data, league?.teamNames || null), source: res.source };
}

async function currentLive(env, ctx, timeline) {
  if (!timeline.some((r) => r.inPlay)) return null;
  const res = await get(env, ctx, fd.endpoints.live(), TTL.live, 0);
  const m = res.data?.matches?.[0];
  return m ? fd.toLive(m) : null;
}

/** The fast-poll route: touches nothing slow. */
async function live(env, ctx) {
  const res = await get(env, ctx, fd.endpoints.live(), TTL.live, 0);
  const m = res.data?.matches?.[0];
  return {
    live: m ? fd.toLive(m) : null,
    season: currentSeason(),
    source: res.source,
    budget: await budgetStatus(env),
  };
}
