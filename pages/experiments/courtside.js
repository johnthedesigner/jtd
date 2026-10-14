import Head from 'next/head'
import pages from '../../utils/pages.json'
import { absoluteUrl } from '../../utils/site'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'

// WebGL needs a window, and the three/R3F bundle should not travel with any
// other page, so the viewer is client-only and split out.
const CourtViewer = dynamic(
    () => import('../../components/nba-court/CourtViewer'),
    { ssr: false }
)

/** The scene's own background, and what the browser chrome should match. */
const SCENE_BG = '#0b0d12'

// See `pages/experiments/index.js`: the sitemap is built from `pages.json`,
// so a page's metadata belongs there rather than inline.
const { title, description, image } = pages.courtside

export default function CourtsidePage() {
    // The layout pins its own content box, but the document can still
    // scroll if anything above it contributes height. This page is a single
    // viewport in every view, so nothing should ever scroll.
    //
    // The background is set on `html` and `body` as well, which is a
    // separate problem from what this page paints: the site's stylesheet
    // makes the body white, and the body's colour is what a mobile browser
    // samples to tint its address bar and what shows in the overscroll
    // area. Without this the arena ends in a white band top and bottom.
    useEffect(() => {
        const { body, documentElement: html } = document
        const previous = {
            overflow: body.style.overflow,
            bodyBg: body.style.backgroundColor,
            htmlBg: html.style.backgroundColor,
            overscroll: html.style.overscrollBehavior,
            bodyMinHeight: body.style.minHeight,
            htmlHeight: html.style.height,
            position: body.style.position,
            insetStart: body.style.insetInlineStart,
            insetTop: body.style.insetBlockStart,
            width: body.style.width,
        }
        body.style.overflow = 'hidden'
        // The stylesheet floors `body` at `100vh`, which on mobile is the
        // height with the address bar hidden — taller than the screen while
        // it is showing. See the `.full-bleed` rule in globals.css.
        body.style.minHeight = '0'
        html.style.height = '100%'
        /*
          Pinned, not merely `overflow: hidden`.

          On iOS `overflow: hidden` on the body does not actually stop the
          document scrolling, and any scroll is what lets Safari retract its
          toolbar and shift the visual viewport underneath a page that has
          already been laid out. Pinning the body takes that away: there is
          nothing to scroll, so nothing shifts. The page is one screen in
          every view, so it gives up nothing.
        */
        body.style.position = 'fixed'
        body.style.insetInlineStart = '0'
        body.style.insetBlockStart = '0'
        body.style.width = '100%'
        body.style.backgroundColor = SCENE_BG
        html.style.backgroundColor = SCENE_BG
        // Stops the rubber-band bounce revealing anything behind the page.
        html.style.overscrollBehavior = 'none'
        return () => {
            body.style.overflow = previous.overflow
            body.style.minHeight = previous.bodyMinHeight
            html.style.height = previous.htmlHeight
            body.style.position = previous.position
            body.style.insetInlineStart = previous.insetStart
            body.style.insetBlockStart = previous.insetTop
            body.style.width = previous.width
            body.style.backgroundColor = previous.bodyBg
            html.style.backgroundColor = previous.htmlBg
            html.style.overscrollBehavior = previous.overscroll
        }
    }, [])

    return (
        <>
            <Head>
                <title>{title}</title>
                <meta property="og:title" content={title} key="title" />
                <meta name="description" content={description} />
                <meta property="og:image" content={absoluteUrl(image)} />
                {/*
                  What Safari and Chrome tint their address bar with, so the
                  chrome continues the scene instead of framing it in white.
                */}
                <meta name="theme-color" content={SCENE_BG} />
            </Head>
            <main style={{ height: '100%', width: '100%', background: SCENE_BG }}>
                {/*
                  The page is a canvas, so without this it had no heading at
                  all — nothing for a screen reader to land on and nothing
                  for a crawler to read. Visually hidden rather than shown:
                  the lockup in the scene is the title on screen, but it is
                  geometry, not text.
                */}
                <h1 className="sr-only">Courtside — an NBA game rendered in WebGL</h1>
                <CourtViewer />
            </main>
        </>
    )
}

/** No footer, and exactly one viewport tall. See `components/Layout.js`. */
CourtsidePage.fullBleed = true
