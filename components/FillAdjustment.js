import { useEffect, useState } from 'react'
import _ from 'lodash'

import ColorInput from './ColorInput'
import GradientInput from './GradientInput'
import SelectInput from './SelectInput'
import { fillTypes } from '../utils/adjustmentOptions'
import { colorsWithFallback } from '../utils/colorUtils'
import { adjustLayers } from '../utils/actions'

const FillAdjustment = (props) => {
    const [type, setType] = useState('')
    const [color, setColor] = useState('')
    const [gradient, setGradient] = useState('')

    useEffect(() => {
        let { adjustments } = props
        if (adjustments) {
            if (adjustments.type) setType(adjustments.type)
            if (adjustments.color) setColor(adjustments.color)
            if (adjustments.gradient) setGradient(adjustments.gradient)
        } else {
            setType('')
            setColor('')
            setGradient('')
        }
    })

    const setGradientFill = (gradient) => {
        props.dispatch(adjustLayers('fill', 'gradient', gradient))
    }

    const setSolidFill = (solid) => {
        props.dispatch(adjustLayers('fill', 'color', solid))
    }

    const setFillType = (value) => {
        props.dispatch(adjustLayers('fill', 'type', value))
    }

    const fillTypeOptions = _.map(fillTypes, (option) => {
        return { name: option.name, value: option.type }
    })

    if (type) {
        let fillColors = colorsWithFallback(color, gradient)

        return (
            <div>
                <div className="adjustments-panel__header">Fill</div>
                <div className="adjustments-panel__adjustment-block">
                    <SelectInput
                        options={fillTypeOptions}
                        propertyName={'type'}
                        setValue={setFillType}
                        valueFromProps={type}
                    />
                    {type === 'color' && (
                        <ColorInput
                            handleChange={setSolidFill}
                            projectColors={props.projectColors}
                            propertyName={'color'}
                            valueFromProps={fillColors.solid}
                        />
                    )}
                    {type === 'gradient' && (
                        <GradientInput
                            handleChange={setGradientFill}
                            projectColors={props.projectColors}
                            propertyName={'gradient'}
                            valueFromProps={fillColors.gradient}
                        />
                    )}
                </div>
            </div>
        )
    } else {
        return null
    }
}

export default FillAdjustment
