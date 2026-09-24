import template from '../../public/nba-courts/template.json'

/**
 * Court geometry, in feet, derived from the normalized atlas in
 * `/public/nba-courts`. Every image shares one canvas and one court rect, so
 * the plane and its UVs are the same for all 60 textures — switching teams is
 * a texture swap and nothing else.
 */
const PPF = template.pixelsPerFoot

/** The whole image, apron included: 126ft x 62ft. */
export const PLANE_LENGTH = template.canvas.width / PPF
export const PLANE_WIDTH = template.canvas.height / PPF

/** The playing surface, outer edge of the boundary lines: 94ft x 50ft. */
export const COURT_LENGTH = template.court.width / PPF
export const COURT_WIDTH = template.court.height / PPF

/** Half-extents, which is what the light-pool mask actually wants. */
export const COURT_HALF = [COURT_LENGTH / 2, COURT_WIDTH / 2]

export const TEAM_NAMES = {
    atl: 'Atlanta Hawks',
    bkn: 'Brooklyn Nets',
    bos: 'Boston Celtics',
    cha: 'Charlotte Hornets',
    chi: 'Chicago Bulls',
    cle: 'Cleveland Cavaliers',
    dal: 'Dallas Mavericks',
    den: 'Denver Nuggets',
    det: 'Detroit Pistons',
    gsw: 'Golden State Warriors',
    hou: 'Houston Rockets',
    ind: 'Indiana Pacers',
    lac: 'LA Clippers',
    lal: 'Los Angeles Lakers',
    mem: 'Memphis Grizzlies',
    mia: 'Miami Heat',
    mil: 'Milwaukee Bucks',
    min: 'Minnesota Timberwolves',
    nop: 'New Orleans Pelicans',
    nyk: 'New York Knicks',
    okc: 'Oklahoma City Thunder',
    orl: 'Orlando Magic',
    phi: 'Philadelphia 76ers',
    phx: 'Phoenix Suns',
    por: 'Portland Trail Blazers',
    sac: 'Sacramento Kings',
    sas: 'San Antonio Spurs',
    tor: 'Toronto Raptors',
    uta: 'Utah Jazz',
    was: 'Washington Wizards',
}

export const TEAMS = Object.keys(TEAM_NAMES).sort()
export const ERAS = ['current', 'vintage']

export function courtImageUrl(team, era) {
    return `/nba-courts/${era}_${team}.webp`
}

/**
 * The house lighting rig: two banks of spotlights, one just outside each
 * sideline, as in a real arena.
 *
 * Each bank is divided into groups, and within a group each successive fixture
 * is aimed a little further along the floor than the last, so the group fans
 * across the court. Every point ends up lit from six or eight directions at
 * once, which is how arenas kill shadows — and, more usefully here, it means a
 * given viewpoint sees each fixture reflected at a different intensity
 * depending on how square its aim is to that reflection. That variation is the
 * whole point; a uniform grid reflects as a uniform pattern and reads as CG.
 *
 * The fixtures are never drawn. They exist as the thing the floor reflects and,
 * later, as the source of the shafts in the haze.
 */
export const LIGHT_RIG = {
    /**
     * Height is set by where the reflections land, not by arena convention.
     * A floor point reflects a bank when the bank's elevation from that point
     * matches the camera's elevation to it, so with banks 31ft off centre and
     * a 30 degree rake, centre court reflects a rig at about 31 x tan(30) = 18
     * feet. Hung at a realistic 42 the reflections sit out at the near edge
     * instead, which is where they were.
     */
    height: 50,
    rowZ: 61,
    /**
     * Four groups of four per bank, sixteen heads in all.
     *
     * Spacing is deliberately uneven: heads sit close together inside a group
     * and the gap between groups is wider, which is how a real truss is
     * populated and reads far less mechanically than an even row. The span
     * works out at about 140ft — a quarter of a court length past each
     * baseline, as the ceiling truss runs.
     */
    perRow: 16,
    groupSize: 4,
    inGroupSpacing: 6.5,
    groupGap: 14,
    /** Half-width of one square head, in feet. */
    fixtureRadius: 0.85,
    /** How far each group fans its aim along the floor, in feet. */
    sweepSpan: 46,
    /** How far across the court a bank aims, in feet from the centre line. */
    aimCross: 14,
    /** Cone half-angles in degrees: full brightness inside, nothing outside. */
    coneInner: 16,
    coneOuter: 33,
}
