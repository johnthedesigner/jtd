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
    '#EB7F78',
    '#F4AE6D',
    '#FFDD64',
    '#75DC9E',
    '#60D8FE',
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
                <h3 style={{ textAlign: 'center' }}>
                    Choose a seed color to get started
                </h3>
                <div
                    className="seedColors"
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
                            background: palettes.grayscale[0],
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
                            height: '2rem',
                            width: '2rem',
                            borderRadius: '50%',
                            margin: '0 .125rem',
                            cursor: 'pointer',
                            borderColor:
                                seed == seedColor
                                    ? palettes.grayscale[8]
                                    : 'transparent',
                            borderStyle: 'solid',
                            borderWidth: '.0625rem',
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
                    className="palette"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        margin: '2rem auto 0',
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
                                            fontFamily: 'var(--monospace-font)',
                                            fontSize: '.5rem',
                                            padding: '.25rem',
                                        }}
                                    >
                                        {swatch.hex}
                                    </div>
                                </div>
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
                        <h3>What was the problem?</h3>
                        <p>
                            Sed venenatis ipsum metus, vel blandit nunc
                            venenatis sit amet. Aliquam erat volutpat. Cras
                            lacinia felis cursus magna tincidunt porta. Nunc ut
                            augue ultrices, condimentum mi eu, lobortis urna.
                            Quisque suscipit iaculis sollicitudin. Pellentesque
                            habitant morbi tristique senectus et netus et
                            malesuada fames ac turpis egestas.
                        </p>
                        <h3>How did we approach this design?</h3>
                        <p>
                            Sed venenatis ipsum metus, vel blandit nunc
                            venenatis sit amet. Aliquam erat volutpat. Cras
                            lacinia felis cursus magna tincidunt porta. Nunc ut
                            augue ultrices, condimentum mi eu, lobortis urna.
                            Quisque suscipit iaculis sollicitudin. Pellentesque
                            habitant morbi tristique senectus et netus et
                            malesuada fames ac turpis egestas.
                        </p>
                        <PaletteWidget />
                    </div>
                    <div className="work__art-container">
                        <div className="figma-iframe--large">
                            <iframe
                                title="iframe 1"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Full-page mockup of the highlights page
                            </h4>
                        </div>
                    </div>
                    <div className="work__art-container">
                        <div className="figma-iframe--small">
                            <iframe
                                title="iframe 2"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Sed venenatis ipsum metus, vel blandit nunc
                                venenatis sit amet. Aliquam erat volutpat. Cras
                                lacinia felis cursus magna tincidunt porta.
                            </h4>
                        </div>
                        <div className="figma-iframe--small">
                            <iframe
                                title="iframe 3"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Full-page mockup of the highlights page
                            </h4>
                        </div>
                    </div>
                    <div className="work__copy">
                        <h3>How did we approach this design?</h3>
                        <p>
                            Sed venenatis ipsum metus, vel blandit nunc
                            venenatis sit amet. Aliquam erat volutpat. Cras
                            lacinia felis cursus magna tincidunt porta. Nunc ut
                            augue ultrices, condimentum mi eu, lobortis urna.
                            Quisque suscipit iaculis sollicitudin. Pellentesque
                            habitant morbi tristique senectus et netus et
                            malesuada fames ac turpis egestas.
                        </p>
                    </div>
                </div>
            </Layout>
        </main>
    )
}

export default Colors
