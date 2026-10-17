import { useEffect, useRef } from "react";
import Footer from "./Footer";
import Header from "./Header";

/**
 * `fullBleed` is for pages that *are* a viewport — the WebGL court, and
 * anything else where the content is sized to the window rather than
 * flowing down it. Those pages drop the footer and pin the content to
 * exactly the viewport height, because a trailing footer plus a
 * `100vh` canvas adds up to more than a screen and the whole thing scrolls.
 *
 * A per-page flag rather than another route check beside `isDesignRoute`:
 * the condition belongs to the page, and a list of paths in `_app` drifts
 * out of date the moment one is renamed.
 */
/**
 * Publishes the *measured* height of the visible viewport as `--app-height`.
 *
 * `svh`/`dvh` are a guess about how a browser lays itself out, and on iOS
 * that guess was wrong twice over: the bottom of a full-bleed page kept
 * landing under Safari's toolbar in both Safari and Chrome (which is the
 * same engine, so it was never a Chrome bug). `visualViewport.height` is
 * not a guess — it is what is actually on screen right now, toolbars and
 * all — so the page is sized from that and falls back to the units only
 * where the API is missing.
 *
 * It listens to the visual viewport's own `resize` *and* `scroll`: on iOS
 * the toolbar retracting fires scroll, not resize, and that is exactly the
 * moment the usable height changes.
 */
function useViewportHeight(enabled, contentRef) {
    useEffect(() => {
        if (!enabled || typeof window === "undefined") return
        const root = document.documentElement
        const vv = window.visualViewport

        const apply = () => {
            const h = vv?.height ?? window.innerHeight
            if (h) root.style.setProperty("--app-height", `${Math.round(h)}px`)

            /*
              How far the page's own box still hangs below what is visible.

              Sizing to the measured viewport should make this zero, and on
              a desktop it is. On iOS it was not: the bottom of the page kept
              landing under the browser's toolbar through three separate
              attempts at predicting the right height. So rather than predict
              it, this measures the overshoot that remains and publishes it,
              and the overlays pinned to the bottom add it to their own
              padding.

              It cannot over-correct, because it only ever reports a positive
              overshoot. It cannot oscillate either: the box being measured
              is the page container, whose bottom does not move when the
              padding inside it changes — measuring the overlay itself would
              feed back into its own input.
            */
            const box = contentRef.current?.getBoundingClientRect()
            const visibleBottom = vv ? vv.height + vv.offsetTop : window.innerHeight
            const clip = box ? Math.max(0, Math.round(box.bottom - visibleBottom)) : 0
            /*
              Still published, now unused by the overlays. They anchor to
              the visual viewport directly instead (see
              `components/webgl/use-visual-viewport-inset`), because this
              correction only works when the page box it measures is
              itself right, and on iOS it is not. Left in place as a
              diagnostic: `?vp` reports it, and a non-zero value is
              evidence of exactly the condition that broke the old
              approach.
            */
            root.style.setProperty("--vv-clip", `${clip}px`)
        }

        apply()
        // iOS reports a stale height for a moment after load and after an
        // orientation change — the toolbar has not settled yet — so this is
        // re-read a few times rather than trusted once.
        const timers = [60, 250, 800, 2000].map((ms) => setTimeout(apply, ms))

        vv?.addEventListener("resize", apply)
        vv?.addEventListener("scroll", apply)
        window.addEventListener("resize", apply)
        window.addEventListener("orientationchange", apply)
        window.addEventListener("pageshow", apply)
        return () => {
            timers.forEach(clearTimeout)
            vv?.removeEventListener("resize", apply)
            vv?.removeEventListener("scroll", apply)
            window.removeEventListener("resize", apply)
            window.removeEventListener("orientationchange", apply)
            window.removeEventListener("pageshow", apply)
            root.style.removeProperty("--app-height")
            root.style.removeProperty("--vv-clip")
        }
    }, [enabled, contentRef])
}

const Layout = ({ children, fullBleed = false }) => {
    const contentRef = useRef(null)
    useViewportHeight(fullBleed, contentRef)

    return (
        <div className={`layout${fullBleed ? " full-bleed" : ""}`}>
            <main
                className="main-content"
                style={{
                    backgroundColor: "inherit",
                    // `main` carries a `min-height: 100vh` from the global
                    // stylesheet, which on mobile is the viewport with the
                    // address bar *hidden*. Leaving it in place under a
                    // `100svh` child keeps the document taller than the
                    // screen and pushes the bottom of a full-bleed page out
                    // of reach — which is exactly how the game cards were
                    // ending up under the fold.
                    ...(fullBleed ? { minHeight: 0 } : null),
                }}
            >
                <Header />
                <div
                    ref={contentRef}
                    className="content"
                    style={
                        fullBleed
                            ? {
                                  // Measured first, units only as a
                                  // fallback: see `useViewportHeight`.
                                  // `100svh` is what this had before, and
                                  // it was not enough on iOS.
                                  height: "var(--app-height, 100svh)",
                                  maxHeight: "var(--app-height, 100svh)",
                                  overflow: "hidden",
                              }
                            : { minHeight: "100vh" }
                    }
                >
                    {children}
                </div>
                {!fullBleed && <Footer />}
            </main>
        </div>
    );
}

export default Layout;
