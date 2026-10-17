import { useEffect } from 'react'

/**
 * A modal over the whole page.
 *
 * Rendered outside the control strip, not inside it. The strip has
 * `backdrop-filter` on it, and an element with a backdrop filter becomes
 * the containing block for any `fixed` descendant — so a "full screen"
 * overlay nested inside it is silently clipped to the strip. That is a
 * rule nothing warns about and the symptom looks like a z-index problem.
 */
export default function ServeModal({ open, onClose, labelledBy, children }) {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null
    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-5 backdrop-blur-md"
            style={{ backgroundColor: 'rgba(8, 9, 11, 0.82)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            onClick={onClose}
        >
            <div
                className="my-auto w-full max-w-[600px] rounded-xl p-7"
                style={{ backgroundColor: 'rgba(22, 24, 27, 0.97)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}
