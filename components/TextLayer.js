import { useEffect, useRef, useState } from 'react'
import _ from 'lodash'

import { typeStyles } from '../utils/adjustmentOptions'

const TextLayer = (props) => {
    const [renderedText, setRenderedText] = useState('')
    const [dimensions, setDimensions] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
    })

    let textTag = useRef(null)

    useEffect(async () => {
        await setDimensions(props.dimensions)
        layoutText(props)
    }, [
        renderedText,
        props.layer.dimensions,
        props.isScaled,
        props.scaleFactor,
        props.adjustments,
    ])

    const layoutText = (props) => {
        let { align, fontSize } = props.layer.adjustments.text
        let layerWidth = props.layer.dimensions.width

        // Keep track of text rows
        let currentRow = 0 // Start with the first row (duh)

        // Set up array to contain rows, starting with first row
        let rows = [
            {
                firstChild: 0, // index of the current row's first element
                width: 0, // We'll increment this as we go
                offset: 0, // track offset if necessary for text alignment
            },
        ]

        const getAlignOffset = (layerWidth, rowWidth, align) => {
            let alignOffset = 0
            if (align === 'center') alignOffset = (layerWidth - rowWidth) / 2
            if (align === 'right') alignOffset = layerWidth - rowWidth
            return alignOffset
        }

        // Go through each text element and build rows
        _.each(textTag.current.children, (child, index) => {
            // Reset existing positioning
            child.setAttribute('dx', 0)
            child.setAttribute('dy', 0)

            // Get width of child element
            let childWidth = child.getComputedTextLength()

            if (rows[currentRow].width + childWidth < layerWidth) {
                // It fits! add to row width and update alignment offset
                rows[currentRow].width += childWidth
                rows[currentRow].offset = getAlignOffset(
                    layerWidth,
                    rows[currentRow].width,
                    align
                )
            } else {
                // It didn't fit. increment row and add new row to rows array
                currentRow++
                rows[currentRow] = {
                    firstChild: index,
                    width: childWidth,
                    offset: getAlignOffset(layerWidth, childWidth, align),
                }
            }
        })

        // Go through rows data and apply positioning
        let lineHeight = fontSize * 1.125 // How far to offset new rows vertically
        _.each(rows, (row, index) => {
            let firstWord = textTag.current.children[row.firstChild]
            let prevRow = rows[index - 1]
            let prevRowOffset =
                index > 0 ? (prevRow.width + prevRow.offset) * -1 : 0
            firstWord.setAttribute('dx', prevRowOffset + row.offset)
            firstWord.setAttribute('dy', lineHeight)
        })
    }

    // const textTag = useRef()

    let { layer } = props
    let { color, fontFamily, fontSize, fontWeight, italic, underline } =
        layer.adjustments.text
    let fontFamilyProps = _.find(typeStyles.families, (family) => {
        return family.id === fontFamily
    })
    let { x, y, width, height, rotation } = dimensions
    let { text, isEditable } = layer
    let textArray = text.split(' ')
    let rotateOriginX = x + width / 2
    let rotateOriginY = y + height / 2
    // Default left-aligned text props
    let textAnchor = 'start'
    let dx = 0

    let opacity = layer.adjustments.blending.opacity
    let blendMode = layer.adjustments.blending.mode

    let textStyles = {
        visibility: isEditable ? 'hidden' : 'visible',
        mixBlendMode: blendMode ? blendMode : 'normal',
    }

    return (
        <text
            draggable={false}
            fill={color}
            fontSize={fontSize}
            key={`rect${layer.id}`}
            x={x}
            y={y}
            dx={dx}
            dy={fontSize}
            fontFamily={fontFamilyProps.value}
            fontStyle={italic ? 'italic' : 'normal'}
            fontWeight={fontWeight}
            opacity={opacity}
            ref={textTag}
            style={textStyles}
            textAnchor={textAnchor}
            textDecoration={underline ? 'underline' : 'none'}
            // transform={`rotate(${rotation} ${rotateOriginX} ${rotateOriginY})`}
        >
            {_.map(textArray, (chunk, index) => {
                return (
                    <tspan key={index} textAnchor={textAnchor}>
                        {chunk + ' '}
                    </tspan>
                )
            })}
        </text>
    )
}
export default TextLayer
