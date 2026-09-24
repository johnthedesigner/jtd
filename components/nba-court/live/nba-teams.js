import { TEAM_NAMES } from '../constants'

/**
 * Bridges ESPN's own team identifiers to this app's existing team key — the
 * lowercase tricode already used everywhere for court textures
 * (`constants.js`'s `TEAM_NAMES`). ESPN identifies teams by both a stable
 * numeric id and its own abbreviation, in the scoreboard, box score, and
 * play-by-play alike; both need to resolve to this app's own key so a live
 * game can drive `setTeam(...)` directly and pick up the right court art.
 *
 * Pulled directly from ESPN's own teams endpoint
 * (`site.api.espn.com/apis/site/v2/sports/basketball/nba/teams`), not
 * guessed — 6 of ESPN's 30 abbreviations don't match this app's tricode key
 * (`GS`, `NO`, `NY`, `SA`, `UTAH`, `WSH`), which is exactly the kind of
 * mismatch that only turns up against the real payload; the other 24 match
 * their lowercased form directly.
 */
const ESPN_ID_TO_TRICODE = {
    1: 'atl',
    2: 'bos',
    17: 'bkn',
    30: 'cha',
    4: 'chi',
    5: 'cle',
    6: 'dal',
    7: 'den',
    8: 'det',
    9: 'gsw',
    10: 'hou',
    11: 'ind',
    12: 'lac',
    13: 'lal',
    29: 'mem',
    14: 'mia',
    15: 'mil',
    16: 'min',
    3: 'nop',
    18: 'nyk',
    25: 'okc',
    19: 'orl',
    20: 'phi',
    21: 'phx',
    22: 'por',
    23: 'sac',
    24: 'sas',
    28: 'tor',
    26: 'uta',
    27: 'was',
}

const TRICODE_TO_ESPN_ID = Object.fromEntries(
    Object.entries(ESPN_ID_TO_TRICODE).map(([id, tricode]) => [tricode, Number(id)])
)

/** ESPN abbreviations that don't match this app's own tricode key directly. */
const ESPN_ABBR_OVERRIDE = {
    gs: 'gsw',
    no: 'nop',
    ny: 'nyk',
    sa: 'sas',
    utah: 'uta',
    wsh: 'was',
}

export function espnIdToTricode(espnTeamId) {
    return ESPN_ID_TO_TRICODE[Number(espnTeamId)] ?? null
}

export function tricodeToEspnId(tricode) {
    return TRICODE_TO_ESPN_ID[tricode] ?? null
}

/** Normalizes an abbreviation as ESPN spells it to this app's own team key. */
export function espnAbbrToTeam(abbr) {
    if (!abbr) return null
    const lower = abbr.toLowerCase()
    const mapped = ESPN_ABBR_OVERRIDE[lower] ?? lower
    return TEAM_NAMES[mapped] ? mapped : null
}

/**
 * ESPN's logo CDN keys most teams by the same tricode this app uses, but
 * not all — verified by request, not assumed: `uta.png` and `nop.png` both
 * 404, while `utah.png` and `no.png` serve. (`ny`/`nyk`, `sa`/`sas`,
 * `gs`/`gsw`, `wsh`/`was` all resolve either way, so only the two real
 * mismatches are listed.)
 */
const LOGO_SLUG_OVERRIDE = {
    uta: 'utah',
    nop: 'no',
}

/** `https://a.espncdn.com/i/teamlogos/nba/500/{slug}.png` for a team. */
export function teamLogoUrl(tricode) {
    if (!tricode) return null
    const slug = LOGO_SLUG_OVERRIDE[tricode] ?? tricode
    return `https://a.espncdn.com/i/teamlogos/nba/500/${slug}.png`
}
