import { useEffect, useState } from 'react'

/**
 * What the viewport actually measures, on the device in your hand.
 *
 * Enabled with `?vp` on the URL. This exists because the bottom of this
 * page kept landing under iOS Safari's toolbar and there is no way to
 * reproduce that locally — headless Chrome has no browser chrome, so every
 * viewport unit and every safe-area inset reads the same there. Two blind
 * fixes missed. This turns the next round into reading numbers off a
 * screenshot instead of guessing again.
 *
 * Deliberately pinned to the *top* of the screen: the thing being
 * diagnosed is the bottom, and a readout that is itself cut off is no use.
 */
export default function ViewportReadout() {
    const [on, setOn] = useState(false)
    const [data, setData] = useState(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        /*
          Available in production too, deliberately.

          It was development-only, which sounds right and made it useless:
          the bug it exists to diagnose only happens on a phone, and the
          build a phone loads is a production one. Gating it to development
          meant the one tool for the job was absent every time it was
          needed. It is a couple of kilobytes behind a query string nobody
          will type by accident.
        */
        if (!new URLSearchParams(window.location.search).has('vp')) return
        setOn(true)

        const probe = document.createElement('div')
        probe.style.cssText = 'position:absolute;visibility:hidden;top:0;left:0;width:1px'
        document.body.appendChild(probe)
        const unit = (u) => {
            probe.style.height = `100${u}`
            return Math.round(probe.getBoundingClientRect().height)
        }
        const inset = (side) => {
            probe.style.height = `env(safe-area-inset-${side}, 0px)`
            return Math.round(probe.getBoundingClientRect().height)
        }

        const read = () => {
            const vv = window.visualViewport
            // The *panel*, not its wrapper: the wrapper is pinned to
            // `bottom: 0` so its edge is always the bottom of the box by
            // definition, and measuring it would report "fine" while the
            // panel inside it sat under the toolbar.
            const overlay = document.querySelector('[data-bottom-overlay]')
            const panel = overlay?.firstElementChild ?? overlay
            const box = panel?.getBoundingClientRect()
            const content = document.querySelector('.content')?.getBoundingClientRect()
            setData({
                inner: window.innerHeight,
                vv: vv ? Math.round(vv.height) : null,
                vvOffsetTop: vv ? Math.round(vv.offsetTop) : null,
                vvPageTop: vv ? Math.round(vv.pageTop) : null,
                svh: unit('svh'),
                lvh: unit('lvh'),
                dvh: unit('dvh'),
                appHeight:
                    getComputedStyle(document.documentElement).getPropertyValue('--app-height').trim() ||
                    '(unset)',
                vvClip:
                    getComputedStyle(document.documentElement).getPropertyValue('--vv-clip').trim() ||
                    '(unset)',
                contentH: content ? Math.round(content.height) : null,
                overlayBottom: box ? Math.round(box.bottom) : null,
                safeBottom: inset('bottom'),
                scrollY: Math.round(window.scrollY),
                docScrollH: document.documentElement.scrollHeight,
            })
        }

        read()
        const vv = window.visualViewport
        vv?.addEventListener('resize', read)
        vv?.addEventListener('scroll', read)
        window.addEventListener('resize', read)
        window.addEventListener('scroll', read)
        const timer = setInterval(read, 500)
        return () => {
            vv?.removeEventListener('resize', read)
            vv?.removeEventListener('scroll', read)
            window.removeEventListener('resize', read)
            window.removeEventListener('scroll', read)
            clearInterval(timer)
            probe.remove()
        }
    }, [])

    if (!on || !data) return null

    /** The number that matters: how far the overlay sits off the bottom. */
    const clipped = data.vv != null ? data.vv - data.overlayBottom : null

    return (
        <div className="pointer-events-none absolute left-2 right-2 top-2 z-[60] rounded-sm bg-black/85 p-2 font-mono text-[10px] leading-[1.5] text-white">
            <div className={clipped != null && clipped < 0 ? 'text-red-400' : 'text-emerald-400'}>
                panel bottom vs visible: {clipped == null ? '?' : `${clipped}px`}
                {clipped != null && clipped < 0 ? '  ← CLIPPED' : '  ← ok'}
            </div>
            <div>
                inner {data.inner} · visualViewport {data.vv} (offsetTop {data.vvOffsetTop}, pageTop{' '}
                {data.vvPageTop})
            </div>
            <div>
                svh {data.svh} · lvh {data.lvh} · dvh {data.dvh} · --app-height {data.appHeight} ·
                --vv-clip {data.vvClip}
            </div>
            <div>
                .content {data.contentH} · panel bottom {data.overlayBottom} · safe-bottom{' '}
                {data.safeBottom}
            </div>
            <div>
                scrollY {data.scrollY} · doc scrollHeight {data.docScrollH}
            </div>
        </div>
    )
}
