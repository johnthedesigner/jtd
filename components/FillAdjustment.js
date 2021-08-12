import { useEffect, useState } from 'react'
import _ from 'lodash'

import ColorInput from './ColorInput'
import GradientInput from './GradientInput'
import SelectInput from './SelectInput'
import { fillTypes } from '../utils/adjustmentOptions'
import { colorsWithFallback } from '../utils/colorUtils'
import { adjustLayers } from '../utils/actions'

const FillAdjustment = (props) => {
    const [adjustments, setAdjustments] = useState({
        type: '',
        color: '',
        gradient: '',
    })

    useEffect(() => {
        if (props.adjustments) {
            setAdjustments(props.adjustments)
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

    if (adjustments.type) {
        console.log(adjustments.type)
        let fillColors = colorsWithFallback(
            adjustments.color,
            adjustments.gradient
        )

        return (
            <div>
                <div className="adjustments-panel__header">Fill</div>
                <div className="adjustments-panel__adjustment-block">
                    <SelectInput
                        options={fillTypeOptions}
                        propertyName={'type'}
                        setValue={setFillType}
                        tooltipText="Fill type"
                        valueFromProps={adjustments.type}
                    />
                    {adjustments.type === 'color' && (
                        <ColorInput
                            handleChange={setSolidFill}
                            projectColors={props.projectColors}
                            propertyName={'color'}
                            tooltipText="Fill color"
                            valueFromProps={fillColors.solid}
                        />
                    )}
                    {adjustments.type === 'gradient' && (
                        <GradientInput
                            handleChange={setGradientFill}
                            projectColors={props.projectColors}
                            propertyName={'gradient'}
                            tooltipText="Fill gradient"
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
