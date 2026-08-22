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
 * Anything the provider cannot supply is reported as `null`, never filled in
 * with plausible-looking data. The site shows "Failed to fetch" in its place.
 */

import { fetchUpstream, budgetStatus, currentSeason } from './upstream.js';
import { fetchNews } from './news.js';
import * as fd from './providers/footballdata.js';

// How long each upstream answer stays fresh.
const TTL = {
  matches: 3 * 3600,
  teams: 24 * 3600,
  club: 12 * 3600,
  standings: 3 * 3600,
  team: 24 * 3600,
  scorers: 6 * 3600,
  live: 55,
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
      return json(request, { error: 'not found', routes: ['/api/bootstrap', '/api/live', '/api/club?id=', '/api/health'] }, { status: 404 });
    } catch (err) {
      // Never 500 at the browser. The frontend renders its "Failed to fetch"
      // state per card, which is more useful to a reader than a stack trace.
      return json(request, { error: 'upstream failure', detail: String(err && err.message) }, { status: 502, maxAge: 0 });
    }
  },
};

const get = (env, ctx, url, ttl, reserve = 0) =>
  fetchUpstream(env, ctx, { url, headers: fd.headers(env), ttl, reserve, isError: fd.isError });

async function health(env) {
  return {
    ok: true,
    provider: 'football-data.org',
    season: currentSeason(),
    hasToken: !!(env.FOOTBALL_DATA_TOKEN || env.API_FOOTBALL_KEY),
    hasKv: !!env.HUB_KV,
    budget: await budgetStatus(env),
    time: new Date().toISOString(),
  };
}

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
  // Matches carry no venue, so grounds come from the competition's team list.
  const venues = fd.toVenues(teamsRes.data);
  const timeline = fd.toTimeline(matchesRes.data?.matches, venues);

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

  const squad = fd.toSquad(teamRes.data, plScorers || []);
  const comps = fd.buildComps(timeline, standings);

  return {
    provider: 'football-data.org',
    season,
    updated: new Date().toISOString(),
    timeline: timeline.length ? timeline : null,
    table: standings.PL ? fd.toPlRaw(standings.PL) : null,
    teamIds: fd.toTeamIds(standings.PL),
    comps: Object.keys(comps).length ? comps : null,
    squad,
    scorers: fd.toScorers(plScorers),
    news,
    live: await currentLive(env, ctx, timeline),
    // This provider carries no injury or transfer data on the free tier.
    // Saying so explicitly is what lets the site render "Failed to fetch"
    // instead of a number nobody fetched.
    injuries: null,
    transfers: null,
    unavailable: ['injuries', 'transfers', 'shirtNumbers', 'domesticCups'],
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
