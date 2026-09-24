import { useEffect, useRef, useState } from 'react'
import { ERAS, TEAM_NAMES } from './constants'
import { VIEWS, VIEW_ORDER } from './views'
import { PROFILES } from './shot-data'

/**
 * Everything that used to sit permanently across the bottom — team, view,
 * era, shot profile — folded behind one gear. The bottom bar's primary job
 * is now picking a game, and these are the knobs of the standalone court
 * experiment rather than anything you'd reach for mid-game.
 *
 * `CourtViewer` only mounts this outside the live view: once a game is
 * open, the court, the teams, and the camera are all dictated by that game,
 * so there'd be nothing here that isn't either fixed or a way to break the
 * thing you're watching.
 *
 * Dark-arena palette with `components/ui`'s Button metrics (36-44px target,
 * bold sans, rounded-sm, visible focus ring), same as the rest of this HUD.
 */

function GearIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
            aria-hidden
        >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    )
}

function Section({ label, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-white/40">
                {label}
            </span>
            {children}
        </div>
    )
}

export default function SettingsFlyout({
    team,
    era,
    onTeam,
    onEra,
    teamList,
    viewId,
    onView,
    profile,
    onProfile,
}) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef(null)
    const view = VIEWS[viewId]

    // Click-away and Escape, so the panel never strands itself over the
    // court with no obvious way back.
    useEffect(() => {
        if (!open) return
        const onDown = (e) => {
            if (!wrapRef.current?.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('pointerdown', onDown)
        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('pointerdown', onDown)
            window.removeEventListener('keydown', onKey)
        }
    }, [open])

    const chip = (active) =>
        `min-h-[36px] rounded-sm px-4 font-sans text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
            active ? 'bg-white text-[#0b0d12]' : 'text-white/70 hover:text-white'
        }`

    return (
        <div ref={wrapRef} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-label="Court settings"
                title="Court settings"
                className={`flex h-[44px] w-[44px] items-center justify-center rounded-sm backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                    open ? 'bg-white text-[#0b0d12]' : 'bg-white/10 text-white/70 hover:text-white'
                }`}
            >
                <GearIcon />
            </button>

            {open && (
                <div className="absolute bottom-[52px] right-0 z-20 w-[min(88vw,520px)] rounded-sm bg-[#0b0d12]/95 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur">
                    <div className="flex flex-col gap-4">
                        <h2 className="font-sans text-base font-bold text-white">
                            {TEAM_NAMES[team]}
                        </h2>

                        <Section label="View">
                            <div className="flex flex-wrap gap-1 rounded-sm bg-white/10 p-1">
                                {VIEW_ORDER.map((id) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => onView(id)}
                                        aria-pressed={viewId === id}
                                        className={chip(viewId === id)}
                                    >
                                        {VIEWS[id].label}
                                    </button>
                                ))}
                            </div>
                        </Section>

                        <Section label="Era">
                            <div className="flex gap-1 self-start rounded-sm bg-white/10 p-1">
                                {ERAS.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => onEra(option)}
                                        aria-pressed={era === option}
                                        className={chip(era === option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </Section>

                        {view.overlay === 'shots' && (
                            <Section label={view.legend || 'Shot profile'}>
                                <div className="flex gap-1 self-start rounded-sm bg-white/10 p-1">
                                    {Object.entries(PROFILES).map(([id, p]) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => onProfile(id)}
                                            aria-pressed={profile === id}
                                            className={chip(profile === id)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </Section>
                        )}

                        <Section label="Team">
                            <div
                                className="flex max-h-[132px] flex-wrap gap-1.5 overflow-y-auto"
                                role="group"
                                aria-label="Team"
                            >
                                {teamList.map(([abbr, name]) => (
                                    <button
                                        key={abbr}
                                        type="button"
                                        onClick={() => onTeam(abbr)}
                                        aria-pressed={team === abbr}
                                        title={name}
                                        className={`min-h-[36px] shrink-0 rounded-sm px-3 font-sans text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                                            team === abbr
                                                ? 'bg-white text-[#0b0d12]'
                                                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                        }`}
                                    >
                                        {abbr}
                                    </button>
                                ))}
                            </div>
                        </Section>
                    </div>
                </div>
            )}
        </div>
    )
}
