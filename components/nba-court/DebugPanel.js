import { useEffect, useState } from 'react'
import { debugState } from './debug-state'

/**
 * Shows what the GPU is actually running.
 *
 * Added after a long stretch where tooling screenshots and the browser
 * disagreed and neither side could prove anything. Values here are read off the
 * live material every frame, so if the file says one thing and this says
 * another, the page is stale — which is a far faster answer than another round
 * of "can you see it now".
 */
export default function DebugPanel() {
    const [, tick] = useState(0)

    useEffect(() => {
        const id = setInterval(() => tick((n) => n + 1), 250)
        return () => clearInterval(id)
    }, [])

    const v = debugState.values
    const rows = [
        ['grainStrength', v.grainStrength],
        ['matte', v.matte],
        ['glossVar', v.glossVar],
        ['rippleAmp', v.rippleAmp],
        ['rippleScale', v.rippleScale],
        ['roughness', v.roughness],
        ['specular', v.specular],
        ['key', v.key],
        ['cornerRadius', v.cornerRadius],
        ['ceilingFill', v.ceilingFill],
        ['ribbonIntensity', v.ribbonIntensity],
        ['fillFlatten', v.fillFlatten],
        ['lightHeight', v.lightHeight],
        ['poolExpand', v.poolExpand],
        ['paintGrain', v.paintGrain],
        ['fixtureRadius', v.fixtureRadius],
        ['groupSize', v.groupSize],
        ['inGroupSpacing', v.inGroupSpacing],
        ['groupGap', v.groupGap],
        ['sweepSpan', v.sweepSpan],
    ]

    return (
        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-sm bg-black/75 p-3 font-mono text-[11px] leading-relaxed text-white/85 backdrop-blur">
            <div className="mb-1 font-bold uppercase tracking-wider text-white/50">
                live uniforms
            </div>
            {rows.map(([label, value]) => (
                <div key={label}>
                    {label}: <span className="text-amber-300">
                        {typeof value === 'number' ? value.toFixed(4) : '—'}
                    </span>
                </div>
            ))}
            <div className="mt-2 border-t border-white/15 pt-2">
                <div>
                    mask: <span className="text-amber-300">{debugState.maskSize || '—'}</span>
                    {' '}mean wood:{' '}
                    <span className="text-amber-300">
                        {typeof debugState.maskMeanWood === 'number'
                            ? debugState.maskMeanWood.toFixed(3)
                            : '—'}
                    </span>
                </div>
                <div>shader: <span className="text-amber-300">{debugState.signature || '—'}</span></div>
                <div className="max-w-[320px] break-words">
                    gpu: <span className="text-amber-300">{debugState.renderer || '—'}</span>
                </div>
            </div>
            <div className="mt-2 max-w-[320px] break-words border-t border-white/15 pt-2">
                <div>url: <span className="text-amber-300">{debugState.query || '—'}</span></div>
                <div>resolved: <span className="text-amber-300">{debugState.resolved || '—'}</span></div>
                <div>texture: <span className="text-amber-300">{debugState.texture || '—'}</span></div>
                <div>overrides: <span className="text-amber-300">{debugState.tuning || '—'}</span></div>
            </div>
            {debugState.postfx && (
                <div className="mt-2 max-w-[320px] break-words border-t border-white/15 pt-2">
                    <div className="mb-1 font-bold uppercase tracking-wider text-white/50">
                        postfx
                    </div>
                    {Object.entries(debugState.postfx).map(([k, val]) => (
                        <div key={k}>
                            {k}: <span className="text-amber-300">{String(val)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
