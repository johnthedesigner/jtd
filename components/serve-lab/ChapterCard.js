import { READOUTS } from './chapters'
import SpeedChart from './SpeedChart'
import { PlayIcon, PauseIcon, ReplayIcon, ChevronLeft, ChevronRight } from './icons'

/**
 * The control strip: which chapter this is, what it claims, and four
 * controls.
 *
 * Dark and neutral rather than tinted to the court, and with no outline.
 * The scene behind it is a saturated cyan under coloured lamps, and a
 * panel that joins in competes with it; a near-black sheet with enough
 * blur reads as something laid over the picture rather than as part of it.
 *
 * One transport button, not two. It was showing Play beside Replay with
 * both meaning the same thing at the end of a chapter.
 */

const SURFACE = { backgroundColor: 'rgba(16, 17, 19, 0.74)' }

const BTN =
    'inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-wider transition-colors'
/*
  `text-white/45` when disabled rather than `opacity-25`. A quarter-opacity
  white on this panel lands near 2.4:1 against it, which is below any
  reasonable floor; 45% measures about 4.6:1 and still reads as off.
*/
const QUIET =
    `${BTN} text-white ring-1 ring-white/25 hover:bg-white/10 hover:ring-white/45 ` +
    'disabled:pointer-events-none disabled:text-white/45 disabled:ring-white/12 disabled:hover:bg-transparent'

function Readout({ spec, value }) {
    if (value == null) return null
    const scaled = value * (spec.scale ?? 1)
    const shown = spec.absolute ? Math.abs(scaled) : scaled
    return (
        <span className="whitespace-nowrap font-mono text-[12px] tabular-nums text-white/50">
            <span className="text-white/30">{spec.label} </span>
            <span className="text-white/80">{shown.toFixed(spec.digits)}</span>
            <span className="text-white/30">{spec.unit}</span>
        </span>
    )
}

export default function ChapterCard({
    intro, chapter, index, total, playing, atEnd,
    readoutValues, chartProps,
    onStart, onPlay, onPause, onReplay, onNext, onBack, onReadMore, onAppendix, onRestart,
}) {
    if (intro) {
        return (
            <div className="mx-auto max-w-[540px] rounded-xl p-6 text-center backdrop-blur-md" style={SURFACE}>
                {/* No title here: it is painted on the court behind this. */}
                <p className="mx-auto my-0 max-w-[46ch] font-sans text-[14.5px] leading-relaxed text-white">
                    {intro.body}
                </p>
                <button
                    type="button" data-intro-start onClick={onStart}
                    className={`${BTN} mt-5 min-h-[38px] bg-white px-7 text-[12px] text-[#0b0c0e] hover:bg-white/85`}
                >
                    <PlayIcon /> Play
                </button>
                <div className="mt-4">
                    <button
                        type="button" data-appendix onClick={onAppendix}
                        className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/35 transition-colors hover:text-white/70"
                    >
                        About this
                    </button>
                </div>
            </div>
        )
    }
    if (!chapter) return null

    const isLast = index === total - 1
    const Transport = playing ? PauseIcon : atEnd ? ReplayIcon : PlayIcon
    const transportLabel = playing ? 'Pause' : atEnd ? 'Replay' : 'Play'

    return (
        <div className="overflow-hidden rounded-xl backdrop-blur-md" style={SURFACE}>
            <div className="flex gap-4 px-5 py-4 sm:gap-6">
                {/* The number gets its own column so the title can sit
                    directly on top of the copy it belongs to. */}
                <div className="shrink-0 pt-0.5 text-center">
                    <div className="font-mono text-[26px] leading-none tabular-nums text-white/85">
                        {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="mt-0.5 font-mono text-[12px] leading-none tabular-nums text-white/30">
                        /{String(total).padStart(2, '0')}
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        <button
                            type="button" data-nav="back" onClick={onBack} disabled={index === 0}
                            aria-label="Previous chapter"
                            className={QUIET}
                        >
                            <ChevronLeft />
                            <span className="sr-only sm:not-sr-only">Previous</span>
                        </button>
                        <button
                            type="button" data-nav="play"
                            onClick={() => (playing ? onPause() : atEnd ? onReplay() : onPlay())}
                            aria-label={transportLabel}
                            className={`${BTN} min-h-[34px] bg-white px-5 text-[#0b0c0e] hover:bg-white/85`}
                        >
                            <Transport /> {transportLabel}
                        </button>
                        {isLast ? (
                            <button type="button" data-nav="restart" onClick={onRestart} aria-label="Start over" className={QUIET}>
                                <ReplayIcon />
                                <span className="sr-only sm:not-sr-only">Start over</span>
                            </button>
                        ) : (
                            <button type="button" data-nav="next" onClick={onNext} aria-label="Next chapter" className={QUIET}>
                                <span className="sr-only sm:not-sr-only">Next</span>
                                <ChevronRight />
                            </button>
                        )}

                        {chapter.readouts.length > 0 && (
                            /*
                              Their own full-width row below the controls on
                              a phone, left-aligned with everything else;
                              pushed to the right of the controls only once
                              there is room beside them.
                            */
                            <span className="order-last w-full flex flex-wrap items-center gap-x-4 gap-y-0.5 sm:order-none sm:ml-auto sm:w-auto">
                                {chapter.readouts.map((key) => (
                                    <Readout key={key} spec={READOUTS[key]} value={readoutValues[key]} />
                                ))}
                            </span>
                        )}
                        {/*
                          Not on a phone. The row is already carrying three
                          controls and a set of live figures in 390 points,
                          and this is the one thing there that is not about
                          the chapter you are reading. It stays on the
                          landing overlay, which is where someone deciding
                          whether to trust any of this would look for it.
                        */}
                        <button
                            type="button" data-appendix onClick={onAppendix}
                            className={`hidden ${chapter.readouts.length ? 'sm:ml-0 ' : ''}ml-auto sm:inline-block font-sans text-[10px] font-bold uppercase tracking-wider text-white/30 transition-colors hover:text-white/70`}
                        >
                            About this
                        </button>
                    </div>

                    <h2 className="m-0 font-sans text-[17px] font-bold leading-tight text-white">
                        {chapter.title}
                    </h2>
                    <button
                        type="button" data-read-more onClick={onReadMore}
                        className="group mt-1.5 block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                    >
                        {/*
                          Headline colour, not a dimmed grey: at this size
                          the copy is the content.

                          No `block` here. `line-clamp-*` works by setting
                          `display: -webkit-box`, and a `block` utility
                          beside it silently wins or loses depending on
                          which lands later in the sheet — which is how
                          this was showing four and five lines on a phone
                          while claiming to clamp at three.
                        */}
                        <span className="line-clamp-3 min-h-[4.5em] font-sans text-[14px] leading-[1.5] text-white sm:line-clamp-2 sm:min-h-[3em]">
                            {chapter.body}
                        </span>
                        <span className="mt-0.5 inline-block font-sans text-[10px] font-bold uppercase tracking-wider text-white/45 transition-colors group-hover:text-white">
                            Read more
                        </span>
                    </button>

                    {chartProps && (
                        <div className="mt-2.5">
                            <SpeedChart {...chartProps} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
