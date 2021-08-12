import { useEffect, useState } from 'react'
import _ from 'lodash'

import SelectInput from './SelectInput'
import MaskedTextInput from './MaskedTextInput'
import { adjustLayers } from '../utils/actions'

const blendModes = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'hue',
    'saturation',
    'color',
    'luminosity',
]

const BlendAdjustment = (props) => {
    const [blendMode, setBlendMode] = useState(blendModes[0])
    const [opacity, setOpacity] = useState(1)

    const { adjustments } = props

    useEffect(() => {
        if (adjustments) {
            if (adjustments.mode) setBlendMode(adjustments.mode)
            if (adjustments.opacity) setOpacity(adjustments.opacity)
        }
    }, [adjustments.mode, adjustments.opacity])

    const blendModeOptions = _.map(blendModes, (mode) => {
        return { name: mode, value: mode }
    })

    const setValueOpacity = (value) => {
        let newValue = (value / 100).toFixed(2)
        // don't allow values over 100%
        newValue = value >= 100 ? 1 : newValue
        // don't allow values under 0%
        newValue = value <= 0 ? 0 : newValue
        console.log(value, newValue)
        setOpacity(newValue)
        props.dispatch(adjustLayers('blending', 'opacity', newValue))
    }

    const setValueBlendMode = (value) => {
        // setBlendMode(value)
        props.dispatch(adjustLayers('blending', 'mode', value))
    }

    if (adjustments) {
        return (
            <div>
                <div className="adjustments-panel__header">
                    Blend &amp; Opacity
                </div>
                <div className="adjustments-panel__adjustment-block">
                    <label style={{ fontSize: 12 }}>Blending mode</label>
                    <SelectInput
                        propertyName={'mode'}
                        options={blendModeOptions}
                        setValue={setValueBlendMode}
                        tooltipText="Blending mode"
                        valueFromProps={blendMode}
                    />
                    <MaskedTextInput
                        type="number"
                        propertyName={'opacity'}
                        setValue={setValueOpacity}
                        tooltipText="Opacity"
                        valueFromProps={Math.round(opacity * 100)}
                    />
                </div>
            </div>
        )
    } else {
        return null
    }
}

export default BlendAdjustment
