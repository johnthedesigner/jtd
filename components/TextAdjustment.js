import { useEffect, useState } from 'react'
import _ from 'lodash'

import ColorInput from './ColorInput'
import SelectInput from './SelectInput'
import ToggleInput from './ToggleInput'

import { fontSizes, typeStyles } from '../utils/adjustmentOptions'
import { adjustLayers } from '../utils/actions'

const TypeAdjustment = (props) => {
    const adjustmentGroup = 'text'

    const { adjustments, projectColors } = props

    const alignOptions = _.map(['left', 'center', 'right'], (option) => {
        return { name: option, value: option }
    })

    const fontFamilyOptions = _.map(typeStyles.families, (style) => {
        return { name: style.name, value: style.id }
    })

    const fontSizeOptions = _.map(fontSizes, (size) => {
        return { name: size, value: size }
    })

    let fontFamilyFromProps = ''
    if (props.adjustments && props.adjustments.fontFamily)
        fontFamilyFromProps = props.adjustments.fontFamily

    const currentFamily = _.find(typeStyles.families, {
        id: fontFamilyFromProps,
    })
    const fontWeightOptions = []
    if (currentFamily) {
        _.each(currentFamily.weights, (weight) => {
            fontWeightOptions.push({ name: weight, value: weight })
        })
    }

    if (adjustments) {
        return (
            <div>
                <div className="adjustments-panel__header">Text</div>
                <div className="adjustments-panel__adjustment-block">
                    <SelectInput
                        key={adjustmentGroup + 'fontFamily'}
                        propertyName={'fontFamily'}
                        options={fontFamilyOptions}
                        setValue={(value) =>
                            props.dispatch(
                                adjustLayers('text', 'fontFamily', value)
                            )
                        }
                        tooltipText="Font family"
                        valueFromProps={props.adjustments.fontFamily}
                    />
                    <SelectInput
                        key={adjustmentGroup + 'fontWeight'}
                        propertyName={'fontWeight'}
                        label="Weight"
                        options={fontWeightOptions}
                        setValue={(value) =>
                            props.dispatch(
                                adjustLayers('text', 'fontWeight', value)
                            )
                        }
                        tooltipText="Font weight"
                        valueFromProps={props.adjustments.fontWeight}
                    />
                    <SelectInput
                        key={adjustmentGroup + 'fontSize'}
                        propertyName={'fontSize'}
                        label="Size"
                        options={fontSizeOptions}
                        setValue={(value) =>
                            props.dispatch(
                                adjustLayers('text', 'fontSize', value)
                            )
                        }
                        tooltipText="Font size"
                        valueFromProps={props.adjustments.fontSize}
                    />
                    <SelectInput
                        key={adjustmentGroup + 'align'}
                        propertyName={'align'}
                        label="Align"
                        options={alignOptions}
                        setValue={(value) =>
                            props.dispatch(adjustLayers('text', 'align', value))
                        }
                        tooltipText="Text alignment"
                        valueFromProps={props.adjustments.align}
                    />
                    <ColorInput
                        key={adjustmentGroup + 'color'}
                        projectColors={projectColors}
                        propertyName={'color'}
                        handleChange={(value) =>
                            props.dispatch(adjustLayers('text', 'color', value))
                        }
                        tooltipText="Text color"
                        valueFromProps={props.adjustments.color}
                    />
                    <ToggleInput
                        propertyName={'italic'}
                        handleChange={(value) =>
                            props.dispatch(
                                adjustLayers('text', 'italic', value)
                            )
                        }
                        tooltipText="Italic"
                        valueFromProps={props.adjustments.italic}
                    />
                    <ToggleInput
                        propertyName={'underline'}
                        handleChange={(value) =>
                            props.dispatch(
                                adjustLayers('text', 'underline', value)
                            )
                        }
                        tooltipText="Underlined"
                        valueFromProps={props.adjustments.underline}
                    />
                </div>
            </div>
        )
    } else {
        return null
    }
}

export default TypeAdjustment
