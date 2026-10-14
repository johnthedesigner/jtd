import { useEffect } from 'react'
import { ERAS, TEAM_NAMES } from './constants'
import { teamLogoUrl } from './live/nba-teams'
import CourtGlyph, { COURT_ASPECT } from './CourtGlyph'
import { OVERLAY_BG, OVERLAY_SCRIM } from './overlay-surface'

/**
 * Which court is on the floor.
 *
 * Only exists on the landing view: once a game is open the court belongs to
 * that game's home team, and offering to change it there would mean
 * watching Boston play in Denver's building.
 *
 * The trigger carries the current team's own mark rather than a gear,
 * because that is what it changes — the button says what the floor is, and
 * opening it is obviously about picking a different one. It is shaped like
 * a court too, at the real 94:50, with the markings drawn behind the mark:
 * the thing being chosen is a floor, so the button is a floor.
 *
 * A modal over a blurred court rather than a flyout: thirty logos is a
 * grid, not a list, and a grid large enough to recognise a mark at a glance
 * covers most of the screen anyway. Better to commit to that than to have a
 * panel fighting the scene behind it.
 */
/** The trigger's width; its height is this over the court's aspect. */
const COURT_WIDTH_PX = 96

export default function CourtMenu({ team, era, onTeam, onEra, teamList, open, onOpen, onClose }) {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    const logo = teamLogoUrl(team)

    return (
        <>
            <button
                type="button"
                onClick={onOpen}
                aria-haspopup="dialog"
                aria-expanded={open}
                data-tour="court-menu"
                aria-label={`Court: ${TEAM_NAMES[team] ?? team}. Choose another`}
                title={`Court: ${TEAM_NAMES[team] ?? team}`}
                // Upper right, but below the site header — the nav floats
                // over this canvas and owns the very top of that corner.
                // Height follows from the width and the court's own ratio
                // rather than being a second number to keep in step.
                className="absolute right-4 top-20 z-20 flex items-center justify-center overflow-hidden rounded-sm ring-1 ring-white/10 backdrop-blur transition-[box-shadow] hover:ring-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-6"
                style={{
                    width: COURT_WIDTH_PX,
                    height: COURT_WIDTH_PX / COURT_ASPECT,
                    backgroundColor: OVERLAY_BG,
                }}
            >
                {/*
                  Inset so the sidelines read as lines rather than as the
                  button's own border, and faint enough to stay behind the
                  mark instead of competing with it.
                */}
                <CourtGlyph className="absolute inset-[3px] h-auto w-[calc(100%-6px)] text-white/25" />
                {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={logo}
                        alt=""
                        width={34}
                        height={34}
                        className="relative h-[34px] w-[34px] object-contain"
                        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }}
                    />
                ) : (
                    <span className="relative font-sans text-xs font-bold uppercase text-white/70">
                        {team}
                    </span>
                )}
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Choose a court"
                    className="absolute inset-0 z-30 flex flex-col backdrop-blur-md"
                    style={{ backgroundColor: OVERLAY_SCRIM }}
                >
                    {/* Clear of the site header, which floats over this canvas. */}
                    <div className="flex shrink-0 items-center justify-between gap-4 px-4 pb-4 pt-20 sm:px-8">
                        <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-white/70">
                            Choose a court
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1 rounded-sm bg-white/10 p-1">
                                {ERAS.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => onEra(option)}
                                        aria-pressed={era === option}
                                        className={`min-h-[34px] rounded-sm px-3.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                                            era === option
                                                ? 'bg-white text-[#0b0d12]'
                                                : 'text-white/70 hover:text-white'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="min-h-[40px] min-w-[40px] rounded-sm font-sans text-base text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/*
                      `items-center` on a scroll container centres the grid
                      while it fits and still scrolls once it doesn't —
                      `justify-center` on the block would strand the top rows
                      above the scrollable area the moment it overflowed.
                      The top padding matches the bottom so the first row's
                      selected ring isn't shaved off by the scroll edge.
                    */}
                    <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-6 sm:px-8">
                        <div className="m-auto grid w-full max-w-5xl grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                            {teamList.map(([abbr, name]) => {
                                const src = teamLogoUrl(abbr)
                                const current = abbr === team
                                return (
                                    <button
                                        key={abbr}
                                        type="button"
                                        onClick={() => {
                                            onTeam(abbr)
                                            onClose()
                                        }}
                                        aria-pressed={current}
                                        title={name}
                                        className={`flex flex-col items-center gap-2.5 rounded-sm px-2 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                                            current
                                                ? 'bg-white/15 ring-1 ring-white/40'
                                                : 'hover:bg-white/10'
                                        }`}
                                    >
                                        {src ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={src}
                                                alt=""
                                                width={88}
                                                height={88}
                                                className="h-[88px] w-[88px] object-contain"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span className="h-[88px] w-[88px]" />
                                        )}
                                        <span className="font-sans text-[17px] font-bold uppercase tracking-wider text-white/70">
                                            {abbr}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
