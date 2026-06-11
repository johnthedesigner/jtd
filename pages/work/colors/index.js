import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import {
    ProseSection, ProseSectionHeading, ProseSectionBody,
} from '@/components/case-study/ProseSection'
import { CaseStudyHero } from '@/components/case-study/CaseStudyHero'
import { TLDRBlock, TLDRItemWhite } from '@/components/case-study/TLDRBlock'
import { NextCaseStudy } from '@/components/case-study/NextCaseStudy'
import pages from '@/utils/pages.json'
import ActionIcon from '@/components/ActionIcons'
import { generatePalette, isValidHex } from '@/utils/palette'
import { STOPS, toCss, toTailwind, toDtcg } from '@/utils/paletteFormat'
import caseStudies from '@/utils/caseStudies'
import PasswordProtect from '@/components/PasswordProtect'
import UnauthenticatedContent from '@/components/UnauthenticatedCaseStudy'

const caseStudy = caseStudies.find((cs) => cs.href === '/work/colors')
const isPrivate = caseStudy?.private ?? false

const GAP = '80px'

const Narrow = ({ children, padBottom = false }) => (
    <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        width: '100%',
        padding: `${GAP} 24px ${padBottom ? GAP : '0'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: GAP,
    }}>
        {children}
    </div>
)

const INITIAL_SEED = '#AA7DE4'
const initialPalette = generatePalette(INITIAL_SEED)

const defaultExampleColors = {
    cardBackground: '#ffffff',
    labelColor: 'rgba(0,0,0,0.45)',
    buttonBackground: initialPalette.stops['500'].hex,
    buttonOutline: initialPalette.stops['500'].hex,
    outlineButtonText: initialPalette.stops['500'].hex,
    linkText: initialPalette.stops['500'].hex,
    headlineColor: initialPalette.stops['500'].hex,
    iconColor: initialPalette.stops['500'].hex,
    paragraphColor: '#1a2632',
}

const AuthenticatedContent = () => {
    const [seedHex, setSeedHex] = useState(INITIAL_SEED)
    const [hexInput, setHexInput] = useState(INITIAL_SEED)
    const [paletteName, setPaletteName] = useState('custom')
    const [palette, setPalette] = useState(initialPalette)
    const [exampleType, setExampleType] = useState('light')
    const [exampleColors, setExampleColors] = useState(defaultExampleColors)
    const [format, setFormat] = useState('css')
    const [copied, setCopied] = useState(false)
    const [swatchCopied, setSwatchCopied] = useState(null)

    const examplePalettes = (p) => ({
        light: {
            cardBackground: '#ffffff',
            labelColor: 'rgba(0,0,0,0.45)',
            buttonBackground: p.stops['500'].hex,
            buttonOutline: p.stops['500'].hex,
            outlineButtonText: p.stops['500'].hex,
            linkText: p.stops['500'].hex,
            headlineColor: p.stops['500'].hex,
            iconColor: p.stops['500'].hex,
            paragraphColor: '#1a2632',
        },
        dark: {
            cardBackground: '#0e1720',
            labelColor: 'rgba(255,255,255,0.4)',
            buttonBackground: p.stops['500'].hex,
            buttonOutline: p.stops['500'].hex,
            outlineButtonText: p.stops['500'].hex,
            linkText: p.stops['500'].hex,
            headlineColor: p.stops['350'].hex,
            iconColor: p.stops['500'].hex,
            paragraphColor: '#d5dde6',
        },
        colorful: {
            cardBackground: p.stops['500'].hex,
            labelColor: p.stops['100'].hex,
            buttonBackground: p.stops['750'].hex,
            buttonOutline: p.stops['750'].hex,
            outlineButtonText: p.stops['50'].hex,
            linkText: p.stops['50'].hex,
            headlineColor: p.stops['100'].hex,
            iconColor: p.stops['850'].hex,
            paragraphColor: '#ffffff',
        },
    })

    const commitSeed = (hex) => {
        const normalized = hex.startsWith('#') ? hex : '#' + hex
        if (!isValidHex(normalized)) return
        setSeedHex(normalized)
        setHexInput(normalized)
        const p = generatePalette(normalized)
        setPalette(p)
        setExampleColors(examplePalettes(p)[exampleType])
    }

    const handleHexInput = (e) => {
        const val = e.target.value
        setHexInput(val)
        const normalized = val.startsWith('#') ? val : '#' + val
        if (isValidHex(normalized)) commitSeed(normalized)
    }

    const handleColorPicker = (e) => {
        commitSeed(e.target.value)
    }

    const handleTypeClick = (type) => {
        setExampleType(type)
        setExampleColors(examplePalettes(palette)[type])
    }

    const handleCopy = () => {
        const name = paletteName.trim() || 'custom'
        let text
        if (format === 'css') text = toCss(name, palette)
        else if (format === 'tailwind') text = toTailwind(name, palette)
        else text = toDtcg(name, palette)
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const handleSwatchCopy = (stop, hex) => {
        navigator.clipboard.writeText(hex).then(() => {
            setSwatchCopied(stop)
            setTimeout(() => setSwatchCopied(null), 1200)
        })
    }

    const labelStyle = (color) => ({
        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color,
        display: 'block',
        margin: '0 0 10px 0',
        transition: 'color 0.2s',
    })

    const divider = <div style={{ height: '1px', background: 'rgba(128,128,128,0.15)' }} />

    const isPickerValid = isValidHex(hexInput.startsWith('#') ? hexInput : '#' + hexInput)

    const PaletteWidget = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── Color picker row ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{
                    fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                    fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'var(--color-on-surface-muted)',
                }}>
                    Choose a color
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <label
                        title="Click to open color picker"
                        style={{
                            width: '44px', height: '44px',
                            borderRadius: '8px',
                            background: isPickerValid ? seedHex : 'var(--color-surface-subtle)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'background 0.2s',
                        }}
                    >
                        <input
                            type="color"
                            value={isPickerValid ? seedHex : '#000000'}
                            onChange={handleColorPicker}
                            style={{
                                position: 'absolute', inset: 0,
                                opacity: 0, width: '100%', height: '100%',
                                cursor: 'pointer',
                            }}
                        />
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <input
                            type="text"
                            value={hexInput}
                            onChange={handleHexInput}
                            placeholder="#2563eb"
                            maxLength={7}
                            style={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                fontSize: '13px',
                                height: '36px', padding: '0 10px',
                                background: 'var(--color-surface)',
                                border: `1px solid ${hexInput && !isPickerValid ? 'var(--color-error, #dc2626)' : 'var(--color-border)'}`,
                                borderRadius: '6px',
                                color: hexInput && !isPickerValid ? 'var(--color-error, #dc2626)' : 'var(--color-on-surface)',
                                width: '110px', outline: 'none',
                            }}
                        />
                        {hexInput && !isPickerValid && (
                            <span style={{ fontSize: '11px', color: 'var(--color-error, #dc2626)', fontFamily: 'var(--font-nunito-sans)' }}>
                                Enter a valid hex color
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <input
                            type="text"
                            value={paletteName}
                            onChange={(e) => setPaletteName(e.target.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase())}
                            placeholder="custom"
                            style={{
                                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                fontSize: '13px',
                                height: '36px', padding: '0 10px',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                color: 'var(--color-on-surface)',
                                width: '130px', outline: 'none',
                            }}
                        />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-on-surface-muted)', fontFamily: 'var(--font-nunito-sans)' }}>
                        ← token name
                    </span>
                </div>
            </div>

            {/* ── 19-stop swatch strip ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(19, 1fr)', gap: '3px' }}>
                    {STOPS.map((stop) => {
                        const s = palette.stops[stop]
                        const useWhite = s.contrast_white > s.contrast_black
                        const labelColor = useWhite ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)'
                        const isCopied = swatchCopied === stop
                        return (
                            <button
                                key={stop}
                                onClick={() => handleSwatchCopy(stop, s.hex)}
                                title={`${stop}: ${s.hex}`}
                                style={{
                                    background: s.hex,
                                    aspectRatio: '1 / 2.2',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px 2px 3px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'transform 0.1s',
                                    outline: 'none',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scaleY(1.06)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scaleY(1)'}
                            >
                                <span style={{ fontSize: '7px', fontFamily: 'monospace', color: labelColor, lineHeight: 1 }}>{stop}</span>
                                <span style={{ fontSize: '6px', fontFamily: 'monospace', color: labelColor, lineHeight: 1, opacity: 0.8 }}>
                                    {isCopied ? '✓' : s.hex.slice(1).toUpperCase()}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Copy tokens ── */}
            <div style={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                overflow: 'hidden',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--color-surface-subtle)',
                    borderBottom: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: '8px',
                }}>
                    <div style={{
                        display: 'flex', gap: '2px',
                        background: 'var(--color-surface)',
                        borderRadius: '6px', padding: '3px',
                        border: '1px solid var(--color-border)',
                    }}>
                        {[
                            { id: 'css', label: 'CSS Variables' },
                            { id: 'tailwind', label: 'Tailwind' },
                            { id: 'json', label: 'JSON Tokens' },
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => setFormat(id)}
                                style={{
                                    fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                    fontSize: '11px', fontWeight: 700,
                                    padding: '4px 10px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    background: format === id ? 'var(--color-primary)' : 'transparent',
                                    color: format === id ? '#ffffff' : 'var(--color-on-surface-muted)',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleCopy}
                        style={{
                            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                            fontSize: '12px', fontWeight: 700,
                            height: '32px', padding: '0 14px',
                            background: copied ? 'var(--color-success, #16a34a)' : 'var(--color-surface)',
                            color: copied ? '#ffffff' : 'var(--color-on-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                </div>
                <div style={{
                    padding: '14px',
                    background: 'var(--color-surface-subtle)',
                    maxHeight: '160px',
                    overflowY: 'auto',
                }}>
                    <pre style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '11px',
                        lineHeight: 1.6,
                        color: 'var(--color-on-surface-body)',
                        margin: 0,
                        whiteSpace: 'pre',
                        overflowX: 'auto',
                    }}>
                        {format === 'css'
                            ? toCss(paletteName.trim() || 'custom', palette)
                            : format === 'tailwind'
                            ? toTailwind(paletteName.trim() || 'custom', palette)
                            : toDtcg(paletteName.trim() || 'custom', palette)
                        }
                    </pre>
                </div>
            </div>

            {/* ── Preview card ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                    display: 'flex', gap: '4px',
                    background: 'var(--color-surface-subtle)',
                    borderRadius: '8px', padding: '4px',
                }}>
                    {['light', 'dark', 'colorful'].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleTypeClick(type)}
                            style={{
                                flex: 1,
                                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                fontSize: '12px', fontWeight: 700,
                                height: '32px', border: 'none', borderRadius: '6px',
                                cursor: 'pointer',
                                background: exampleType === type ? 'var(--color-surface)' : 'transparent',
                                color: exampleType === type ? 'var(--color-on-surface)' : 'var(--color-on-surface-muted)',
                                boxShadow: exampleType === type ? '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' : 'none',
                                transition: 'all 0.15s',
                            }}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                <div style={{
                    background: exampleColors.cardBackground,
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    transition: 'background 0.2s',
                }}>
                    <div style={{ padding: '16px 20px' }}>
                        <span style={labelStyle(exampleColors.labelColor)}>Buttons</span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button style={{
                                height: '36px', padding: '0 16px',
                                background: exampleColors.buttonBackground, color: '#ffffff',
                                border: 'none', borderRadius: '6px',
                                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}>Primary</button>
                            <button style={{
                                height: '36px', padding: '0 16px',
                                background: 'transparent', color: exampleColors.outlineButtonText,
                                border: `1.5px solid ${exampleColors.buttonOutline}`, borderRadius: '6px',
                                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}>Secondary</button>
                            <button style={{
                                height: '36px', padding: '0 12px',
                                background: 'transparent', color: exampleColors.linkText,
                                border: 'none', borderRadius: '6px',
                                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                fontSize: '13px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline',
                                transition: 'color 0.2s',
                            }}>Link</button>
                        </div>
                    </div>
                    {divider}
                    <div style={{ padding: '16px 20px' }}>
                        <span style={labelStyle(exampleColors.labelColor)}>Headlines</span>
                        <span style={{
                            fontFamily: 'var(--font-fraunces), Georgia, serif',
                            fontSize: '22px', fontWeight: 600, lineHeight: 1.25,
                            color: exampleColors.headlineColor, display: 'block',
                            transition: 'color 0.2s',
                        }}>
                            The quick brown fox jumped over the lazy dog
                        </span>
                    </div>
                    {divider}
                    <div style={{ padding: '16px 20px' }}>
                        <span style={labelStyle(exampleColors.labelColor)}>Icons</span>
                        <div style={{ display: 'flex', gap: '12px', color: exampleColors.iconColor, transition: 'color 0.2s' }}>
                            <ActionIcon iconType="newRectangle" />
                            <ActionIcon iconType="newEllipse" />
                            <ActionIcon iconType="newText" />
                            <ActionIcon iconType="resize" />
                            <ActionIcon iconType="blending" />
                            <ActionIcon iconType="sendToBack" />
                            <ActionIcon iconType="bringToFront" />
                        </div>
                    </div>
                    {divider}
                    <div style={{ padding: '16px 20px' }}>
                        <span style={labelStyle(exampleColors.labelColor)}>Paragraph Text</span>
                        <p style={{
                            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                            fontSize: '15px', lineHeight: 1.65,
                            color: exampleColors.paragraphColor, margin: 0,
                            transition: 'color 0.2s',
                        }}>
                            Nam faucibus accumsan ultrices. Duis magna velit,
                            pretium quis ultricies in, efficitur eu nisi. Ut id
                            condimentum neque. Integer dapibus eros urna, quis
                            pharetra nunc fringilla eu.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    )

    return (
        <>
            <Head>
                <title>{`${caseStudy?.title ?? 'A Refined Palette'} | John the Designer – Boston-Area Product Designer John Livornese`}</title>
                <meta property="og:title" content={`${caseStudy?.title ?? 'A Refined Palette'} | John the Designer – Boston-Area Product Designer John Livornese`} key="title" />
                <meta name="description" content={caseStudy?.description ?? pages.colors?.description} />
                <meta name="og:image" content={pages.colors?.image ?? '/social-img.png'} />
            </Head>

            <CaseStudyHero
                company="Personal Project"
                title="A Refined Palette"
                subtitle="Starting with the color tokens your design system really needs"
                imageSrc="/work/paletteer/header.svg"
                imageWidth={2396}
                imageHeight={1656}
                imageAlt="Palette generator showing a 19-stop color ramp generated from a seed color"
            />

            <main style={{ display: 'flex', flexDirection: 'column' }}>
                <Narrow padBottom>
                    <TLDRBlock summary="This project was born out of an effort to incorporate our growing design system into our application's aging codebase at Luminoso. A particular pain-point was our inconsistent use of color. I coded an internal tool that allowed me to generate accessible, flexible color palettes. Engineers could use the tool to generate code snippets with color tokens, identify the correct replacement color for out-of-palette colors and more. Since then I independently developed this tool into a Figma plugin with over 10,000 users.">
                        <TLDRItemWhite label="My Role">
                            I coded the original internal tool, including the unique color generation script
                            myself while I was working as the Head of Product Design at Luminoso. I coded
                            and maintain the subsequent Figma plugin myself.
                        </TLDRItemWhite>
                        <TLDRItemWhite label="Outcome">
                            While working at Luminoso I used this tool to generate color tokens that helped
                            speed communication between design and engineering, and helped engineers audit
                            our codebase toward consistency with our design system.
                        </TLDRItemWhite>
                    </TLDRBlock>

                    <ProseSection>
                        <ProseSectionHeading>What&apos;s the problem?</ProseSectionHeading>
                        <ProseSectionBody>
                            <p>
                                We&apos;ve all been there right? Your product (not to mention your style guide)
                                is a few years old, the color palette has grown to three times its original
                                size, there are 16 colors in the codebase just for buttons... wait, who made
                                this button <em>&ldquo;electric blueberry&rdquo;</em>?
                            </p>
                            <p>
                                Color usage is just one way in which your design system can get out of hand.
                                Your carefully assembled color palette can start to expand to accomodate your
                                design system&apos;s interaction states, visual hierarchy, accessibility
                                concerns, and other realities of maintaining an application in the long term.
                                As the design system grows, these new colors fall into inconsistent use and
                                inconsistent naming practices. Engineers are less certain of which colors to
                                use and when to choose a new one. Color usage in your application becomes less
                                meaningful, purposeful and accessible.
                            </p>
                        </ProseSectionBody>
                    </ProseSection>

                    <ProseSection>
                        <ProseSectionHeading>How did I fix it?</ProseSectionHeading>
                        <ProseSectionBody>
                            <p>
                                <em>
                                    TL;DR: Start with the palette you will need, and share it between design
                                    and engineering.
                                </em>
                            </p>
                            <p>
                                We&apos;re often working from a set of core brand colors, so that&apos;s where
                                I started. I wrote an application that takes a seed color, then builds an array
                                of shades from that seed. The resulting color palettes contain a broad enough
                                selection to accomodate subtle hover states, text contrast issues, light
                                mode/dark mode color palettes and more. Try it out below to see an example of
                                how I put this into practice.
                            </p>
                            <PaletteWidget />
                        </ProseSectionBody>
                    </ProseSection>

                    <ProseSection>
                        <ProseSectionHeading>Making it easier to get started</ProseSectionHeading>
                        <ProseSectionBody>
                            <p>
                                Our team needed help organizing the implementation of our design system and its
                                more deliberate color palette, so I built a set of internal tools to make
                                things easier. In addition to generating arrays of color variations there were
                                a number of features for the engineering and design teams. The colors could be
                                output as JS objects or CSS variables so they could be easily incorporated into
                                our codebase. In addition, engineers could supply a hex code or RGB value from
                                the codebase and find out which color from the new color palette most closely
                                matched that color, significantly accellerating the clean-up of our UI.
                            </p>
                        </ProseSectionBody>
                    </ProseSection>

                    <ProseSection>
                        <ProseSectionHeading>P.S. There&apos;s a Figma Plugin</ProseSectionHeading>
                        <ProseSectionBody>
                            <p>
                                The cleanup went quickly and smoothly, the team was really happy with our color
                                palette generator. I found myself using the generator for almost every project
                                I worked on, even outside of work. So I figured I&apos;d share the joy.
                            </p>
                            <p>
                                I&apos;ve released a{' '}
                                <a
                                    href="https://www.figma.com/community/plugin/849144368519969202"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: 'var(--color-primary-text)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                                >
                                    Figma Plugin
                                </a>
                                , based on the color palette generator, released to the Figma community.
                            </p>
                        </ProseSectionBody>
                    </ProseSection>

                    <NextCaseStudy current="/work/colors" nextHref="/work/sistema" />
                </Narrow>
            </main>
        </>
    )
}

const Paletteer = () => {
    return isPrivate
        ? <PasswordProtect isPrivate AuthenticatedContent={AuthenticatedContent} UnauthenticatedContent={UnauthenticatedContent} />
        : <AuthenticatedContent />
}

export default Paletteer
