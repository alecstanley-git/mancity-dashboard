# City Hub

A personal Manchester City dashboard — fixtures, live scores, league tables, squad and news.
Live at **[mancity.alecstanley.com](https://mancity.alecstanley.com)**.

---

## Architecture

```
  Browser                          Cloudflare Worker              Upstream
  ─────────                        ─────────────────              ────────
  mancity.alecstanley.com          mancity-hub-api                football-data.org (token)
  GitHub Pages, static React  ───► holds the API token       ───► Fantasy PL        (no key)
  no keys in the bundle            caches + rate-limits            ESPN              (no key)
                                   joins + normalises shapes       Wikidata          (no key)
                                                                   BBC / Guardian RSS (no key)
```

- Site: <https://mancity.alecstanley.com>
- Worker: <https://mancity-hub-api.stanleyalec283.workers.dev>
- Repo: <https://github.com/alecstanley-git/mancity-dashboard>

GitHub Pages serves static files only, so the frontend cannot hold an API token. The Worker
holds it as a secret, calls upstream on the site's behalf, caches the answers, and returns
data already shaped the way the components render it. The token never reaches the browser
and never enters this repository.

### Layout

| path | what it is |
| --- | --- |
| `src/pages/` | one component per page — Overview, Fixtures, Squad, Tables, Player, Club |
| `src/components/` | shared chrome: header, live/idle bars, tab bar, badges, empty states |
| `src/model/` | the view model. Turns a Worker payload into exactly what components render |
| `src/lib/api.js` | Worker client and polling |
| `src/lib/calendar.js` | builds the downloadable `.ics` for a fixture or a whole season |
| `src/components/Portrait.jsx` | player headshot with a fallback chain to the placeholder |
| `src/hooks/` | navigation/history, tooltip and toast layers |
| `src/styles/tokens.css` | both colour themes, the interaction layer, the mobile override layer |
| `worker/src/` | the Cloudflare Worker |
| `worker/src/providers/` | one file per data provider — swap providers by adding one here |
| `worker/src/join.js` | reconciles one player across providers, on date of birth |
| `worker/src/derive.js` | caches the small shapes built from a large payload |
| `design/` | the original Claude Design export, kept for reference. Nothing depends on it |
| `design-spec.md` | the design contract. Read before changing layout, colour or data shapes |

### No invented data

The site never displays a number it did not fetch. Anything the provider cannot supply is
returned as `null` by the Worker and rendered as **"Failed to fetch"** by the frontend, in
place of the value, with the panel keeping its position in the layout.

The original design export shipped with authored sample data, and much of it was synthetic
(pass accuracy was `78 + shirtNumber % 14`; squad size was `24 + clubName.length % 4`). All
of it has been removed rather than shown as if real.

### Who supplies what

Four providers. Only football-data.org needs a key; the other three are unauthenticated, so
there is exactly one secret to look after.

| provider | key | supplies |
| --- | --- | --- |
| **football-data.org** | token | the spine — PL and UCL tables, fixtures, results, squad membership, club identity |
| **Fantasy Premier League** | none | availability and injuries, transfers, expected goals/assists, minutes, headshots — for all twenty clubs |
| **ESPN** | none | FA Cup, EFL Cup, Community Shield, Super Cup, Club World Cup; shirt numbers, heights, current grounds |
| **Wikidata** | none | ground capacity |
| **BBC Sport / Guardian RSS** | none | news and thumbnails |

Everything except football-data.org is optional: each is wrapped so a failure returns `null`
and only the panels it feeds report the gap.

### What is covered

Everything below is fetched. Fields no free tier can supply — contract length, preferred
foot, head-to-head records, broadcaster listings and the current manager — were removed from
the interface rather than left reporting a failure forever.

| area | what is shown |
| --- | --- |
| Fixtures | every competition, kickoff times, venues, crests, filterable by competition |
| Tables | full Premier League table with form; Champions League once the league phase starts |
| Cups | FA Cup, EFL Cup, Community Shield, Super Cup, Club World Cup, as a knockout path |
| Last match | attendance, referee, goals and cards, and both sides' possession, shots, corners and fouls |
| Squad | shirt numbers, heights, weights, ages, nationalities, join dates, availability |
| Treatment room | injuries and suspensions with the reason and expected return, for every club |
| Transfer desk | moves in and out, in the Premier League's own wording |
| Player | portrait, expected goals and assists per 90, involvement and discipline, set-piece duty, last five matches |
| Club | ground and capacity, squad size, absences — for all twenty clubs |
| News | BBC Sport and The Guardian |
| Calendar | the next fixture, or a whole filtered season, as a downloadable `.ics` with a 30-minute reminder |

### Empty is not the same as broken

A panel with nothing in it says which of the two it is. "Failed to fetch" means the request
failed. When the request succeeded and there is genuinely nothing yet — a player with no
minutes, a squad with no goals, a goalkeeper with no set-piece duty — the panel says that
instead, and why. Both states are honest; only one of them is a fault.

---

## Running locally

You need Node 20+ and a free football-data.org token
([register here](https://www.football-data.org/client/register)).

```bash
npm install

# The Worker reads its token from worker/.dev.vars, which is gitignored.
echo 'FOOTBALL_DATA_TOKEN=your_token_here' > worker/.dev.vars

# Point the frontend at the local Worker instead of the deployed one.
echo 'VITE_WORKER_URL=http://localhost:8787' > .env.local
```

Then run the two halves in separate terminals:

```bash
npm run worker:dev   # Worker on http://localhost:8787
npm run dev          # site on http://localhost:5173
```

Check the Worker on its own with `curl localhost:8787/api/health` — it reports whether the
token and KV binding are present, the season it is reading, and the request budget.

Delete `.env.local` to point the local site back at the deployed Worker.

---

## The Worker

### Routes

| route | returns |
| --- | --- |
| `GET /api/bootstrap` | everything the dashboard needs, in one response |
| `GET /api/live` | only the match in play, for fast polling |
| `GET /api/club?id=<teamId>` | one club's identity and recent results, when a club page opens |
| `GET /api/player?id=<fplId>` | one player's match-by-match season, when a player page opens |
| `GET /api/health` | token/KV presence, season, request budget |

`/api/bootstrap` includes a `sources` object saying whether each card came from `upstream`,
`cache`, or a stale copy. When a card looks wrong, that tells you whether to suspect the API
or the mapping.

### How it stays inside the free tier

Three layers, in order:

1. **Cloudflare Cache API**, keyed on the upstream URL. Per-endpoint TTLs — 3h for fixtures
   and tables, 24h for the squad, 55s for a live match.
2. **A KV day counter** (optional, see below). Once the day's budget is spent the Worker
   stops calling upstream entirely.
3. **A KV stash** of the last good response per endpoint, kept seven days. When the budget is
   spent or upstream is down, this is served instead — stale, but real.

Without the KV binding, layer 1 still applies and layers 2 and 3 are skipped. The Worker
checks for the binding and degrades quietly.

### Deploying it

```bash
export CLOUDFLARE_API_TOKEN=$(cat ~/.cf-token)
npm run worker:deploy
```

The Cloudflare API token needs these permissions:

| scope | permission | why |
| --- | --- | --- |
| Account | Workers Scripts — **Edit** | deploy the Worker, set its secrets |
| Account | Workers KV Storage — **Edit** | create and write the cache namespace |
| Zone (`alecstanley.com`) | DNS — **Edit** | manage the site's DNS record |

Watch it live with `npm run worker:tail`.

### KV

Already created and bound (`HUB_KV`, namespace `c16b12e769f94c7b8d7dd295512d3a6b`). The
Worker treats it as optional, so if the binding is ever removed the site keeps working with
Cache-API caching alone. To recreate it from scratch:

```bash
npx wrangler kv namespace create HUB_KV --config worker/wrangler.toml
```

then paste the id it prints into the `[[kv_namespaces]]` block in `worker/wrangler.toml` and
redeploy.

---

## Rotating keys and secrets

The football-data.org token is a **Worker secret**. It is not in this repository, not in the
frontend bundle, and not in the GitHub Actions configuration.

```bash
# Rotate: issue a new token at football-data.org, then
export CLOUDFLARE_API_TOKEN=$(cat ~/.cf-token)
npx wrangler secret put FOOTBALL_DATA_TOKEN --config worker/wrangler.toml
# paste the new token at the prompt; it takes effect immediately, no redeploy

npx wrangler secret list --config worker/wrangler.toml   # confirm
```

Update `worker/.dev.vars` separately for local development. That file is gitignored; never
commit it.

If a token is ever exposed, revoke it at the provider first, then set the replacement — the
Worker starts using a new secret on its next request.

---

## Deploying the site

Pushing to `main` builds and publishes automatically via
`.github/workflows/deploy.yml`. To deploy by hand, run the **Deploy site** workflow from the
Actions tab.

The build needs no secrets. `VITE_WORKER_URL` defaults to the deployed Worker; override it by
setting a repository *variable* (Settings → Secrets and variables → Actions → Variables) of
that name.

### Custom domain

`public/CNAME` pins the domain, so it survives every deploy. In Cloudflare DNS:

| type | name | target | proxy |
| --- | --- | --- | --- |
| CNAME | `mancity` | `alecstanley-git.github.io` | **DNS only** (grey cloud) |

Two settings matter, and both are easy to get wrong:

- **The record must not be proxied.** An orange cloud puts Cloudflare in front of GitHub's
  certificate and breaks the TLS handshake between them.
- **SSL/TLS mode must be Full or Full (strict)**, never Flexible. Flexible makes Cloudflare
  talk plain HTTP to GitHub, which forces HTTPS, and the result is a redirect loop.

GitHub then issues its own certificate for the domain, which takes a few minutes. Once it
has, tick **Enforce HTTPS** in Settings → Pages.

---

## Changing provider

Every provider-specific detail lives in one file, `worker/src/providers/`. A provider module
exports its endpoints, its auth header, and functions mapping its payloads onto the shapes in
[`design-spec.md`](design-spec.md) §9. `worker/src/index.js` imports one of them and knows
nothing else about the upstream API.

To swap providers, add a module beside `footballdata.js` and change that import. Nothing in
`src/` changes — the frontend only ever sees the normalised shapes.

Worth knowing if you revisit this: **API-Football's free tier cannot read the current
season** (it stops at 2024), which is why this project uses football-data.org. API-Football's
paid tier covers the domestic cups, injuries and transfers that currently read "Failed to
fetch".

---

## Design

[`design-spec.md`](design-spec.md) is the contract: colour tokens, type scale, the card and
table geometry, the `data-m` responsive layer, and the data invariants. It was written for
the original export and still governs the port. Read §9 before changing a data shape and §11
before changing layout.

Verify changes at 1440px, ~960px and 390px, in both themes.
