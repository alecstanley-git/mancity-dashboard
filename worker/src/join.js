/**
 * Reconciling one player across three providers.
 *
 * football-data.org names the squad, ESPN holds the shirt number and the
 * physical detail, FPL holds availability and the underlying numbers. None of
 * them shares an id with the others.
 *
 * Date of birth is the join key. Measured on City's squad:
 *
 *   surname match   22 of 26   fails on players filed under a full legal name
 *                              -- "de Oliveira Nunes dos Reis" for Vitor Reis,
 *                              "Moreira de Oliveira" for Savinho,
 *                              "González Iglesias" for Nico González
 *   DOB match       25 of 26   the miss is a player ESPN's roster omits
 *                              entirely, which is an absence and not a failure
 *
 * So DOB first, normalised surname second, and nothing at all third. A player
 * who matches nowhere keeps the fields football-data.org gave and nulls the
 * rest, which is what makes the panel say "Failed to fetch" for that player
 * rather than borrow another player's numbers.
 */

/** Strip accents, punctuation and case so surnames compare across providers. */
export function normalise(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim();
}

/** The last word of a name, which is the surname often enough to be a fallback. */
const surnameOf = (name) => {
  const parts = normalise(name).split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
};

/**
 * Build a surname lookup over an index keyed by date of birth.
 *
 * A surname shared by two players in one squad is dropped rather than guessed
 * at, so the fallback can never attach the wrong player's data.
 */
function surnameIndex(byDob) {
  const counts = new Map();
  const found = new Map();

  for (const entry of Object.values(byDob || {})) {
    const key = surnameOf(entry?.name);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
    found.set(key, entry);
  }

  const out = new Map();
  for (const [key, entry] of found) if (counts.get(key) === 1) out.set(key, entry);
  return out;
}

/**
 * Look one player up in a provider index.
 *
 * @param byDob  provider index keyed by YYYY-MM-DD date of birth
 * @param dob    the player's date of birth, from football-data.org
 * @param name   the player's name, used only if the date of birth misses
 */
export function lookup(byDob, dob, name, surnames = null) {
  if (!byDob) return null;

  const key = dob ? String(dob).slice(0, 10) : null;
  if (key && byDob[key]) return byDob[key];

  const table = surnames || surnameIndex(byDob);
  const surname = surnameOf(name);
  return (surname && table.get(surname)) || null;
}

/**
 * Merge the extra providers into a squad already built by football-data.org.
 *
 * The football-data squad stays the source of who is in the squad; the others
 * only add fields to players who are already there. That ordering matters --
 * FPL lists players on loan elsewhere and ESPN's roster lags on new signings,
 * so letting either define membership would change who the site says plays for
 * City.
 *
 * One exception to football-data.org owning membership: a player the Premier
 * League reports has joined another club is dropped. football-data.org kept
 * Rodri, Reijnders and Phillips in City's squad after all three had left, and
 * listing a player as City's while the transfer desk reports him gone is a
 * contradiction the reader would have to resolve. Removing a departure on the
 * strength of the PL's own note is correcting stale data, not inventing any.
 *
 * @param groups   squad groups from `footballdata.toSquad`
 * @param dobs     player name -> date of birth, from the same team payload
 * @param espn     roster index from `espn.toRosterIndex`
 * @param fpl      player index from `fpl.toPlayerIndex`
 * @param departed index from `fpl.toDepartedIndex`
 */
export function mergeSquad(groups, dobs, espn, fpl, departed = null) {
  if (!groups || !groups.length) return groups;

  const espnSurnames = surnameIndex(espn);
  const fplSurnames = surnameIndex(fpl);
  const goneSurnames = surnameIndex(departed);

  return groups
    .map((g) => ({
    group: g.group,
    players: g.players
      .filter((p) => !lookup(departed, dobs?.[p.name] || null, p.name, goneSurnames))
      .map((p) => {
      const dob = dobs?.[p.name] || null;
      const e = lookup(espn, dob, p.name, espnSurnames);
      const f = lookup(fpl, dob, p.name, fplSurnames);

      return {
        ...p,
        // Shirt number exists in exactly one of the three providers.
        num: e?.num ?? p.num ?? null,
        height: e?.height ?? null,
        weight: e?.weight ?? null,
        // Two portrait sources, because neither is complete and neither is
        // reliable on its own: the Premier League's CDN 403s for some recent
        // signings, and ESPN has no headshot for others. The frontend tries
        // them in order and falls back to the placeholder if both fail.
        photo: f?.photo ?? null,
        altPhoto: e?.headshot ?? null,
        flag: e?.flag ?? null,
        joined: f?.joined ?? null,
        // Availability. Null stays null: no feed reaching this player means the
        // chip reports that, rather than assuming the player is fit.
        st: f?.st ?? p.st ?? null,
        // Minutes and the underlying numbers are Premier League only, which is
        // what the panels reading them are labelled.
        minutes: f?.minutes ?? null,
        starts: f?.starts ?? null,
        xg: f?.xg ?? null,
        xa: f?.xa ?? null,
        xg90: f?.xg90 ?? null,
        xa90: f?.xa90 ?? null,
        xgi90: f?.xgi90 ?? null,
        // Involvement and discipline.
        tackles: f?.tackles ?? null,
        cbi: f?.cbi ?? null,
        recoveries: f?.recoveries ?? null,
        yellows: f?.yellows ?? null,
        reds: f?.reds ?? null,
        saves: f?.saves ?? null,
        cleanSheets: f?.cleanSheets ?? null,
        goalsConceded: f?.goalsConceded ?? null,
        // Set-piece duty, which unlike the counting stats says something real
        // before a ball has been kicked.
        pens: f?.pens ?? null,
        freeKicks: f?.freeKicks ?? null,
        corners: f?.corners ?? null,
        fplId: f?.fplId ?? null,
      };
    }),
  }))
    .filter((g) => g.players.length);
}

/**
 * Squad totals, counted off the merged squad rather than off any one provider.
 *
 * This has to be derived here or the card contradicts the page beside it: FPL
 * counts 26 City players, football-data.org 34, and the merged squad 30. A card
 * reading "26 players" above a list of 30 is a contradiction the reader has to
 * resolve, so both now count the same thing.
 */
export function squadFacts(groups) {
  if (!groups || !groups.length) return null;
  const players = groups.flatMap((g) => g.players);
  if (!players.length) return null;

  const keepers = groups.find((g) => g.group === 'GOALKEEPERS')?.players.length || 0;
  const ages = players.map((p) => p.age).filter((a) => typeof a === 'number');

  return [
    { label: 'SQUAD SIZE', value: String(players.length) },
    { label: 'AVERAGE AGE', value: ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : null },
    { label: 'GOALKEEPERS', value: String(keepers) },
    { label: 'OUTFIELD', value: String(players.length - keepers) },
  ];
}

/** How well the sources lined up, for /api/health. */
export function joinReport(groups, dobs, espn, fpl) {
  if (!groups) return null;
  const players = groups.flatMap((g) => g.players);
  const espnSurnames = surnameIndex(espn);
  const fplSurnames = surnameIndex(fpl);

  let espnHits = 0;
  let fplHits = 0;
  for (const p of players) {
    const dob = dobs?.[p.name] || null;
    if (lookup(espn, dob, p.name, espnSurnames)) espnHits += 1;
    if (lookup(fpl, dob, p.name, fplSurnames)) fplHits += 1;
  }
  return { squad: players.length, espn: espnHits, fpl: fplHits };
}

/**
 * Rename each injury to the squad's own spelling of the player.
 *
 * The treatment room links a player by name, and the squad page is keyed by
 * football-data.org's spelling while the availability feed uses the Premier
 * League's. They disagree often enough to matter: "Jérémy Doku" against
 * "Jeremy Doku" is one character, and it was enough to make the link open an
 * empty profile.
 *
 * Matching is by date of birth, the same key the squad merge uses. A player the
 * squad does not contain — someone on loan elsewhere, say — keeps the feed's
 * name and is marked `linkable: false`, so the card shows the absence without
 * offering a link to a page that would have nothing on it.
 */
export function attachSquadNames(injuries, groups, dobs) {
  if (!injuries || !injuries.length) return injuries;

  const byDob = new Map();
  const bySurname = new Map();
  const clash = new Set();

  for (const g of groups || []) {
    for (const p of g.players) {
      const dob = dobs?.[p.name];
      if (dob) byDob.set(String(dob).slice(0, 10), p.name);
      const key = normalise(p.name).split(/\s+/).pop();
      if (!key) continue;
      if (bySurname.has(key)) clash.add(key);
      bySurname.set(key, p.name);
    }
  }

  return injuries.map((i) => {
    const key = i.dob ? String(i.dob).slice(0, 10) : null;
    const surname = normalise(i.name).split(/\s+/).pop();
    const matched =
      (key && byDob.get(key)) || (surname && !clash.has(surname) && bySurname.get(surname)) || null;
    return { ...i, name: matched || i.name, linkable: !!matched };
  });
}

/**
 * Mark which scorers still have a squad page to open.
 *
 * The competition's scorer list keeps a player who scored for City and has
 * since left, but the squad drops him — so his name would link to an empty
 * profile. Same failure the treatment room had, from the opposite direction.
 */
export function markLinkable(rows, groups) {
  if (!rows || !rows.length) return rows;
  const names = new Set((groups || []).flatMap((g) => g.players.map((p) => p.name)));
  return rows.map((r) => ({ ...r, linkable: names.has(r.name) }));
}
