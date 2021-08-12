import { useEffect, useState } from 'react'
import _ from 'lodash'

import ColorInput from './ColorInput'
import SelectInput from './SelectInput'
import ToggleInput from './ToggleInput'

import { fontSizes, typeStyles } from '../utils/adjustmentOptions'
import { adjustLayers } from '../utils/actions'

const TypeAdjustment = (props) => {
    const adjustmentGroup = 'text'

    const [alignment, setAlignment] = useState('left')
    const [fontColor, setFontColor] = useState('')
    const [fontFamily, setFontFamily] = useState('')
    const [fontSize, setFontSize] = useState('')
    const [fontWeight, setFontWeight] = useState('')
    const [italic, setItalic] = useState(false)
    const [underline, setUnderline] = useState(false)

    const { adjustments, projectColors } = props

    useEffect(() => {
        if (adjustments) {
            if (adjustments.align) setAlignment(adjustments.align)
            if (adjustments.color) setFontColor(adjustments.color)
            if (adjustments.fontFamily) setFontFamily(adjustments.fontFamily)
            if (adjustments.fontSize) setFontSize(adjustments.fontSize)
            if (adjustments.fontWeight) setFontWeight(adjustments.fontWeight)
            if (adjustments.italic) setItalic(adjustments.italic)
            if (adjustments.underline) setUnderline(adjustments.underline)
        }
    }, [adjustments])

    const alignOptions = _.map(['left', 'center', 'right'], (option) => {
        return { name: option, value: option }
    })

    const fontFamilyOptions = _.map(typeStyles.families, (style) => {
        return { name: style.name, value: style.id }
    })

    const fontSizeOptions = _.map(fontSizes, (size) => {
        return { name: size, value: size }
    })

    const currentFamily = _.find(typeStyles.families, { id: fontFamily })
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
                        valueFromProps={fontFamily}
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
                        valueFromProps={fontWeight}
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
                        valueFromProps={fontSize}
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
                        valueFromProps={alignment}
                    />
                    <ColorInput
                        key={adjustmentGroup + 'color'}
                        projectColors={projectColors}
                        propertyName={'color'}
                        setValue={(value) =>
                            props.dispatch(
                                adjustLayers('text', 'fontColor', value)
                            )
                        }
                        tooltipText="Text color"
                        valueFromProps={fontColor}
                    />
                    <ToggleInput
                        propertyName={'italic'}
                        setValue={(value) =>
                            props.dispatch(
                                adjustLayers('text', 'italic', value)
                            )
                        }
                        tooltipText="Italic"
                        valueFromProps={italic}
                    />
                    <ToggleInput
                        propertyName={'underline'}
                        setValue={(value) =>
                            props.dispatch(
                                adjustLayers('text', 'underline', value)
                            )
                        }
                        tooltipText="Underlined"
                        valueFromProps={underline}
                    />
                </div>
            </div>
        )
    } else {
        return null
    }
}

export default TypeAdjustment
