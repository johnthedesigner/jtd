/**
 * What the Courtside tour says, and where it points.
 *
 * Lifted out of `ProductTour` when a second experiment needed the same
 * mechanism with different words. The component is generic now; everything
 * specific to a basketball game lives here.
 *
 * Two lists because the controls on screen change: the landing has a game
 * strip and a court picker, a game in progress has a score bug, a speed
 * control and a way out, and none of the landing's controls at all. One
 * list covering both would spend half its length pointing at nothing.
 */
const TOURS = {
    landing: [
        {
            id: 'welcome',
            title: 'A basketball game, rendered',
            body: 'Every game here is drawn on a real NBA floor in 3D — the plays, the score, the lighting. Pick a game and it plays out on the court behind this card.',
        },
        {
            id: 'tabs',
            anchor: 'games-tabs',
            title: 'Live now, or anything from the past week',
            body: '“Watch live” has whatever is in progress plus the rest of the week’s schedule. “Replays” has the finished games — those start from the opening tip, not the final score.',
        },
        {
            id: 'card',
            anchor: 'game-card',
            title: 'Pick a game',
            body: 'Each card shows the matchup, the home side, and when it was played. Choosing one drops you onto that team’s home floor.',
        },
        {
            id: 'court',
            anchor: 'court-menu',
            title: 'Change the floor',
            body: 'Every team’s court is here, in its current and vintage paint. This only exists out here — inside a game the floor belongs to whoever is hosting.',
        },
    ],
    live: [
        {
            id: 'hud',
            anchor: 'live-hud',
            title: 'What just happened',
            body: 'The call, the score, the clock, and how many timeouts each side still has. Open it to read back through the plays.',
        },
        {
            id: 'floor',
            title: 'Watch the floor',
            body: 'Shots, rebounds and steals are marked where they happened, and the camera turns toward each one. The score behind the benches is part of the building, lit like everything else.',
        },
        {
            id: 'speed',
            anchor: 'playback-speed',
            title: 'Set the pace',
            body: 'A replay runs at its own speed — slow it down to watch a sequence land, or run it up to get through a quarter.',
        },
        {
            id: 'exit',
            anchor: 'exit-game',
            title: 'Back out',
            body: 'This leaves the game and returns you to the schedule, with the lights going down and back up on the way.',
        },
    ],
}

export default TOURS

/**
 * A tour nobody can find is decoration, so it runs itself the first time
 * someone lands here and then never again unless asked. Per-browser;
 * clearing site data brings it back.
 */
export const TOUR_SEEN_KEY = 'nba-court-tour-v1'

/** Says what it opens, rather than being a question mark in a corner. */
export const TOUR_LABEL = 'How to use JTD Courtside'
