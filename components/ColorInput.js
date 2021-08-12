import { useState } from 'react'
import Tooltip from '@material-ui/core/Tooltip'

import ColorPicker from './ColorPicker'

const ColorInput = (props) => {
    const [showPicker, setShowPicker] = useState(false)

    const updateColor = (color) => {
        setShowPicker(!showPicker)
        props.handleChange(color)
    }

    const { projectColors, propertyName, valueFromProps, tooltipText } = props

    const thumbnailStyles = {
        background: valueFromProps ? valueFromProps : 'rgb(0,0,0)',
    }

    const previewStyles = {
        background: valueFromProps ? valueFromProps : 'rgb(0,0,0)',
    }

    return (
        <div className="color-adjustment">
            <Tooltip title={tooltipText} placement="right">
                <div className="color-adjustment__color-thumbnail">
                    <div
                        className="color-adjustment__preview"
                        style={previewStyles}
                    />
                    <div
                        className={`color-adjustment__thumbnail color-adjustment__thumbnail--${propertyName}`}
                        onClick={() => setShowPicker(!showPicker)}
                        style={thumbnailStyles}
                    />
                </div>
            </Tooltip>
            <ColorPicker
                colors={projectColors}
                updateColor={updateColor}
                show={showPicker}
            />
        </div>
    )
}

export default ColorInput
