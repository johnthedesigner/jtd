import _ from 'lodash'

import { typeStyles } from '../utils/adjustmentOptions'

const TextLayer = (props) => {
    const { x, y, width, height, rotation } = props.layer.dimensions
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
        <foreignObject x={x} y={y} width={width} height={height}>
            <div style={textStyles}>{props.layer.text}</div>
        </foreignObject>
    )
}
export default TextLayer
