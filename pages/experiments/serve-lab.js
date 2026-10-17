import Head from 'next/head'
import pages from '../../utils/pages.json'
import { absoluteUrl } from '../../utils/site'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'
// From `palette`, not from the arena: the arena imports three.js, and
// pulling that into the page would undo the dynamic import below.
import { SCENE_BG } from '../../components/serve-lab/palette'

// WebGL needs a window, and the three/R3F bundle should not travel with any
// other page, so the viewer is client-only and split out.
const ServeViewer = dynamic(() => import('../../components/serve-lab/ServeViewer'), {
    ssr: false,
})

const { title, description, image } = pages.serveLab

export default function ServeLabPage() {
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
                {/* Added with the rest of the listing; omitted rather than
                    pointed at a file that isn't there yet. */}
                {image && <meta property="og:image" content={absoluteUrl(image)} />}
                <meta name="theme-color" content={SCENE_BG} />
                {/*
                  BBH Bartle, for the mark painted on the court. Loaded with
                  a plain stylesheet link rather than `next/font`, which does
                  not carry this family — its catalogue has the unrelated
                  "BBH Sans Bartle" instead. `_document` already preconnects
                  to both Google Fonts hosts.
                */}
                <link
                    href="https://fonts.googleapis.com/css2?family=BBH+Bartle&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <main style={{ height: '100%', width: '100%', background: SCENE_BG }}>
                {/*
                  The page is a canvas, so without this it has no heading at
                  all — nothing for a screen reader to land on and nothing
                  for a crawler to read.
                */}
                <h1 className="sr-only">
                    Serve Lab — a professional tennis serve, measured from motion capture
                </h1>
                <ServeViewer />
            </main>
        </>
    )
}

/** No footer, and exactly one viewport tall. See `components/Layout.js`. */
ServeLabPage.fullBleed = true
