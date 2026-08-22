# City Hub — design specification

A personal Manchester City dashboard. `City Hub.dc.html` is the whole site: a streaming Design Component with an inline template and a `Component extends DCLogic` class. No build step, no stylesheet, no framework beyond the DC runtime.

### Files

| file | role |
| --- | --- |
| `City Hub.dc.html` | the entire site — all six pages, both themes, desktop and mobile |
| `crest.svg` | the only external asset |
| `Mobile Preview.dc.html` | a device harness: phone/tablet frames around the site, with a simulated Android nav bar whose back button is wired to the frame's history. Development aid only — nothing depends on it, and deleting it does not affect the site |
| `design-spec.md` | this document |

This document is written so an agent with no prior context can extend the site without guessing.

---

## 1. Product intent

The first tab a die-hard supporter opens each day of the season. One glance answers: are City playing today, what is the score, where do we sit in every competition, what is the news, who is fit.

Two rules that shape every decision:

1. **Matchday urgency, otherwise calm.** The only loud element is the live bar, and only when a match is in play. Everything else is quiet, dense and scannable.
2. **Every panel earns its place.** No decorative filler, no dummy sections. If a panel has empty space, it gets more real content or the layout gives the height back.

All data is authored sample data pending a real feed (see §9 for the invariants any feed must preserve).

---

## 2. Type

Two families, loaded from Google Fonts in `<helmet>`:

| family | weights | used for |
| --- | --- | --- |
| **Archivo** | 400, 500, 600, 700, 800 | everything made of words — UI, labels, copy, names |
| **Barlow Condensed** | 500, 600, 700 | everything countable — scores, points, countdown, stats, shirt numbers, page titles |

Fallback stack: `Archivo, Helvetica, sans-serif`. A monospace stack (`ui-monospace, SFMono-Regular, Menlo, monospace`) appears only inside image placeholders, to mark them as placeholders.

**Never mix the two families inside one line of text.** Barlow Condensed is a numeral and display face here, not a text face.

### Type scale

Display (Barlow Condensed, weight 700, `line-height` .8–.95):

| px | role |
| --- | --- |
| 92 | shirt number over a 3:4 portrait |
| 46 / 44 | headline stat values (player, club) |
| 44 | hero kickoff time |
| 42 | page titles — FIXTURES & RESULTS, FIRST-TEAM SQUAD, TABLES |
| 42 | shirt number over a 4:3 card |
| 40 | player name (profile) |
| 34 | club name (profile), hero "VS" |
| 34 | countdown digits |
| 30 | squad-fact figures |
| 28 | live score |
| 26 | competition status (Tables page) |
| 22 | team codes in the live bar, recent-result scores |
| 19–20 | table points, metric values |
| 16–17 | table rank, fixture-rail time, form-row codes |
| 14–15 | badge codes inside discs |

Text (Archivo):

| px / weight | role |
| --- | --- |
| 19 / 800 | wordmark "CITY HUB" |
| 15 / 700 | squad-card player name, news headline |
| 14.5 / 700 | fixtures-page opponent |
| 13.5 / 700 | list-row names, table club names |
| 13 / 800 / .06em | **card header title** |
| 13 / 600 | identity meta values |
| 12.5 / 600–700 | body copy, buttons, tab labels |
| 11.5 / 600 | tooltips, sub-labels, meta |
| 11 / 700 / .10em | **card header meta** (right side) |
| 11 / 800 / .12–.16em | eyebrow labels, venue letters |
| 10.5 / 700 / .12em | table column headings |
| 10 / 800 / .14em | stat-card labels, news kickers |
| 9.5 / 800 / .10em | status chips, unit labels |

Letter-spacing rises as size falls: body 0 to .04em, labels .06em to .12em, eyebrows .14em to .18em. `text-wrap: pretty` on any multi-line prose.

---

## 3. Colour

Official club palette, and nothing outside it except three functional colours (win green, and the neutral greys derived from navy).

| name | hex | use |
| --- | --- | --- |
| Sky Blue | `#6CABDD` | the primary. Accents, active states, links, bars, focus rings, shirt numbers |
| Navy | `#1C2C5B` | the anchor. Hero surface in light mode, text on sky, deep chrome |
| Gold | `#FFC659` (dark) / `#D4A12A` (light) | the countdown seconds, secondary status, Europa places |
| Red | `#EC3325` | live and urgent only — live bar, injury, relegation. Never decorative |
| White | `#FFFFFF` | light-mode surfaces, text on navy/red |
| Win green | `#2FA46A` | W results, available status. Functional, not brand |

### Tokens

Both themes are CSS custom properties declared in `<helmet>`, on `:root` (light) and `[data-theme="dark"]`. The root element carries `data-theme="{{ theme }}"`. **All colour in the design references a token — never a raw hex, except the six brand values inside token definitions and inside data-driven club badges.**

| token | light | dark | meaning |
| --- | --- | --- | --- |
| `--bg` | `#EDF2F8` | `#070D22` | page |
| `--panel` | `#FFFFFF` | `#0F1A3C` | card surface |
| `--panel2` | `#F4F8FC` | `#142149` | inset surface, row hover, tiles |
| `--line` | `#DCE6F1` | `rgba(108,171,221,.16)` | all borders and separators |
| `--ink` | `#101A38` | `#E9F1FA` | primary text |
| `--dim` | `#5D6E90` | `#8AA2C6` | secondary text, labels |
| `--sky` | `#6CABDD` | `#6CABDD` | accent fills, bars, focus |
| `--skyText` | `#2B7AB8` | `#8CC3EC` | accent **text** (contrast-corrected per theme) |
| `--navy` | `#1C2C5B` | `#1C2C5B` | on-sky text |
| `--gold` | `#D4A12A` | `#FFC659` | gold accents |
| `--red` | `#EC3325` | `#EC3325` | live / urgent |
| `--chip` | `#E9F2FA` | `#17265A` | number discs, squares behind numerals |
| `--heroBg` | `#1C2C5B` | `#12224D` | match-centre surface |
| `--heroInk` / `--heroDim` / `--heroLine` | `#FFFFFF` / `#A9C4E4` / `rgba(108,171,221,.30)` | `#FFFFFF` / `#9DB8DC` / `rgba(108,171,221,.22)` | text and rules on the hero |
| `--shadow` | `0 1px 2px rgba(16,26,56,.06), 0 10px 28px rgba(16,26,56,.07)` | `0 1px 0 rgba(255,255,255,.04), 0 20px 44px rgba(0,0,0,.45)` | resting card |
| `--shadowUp` | `0 2px 4px …, 0 16px 34px rgba(16,26,56,.13)` | `0 1px 0 …, 0 26px 54px rgba(0,0,0,.55)` | hovered card |
| `--stripe` / `--stripeBg` | `rgba(28,44,91,.07)` / `#E5EDF6` | `rgba(108,171,221,.10)` / `#101C40` | image placeholder hatch |

### The two identities

They are not inversions of each other.

**Light** is a white-panel broadsheet: cool off-white page, pure white cards, hairline sky-grey rules, navy ink. The hero is a solid navy block — the one dark object on the page, which is what makes the match centre read as the headline. Gold is darkened to `#D4A12A` so it holds on white.

**Light-mode rule:** sky blue never carries small text. Use `--skyText` (`#2B7AB8`) for accent words; keep `#6CABDD` for fills, bars and dots.

**Dark** is a floodlit night: near-black navy page, raised navy panels, borders made of translucent sky rather than grey, so edges glow instead of ruling. The hero lifts one step out of the page instead of dropping into it. Gold brightens to `#FFC659`; sky text lightens to `#8CC3EC`.

Both themes: exactly one accent (sky), one highlight (gold), one alarm (red). No gradients anywhere except two functional ones — the hero's 1px diagonal hatch and the image-placeholder hatch, plus the photo scrims in §7.

---

## 4. Layout

**Two modes, one markup.** Desktop is described below. Mobile (≤860px) is the same DOM re-laid-out by the `data-m` override layer in §11 — there is no second template and no mobile-only page. Read §11 before adding any layout.

- Page: `max-width:1440px`, 32px gutters (16px on mobile), `padding-bottom:72px` (`88px + safe-area` on mobile, to clear the tab bar).
- Grid: `repeat(12, 1fr)`, `gap:20px`, **`align-items:start`** — columns never stretch to a neighbour's height. This is the fix for dead space; do not remove it.
- **A multi-card page is two continuous columns, never a stack of independent rows.** `align-items:start` stops a card *stretching*, but it cannot fix a page authored as row-after-row: if row one is `4 + 8` and row two is `7 + 5`, the short card in row one leaves a tall void beneath it and the two rows' seams don't line up. Instead give the page **two `<section>` columns for its whole height** (`span 5` + `span 7` on Club, `span 4` + `span 8` on Player), each a `flex-direction:column` with `gap:20px`, and put every card inside one of them. Cards then flow to fill their column and the vertical seam is unbroken from header to footer. Full-width rows (news, related players) sit after both columns as `span 12`.
- Base unit 4px. 10px appears only in the five-across result strip.
- Bars: live 56px, idle 48px, header 88px. Each is one `align-items:center` row; nothing uses baseline alignment; labels carry `line-height:1` so nothing drifts.

### Column spans

| page | rows |
| --- | --- |
| Overview | hero 8 + fixture rail 4 · standings 7 + squad column 5 · news 12 (4 cards) |
| Fixtures | full-width stack, one card per month |
| Squad | full-width, position groups, 3 cards per row |
| Tables | full table 8 + competition status 4 |
| Player | **column 4** (portrait, underlying numbers) + **column 8** (stat cards, by competition, last five) · news 12 (3 cards) · related 12 (4 cards) |
| Club | **column 5** (identity, season split, against City) + **column 7** (stat cards, recent form, squad + absences) |

The two profile pages are the continuous-column pattern above: one `<section>` per column running the page's full height, not a sequence of rows. Adding a card means choosing a column and appending to it — never starting a new row.

### Cards

| token | value |
| --- | --- |
| outer radius | 16px |
| inner tile / row radius | 10px |
| chip, button, table row | 8px |
| pill | 999px |
| card padding | 24px — 20px on stat and player cards, 18/20px on media cards where the image is flush |
| card header → body | 18px, header row `min-height:26px` |

**Card header** is always the same object: title 13/800/.06em left, meta 11/700/.10em `--dim` right, `justify-content:space-between`.

**Rows** — 14px vertical padding, 1px `--line` separator, and the hover surface bleeds 10px into the card padding (`padding:14px 10px; margin:0 -10px`) so the highlight looks flush with the card edge.

**Tables** — one column template everywhere, Overview and Tables page alike:

```
44px | minmax(0,1fr) | 40px | 46px | 46px | 118px
   #        club         P      GD     PTS     form
```

The header row uses the identical template and the same 10px side padding, so headings sit exactly over their values. The position cell is a 3px zone bar + rank, giving every table the same left edge. Numerics centred, form dots right-aligned. Any grid with a text column and a fixed column must make the **text** column the flexible one (`minmax(0,1fr)`) and give short fixed data `white-space:nowrap` — flexing a score column collapses it.

---

## 5. Components

**Live bar** (matchday only, `matchState: "live"`) — full-bleed `--red`, 56px. Pulsing dot + LIVE, then a fixed-width block: 48px team code / 76px score / 48px team code / 44px minute badge, so a goal or a minute tick cannot shift its neighbours. Then a divider, the goalscorer list, and the competition on the right. Team codes and scorers are links.

**Idle bar** — `--panel2`, 48px, sky dot + NO MATCH TODAY, next fixture line, today's date right-aligned.

**Header** — crest (46px), wordmark + greeting, nav (Overview / Fixtures / Squad / Tables — active item is `--ink` with a 2px sky underline), sun/moon theme toggle in a pill.

**Match centre** (hero) — navy surface with a 26px diagonal hatch. Competition chip (sky fill, navy text) + round, crest vs opponent badge, kickoff time in AEST at 44px, venue and broadcast, then a rule and the countdown: four 74px tiles, the seconds tile filled gold with navy digits. One primary action (`Add to calendar`, sky, 44px tall).

**Standings** — tabbed by competition. League competitions render the table; cup competitions render a round-by-round path (round label, opponent, venue, result chip). Below either, always: "CITY · LAST FIVE IN {competition}" as five equal `minmax(0,1fr)` tiles. This strip is what earns the card its height on cup tabs.

**Form dots** — 19px squares, 5px radius: W `#2FA46A`, D `--panel2`-adjacent grey, L `--red`, white text (grey text on D). Ordered oldest → newest. Every dot carries a tooltip.

**Squad card** — number square, name (link), nation · age, availability chip, then a 3-column apps/goals/assists footer above a hairline.

**Media card** — 16:10 (Overview) or 16:9 (player page) placeholder, red duration chip on video, kicker / headline / source · time. Whole card is a `data-card`.

**Stat card** — label 10/800/.14em with `line-height:1.2` and `min-height:24px`, value 44–46px Barlow Condensed, sub 11.5/600 with `min-height:31px`.

**Reserve height for anything that can wrap.** In any row of sibling cards, a label or sub that wraps to two lines in one card and one line in the next puts their values on two different baselines — the row reads as broken even though every card is internally correct. So every text slot above a headline value carries a `min-height` for its worst case: 24px for a two-line label, 31px for a two-line sub. This bites at narrow desktop widths (~900–1100px) long before it bites on mobile, so check it there.

**Buttons** — 44px primary (sky fill, navy text), 34px secondary (transparent, `--line` border, `--dim` text). Tabs and chips: 8px radius, sky fill when active, transparent with `--line` border when not. On mobile every one of these becomes ≥44px tall (§11).

**Bottom tab bar** (mobile only) — fixed, `--panel` surface, 1px `--line` top rule, upward shadow, `env(safe-area-inset-bottom)` padding. Four equal buttons, 52px tall, each a 20×3px sky indicator over a 10.5/800/.09em uppercase label. It renders the same `nav` list as the desktop header nav, so the two can never disagree. Inline `display:none`; the mobile layer switches it on.

---

## 6. Pages and navigation

`state.page` drives one `<sc-if>` per page: `Overview`, `Fixtures`, `Squad`, `Tables`, `Player`, `Club`. The last two are not in the nav — they are reached by clicking a name, and `state.fromPage` remembers where the user came from so the back button reads "Back to Tables".

**Everything nameable is clickable.** Every player mention opens a player page; every club mention opens a club page. Currently wired: standings rows (both tables), the last-five strip, cup paths, fixture rail, hero opponent and "Man City", live-bar team codes and goalscorers, fixtures-page rows, squad cards, top scorers, treatment room, player-page form codes and related players, club-page recent results and contributors. **Any new surface that names a club or player must wire the same link** — the pattern is a bare `<button>` with `background:none;border:0;padding:0`, inheriting colour, `style-hover="color:var(--skyText)"`.

**Back is a first-class control.** Every page change goes through `nav(patch)` in the logic class, which pushes one `history` entry (no URL change — `pushState(state, '')`, so the host URL is untouched). `popstate` restores `page` / `player` / `club` / `fromPage` from that entry. Consequences to preserve:

- Android's hardware back and the in-page "Back to X" button walk the same stack; `goBack()` calls `history.back()` when depth > 0 and only falls back to `fromPage` when it is the first entry.
- Back from the Overview leaves the app, which is correct Android behaviour.
- **Never call `setState({ page: … })` directly.** A new navigation surface calls `this.nav({ page, … })` or it silently breaks the back button.

Player pages are City players only. Rival-club pages describe absences by position ("Centre-back · knee") and squads by aggregate, so no player names are invented.

---

## 7. Imagery

No photography yet. Placeholders are a `--stripeBg` fill with a 12px diagonal `--stripe` hatch and a monospace caption naming what belongs there ("player portrait 3:4", "match photo 16:10"). Never hand-draw illustrative SVG; the crest is the only artwork.

**Shirt number over a portrait.** The number sits bottom-centre on the image and must stay readable over any photo:

- Scrim: a four-stop gradient over the bottom **52%** of a 3:4 portrait (56% on a 4:3 card): `rgba(4,10,26,0) 0% → .22 34% → .66 68% → .94 100%`. The long transparent lead-in keeps the photo intact; the number lands on near-solid darkness.
- Number: Barlow Condensed 700, 92px on the portrait / 42px on the card, `line-height:.8`, `bottom:10px` (6px on the card), `--sky` on the portrait, white on the cards, with `text-shadow:0 2px 20px rgba(0,0,0,.7)` as insurance against pale images.
- When real portraits land: if they are consistently dark at the bottom, the scrim can come down to ~40%; verify the number against the lightest image in the set, not the average.

---

## 8. Interaction

### Hover text (tooltips)

Explain abbreviations and icon-only controls; never restate a visible label.

- Trigger: `data-tip` on any element. 250ms in, 80ms out, delegated from one floating node.
- Placement: centred above, 8px offset; flips below within 12px of the viewport top; clamps 12px from either edge.
- Style: `--panel` surface, 1px `--line`, 8px radius, 11.5/600, 240px max, elevated shadow.
- Motion: fade + 4px rise, 140ms ease.
- Copy: sentence case, no full stop, ≤ 7 words, states the outcome — "Switch to dark mode", "Champions League places", "Match clock", "Open player page".

### Toasts

- Trigger: `data-toast="message"` on click, optional `data-toast-tone="sky|gold|red"`.
- Bottom-right, 24px inset, stacked upward, 12px gap, max 3 (oldest drops).
- `--panel` surface, 4px left bar in the tone, 13/600, 340px max.
- 16px slide from the right + fade, 220ms `cubic-bezier(.2,.8,.2,1)`; auto-dismiss 3.4s; exit fade 180ms.
- Copy: past-tense confirmation plus one useful detail, ≤ 60 characters — "Added to calendar — reminder 30 min before kickoff".

### Hover and press

| target | hover | press |
| --- | --- | --- |
| actionable card (`data-card`) | `translateY(-2px)`, border → sky, `--shadowUp`, 160ms | `translateY(0) scale(.995)`, border → sky |
| list row (`data-row`) | background → `--panel2`, 120ms | background → `--panel2` |
| button / chip | background lightens, border → sky, 140ms | `translateY(1px) scale(.99)`, 100ms |
| name link | colour → `--skyText` | — |
| nav item | colour → `--ink` | — |

Panels that are not actionable never move. `:focus-visible` is a 2px `--sky` outline at 2px offset on every control. `prefers-reduced-motion: reduce` collapses all transitions and animations to 0.01ms.

**Every `:hover` rule is wrapped in `@media (hover:hover)`** so a touch tap cannot leave a card stuck in its hover state; the press column above is the touch feedback, and anything with a hover state must have one. Buttons carry `-webkit-tap-highlight-color:transparent` and `touch-action:manipulation`. Tooltips are hover affordances only — never put information on a `data-tip` that a touch user cannot reach another way.

### Copy voice

Terse, informed, no hype. Labels are uppercase and abbreviated like a broadcast graphic (MATCHWEEK 12, ALL COMPS, NEXT 4). Prose is plain British football register — "back in team training", not "on the road to recovery". Numbers before adjectives. No emoji outside the live goalscorer line.

---

## 9. Data model

All data is authored in the logic class. Method by method:

| method | returns |
| --- | --- |
| `comps()` | the five competitions, keyed `PL / UCL / FA / EFL / CWC`. Each has `label`, `updated`, either `rows` (table) or `path` (cup), a `short` label and a `recent` five-match list |
| `plFull(dark)` | the full 20-team league table. Each row: `club, played, gd, pts, form, W, D, L, GF` plus derived `zone`, `zoneTip`, `rowBg`, `open` |
| `seasonData(dark)` | fixtures and results grouped by month; each match has opponent, code, competition, H/A, ground, score or kickoff time, tone, and an `open` handler |
| `squadData(dark)` | four position groups; each player has number, name, nation, age, apps, goals, assists and an availability status with its own colours |
| `playerRecord(name, dark)` | one player's profile: identity, headline stats, metrics, per-competition splits, last five, news, related players — **all role-aware** |
| `clubRecord(name, dark)` | one club's profile: identity from `clubMeta()`, record and split from its `plFull` row, recent results, squad aggregates, absences, head-to-head |
| `clubMeta()` | code, stadium, capacity, manager, founded, nickname for ~38 clubs |
| `formDots(str, theme)` | a W/D/L string → dot objects with colours and tooltips |

### Invariants a real feed must preserve

These are what previous bugs came from. Check them on every data change.

1. **`pts = 3W + D`** and **`W + D + L = played`** and **`GA = GF − GD`** for every club.
2. A club's **form dots, record, season split and recent-results list all describe the same matches.** Club pages derive recent results from the club's own form string; City's page reads the authored `comps().PL.recent` so it matches the Overview exactly.
3. **No club's page may invent a City result.** City is excluded from other clubs' derived opponents; City meetings live only in the head-to-head card, sourced from `seasonData`.
4. **Name variants resolve to one row.** `clubRecord` normalises through an alias map (`Nottm Forest → Nottingham Forest`, `Tottenham Hotspur → Tottenham`, `Man City → Manchester City`) before lookup. Add an alias whenever a new display label appears.
5. **Player stats match the player's role.** Keepers get clean sheets, saves, save percentage and long-ball accuracy; defenders duels, interceptions, clearances; midfielders pass accuracy, chances created, carries; forwards shots and conversion. Zero goals reads "no goals this season", never a mins-per-goal figure.
6. **Unavailable players read as unavailable.** Status other than AVAILABLE replaces the last-five contributions with "Out — {issue}" / "Unavailable" and swaps the news set for recovery coverage.
7. Form dots run **oldest → newest**; the recent-results list runs **newest first** and says so in its header.

### State and props

`state`: `theme` (overrides the prop once the user toggles), `comp` (standings tab), `page`, `player`, `club`, `fromPage`, `now` (1s tick for the countdown). The four navigation keys (`page`, `player`, `club`, `fromPage`) are written only through `nav()`, which mirrors them into `history` — see §6.

Props (Tweaks panel): `theme` `dark|light`, `matchState` `upcoming|live`, `supporterName` (text, drives the greeting).

The countdown target is set once on mount at now + 2d 11h 42m; kickoff strings are formatted with `Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney' })`. **All times display in AEST** — the label appears in the match centre, not in the header.

---

## 10. Conventions for extending

- Inline styles only. The `<helmet>` block holds font links, the two token sets, keyframes, the interaction layer (`[data-card]`, `[data-row]`, `button`, `:focus-visible`, reduced motion) and body resets, plus the mobile override layer (§11). Nothing else belongs there — no classes, no desktop layout CSS.
- Reference tokens, never raw hex, except club badge colours which are data.
- Values that change with theme or data are computed in `renderVals()` and passed in by name; template holes are dotted paths only, never expressions.
- Repetition uses `<sc-for>` with `hint-placeholder-count`; conditionals use `<sc-if>` with `hint-placeholder-val`. Both hints are what render while the page streams — always set them.
- New card? Copy the card header object, the 24px padding and the 16px radius. New table? Copy the column template. New row list? Copy the 14px/10px bleed pattern.
- New named entity on screen? Wire its link (§6) and its tooltip if it is abbreviated.
- Verify at **1440px, ~960px and 390px**, in **both themes**, both `matchState` values, and on every standings tab — cup tabs render a different body from league tabs. The middle width is where wrapping labels break shared baselines (§5); the ends never show it.
- New layout? Give it a `data-m` role from §11 in the same edit that creates it. New navigation? Route it through `nav()` (§6).

---

## 11. Responsive and touch — the mobile mode

One template serves both modes. Mobile is a single `@media (max-width:860px)` block at the end of `<helmet>`, plus one `@media (min-width:561px) and (max-width:860px)` rule that gives tablets two card columns. Desktop rules are never touched by it.

**Why an attribute layer and not holes.** Responsive geometry cannot be inline, and it cannot be a `{{ }}` hole either — a hole cannot resolve while the page streams, so the layout would arrive last. Instead every element that needs to move carries a **`data-m` role**, and the media block styles those roles. The rules are attribute selectors, not classes: they stream with `<helmet>`, before any markup, so the first painted pixel is already correct at every width. Colour is never touched — both themes inherit through the same tokens, so the mobile layer costs nothing in the dark/light contract.

### The `data-m` vocabulary

One value per element. Reuse a role where you can; invent one only when nothing fits, and add it to this table when you do.

| role | on | mobile effect |
| --- | --- | --- |
| `root` | page wrapper | bottom padding clears the tab bar + safe area |
| `page` | full-bleed bars, header, footer | gutters 32 → 16px |
| `grid` | the four 12-column `<main>`s | becomes a 14px-gap column; children lose their `grid-column` |
| `stack` | the two flex-column `<main>`s | gutters 16px, gap 18px |
| `hide` | desktop-only chrome | `display:none` |
| `tabbar` | bottom tab bar | `display:block` (inline `none` off-mobile) |
| `card` | 24px-padded cards | padding 18px |
| `tap` | 34px secondary buttons | ≥44px, 16px side padding |
| `chiprow` | tab / filter / chip rows | full width, no wrap, horizontal scroll, children ≥44px |
| `scrollx` | inline text-tab rows | horizontal scroll, no wrap |
| `live` `livelab` `livescore` | live bar | fixed widths release, score right-aligned |
| `idle` | idle bar | height auto, wraps |
| `head` `crest` `tog` | header | 88 → 64px, crest 46 → 38px, toggle buttons 44×38 |
| `hero` `hero-teams` `hero-kick` `kick` | match centre | 18px padding, badges wrap, kickoff block drops full-width under a rule, 44 → 34px |
| `cd-wrap` `cd-row` `cd` `cd-act` | countdown | stacks; the four 74px tiles become `flex:1`; the action goes full-width at 48px |
| `table` `num` | every standings table | six columns → four (`30px / 1fr / 38px / 84px`); P and GD (`num`) drop out; form dots 19 → 14px; club names 13.5 → 13px |
| `path` | cup-path rows | wraps |
| `five` | last-five strip | 5-up grid → 140px horizontal snap-scroller |
| `cards1` / `cards2` | card grids | 1 column (2 on tablet) / 2 columns |
| `title` `statbig` `shirt` `pname` `cname` | display type | 42→32, 46/44→34, 92→68, 40→30, 34→26 |
| `mohead` `mopad` | fixtures month card | padding 24 → 16px |
| `fx` + `fx-d` `fx-b` `fx-o` `fx-c` `fx-s` `fx-v` | fixtures rows | six columns → two named areas, `"d d c"` (date, competition) over `"b o s"` (badge, opponent, score); the H/A letter drops |
| `pc` `pc-min` | by-competition table | five columns → four; MINUTES drops |
| `l5` | last-five rows | gap 10/12 → 8px |
| `backrow` `foot` | back row, footer | wrap / stack |
| `facts` | club squad-fact tiles | 4-up → 2-up by **container** width, not viewport — see below |
| `stats` | the four headline stat cards on Player and Club | 4-up → 2-up by **container** width — see below |
| `col-side` `col-main` | the two continuous profile-page columns | flatten into the single `grid` stack and adopt its 14px rhythm |
| `toasts` `tip` | the two floating nodes built in `installUI()` | toast stack goes full-width above the tab bar instead of pinned bottom-right; tooltip clamps to the viewport |

### Container queries, not viewport queries, inside cards

A tile row **inside** a card must respond to the card's width, not the window's. The club SQUAD card is ~790px at 1440 and ~485px at 960; the profile stat row is ~570px inside a `span 7` column. A viewport breakpoint is wrong at one end or the other, and now that profile pages are continuous columns (§4) the card width no longer tracks the viewport at all.

So the owning `<section>` carries `container-type:inline-size` and the grid inside carries a `data-m` role queried by container width:

| grid | container rule | effect |
| --- | --- | --- |
| `stats` | `@container (max-width:620px)` | four stat cards → 2×2 |
| `facts` | `@container (max-width:400px)` | four squad tiles → 2×2 |

Use this pattern for any tile row inside a card; do not add viewport breakpoints for one. The two container rules live outside the mobile media query — they are width logic, not mobile logic, and they hold on desktop too.

The companion fix is copy. Tile labels are **abbreviated to fit one line at the narrowest tile** — SQUAD, AVG AGE, CAPPED, ACADEMY, not SQUAD SIZE / AVERAGE AGE / INTERNATIONALS / ACADEMY GRADUATES. A 9.5px label at .1em tracking needs roughly 6.6px per character; if a label cannot fit its tile on one line, shorten the label rather than let it wrap. And never `overflow-wrap:anywhere` on a label — it breaks words mid-syllable ("INTERNATI / ONALS") and inflates the whole row's height.

### Rules for extending

1. **Mobile is subtractive, never additive.** Drop a column, stack a row, scroll a strip — never write mobile-only copy or a mobile-only panel. The two modes must always say the same thing.
2. **What may be dropped:** derived numbers recoverable elsewhere (P, GD, MINUTES, the H/A letter beside a named ground) and pure separators. **What may never be dropped:** names, scores, times, dates, availability, form.
3. **Touch minimum 44px.** Anything tappable gets `tap`, lives in a `chiprow`, or is already ≥44px. Cards and list rows are large enough as they are.
4. **No horizontal page scroll at 360px.** Any grid with a text column keeps that column `minmax(0,1fr)`; fixed columns get `white-space:nowrap`. Where five things genuinely must stay in one row, make it a snap-scroller (`five`), not a squeeze.
5. **Type floor on mobile:** 11px for labels, 13px for names. Display type shrinks by role, never below the values above.
6. **Both themes, free.** The mobile layer sets geometry and `display` only. A colour in it means the colour belongs in a token instead.
7. **Test the breakpoints, not just the ends** — 860px and 561px are where stacking and card columns flip, and 620px/400px of *container* width are where the two tile grids flip.
8. **Adding a card to a profile page?** Append it to `col-side` or `col-main` (§4). A new `span n` row re-introduces the dead-space bug those columns exist to fix.
