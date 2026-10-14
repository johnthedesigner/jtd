import Head from 'next/head'
import ExperimentCard from '../../components/ExperimentCard'
import LogoHeroGPU from '../../components/LogoHeroGPU'
import { FLASK_FALLBACK_IMAGES } from '../../components/logo-hero-gpu/constants'
import { FLASK_SDF, flaskField } from '../../components/logo-hero-gpu/flask-hero'
import experiments, { EXPERIMENTS_BLURB } from '../../utils/experiments'
import pages from '../../utils/pages.json'
import { absoluteUrl } from '../../utils/site'

// Metadata lives in `pages.json` because the sitemap is generated from it —
// keeping it in the component instead is how both new routes came to be
// missing from `/sitemap.xml`.
const { title, description, image } = pages.experiments

/**
 * Everything built here for its own sake rather than for a client.
 *
 * The header is the same hero the case studies index uses, with the same
 * settings — only the glyph in the field differs. Those settings live in
 * `flask-hero.js` because `scripts/generate-fallbacks.mjs` needs the same
 * ones: the fallback image is what every browser without WebGPU sees, and
 * generating it from a separate copy is how it came to be rendering the
 * logomark while this page rendered flasks.
 */
export default function ExperimentsPage() {
    return (
        <>
            <Head>
                <title>{title}</title>
                <meta property="og:title" content={title} key="title" />
                <meta name="description" content={description} />
                {/* Absolute: a relative `og:image` is not resolved by most
                    crawlers, so the card comes back blank. */}
                <meta property="og:image" content={absoluteUrl(image)} />
            </Head>

            <main style={{ display: 'flex', flexDirection: 'column' }}>
                <LogoHeroGPU
                    height="42vh"
                    animate={false}
                    tearEndsAt={0.9}
                    contentLift={0.06}
                    fallbackImages={FLASK_FALLBACK_IMAGES}
                    fieldOptions={flaskField}
                    sceneOptions={{ sdf: FLASK_SDF }}
                >
                    <h1 style={{
                        fontFamily: 'var(--font-schmaltzy), Palatino Linotype, serif',
                        fontSize: 'clamp(40px, 6vw, 80px)',
                        fontWeight: 600,
                        lineHeight: 0.95,
                        letterSpacing: '-0.02em',
                        color: 'white',
                        margin: 0,
                        textAlign: 'center',
                        padding: '0 24px',
                    }}>
                        Experiments
                    </h1>
                </LogoHeroGPU>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        maxWidth: '880px',
                        margin: '0 auto',
                        width: '100%',
                        // Clears the hero's ragged edge, which tapers off just
                        // inside the hero and needs room before the first card.
                        padding: '48px 24px 120px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '32px',
                    }}>
                        <p style={{
                            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                            fontSize: '18px',
                            lineHeight: 1.6,
                            color: 'var(--color-on-surface-body)',
                            maxWidth: '620px',
                            margin: 0,
                        }}>
                            {EXPERIMENTS_BLURB}
                        </p>
                        {experiments.map((item) => (
                            <ExperimentCard key={item.href} item={item} />
                        ))}
                    </div>
                </div>
            </main>
        </>
    )
}
