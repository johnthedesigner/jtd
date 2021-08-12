import { useEffect, useState } from 'react'

import ColorInput from './ColorInput'
import MaskedTextInput from './MaskedTextInput'
import { adjustLayers } from '../utils/actions'

const StrokeAdjustment = (props) => {
    const [strokeWidth, setStrokeWidth] = useState(0)
    const [strokeColor, setStrokeColor] = useState('')

    useEffect(() => {
        if (props.adjustments) {
            if (props.adjustments.width) setStrokeWidth(props.adjustments.width)
            if (props.adjustments.color) setStrokeColor(props.adjustments.color)
        }
    }, [props.adjustments])

    let adjustmentGroup = 'stroke'

    const { adjustments, projectColors } = props

    const setLayerAdjustment = (propertyName, value) => {
        props.dispatch(adjustLayers(adjustmentGroup, propertyName, value))
    }

    // const setStrokeWidth = (value) => setLayerAdjustment('width', value)

    // const setStrokeColor = (value) => setLayerAdjustment('color', value)

    if (adjustments) {
        return (
            <div>
                <div className="adjustments-panel__header">Stroke</div>
                <div className="adjustments-panel__adjustment-block">
                    <MaskedTextInput
                        propertyName={'width'}
                        label="Width"
                        setValue={(value) => setLayerAdjustment('width', value)}
                        suffix="px"
                        tooltipText="Stroke width"
                        type="text"
                        valueFromProps={strokeWidth}
                    />
                    <ColorInput
                        projectColors={projectColors}
                        propertyName={'color'}
                        handleChange={(value) =>
                            setLayerAdjustment('color', value)
                        }
                        tooltipText="Stroke color"
                        valueFromProps={strokeColor}
                    />
                </div>
            </div>
        )
    } else {
        return null
    }
}

export default StrokeAdjustment
