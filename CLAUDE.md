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
`data-tip` instead. That is deliberate; do not "fix" it by cramming text in.

---

## Architecture

GitHub Pages is static, so the frontend cannot hold a key. The Cloudflare Worker holds the
token as a secret, calls upstream, caches, and returns shapes the components render directly.

```
mancity.alecstanley.com  ──►  mancity-hub-api  ──►  football-data.org / RSS
(static React, no keys)       (token + cache)
```

| path | role |
| --- | --- |
| `src/pages/` | one component per page |
| `src/model/index.js` | `buildModel()` — the whole view model. Components compute nothing |
| `src/model/records.js` | table / squad / club / player transforms. Returns real data or `null` |
| `src/lib/api.js` | Worker client, bootstrap + live polling |
| `worker/src/providers/` | **all provider-specific code.** Swapping providers is a change here plus one import in `worker/src/index.js` |
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

**API-Football is a dead end on the free tier.** It looks ideal (all five competitions,
injuries, transfers, goalscorers, badges) but **its free plan cannot read the current season —
it stops at 2024.** Verified by direct API call; the docs site is behind a bot challenge that
blocks scraping, so this is not discoverable by reading. Its paid tier ($19/mo) would restore
the domestic cups, injuries and transfers that currently read "Failed to fetch". The adapter
for it is in git history (`worker/src/providers/apifootball.js`, deleted in commit `e7607d7`).

**TheSportsDB's free key caps every list at 5 rows** — unusable for a 20-team table.

---

## Gotchas that cost time

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

`~/.cf-token` has been **deleted**. For Worker deploys or secret rotation use
`npx wrangler login` (browser OAuth). The football-data token lives only as a Worker secret
and in the gitignored `worker/.dev.vars`; it is not in the repo or the bundle.

---

## Current state

Everything in the original brief is done and deployed. The Premier League season is one match
old, so most of the table reads 0 and City's form strip is empty — that is real data, not a
bug. The Champions League tab appears automatically once City have a fixture in it.
