/**
 * Provider-agnostic cached fetch.
 *
 * Two things stand between the dashboard and a free-tier rate limit:
 *
 *   1. The Cloudflare Cache API, keyed on the upstream URL. Every colo that has
 *      served a request recently answers from cache without touching upstream.
 *   2. A KV budget counter. Once the day's allowance is spent, `fetchUpstream`
 *      refuses to call out again and serves the last good payload from KV.
 *
 * So a bad day degrades to stale data rather than to errors, and a page left
 * open in a tab can never exhaust the key.
 */

const todayKey = () => new Date().toISOString().slice(0, 10);

async function bumpBudget(env, by = 1) {
  if (!env.HUB_KV) return;
  const key = `budget:${todayKey()}`;
  const used = (parseInt((await env.HUB_KV.get(key)) || '0', 10) || 0) + by;
  // Two days of TTL so a counter written just before midnight still expires.
  await env.HUB_KV.put(key, String(used), { expirationTtl: 172800 });
}

export async function budgetStatus(env) {
  const cap = parseInt(env.DAILY_BUDGET || '400', 10);
  const used = env.HUB_KV ? parseInt((await env.HUB_KV.get(`budget:${todayKey()}`)) || '0', 10) || 0 : 0;
  return { cap, used, remaining: Math.max(0, cap - used) };
}

const stash = (env, key) => (env.HUB_KV ? env.HUB_KV.get(`stash:${key}`, 'json') : Promise.resolve(null));

/**
 * One upstream GET, cached and budgeted.
 *
 * @param url      absolute upstream URL
 * @param headers  auth headers for the provider
 * @param ttl      seconds to cache a successful response
 * @param reserve  leave this many calls of the day's budget untouched, so a
 *                 live match can still be polled after the slow-moving cards
 *                 have taken their share. Live polling passes 0.
 * @param isError  provider-specific check for a 200 that is really a failure
 */
export async function fetchUpstream(env, ctx, { url, headers, ttl, reserve = 0, isError }) {
  const cacheKey = new Request(url, { method: 'GET' });
  const cache = caches.default;

  const hit = await cache.match(cacheKey);
  if (hit) return { data: await hit.json(), source: 'cache' };

  const budget = await budgetStatus(env);
  if (budget.remaining <= reserve) {
    return { data: await stash(env, url), source: 'stale-budget', budget };
  }

  let res;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    return { data: await stash(env, url), source: 'stale-network', error: String(err) };
  }

  await bumpBudget(env);

  if (!res.ok) {
    return { data: await stash(env, url), source: 'stale-http', status: res.status };
  }

  const data = await res.json();

  const upstreamError = isError ? isError(data) : null;
  if (upstreamError) {
    return { data: await stash(env, url), source: 'stale-upstream-error', upstreamErrors: upstreamError };
  }

  const body = JSON.stringify(data);
  ctx.waitUntil(
    cache.put(
      cacheKey,
      new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': `max-age=${ttl}` } })
    )
  );
  if (env.HUB_KV) {
    // The stash is the last-known-good answer, kept far longer than the cache
    // so an exhausted budget still has something honest to show.
    ctx.waitUntil(env.HUB_KV.put(`stash:${url}`, body, { expirationTtl: 604800 }));
  }

  return { data, source: 'upstream' };
}

// Northern-hemisphere seasons are labelled by the year they start in.
export function currentSeason(now = new Date()) {
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}
