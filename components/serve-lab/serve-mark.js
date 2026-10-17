import * as THREE from 'three'

/**
 * The JTD mark and "Serve Lab", painted on the run-off behind the baseline.
 *
 * Where a show court carries a sponsor or a tournament name. It is drawn
 * into a canvas rather than modelled, because that is what paint is: a flat
 * mark lying on the surface, taking the court's own light and wearing the
 * way the surface around it wears.
 *
 * The logo geometry is the real one, lifted from `components/Header.js` so
 * the two cannot drift. Its three shapes are the white parts of the mark;
 * the rounded rectangle behind them is left out, since here the court is
 * the background.
 */

/** The JTD mark, as it is drawn in the site header. `viewBox="0 0 90 41"`. */
export const LOGO_VIEWBOX = [90, 41]

/**
 * The three shapes, left to right: J, T, D. The racket's strings borrow the
 * first of them.
 */
export const LOGO_PATHS = [
    'M33.748 12.8556C33.6767 12.4504 33.9467 12.0641 34.351 11.9926L53.7972 8.55685C54.2015 8.48541 54.5871 8.75594 54.6584 9.16109L56.2437 18.1702C56.315 18.5753 56.045 18.9617 55.6407 19.0331L51.5113 19.7627C51.3091 19.7985 51.1741 19.9916 51.2098 20.1942L52.8597 29.5701C52.931 29.9752 52.661 30.3616 52.2566 30.433L43.2657 32.0216C42.8614 32.093 42.4758 31.8225 42.4045 31.4173L40.7546 22.0415C40.7189 21.8389 40.5262 21.7036 40.324 21.7393L36.1946 22.4689C35.7902 22.5404 35.4047 22.2698 35.3334 21.8647L33.748 12.8556Z',
    'M22.1508 11.9354C22.1294 11.5246 22.4443 11.1741 22.8543 11.1525L31.9715 10.6737C32.3815 10.6522 32.7313 10.9678 32.7528 11.3786L33.2695 21.2581C33.5763 27.1252 29.0785 32.1307 23.2232 32.4381C17.6175 32.7325 12.8 28.6142 12.1301 23.1142C12.0804 22.7059 12.398 22.3541 12.808 22.3326L22.2964 21.8343C22.5014 21.8236 22.6588 21.6483 22.6481 21.4429L22.1508 11.9354Z',
    'M59.3772 9.62064L69.1003 11.3385C74.8745 12.3588 78.7301 17.8762 77.7119 23.6621C76.6938 29.448 71.1875 33.3113 65.4132 32.2911L55.6901 30.5732C55.2858 30.5018 55.0158 30.1154 55.0871 29.7103L58.516 10.2249C58.5873 9.81973 58.9729 9.5492 59.3772 9.62064Z',
]

const CANVAS = { width: 1024, height: 640 }

/** The face painted on the court. Not a site font: see the page's `<Head>`. */
const MARK_FONT = "'BBH Bartle'"

/** Metres. Sized to the canvas, and to the run-off it has to fit inside. */
export const MARK_SIZE = { width: 7.2, depth: 4.5 }
/** Centre of the mark, in metres back from the baseline. */
export const MARK_SET_BACK = 2.9

export function buildCourtMark() {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS.width
    canvas.height = CANVAS.height
    const ctx = canvas.getContext('2d')

    /**
     * The largest size at which `text` still fits `maxWidth`.
     *
     * Measured rather than trusted. BBH Bartle is a wide display face and
     * "SERVE" overran the canvas at the size that looked right on paper,
     * which clips as a centred string: the first and last letters lose
     * their outer edge and nothing else looks wrong, so it reads as a
     * drawing mistake rather than as overflow.
     */
    const fitFont = (text, maxWidth, startSize) => {
        let size = startSize
        for (let i = 0; i < 24; i++) {
            ctx.font = `400 ${Math.round(size)}px ${MARK_FONT}`
            if (ctx.measureText(text).width <= maxWidth) break
            size *= 0.96
        }
        return Math.round(size)
    }

    const draw = () => {
        ctx.clearRect(0, 0, CANVAS.width, CANVAS.height)
        ctx.save()
        // Off-white: paint on a matte court, not a light source.
        ctx.fillStyle = '#c8cfd2'

        // The mark, centred and sized as a share of the canvas width.
        const logoWidth = CANVAS.width * 0.656
        const scale = logoWidth / LOGO_VIEWBOX[0]
        const logoHeight = LOGO_VIEWBOX[1] * scale
        const logoTop = CANVAS.height * 0.035
        ctx.save()
        ctx.translate((CANVAS.width - logoWidth) / 2, logoTop)
        ctx.scale(scale, scale)
        for (const d of LOGO_PATHS) ctx.fill(new Path2D(d))
        ctx.restore()

        // "Serve" over "Lab", set tight under it so the three read as one
        // stacked lockup rather than as a mark with a caption.
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.02em'
        const inset = CANVAS.width * 0.9
        const size = Math.min(
            fitFont('SERVE', inset, CANVAS.height * 0.149),
            fitFont('LAB', inset, CANVAS.height * 0.149)
        )
        ctx.font = `400 ${size}px ${MARK_FONT}`
        const capHeight = size * 0.72
        const first = logoTop + logoHeight + CANVAS.height * 0.012 + capHeight
        ctx.fillText('SERVE', CANVAS.width / 2, first)
        ctx.fillText('LAB', CANVAS.width / 2, first + size * 0.92)
        ctx.restore()

        /*
          Then take a little of it away, as ball impacts.

          This is the one place on the court where wear has a direction: a
          ball arriving on a serve is travelling down the court and skidding
          as it bites, so each mark is an ellipse stretched along that axis,
          not a dot. The canvas `v` axis runs down the court, so that is the
          long one.

          Clustered rather than scattered. Impacts land where serves land,
          which means a few busy patches and a lot of untouched paint; an
          even sprinkle reads as noise over the top of the artwork instead
          of as something that happened to it.
        */
        ctx.globalCompositeOperation = 'destination-out'
        const CLUSTERS = 9
        for (let c = 0; c < CLUSTERS; c++) {
            const cx = Math.random() * CANVAS.width
            const cy = Math.random() * CANVAS.height
            const spreadX = 60 + Math.random() * 190
            const spreadY = 90 + Math.random() * 240
            const hits = 4 + Math.floor(Math.random() * 12)
            for (let i = 0; i < hits; i++) {
                // Gaussian-ish, so a cluster has a dense middle.
                const gx = (Math.random() + Math.random() - 1) * spreadX
                const gy = (Math.random() + Math.random() - 1) * spreadY
                const rx = 3 + Math.random() * 7
                ctx.globalAlpha = 0.015 + Math.random() * 0.055
                ctx.beginPath()
                ctx.ellipse(
                    cx + gx,
                    cy + gy,
                    rx,
                    rx * (1.9 + Math.random() * 1.4),
                    // A few degrees of scatter: serves do not all arrive on
                    // exactly the same line.
                    (Math.random() - 0.5) * 0.28,
                    0,
                    Math.PI * 2
                )
                ctx.fill()
            }
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
    }

    draw()

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8

    /*
      Redraw once the webfont is actually available. The first pass can land
      before `next/font` has resolved, and a mark set in the fallback face is
      a different width — visibly so at this size.
    */
    if (typeof document !== 'undefined' && document.fonts) {
        // `fonts.ready` alone is not enough: a face nothing has rendered yet
        // is not loaded, and this one is only ever drawn into a canvas, so
        // nothing in the DOM triggers it. Ask for it by name first.
        const redraw = () => {
            draw()
            texture.needsUpdate = true
        }
        document.fonts
            .load(`400 64px ${MARK_FONT}`)
            .then(() => document.fonts.ready)
            .then(redraw)
            .catch(redraw)
    }

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        // Paint, not gloss: the surface under it is the shiny part.
        roughness: 0.96,
        metalness: 0,
        depthWrite: false,
    })

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(MARK_SIZE.width, MARK_SIZE.depth),
        material
    )
    /*
      Flat, then turned to read from the other end of the court. The cameras
      that show this mark look back toward the baseline, so without the half
      turn it is upside down in every one of them.
    */
    mesh.rotation.set(-Math.PI / 2, 0, Math.PI)
    mesh.receiveShadow = true

    return {
        mesh,
        dispose: () => {
            texture.dispose()
            material.dispose()
            mesh.geometry.dispose()
        },
    }
}
