import Head from 'next/head'
import DesignLayout from '@/components/DesignLayout'

const SectionLabel = ({ children }) => (
    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)', marginBottom: '20px' }}>{children}</p>
)

const colorGroups = [
    {
        label: 'Brand',
        tokens: [
            { name: 'primary', token: '--color-primary' },
            { name: 'primary-text', token: '--color-primary-text' },
            { name: 'primary-hover', token: '--color-primary-hover' },
            { name: 'primary-pressed', token: '--color-primary-pressed' },
            { name: 'primary-subtle', token: '--color-primary-subtle' },
        ],
    },
    {
        label: 'Surface',
        tokens: [
            { name: 'surface', token: '--color-surface' },
            { name: 'surface-raised', token: '--color-surface-raised' },
            { name: 'surface-overlay', token: '--color-surface-overlay' },
            { name: 'surface-subtle', token: '--color-surface-subtle' },
        ],
    },
    {
        label: 'Text',
        tokens: [
            { name: 'on-surface', token: '--color-on-surface' },
            { name: 'on-surface-body', token: '--color-on-surface-body' },
            { name: 'on-surface-muted', token: '--color-on-surface-muted' },
            { name: 'on-surface-placeholder', token: '--color-on-surface-placeholder' },
        ],
    },
    {
        label: 'Border',
        tokens: [
            { name: 'border', token: '--color-border' },
            { name: 'border-mid', token: '--color-border-mid' },
            { name: 'border-focus', token: '--color-border-focus' },
            { name: 'border-active', token: '--color-border-active' },
        ],
    },
    {
        label: 'Semantic',
        tokens: [
            { name: 'error', token: '--color-error' },
            { name: 'on-error', token: '--color-on-error' },
            { name: 'error-surface', token: '--color-error-surface' },
            { name: 'success', token: '--color-success' },
            { name: 'on-success', token: '--color-on-success' },
            { name: 'success-surface', token: '--color-success-surface' },
            { name: 'warning', token: '--color-warning' },
            { name: 'on-warning', token: '--color-on-warning' },
            { name: 'warning-surface', token: '--color-warning-surface' },
        ],
    },
]

const Swatch = ({ name, token }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ height: '56px', borderRadius: '6px', border: '1px solid var(--color-border)', background: `var(${token})` }} />
        <div>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>{name}</p>
            <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-on-surface-muted)', margin: 0 }}>{token}</p>
        </div>
    </div>
)

const typeRoles = [
    {
        label: 'Display',
        style: { fontFamily: 'var(--font-schmaltzy), serif', fontSize: '64px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.01em' },
        sample: 'John the Designer',
        meta: 'Schmaltzy · 64px · 800 · lh 1.0',
    },
    {
        label: 'Heading LG',
        style: { fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '34px', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.015em' },
        sample: 'Planning Better Together',
        meta: 'Fraunces · 34px · 600 · lh 1.15',
    },
    {
        label: 'Heading SM',
        style: { fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '22px', fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.01em' },
        sample: 'Scenario Planning for Everyone',
        meta: 'Fraunces · 22px · 400 · lh 1.25',
    },
    {
        label: 'Deck',
        style: { fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '20px', fontWeight: 300, lineHeight: 1.4, fontStyle: 'italic' },
        sample: 'Making complex decisions more accessible to the people who matter.',
        meta: 'Fraunces · 20px · 300 · italic · lh 1.4',
    },
    {
        label: 'Body LG',
        style: { fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif', fontSize: '17px', fontWeight: 400, lineHeight: 1.7 },
        sample: 'I designed visual modeling tools and collaborative comparison features that made building and experimenting with planning models more accessible, bringing decision-makers into what was once isolated analyst work.',
        meta: 'Nunito Sans · 17px · 400 · lh 1.7',
    },
    {
        label: 'Body SM',
        style: { fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: 1.65 },
        sample: "Some of my work isn't ready for the whole world to see. Get in touch and I'll share the password.",
        meta: 'Nunito Sans · 14px · 400 · lh 1.65',
    },
    {
        label: 'Label',
        style: { fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif', fontSize: '11px', fontWeight: 700, lineHeight: 1, letterSpacing: '0.12em', textTransform: 'uppercase' },
        sample: 'Case Studies',
        meta: 'Nunito Sans · 11px · 700 · uppercase · ls 0.12em',
    },
    {
        label: 'Caption',
        style: { fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: 1.5, letterSpacing: '0.01em' },
        sample: 'Last updated May 2026 · Boston, MA',
        meta: 'Nunito Sans · 12px · 400 · lh 1.5',
    },
]

const spacingStops = [
    { name: 'space-1', px: '4px', token: '--space-1' },
    { name: 'space-2', px: '8px', token: '--space-2' },
    { name: 'space-3', px: '12px', token: '--space-3' },
    { name: 'space-4', px: '16px', token: '--space-4' },
    { name: 'space-5', px: '20px', token: '--space-5' },
    { name: 'space-6', px: '24px', token: '--space-6' },
    { name: 'space-7', px: '28px', token: '--space-7' },
    { name: 'space-8', px: '32px', token: '--space-8' },
    { name: 'space-10', px: '40px', token: '--space-10' },
    { name: 'space-12', px: '48px', token: '--space-12' },
    { name: 'space-14', px: '56px', token: '--space-14' },
    { name: 'space-16', px: '64px', token: '--space-16' },
    { name: 'space-20', px: '80px', token: '--space-20' },
    { name: 'space-24', px: '96px', token: '--space-24' },
]

const radiusStops = [
    { name: 'none', px: '0px', token: '--radius-none', use: 'Full-bleed containers, code blocks' },
    { name: 'xs', px: '4px', token: '--radius-xs', use: 'Inline code, small chips' },
    { name: 'sm', px: '6px', token: '--radius-sm', use: 'Buttons, inputs — interactive tier' },
    { name: 'md', px: '8px', token: '--radius-md', use: 'Image thumbnails, inline media' },
    { name: 'lg', px: '10px', token: '--radius-lg', use: 'Cards, panels — container tier' },
    { name: 'xl', px: '14px', token: '--radius-xl', use: 'Callouts, solid CTA sections' },
    { name: '2xl', px: '18px', token: '--radius-2xl', use: 'Modals, dialogs, drawers' },
    { name: 'full', px: '9999px', token: '--radius-full', use: 'Badges, tags, pills only' },
]

export default function DesignTokens() {
    return (
        <>
            <Head><title>Design System — Tokens</title></Head>
            <DesignLayout>

                <div style={{ marginBottom: '16px' }}>
                    <h1 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '34px', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.015em', color: 'var(--color-on-surface)', margin: 0 }}>Tokens</h1>
                    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '15px', color: 'var(--color-on-surface-body)', marginTop: '8px' }}>
                        Compiled from <code style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>tokens/src/</code> via Style Dictionary. Edit source JSON, run <code style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>npm run tokens</code>.
                    </p>
                </div>

                {/* Colors */}
                <section style={{ marginTop: '56px' }}>
                    <SectionLabel>Color tokens</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {colorGroups.map((group) => (
                            <div key={group.label}>
                                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: 'var(--color-on-surface-muted)', marginBottom: '16px', marginTop: 0 }}>{group.label}</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                                    {group.tokens.map(({ name, token }) => (
                                        <Swatch key={token} name={name} token={token} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Typography */}
                <section style={{ marginTop: '64px' }}>
                    <SectionLabel>Typography scale</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--color-border)' }}>
                        {typeRoles.map(({ label, style, sample, meta }) => (
                            <div key={label} style={{ padding: '32px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px' }}>
                                    <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)' }}>{label}</span>
                                    <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', color: 'var(--color-on-surface-muted)' }}>{meta}</span>
                                </div>
                                <p style={{ ...style, color: 'var(--color-on-surface)', margin: 0 }}>{sample}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Spacing */}
                <section style={{ marginTop: '64px' }}>
                    <SectionLabel>Spacing scale</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {spacingStops.map(({ name, px, token }) => (
                            <div key={token} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-on-surface-muted)', width: '80px', flexShrink: 0 }}>{name}</span>
                                <div style={{ height: '20px', background: 'var(--color-primary)', borderRadius: '4px', width: `var(${token})`, flexShrink: 0 }} />
                                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-on-surface-muted)' }}>{px}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Shape */}
                <section style={{ marginTop: '64px', marginBottom: '64px' }}>
                    <SectionLabel>Shape — border radius</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px' }}>
                        {radiusStops.map(({ name, px, token, use }) => (
                            <div key={token} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ height: '64px', width: '100%', background: 'var(--color-primary-subtle)', border: '2px solid var(--color-primary)', borderRadius: `var(${token})` }} />
                                <div>
                                    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>{name} <span style={{ fontWeight: 400, color: 'var(--color-on-surface-muted)' }}>· {px}</span></p>
                                    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', color: 'var(--color-on-surface-muted)', marginTop: '2px', marginBottom: 0 }}>{use}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </DesignLayout>
        </>
    )
}
