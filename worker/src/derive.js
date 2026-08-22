/**
 * Cache for the small shapes built from a large upstream payload.
 *
 * `fetchUpstream` caches the raw response, which is the right thing for
 * football-data.org where a response is a few kilobytes. It is the wrong thing
 * for the FPL bootstrap, which is 1.5 MB: a cache hit still costs a 1.5 MB
 * `JSON.parse` on every request, and a Worker gets very little CPU per
 * invocation.
 *
 * So the reduction is cached too. The big payload is fetched and parsed at most
 * once per TTL; every request in between reads a few kilobytes of already
 * reduced JSON out of KV.
 *
 * Without a KV binding this degrades to calling `build` every time, which is
 * exactly what the Worker did before and is still correct, only slower.
 */

/**
 * Bump when the shape a `build` returns changes.
 *
 * The cache is keyed by name, so without this a deploy that adds a field keeps
 * serving the old shape until the TTL expires -- which cost real confusion once
 * already, when newly added per-club summaries came back empty for six hours.
 */
const SHAPE = 4;

const KEY = (name) => `derived:v${SHAPE}:${name}`;

/**
 * @param name  cache key, unique per derivation and per season
 * @param ttl   seconds the derived shape stays fresh
 * @param build async () => value. Only called on a miss.
 */
export async function derived(env, ctx, { name, ttl, build }) {
  if (!env.HUB_KV) {
    const value = await build();
    return { data: value, source: 'derived-uncached' };
  }

  const key = KEY(name);
  const hit = await env.HUB_KV.get(key, 'json');
  // A derivation is allowed to be null when upstream genuinely had nothing, so
  // the envelope records the miss explicitly rather than treating null as one.
  if (hit && hit.v !== undefined) return { data: hit.v, source: 'derived-cache' };

  const value = await build();

  ctx.waitUntil(
    env.HUB_KV.put(key, JSON.stringify({ v: value, at: Date.now() }), { expirationTtl: Math.max(60, ttl) })
  );

  return { data: value, source: 'derived-build' };
}
