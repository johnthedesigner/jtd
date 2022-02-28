import chroma from 'chroma-js'
import _ from 'lodash'

import * as Curves from './curves'
import crayolaColors from './crayolaColors'

const generateColors = (sourceColor, steps = 12) => {
    // Bail out if there isn't really a source color provided
    if (!sourceColor) return true

    // Configuration
    // let steps = 12; // Number of color swatches in each palette
    let contrastRange = [1.1, 19] // We'll be generating palettes based on text contrast

    // build a distribution of contrast values we will target
    let contrastDistribution = _.times(steps, (index) => {
        let curveStep = Curves['easeInOutQuint'](index / (steps - 1))
        let range = contrastRange[1] - contrastRange[0]
        return curveStep * range + contrastRange[0]
    })

    // Figure out the closest contrast value for source color and get the index
    let sourceContrast = chroma.contrast(sourceColor, 'white').toFixed(2)
    let closestContrastValue = _.first(
        _.sortBy(contrastDistribution, (contrastStep) => {
            return Math.abs(contrastStep - sourceContrast)
        })
    )

    // Return the index of the closest matching value
    let sourceColorIndex = _.findIndex(contrastDistribution, (o) => {
        return o === closestContrastValue
    })

    // Confine a number to a range from 0 to 1
    let confine = (number) => {
        return Math.max(Math.min(number, 1), 0)
    }

    // Build a wider set of colors to choose from
    let expandedColors = new Array()
    let hueIncrement = 0.15 // rate of hue change
    let satIncrement = 0.008 // rate of saturation change
    let lumIncrement = 0.015 // rate of luminosity change
    _.times(steps * 10, (index) => {
        let sourceColorHSV = chroma(sourceColor).hsv()
        let lighterHue = sourceColorHSV[0] + hueIncrement * index
        let lighterSat = confine(sourceColorHSV[1] - satIncrement * index)
        let lighterLum = confine(sourceColorHSV[2] + lumIncrement * index)
        let darkerHue = sourceColorHSV[0] - hueIncrement * 2 * index
        let darkerSat = confine(sourceColorHSV[1] + satIncrement * 4 * index)
        let darkerLum = confine(sourceColorHSV[2] - lumIncrement * index)
        let lighterColor = chroma(
            chroma.hsv(lighterHue, lighterSat, lighterLum)
        ).hex()
        let darkerColor = chroma(
            chroma.hsv(darkerHue, darkerSat, darkerLum)
        ).hex()
        expandedColors.push(darkerColor)
        expandedColors.push(lighterColor)
    })

    // Select a color for the light end of our palette based on black text contrast
    let lightestColor = _.first(
        _.sortBy(expandedColors, (color) => {
            let colorContrast = chroma.contrast(color, 'black').toFixed(2)
            return Math.abs(colorContrast - 19)
        })
    )

    // Select a color for the dark end of our palette based on white text contrast
    let darkestColor = _.first(
        _.sortBy(expandedColors, (color) => {
            let colorContrast = chroma.contrast(color, 'white').toFixed(2)
            return Math.abs(colorContrast - 18)
        })
    )

    // Build a color palette from the lightest, darkest and source colors
    let colorGradient = chroma
        .scale([
            chroma(lightestColor).hex(),
            sourceColor,
            chroma(darkestColor).hex(),
        ])
        .domain([0, sourceColorIndex / (steps - 1), 1])
        .colors(steps)

    // Assemble the swatch list for this palette
    let swatchList = _.map(colorGradient, (color, index) => {
        const contrastWhite = chroma.contrast(color, 'white').toFixed(2)
        const contrastBlack = chroma.contrast(color, 'black').toFixed(2)
        var displayColor = ''
        if (contrastWhite >= 4.5) {
            displayColor = 'white'
        } else {
            displayColor = 'black'
        }
        return {
            hex: chroma(color).hex(),
            hue: chroma(color).hsv()[0],
            sat: chroma(color).hsv()[1],
            lum: chroma(color).hsv()[2],
            hsv: chroma(color).hsv(),
            hsl: chroma(color).hsl(),
            rgb: chroma(color).rgb(),
            contrastBlack: contrastBlack,
            contrastWhite: contrastWhite,
            displayColor: displayColor,
            sourceColorIndex,
            steps,
        }
    })

    // Pick a name for this set of swatches and apply it to each swatch
    let swatchName = _.first(
        _.orderBy(
            _.map(crayolaColors, (color) => {
                color.distance = chroma.distance(color.hex, sourceColor)
                return color
            }),
            'distance',
            'asc'
        )
    ).name

    // Make the swatch name lowercase and replace spaces with hyphens
    let swatchNameFormatted = swatchName
        .trim()
        .replace(/\s/g, '-')
        .toLowerCase()

    // Add swatch names to each swatch in the palette
    _.each(swatchList, (swatch, i) => {
        swatchList[i].name = `${swatchNameFormatted}-${i}`
    })

    return {
        name: swatchName,
        swatches: swatchList,
        sourceColorIndex: swatchList[0].sourceColorIndex,
    }
}

export default generateColors
