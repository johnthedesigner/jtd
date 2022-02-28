import chroma from 'chroma-js'
import _ from 'lodash'
import Head from 'next/head'
import { useEffect, useState } from 'react'

import Layout from '../../components/Layout'
import WorkHeader from '../../components/WorkHeader'
import { palettes } from '../../utils/colorUtils'
import generateColors from '../../utils/generateColors'
import ActionIcon from '../../components/ActionIcons'

const title =
    'Work: Colors | John the Designer – Boston-Area Product Designer John Livornese'
const description =
    'An example of some of my recent work in a product design role'

const seedColors = [
    '#FF6C63',
    '#FFA51F',
    '#FFEC44',
    '#4FEB8D',
    '#3DACEA',
    '#AA7DE4',
    '#273A40',
]

const defaultExampleColors = {
    cardBackground: 'white',
    labelColor: palettes.grayscale[2],
    buttonBackground: palettes.purple[5],
    buttonOutline: palettes.purple[5],
    outlineButtonText: palettes.purple[5],
    linkText: palettes.purple[5],
    headlineColor: palettes.purple[5],
    iconColor: palettes.purple[5],
    paragraphColor: palettes.grayscale[8],
}

const initialPalette = generateColors(seedColors[5])

const Colors = () => {
    const [seedInput, setSeedInput] = useState('#AA7DE4')
    const [seedColor, setSeedColor] = useState('#AA7DE4')
    const [palette, setPalette] = useState(initialPalette)
    const { swatches } = palette
    const [exampleType, setExampleType] = useState('light')
    const [exampleColors, setExampleColors] = useState(defaultExampleColors)

    var examplePalettes = {
        light: {
            cardBackground: 'white',
            labelColor: palettes.grayscale[2],
            buttonBackground: swatches[5].hex,
            buttonOutline: swatches[5].hex,
            outlineButtonText: swatches[5].hex,
            linkText: swatches[5].hex,
            headlineColor: swatches[3].hex,
            iconColor: swatches[5].hex,
            paragraphColor: palettes.grayscale[8],
        },
        dark: {
            cardBackground: palettes.grayscale[9],
            labelColor: palettes.grayscale[2],
            buttonBackground: swatches[5].hex,
            buttonOutline: swatches[5].hex,
            outlineButtonText: swatches[5].hex,
            linkText: swatches[5].hex,
            headlineColor: swatches[3].hex,
            iconColor: swatches[5].hex,
            paragraphColor: palettes.grayscale[0],
        },
        colorful: {
            cardBackground: swatches[5].hex,
            labelColor: swatches[2].hex,
            buttonBackground: swatches[9].hex,
            buttonOutline: swatches[9].hex,
            outlineButtonText: swatches[0].hex,
            linkText: swatches[0].hex,
            headlineColor: swatches[1].hex,
            iconColor: swatches[9].hex,
            paragraphColor: swatches[0],
        },
    }

    useEffect(() => {
        setPalette(generateColors(seedColor))
    }, [seedColor])

    useEffect(() => {
        setExampleColors(examplePalettes[exampleType])
    }, [palette])

    const handleInputChange = (e) => {
        let { value } = e.target
        // If input is a complete valid color, update the seed color
        let validColor = chroma.valid(value)
        if (validColor) {
            setSeedColor(value)
        }
        setSeedInput(value)
    }

    const handleSeedClick = (seed) => {
        setSeedColor(seed)
        setSeedInput(seed)
    }

    const handleTypeClick = (type) => {
        setExampleType(type)
        setExampleColors(examplePalettes[type])
    }

    const labelStyles = { color: exampleColors.labelColor }

    const PaletteWidget = () => {
        return (
            <>
                <h4
                    style={{
                        fontFamily: 'var(--monospace-font)',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        color: swatches[5].hex,
                        margin: '.75rem auto',
                    }}
                >
                    Choose a seed color to get started
                </h4>
                <div
                    className="seed-colors"
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <input
                        type="text"
                        value={seedInput}
                        onChange={handleInputChange}
                        style={{
                            border: `1px solid ${palettes.grayscale[1]}`,
                            background: 'white',
                            color: palettes.grayscale[8],
                            width: '6rem',
                            height: '2rem',
                            lineHeight: '2rem',
                            padding: '0 .5rem',
                            margin: '0 .5rem',
                            borderRadius: '.25rem',
                            fontFamily: 'var(--monospace-font)',
                            fontSize: '1rem',
                        }}
                    />
                    {_.map(seedColors, (seed) => {
                        let seedStyles = {
                            background: seed,
                            width: '2rem',
                            aspectRatio: '1',
                            borderRadius: '50%',
                            margin: '0 .125rem',
                            cursor: 'pointer',
                            borderColor:
                                seed == seedColor ? 'white' : 'transparent',
                            borderStyle: 'solid',
                            borderWidth: '.125rem',
                            boxSizing: 'border-box',
                        }
                        return (
                            <div
                                key={seed}
                                className="palette__swatch"
                                style={seedStyles}
                                onClick={() => {
                                    handleSeedClick(seed)
                                }}
                            />
                        )
                    })}
                </div>
                <div
                    className="color-examples"
                    style={{ background: exampleColors.cardBackground }}
                >
                    <div className="color-examples__type-selection">
                        <button
                            className="color-examples__type-button"
                            onClick={() => handleTypeClick('light')}
                            style={{
                                background:
                                    examplePalettes.light.cardBackground,
                                color: examplePalettes.light.paragraphColor,
                            }}
                        >
                            Light
                        </button>
                        <button
                            className="color-examples__type-button"
                            onClick={() => handleTypeClick('dark')}
                            style={{
                                background: examplePalettes.dark.cardBackground,
                                color: examplePalettes.dark.paragraphColor,
                            }}
                        >
                            Dark
                        </button>
                        <button
                            className="color-examples__type-button"
                            onClick={() => handleTypeClick('colorful')}
                            style={{
                                background:
                                    examplePalettes.colorful.cardBackground,
                                color: examplePalettes.colorful.paragraphColor,
                            }}
                        >
                            Colorful
                        </button>
                    </div>
                    <div
                        className="color-examples__group"
                        style={{ marginTop: '2rem' }}
                    >
                        <label
                            className="color-examples__label"
                            style={labelStyles}
                        >
                            Color Palette
                        </label>
                        <div
                            className="palette"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, 1fr)',
                                margin: '0 auto',
                                width: '28rem',
                                maxWidth: '100%',
                            }}
                        >
                            {palette &&
                                _.map(palette.swatches, (swatch) => {
                                    let swatchStyles = {
                                        position: 'relative',
                                        background: swatch.hex,
                                        aspectRatio: '2',
                                        margin: '.125rem',
                                        borderRadius: '.25rem',
                                        border: '1px solid rgba(0,0,0,.1)',
                                    }
                                    return (
                                        <div
                                            key={swatch.hex}
                                            className="palette__swatch"
                                            style={swatchStyles}
                                        >
                                            <div
                                                className="palette__swatch-label"
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    color: swatch.displayColor,
                                                    fontFamily:
                                                        'var(--monospace-font)',
                                                    fontSize: '.5rem',
                                                    padding: '.25rem',
                                                    overflow: 'hidden',
                                                }}
                                            />
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                    <div className="color-examples__group">
                        <label
                            className="color-examples__label"
                            style={labelStyles}
                        >
                            Buttons
                        </label>
                        <button
                            className="color-examples__button--primary"
                            style={{
                                background: exampleColors.buttonBackground,
                            }}
                        >
                            Primary
                        </button>
                        <button
                            className="color-examples__button--secondary"
                            style={{
                                borderColor: exampleColors.buttonOutline,
                                color: exampleColors.outlineButtonText,
                            }}
                        >
                            Secondary
                        </button>
                        <button
                            className="color-examples__button--tertiary"
                            style={{
                                color: exampleColors.linkText,
                            }}
                        >
                            Link
                        </button>
                    </div>
                    <div className="color-examples__group">
                        <label
                            className="color-examples__label"
                            style={labelStyles}
                        >
                            Headlines
                        </label>
                        <span
                            className="color-examples__headline"
                            style={{ color: exampleColors.headlineColor }}
                        >
                            The quick brown fox jumped over the lazy dog
                        </span>
                    </div>
                    <div className="color-examples__group">
                        <label
                            className="color-examples__label"
                            style={labelStyles}
                        >
                            Icons
                        </label>
                        <span
                            className="color-examples__icons-row"
                            style={{ color: exampleColors.iconColor }}
                        >
                            <ActionIcon iconType="newRectangle" />
                            <ActionIcon iconType="newEllipse" />
                            <ActionIcon iconType="newText" />
                            <ActionIcon iconType="resize" />
                            <ActionIcon iconType="blending" />
                            <ActionIcon iconType="sendToBack" />
                            <ActionIcon iconType="bringToFront" />
                        </span>
                    </div>
                    <div className="color-examples__group">
                        <label
                            className="color-examples__label"
                            style={labelStyles}
                        >
                            Paragraph Text
                        </label>
                        <p
                            className="color-examples__paragraph"
                            style={{ color: exampleColors.paragraphColor }}
                        >
                            Nam faucibus accumsan ultrices. Duis magna velit,
                            pretium quis ultricies in, efficitur eu nisi. Ut id
                            condimentum neque. Integer dapibus eros urna, quis
                            pharetra nunc fringilla eu.
                        </p>
                    </div>
                </div>
            </>
        )
    }

    return (
        <main className="work-item-page">
            <Layout>
                <Head>
                    <title>{title}</title>
                    <meta property="og:title" content={title} key="title" />
                    <meta name="description" content={description} />
                </Head>
                <div id="main">
                    <WorkHeader
                        superHead="A Refined Palette"
                        headline="Building the color palette you're going to need
                            later"
                        palette={palettes.purple}
                    />
                    <div className="work__copy">
                        <h3>What's the problem?</h3>
                        <p>
                            We've all been there right? Your product (not to
                            mention your style guide) is a few years old, the
                            color palette has grown to three times its original
                            size, there are 16 colors in the codebase just for
                            buttons... wait, who made this button "electric
                            blueberry" for this CTA?
                        </p>
                        <p>
                            Picking a color palette for digital design is
                            complicated. Your carefully assembled color palette
                            can start to expand to accomodate interaction
                            states, visual hierarchy, accessibility concerns and
                            other realities of maintaining an application in the
                            long term. As the palette grows, these new colors
                            fall into inconsistent use and inconsistent naming
                            practices. Engineers are less certain of which
                            colors to use and when to choose a new one.
                        </p>
                        <h3>How did I fix it?</h3>
                        <p>
                            <em>
                                TL;DR: Start with the palette you will need, and
                                share it between design and engineering.
                            </em>
                        </p>
                        <p>
                            We're often working from a set of core brand colors,
                            so that's where I started. I wrote an application
                            that takes a seed color, then builds an array of
                            shades from that seed. The resulting color palettes
                            contain a broad enough selection to accomodate
                            subtle hover states, text contrast issues, light
                            mode/dark mode color palettes and more. Try it out
                            below to see an example of how I put this into
                            practice.
                        </p>
                        <PaletteWidget />
                        <h3>Making it easier to get started</h3>
                        <p>
                            Our team needed help organizing the transition to
                            our new color palette, so I deployed my palette
                            generator internally as a web app. In addition to
                            generating arrays of color variations the app
                            supported an array of features for the team. The
                            colors could be output as JS objects or CSS
                            variables so they could be easily incorporated into
                            our codebase. In addition, engineers could supply a
                            hex code or RGB value from the codebase and find out
                            which color from the new color palette most closely
                            matched that color, significantly accellerating the
                            clean-up color of our UI.
                        </p>
                        <h3>P.S. There's a Figma Plugin</h3>
                        <p>
                            The cleanup went quickly and smoothly, the team was
                            really happy with our color palette generator. I
                            found myself using the generator for almost every
                            project I worked on, even outside of work. So I
                            figured I'd share the joy.
                        </p>
                        <p>
                            I've released a{' '}
                            <a
                                href="https://www.figma.com/community/plugin/849144368519969202"
                                target="_blank"
                            >
                                Figma Plugin
                            </a>
                            , based on the color palette generator and released
                            it to the Figma community.
                        </p>
                    </div>
                </div>
            </Layout>
        </main>
    )
}

export default Colors
