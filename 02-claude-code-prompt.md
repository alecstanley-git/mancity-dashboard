# Claude Code Prompt — Build out the Man City Hub backend & deployment

This working directory contains the exported frontend from Claude Design for my Manchester City personal dashboard site ("hub"). Take this from a static design mockup to a fully working, deployed website with real live data. Work through the following in order, and check in with me wherever you need a decision, credential, or manual step only I can perform.

## 1. Audit & structure the project

Review the exported design files, confirm whether it's plain HTML/CSS/JS or a framework (React/Vite/etc.), and set it up as a clean, buildable project suitable for static hosting on GitHub Pages. Restructure/componentize as needed for maintainability.

## 2. Source real assets

Replace placeholder imagery with real assets: the club crests (Man City is currently the only asset), opponent badges for upcoming fixtures, and competition logos (Premier League, Champions League, FA Cup, etc.). Prefer badge/logo URLs served directly by whichever sports data API we settle on in step 3, so they stay current automatically, over hosting static copies. Where you need generic imagery (e.g. news thumbnails), source appropriately licensed images.

## 3. Choose and integrate sports data APIs

Research and evaluate football data API providers (for example football-data.org, API-Football/API-Sports via RapidAPI, TheSportsDB, or others you find) against these needs:

- Live scores, fixtures, and match minute/goalscorer updates
- League standings for every competition Man City compete in this season
- Top scorer / squad stats
- Injury and transfer news (may need a second source if no single API covers this well)

Pick the most reliable option(s) given free-tier limits and competition coverage, and tell me which you chose and why before wiring everything up.

## 4. Hide API keys with a Cloudflare Worker

GitHub Pages is static hosting only, so build a Cloudflare Worker that acts as a backend proxy: it holds the API keys as Worker secrets (never in the frontend bundle or repo), forwards requests to the chosen sports APIs, handles CORS, and caches responses sensibly to stay within rate limits. Write the full Worker code in this repo (e.g. in a `/worker` directory) with clear separation from the frontend.

If I give you a Cloudflare API token, use `wrangler` to deploy the Worker directly. If not, write out exact, copy-pasteable manual deployment steps for me instead.

## 5. Wire the frontend to live data

Connect every dashboard section (match centre, live match bar, standings, news feed, squad watch) to the Worker endpoints. Implement sensible loading states, error/fallback states, and refresh intervals — faster polling during live matches, slower otherwise.

## 6. Push to GitHub & deploy

Initialize a git repo if needed, commit the work, and push to a new GitHub repository (ask me for the repo name/visibility if you need it; use the `gh` CLI if it's authenticated, otherwise tell me exactly what to run). Set up GitHub Pages, including a GitHub Actions workflow to build and deploy if the project needs a build step.

## 7. Connect the custom domain

I own the Cloudflare-managed domain `alecstanley.com` and want this site live at `mancity.alecstanley.com`. Add the required `CNAME` file to the repo and configure the GitHub Pages custom domain setting. Then give me the exact DNS record(s) to add in my Cloudflare dashboard (or set them via the Cloudflare API if I provide a token), and the correct Cloudflare SSL/TLS mode so it doesn't conflict with GitHub's certificate.

## 8. Document everything

Write a README covering the architecture (frontend → Worker → APIs), how to run it locally, how to rotate/update API keys and secrets, and how to redeploy.

Ask me before doing anything that needs my credentials, approval, or a manual dashboard step (GitHub auth, Cloudflare API tokens, DNS changes I need to make myself).
