/**
 * How fast a finished game plays back.
 *
 * Only shown while replaying: a live game arrives at the speed it is being
 * played, and there is nothing to speed up.
 *
 * `1x` is the pace replay already ran at before this control existed
 * (`DEFAULT_INTERVAL_MS`), so the default changes nothing for anyone who
 * ignores it — the faster options are for getting through a quarter, and
 * the half-speed one for watching a sequence land.
 *
 * Positioned by whoever renders it rather than pinning itself to a corner:
 * it now lives in the score overlay's own bottom row, beside the tour
 * button, so the controls for watching a game are all in one place instead
 * of scattered around the edges of the court.
 */
export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4]

export default function PlaybackSpeed({ active, speed, onSpeed }) {
    if (!active) return null

    return (
        <div
            data-tour="playback-speed"
            className="flex items-center gap-1 rounded-sm p-1"
            role="group"
            aria-label="Playback speed"
        >
            <span className="hidden px-1.5 font-sans text-[10px] font-bold uppercase tracking-wider text-white/40 sm:inline">
                Speed
            </span>
            {PLAYBACK_SPEEDS.map((value) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => onSpeed(value)}
                    aria-pressed={speed === value}
                    className={`min-h-[26px] rounded-sm px-2 font-sans text-[11px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                        speed === value
                            ? 'bg-white text-[#0b0d12]'
                            : 'text-white/60 hover:text-white'
                    }`}
                >
                    {value}&times;
                </button>
            ))}
        </div>
    )
}
