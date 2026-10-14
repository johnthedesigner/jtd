import { useEffect, useState } from 'react'
import { OVERLAY_SCRIM, OVERLAY_BG_STRONG } from './overlay-surface'

/**
 * Says, once, that this is built for a bigger screen.
 *
 * It does not block anything. The experience genuinely works on a phone —
 * the court fits the width, the controls have phone layouts — it is just
 * that a 94-foot floor rendered across 390 points is a small thing to read,
 * and the detail the whole experiment is about does not survive it. So this
 * sets an expectation and gets out of the way, rather than refusing to
 * render.
 *
 * Keyed on width rather than on a user-agent test: what matters is how much
 * room there is, which is also true of a narrow window on a desktop, and
 * which does not go stale the way a device list does.
 */
const NARROW_MAX = 639
const SEEN_KEY = 'nba-court-small-screen-v1'

export default function SmallScreenNotice() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return
        const query = window.matchMedia(`(max-width: ${NARROW_MAX}px)`)
        if (!query.matches) return
        let seen = true
        try {
            seen = window.sessionStorage.getItem(SEEN_KEY) === '1'
        } catch {
            // Private browsing throws on access. Treat it as already shown
            // rather than reappearing on every navigation.
        }
        if (seen) return
        // Let the scene light up first; arriving on top of a loading screen
        // makes it read as an error rather than as a note.
        const timer = setTimeout(() => {
            try {
                window.sessionStorage.setItem(SEEN_KEY, '1')
            } catch {
                /* nothing to do */
            }
            setOpen(true)
        }, 1400)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open])

    if (!open) return null

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center p-5 backdrop-blur-sm"
            style={{ backgroundColor: OVERLAY_SCRIM }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="small-screen-title"
            onClick={() => setOpen(false)}
        >
            <div
                className="w-full max-w-[320px] rounded-sm p-5 ring-1 ring-white/15"
                style={{ backgroundColor: OVERLAY_BG_STRONG }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2
                    id="small-screen-title"
                    className="font-sans text-base font-bold leading-snug text-white"
                >
                    Better on a bigger screen
                </h2>
                <p className="mb-0 mt-2 font-sans text-xs leading-relaxed text-white/65">
                    This one renders a full arena floor in 3D, and most of what
                    makes it worth looking at — the lighting on the boards, the
                    marks out on the court — is hard to see at this size. It all
                    works here, but a laptop does it justice.
                </p>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-4 min-h-[36px] w-full rounded-sm bg-white px-3 font-sans text-[11px] font-bold uppercase tracking-wider text-[#0b0d12] transition-colors hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    Have a look anyway
                </button>
            </div>
        </div>
    )
}
