# City Hub — working notes

A personal Manchester City dashboard. Live at **https://mancity.alecstanley.com**.

| | |
| --- | --- |
| Site | https://mancity.alecstanley.com (GitHub Pages, custom domain, HTTPS enforced) |
| Repo | https://github.com/alecstanley-git/mancity-dashboard (public, `main`) |
| Worker | https://mancity-hub-api.stanleyalec283.workers.dev |
| Data | football-data.org (token) · BBC Sport + Guardian RSS (keyless) |

Full detail is in [`README.md`](README.md). The design contract is
[`design-spec.md`](design-spec.md) — read §9 before changing a data shape and §11 before
changing layout. This file is only the things you cannot infer from the code.

---

## The hard rule: never invent data

**Alec's explicit instruction: no fabricated data anywhere on the site.** Where a value
cannot be fetched — the provider does not carry it, or the request failed — the panel keeps
its place in the layout and renders **"Failed to fetch"**. Do not remove the feature, do not
substitute a plausible number, do not fall back to sample data.

This is why:

- There is **no sample/fallback data** in the repo. `src/model/sample.js` was deleted. Do not
  reintroduce it.
- The Worker returns `null` for anything it cannot source, never a filled-in value. See the
  `unavailable` array in `/api/bootstrap`.
- The frontend renders nulls via `src/components/Missing.jsx` — `<Missing />` for a whole
  panel, `orMissing(value)` for a single field.
- The squad's availability chip is `null`, not `'fit'`. Claiming every player is available
  would be a guess.

The original Claude Design export was full of synthetic data presented as real (pass accuracy
was `78 + shirtNumber % 14`; squad size was `24 + clubName.length % 4`; invented injuries,
transfers, head-to-heads and news headlines). It has all been removed. If a page looks sparse,
that is the rule working, not a regression.

**Exception to watch for:** two spots are too small to hold the words "Failed to fetch" — the
44px shirt-number square and the badge disc. Both show an em dash with an explanatory
`data-tip` instead. That is deliberate; do not "fix" it by cramming text in. Shirt numbers
themselves are now real (ESPN), but the em dash still shows for a player no provider matched
— typically someone out on loan — so the path is still live.

---

## Keep these docs current

Update `README.md` and this file **as part of the change**, not afterwards. A `Stop` hook
(`.claude/hooks/docs-reminder.sh`) checks for source edits that left both untouched and asks
once per change set — it is a backstop, not the mechanism.

What belongs where:

- **`README.md`** — anything a person setting the project up or operating it needs:
  architecture, commands, deployment, key rotation, and the table of what the provider does
  and does not supply. Update that table whenever provider coverage changes.
- **`CLAUDE.md`** — a standing constraint, a decision worth not relitigating, or a trap that
  cost real time. Not a changelog, and not a summary of the code: only what a fresh session
  could not work out by reading the repo. If a "Gotchas" entry stops being true, delete it —
  a stale warning is worse than none.

Neither file needs an entry for an ordinary bug fix or refactor. Say so and move on.

---

## Architecture

GitHub Pages is static, so the frontend cannot hold a key. The Cloudflare Worker holds the
token as a secret, calls upstream, caches, and returns shapes the components render directly.

```
mancity.alecstanley.com  ──►  mancity-hub-api  ──►  football-data.org (token)
(static React, no keys)       (token + cache            Fantasy PL / ESPN /
                               + cross-provider join)   Wikidata / RSS (keyless)
```

| path | role |
| --- | --- |
| `src/pages/` | one component per page |
| `src/model/index.js` | `buildModel()` — the whole view model. Components compute nothing |
| `src/model/records.js` | table / squad / club / player transforms. Returns real data or `null` |
| `src/lib/api.js` | Worker client, bootstrap + live polling |
| `worker/src/providers/` | **all provider-specific code.** Swapping providers is a change here plus one import in `worker/src/index.js` |
| `worker/src/join.js` | reconciles one player across providers. Read its header before touching squad code |
| `worker/src/derive.js` | caches the small shapes built from a large payload. Bump `SHAPE` when a shape changes |
| `design/` | the original Claude Design export, reference only. Nothing depends on it |

## Commands

```bash
npm run dev            # site on :5173
npm run worker:dev     # Worker on :8787
npm run build
npm run worker:deploy  # needs `npx wrangler login` first (see below)
```

Local dev needs `worker/.dev.vars` with `FOOTBALL_DATA_TOKEN=...` (gitignored). Add
`.env.local` with `VITE_WORKER_URL=http://localhost:8787` to point the site at the local
Worker; delete it to use the deployed one.

---

## Decisions already made — don't relitigate

**The port.** The export was a Claude Design component: a custom template runtime
(`sc-for`/`sc-if`/`{{ }}`) whose `support.js` fetched React *and Babel* from a CDN and parsed
the template in the browser. Unshippable. Converted to React + Vite (63 kB gzipped). The
conversion was done by one-shot scripts that no longer exist — the port is finished, don't
look for them.

**Four providers, layered — do not consolidate them.** football-data.org is the spine and the
only one with a token. FPL, ESPN and Wikidata each fill something no other free source has.
Each is optional and wrapped, so one going down costs its panels and nothing else.

**Paying for a provider is no longer the way to close a gap.** The remaining "Failed to fetch"
fields — contract, preferred foot, head-to-head, broadcaster, current manager — are the ones
no free tier reaches, and everything else is now sourced. Before adding a paid tier, check
whether the field is actually missing rather than assuming the old coverage table.

**Sources already ruled out, with the reason. Do not re-research these:**

| source | why not |
| --- | --- |
| API-Football free tier | cannot read the current season; stops at 2024. Verified by direct call. Adapter is in git history (`worker/src/providers/apifootball.js`, deleted in `e7607d7`) |
| TheSportsDB free key | caps every list at 5 rows — unusable for a 20-team table |
| SofaScore | `403 Forbidden` on every endpoint from a datacenter IP |
| Fotmob | returns the HTML shell, not JSON |
| Transfermarkt community APIs | the public instances are dead — `fly.dev` 500s, `vercel.app` returns `402 DEPLOYMENT_DISABLED` |

**football-data.org's free tier is 12 competitions** (`TIER_ONE`). Of City's, only PL and CL
are in it. FA Cup is `TIER_TWO`; the EFL Cup, Community Shield, Super Cup and Club World Cup
are not sold at any tier. That is why the cups come from ESPN.

---

## Gotchas that cost time

### The multi-provider layer

- **Calendar export writes UTC, deliberately.** `src/lib/calendar.js` emits `DTSTART` with a
  `Z` suffix so the event lands at the right local time — the dashboard is read in Australia
  and the fixtures kick off in England. It is also a CRLF format with a 75-octet line limit;
  both are enforced there, and clients reject files that ignore them.
- **Any name that crosses providers must be resolved before it becomes a link.** The
  treatment room linked FPL's "Jérémy Doku" at a squad keyed on football-data's "Jeremy Doku",
  so the link opened an empty profile — one accent's difference. `attachSquadNames` renames
  each injury to the squad's spelling by DOB; `markLinkable` flags scorers who have since left
  and therefore have no page. Anything that cannot be resolved renders as plain text rather
  than a link to nothing. **Adding a link keyed on a name? Resolve it first.**
- **Join players on date of birth, never on name.** Measured on City's squad: DOB matched 25
  of 26, a normalised-surname match only 22. It fails on players filed under a full legal
  name — `de Oliveira Nunes dos Reis` is Vitor Reis, `Moreira de Oliveira` is Savinho,
  `González Iglesias` is Nico González. `worker/src/join.js` does DOB first, unique surname
  second, nothing third.
- **football-data.org's squad keeps departed players.** It still listed Rodri, Reijnders and
  Phillips weeks after they left. The squad drops anyone FPL reports as gone, or the squad
  page contradicts the transfer desk beside it.
- **ESPN needs a User-Agent from its allowlist.** It answers `curl/*`, `okhttp/*`,
  `Go-http-client/*` and `python-requests/*` with 200, and answers a *browser* string, an
  application name like `CityHub/1.0`, or no agent at all with **403**. Counter-intuitive but
  verified from a Cloudflare colo, so it is the agent and not the address. FPL and Wikidata
  both accept an honest `CityHub/1.0` agent.
- **ESPN standings live on a different host.** `site.web.api.espn.com/apis/v2/...` returns
  them; `site.api.espn.com` returns `{}` for the same path.
- **ESPN's `coach` array is historical, not current.** For City it ends at Roberto Mancini.
  Never read a manager from it. No free source has the current one, so that field is honestly
  unavailable.
- **ESPN's Champions League lags a season.** `uefa.champions` still points at 2025 until the
  league phase is drawn, which is why football-data.org remains the UCL source.
- **Read match state from `status.type.completed` and `.state`, not from status names.** A cup
  adds names a league never uses — `STATUS_FINAL_PEN` covered nine of the first fifty-two EFL
  Cup ties, and extra time adds more.
- **Bump `SHAPE` in `worker/src/derive.js` whenever a derived shape changes.** The derived
  cache is keyed by name, so without it a deploy that adds a field serves the old shape until
  the TTL expires. That cost an hour once already: newly added per-club summaries came back
  empty and looked like a join bug.
- **Wikidata: constrain stadium lookups to the UK (`wdt:P17 wd:Q145`).** Matching
  `skos:altLabel` is what finds grounds filed under an alias, but unconstrained it also
  matches Melbourne's Etihad Stadium and returns two capacities for City. And never select
  clubs by league membership (`wdt:P118`) — it returns clubs and grounds seasons out of date.
- **Both football providers are stale on grounds.** football-data.org still has Everton at
  Goodison Park and Brentford at Griffin Park. ESPN has the current ones, so ESPN's
  club-to-ground map wins; it also raises the Wikidata capacity hit rate to 20 of 20.
- **A per-90 rate with zero minutes is not zero.** FPL returns `0` for a player who has not
  played; the adapter nulls it, so the panel reports having nothing rather than showing a
  measurement of no threat. Counting stats are gated the same way.
- **A Premier League headshot dropped into a small box looks like a bug.** They are 500x500
  with the player small in frame, so at 44px the face is a few pixels and the avatar reads as
  empty even though the image loaded fine. `Portrait` takes a `zoom` prop for this; the squad
  avatars use 1.6 with `transform-origin: center 34%`. Before assuming a portrait failed to
  load, check `naturalWidth` — it was 500 the whole time.
- **Player portraits need two sources and a client-side fallback.** The Premier League's CDN
  answers **403**, not 404, for players it has no photo of (Rulli, Donnarumma), and ESPN has
  no headshot for others (Bettinelli). Only one City player has both. A CSS `background-image`
  cannot detect either failure and renders a blank card, so `src/components/Portrait.jsx` uses an
  `<img>` with `onError` and falls through PL → ESPN → striped placeholder.
- **`fpl.isError` must accept two payload shapes.** The bootstrap has `elements`, but
  `/element-summary` has `history`. Checking only for `elements` marks every player-form
  response as an upstream failure, which silently empties the last-five card.
- **`element-summary` names the opponent by numeric team id.** Resolving it needs the
  bootstrap's team list, which is why `/api/player` reads the same cached `leagueData` the
  bootstrap does rather than re-fetching 1.5 MB.

### Older


- **football-data.org calls City "Man City".** `shortName()` in the provider special-cases
  team id 65 to return `'Manchester City'`, because `plFull()` matches the City row by name.
  Break this and the City row stops highlighting and the City club page finds no row.
- **Matches carry no venue.** Grounds come from a separate `/competitions/PL/teams` call,
  mapped in `toVenues()`.
- **GitHub Pages certificate can stall indefinitely.** If `https_certificate` is `null` (not
  `authorization_pending`), provisioning never started. Fix: PUT the Pages API with
  `cname=""`, then PUT it again with the real domain. That kicked it immediately after ~25
  minutes of nothing. Check `repos/{owner}/{repo}/pages/health` first — if `is_valid: true`
  and `is_https_eligible: true`, the problem is on GitHub's side, not the DNS.
- **The workers.dev subdomain is the Cloudflare account name**, `stanleyalec283`, not the
  domain name. It is the default in `src/lib/api.js` and the Actions workflow.
- **A read-only Cloudflare token fails as `Authentication error [code: 10000]` on writes
  while reads still succeed** — easy to misread as a broken token. Also, newly widened
  permissions take a minute or two to propagate.
- **The DNS record must stay DNS-only (grey cloud).** Proxying puts Cloudflare in front of
  GitHub's certificate and breaks it. Zone SSL/TLS is already Full (strict), which is correct.

## Credentials

`~/.cf-token` holds a read/write Cloudflare API token; export it as `CLOUDFLARE_API_TOKEN`
for `wrangler`, or use `npx wrangler login` instead. The football-data token lives only as a
Worker secret and in the gitignored `worker/.dev.vars`; it is not in the repo or the bundle.
The other three providers need no credential at all.

---

## Current state

Everything in the original brief is done, plus the four-provider layer that closed most of the
"Failed to fetch" panels (injuries, transfers, shirt numbers, cups, capacity, xG, rival squads).
All of it is deployed and verified live: the Worker's `/api/health` reports every provider, and
`/api/bootstrap` from the production edge returns all four with no failed source.

Also working, having previously been decorative: the **Add to calendar** button (downloads a
real `.ics` with a 30-minute alarm — it used to do nothing but show a toast saying it had), the
**fixture competition filter** (was hardcoded `null`), and **player portraits** on the squad
and player pages.

The 2026/27 season is one match old, so a lot of real data is legitimately zero or empty:

- most of the table reads 0, and City's form strip is empty
- Top Scorers reports nothing, because nobody has scored yet
- player xG panels report nothing, because a per-90 with no minutes is not a rate
- the EFL Cup tab is absent — City enter in the third round, which is not drawn yet
- the Champions League tab appears once the league phase is drawn

None of that is a regression. Check the season is actually under way before debugging an
empty panel.

**Empty and broken are now distinguished.** `Missing` takes a `label` and `note`, and the
model supplies an `*Empty` / `emptyState` object wherever it can prove the fetch succeeded and
there is simply nothing yet — `scorersEmpty`, `player.emptyState`, `setPiecesEmpty`,
`newsEmpty`, `club.formEmpty`, `club.topEmpty`. Only a real failure says "Failed to fetch".
When adding a panel, decide which of the two it can be and wire the empty case too.
