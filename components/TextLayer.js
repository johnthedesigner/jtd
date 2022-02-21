import { useEffect, useState } from 'react'
import _ from 'lodash'

import { typeStyles } from '../utils/adjustmentOptions'

const TextLayer = (props) => {
    const [dimensions, setDimensions] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
    })

    useEffect(() => {
        setDimensions(props.dimensions)
    }, [props.dimensions])

    const {
        align,
        fontFamily,
        fontSize,
        fontWeight,
        italic,
        underline,
        color,
    } = props.layer.adjustments.text

    let fontFamilyProps = _.find(typeStyles.families, (family) => {
        return family.id === fontFamily
    })

    let rotateOriginX = dimensions.x + dimensions.width / 2
    let rotateOriginY = dimensions.y + dimensions.height / 2

    let opacity = props.layer.adjustments.blending.opacity
    let blendMode = props.layer.adjustments.blending.mode

    const textStyles = {
        fontFamily: fontFamilyProps.value,
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
        textAlign: align,
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: underline ? 'underline' : 'none',
        lineHeight: 1.25,
        opacity,
    }

    const foreignObjectStyles = {
        overflow: 'visible',
        mixBlendMode: blendMode ? blendMode : 'normal',
    }

    return (
        <foreignObject
            x={dimensions.x}
            y={dimensions.y}
            width={dimensions.width}
            height={dimensions.height}
            transform={`rotate(${dimensions.rotation} ${rotateOriginX} ${rotateOriginY})`}
            style={foreignObjectStyles}
        >
            <div style={textStyles}>{props.layer.text}</div>
        </foreignObject>
    )
}
export default TextLayer
