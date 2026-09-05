import Head from 'next/head'
import { useCallback, useEffect, useRef, useState } from 'react'
import LogoHero from '../../components/LogoHero'
import LogoHeroGPU from '../../components/LogoHeroGPU'
import SketchLogo from '../../components/SketchLogo'

// The hero content is a fixed ~670px block, so it nearly fills the hero. The
// component's `contentLift` puts more of the remaining slack below the text
// than above, which is what keeps the tagline clear of the ragged edge.
const HEIGHT = '92vh'

function HeroContent() {
    return (
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <div style={{ width: 'min(480px, 80vw)', overflow: 'hidden', margin: '0 auto 32px' }}>
                <SketchLogo />
            </div>
            <h1 style={{
                fontFamily: 'var(--font-schmaltzy), Palatino Linotype, serif',
                fontSize: 'clamp(72px, 14vw, 180px)',
                fontWeight: 600,
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
                color: 'white',
                margin: '0 0 24px',
            }}>
                <span style={{ display: 'block' }}>John the</span>
                <span style={{ display: 'block' }}>Designer</span>
            </h1>
            <p style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: 'clamp(16px, 2vw, 22px)',
                fontWeight: 700,
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.9)',
                maxWidth: '500px',
                margin: '0 auto',
            }}>
                I turn complex design problems into simple and beautiful websites&nbsp;&amp;&nbsp;apps.
            </p>
        </div>
    )
}

const cellStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '13px',
    padding: '6px 12px 6px 0',
    color: 'var(--color-on-surface, #111)',
}

function Metrics({ rows }) {
    return (
        <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
                {rows.map(([label, value]) => (
                    <tr key={label}>
                        <td style={{ ...cellStyle, opacity: 0.6 }}>{label}</td>
                        <td style={{ ...cellStyle, fontWeight: 700 }}>{value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default function LogoHeroExperiment() {
    const [mode, setMode] = useState('gpu')
    const [run, setRun] = useState(0)
    const [status, setStatus] = useState('starting…')
    const [metrics, setMetrics] = useState({})
    const heroRef = useRef(null)

    const onStatus = useCallback((state, detail) => {
        if (state === 'ready') {
            setStatus('rendering')
            setMetrics((m) => ({ ...m, setupMs: detail.setupMs.toFixed(1), count: detail.count }))
        } else if (state === 'settled') {
            setStatus(detail.animated ? 'settled, loop stopped' : 'settled (reduced motion)')
            setMetrics((m) => ({ ...m, frames: detail.frames }))
        } else {
            setStatus(`${state}: ${typeof detail === 'string' ? detail : ''}`)
        }
    }, [])

    // DOM node count is the whole point of the comparison, so measure it live.
    const [nodes, setNodes] = useState(0)
    useEffect(() => {
        const id = setTimeout(() => {
            setNodes(heroRef.current?.querySelectorAll('*').length ?? 0)
        }, 3000)
        return () => clearTimeout(id)
    }, [mode, run])

    const replay = () => {
        setStatus('starting…')
        setMetrics({})
        setRun((r) => r + 1)
    }

    return (
        <>
            <Head>
                <title>Logo hero: GPU vs DOM</title>
                <meta name="robots" content="noindex" />
            </Head>

            <div ref={heroRef}>
                {mode === 'gpu' ? (
                    <LogoHeroGPU key={`gpu-${run}`} height={HEIGHT} onStatus={onStatus}>
                        <HeroContent />
                    </LogoHeroGPU>
                ) : (
                    <LogoHero key={`dom-${run}`} height={HEIGHT} animate>
                        <HeroContent />
                    </LogoHero>
                )}
            </div>

            {/* The hero's canvas hangs past its container by the scene's bleed.
                What follows sits above it in paint order but stays transparent,
                so the ragged edge reads against the page rather than being
                covered up, and its top padding clears the overhang. */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: '880px', margin: '0 auto', padding: '260px 24px 120px' }}>
                <h2 style={{
                    fontFamily: 'var(--font-fraunces), Georgia, serif',
                    fontSize: 'clamp(28px, 4vw, 40px)',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                }}>
                    Logo hero, rebuilt on the GPU
                </h2>
                <p style={{
                    fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                    fontSize: '17px',
                    lineHeight: 1.6,
                    maxWidth: '60ch',
                    margin: '0 0 32px',
                    opacity: 0.8,
                }}>
                    The GPU version draws the whole field in one instanced call against a
                    distance field of the logomark. Logos sit at different depths, which
                    sets their size and their defocus, the field tears off at the bottom
                    of the hero rather than being cut, and nothing paints a background
                    behind them. The loop stops the moment the animation lands.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
                    {[['gpu', 'GPU (vgpu)'], ['dom', 'DOM (current)']].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => { setMode(value); replay() }}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '999px',
                                border: '1px solid rgba(0,0,0,0.15)',
                                background: mode === value ? '#1683ff' : 'transparent',
                                color: mode === value ? 'white' : 'inherit',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        onClick={replay}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '999px',
                            border: '1px solid rgba(0,0,0,0.15)',
                            background: 'transparent',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                        }}
                    >
                        Replay
                    </button>
                </div>

                <Metrics
                    rows={
                        mode === 'gpu'
                            ? [
                                ['status', status],
                                ['logos', metrics.count ?? '—'],
                                ['setup', metrics.setupMs ? `${metrics.setupMs} ms` : '—'],
                                ['frames drawn', metrics.frames ?? '—'],
                                ['draw calls / frame', '2'],
                                ['depth of field', 'per-instance, in the distance field'],
                                ['hero DOM nodes', nodes || '—'],
                            ]
                            : [
                                ['status', 'CSS transitions'],
                                ['logos', '400'],
                                ['animated elements', '400 divs / 1200 paths'],
                                ['depth of field', 'none'],
                                ['hero DOM nodes', nodes || '—'],
                            ]
                    }
                />
            </div>
        </>
    )
}
