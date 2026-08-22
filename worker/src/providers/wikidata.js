/**
 * Wikidata adapter -- ground capacity only.
 *
 * No football provider on a free tier carries stadium capacity, and both of the
 * ones this project uses carry a stale ground for at least one club
 * (football-data.org still has Brentford at Griffin Park and Everton at
 * Goodison Park). Wikidata is queried for capacity alone, keyed on the ground
 * name the football provider gave, so a wrong ground upstream yields no
 * capacity rather than the wrong capacity.
 *
 * Two traps this query is shaped around, both found by running it:
 *
 *   Name collisions. Matching `skos:altLabel` as well as `rdfs:label` is what
 *   finds grounds recorded under an alias, but on its own it also matches
 *   Melbourne's Etihad Stadium and returns two capacities for City. Constraining
 *   to `wdt:P17 wd:Q145` (United Kingdom) removed every collision across all
 *   twenty clubs.
 *
 *   Spelling. Wikidata writes "St James’ Park" with a typographic apostrophe and
 *   files Brighton's ground under "American Express Community Stadium" without
 *   the leading "The". Each name is therefore asked for in a few spellings.
 *
 * Do NOT query clubs by league membership (`wdt:P118`): that route returns
 * clubs that left the division seasons ago and grounds they have since left.
 */

const ENDPOINT = 'https://query.wikidata.org/sparql';

export const headers = () => ({
  // Wikidata asks callers to identify themselves and rate-limits anonymous
  // traffic harder. This one is honest and it is accepted.
  'user-agent': 'CityHub/1.0 (+https://mancity.alecstanley.com)',
  accept: 'application/sparql-results+json',
});

export const isError = (data) => {
  if (!data) return 'empty payload';
  if (!data.results || !Array.isArray(data.results.bindings)) return 'no bindings';
  return null;
};

/**
 * Grounds Wikidata files under a different name from the one the football
 * providers use, because the sponsor name and the encyclopaedia name differ.
 * Each of these was confirmed by querying both spellings.
 */
const ALIAS = {
  'Gtech Community Stadium': 'Brentford Community Stadium',
  'American Express Stadium': 'American Express Community Stadium',
  'The American Express Community Stadium': 'American Express Community Stadium',
};

/** The spellings a ground might be filed under. */
export function variants(name) {
  const base = String(name || '').trim();
  if (!base) return [];

  const out = new Set([base]);
  if (ALIAS[base]) out.add(ALIAS[base]);
  // Wikidata prefers the typographic apostrophe; football providers send ASCII.
  out.add(base.replace(/'/g, '’'));
  out.add(base.replace(/’/g, "'"));
  // "The City Ground" is filed both ways; "The American Express Community
  // Stadium" only without the article.
  if (/^The\s+/i.test(base)) out.add(base.replace(/^The\s+/i, ''));
  else out.add(`The ${base}`);

  return [...out].filter(Boolean);
}

const escape = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/**
 * One query for every ground on the page.
 *
 * `VALUES` keeps this to a single request no matter how many clubs are asked
 * about, which matters because the endpoint is shared and unauthenticated.
 */
export function query(names) {
  const all = [...new Set(names.flatMap(variants))];
  if (!all.length) return null;
  const values = all.map((n) => `"${escape(n)}"@en`).join(' ');
  return `SELECT ?name ?cap WHERE {
  VALUES ?name { ${values} }
  { ?s rdfs:label ?name } UNION { ?s skos:altLabel ?name }
  ?s wdt:P17 wd:Q145 .
  ?s wdt:P1083 ?cap .
}`;
}

export const endpoint = (names) => {
  const q = query(names);
  return q ? `${ENDPOINT}?format=json&query=${encodeURIComponent(q)}` : null;
};

/**
 * ground name -> capacity, mapped back onto the spellings that were asked for.
 *
 * A ground that matched under a variant is returned under the caller's original
 * spelling, so the club page can look it up with the name it already holds. A
 * ground that matched nothing is simply absent, and its panel reports that.
 */
export function toCapacities(payload, names) {
  const bindings = payload?.results?.bindings;
  if (!Array.isArray(bindings) || !bindings.length) return null;

  const found = new Map();
  for (const b of bindings) {
    const label = b.name?.value;
    const cap = parseInt(b.cap?.value, 10);
    if (label && Number.isFinite(cap)) found.set(label, cap);
  }
  if (!found.size) return null;

  const out = {};
  for (const name of names) {
    for (const v of variants(name)) {
      if (found.has(v)) {
        out[name] = found.get(v);
        break;
      }
    }
  }
  return Object.keys(out).length ? out : null;
}

/** Capacities read better with a thousands separator. */
export const formatCapacity = (n) => (Number.isFinite(n) ? n.toLocaleString('en-GB') : null);
