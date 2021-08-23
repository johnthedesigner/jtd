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

    const textStyles = {
        fontFamily: fontFamilyProps.value,
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
        textAlign: align,
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: underline ? 'underline' : 'none',
    }

    return (
        <foreignObject
            x={dimensions.x}
            y={dimensions.y}
            width={dimensions.width}
            height={dimensions.height}
        >
            <div style={textStyles}>{props.layer.text}</div>
        </foreignObject>
    )
}
export default TextLayer
