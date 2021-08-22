import { useEffect, useState } from 'react'

import ColorPicker from './ColorPicker'

const GradientInput = (props) => {
    const gradientSides = { start: 'start', end: 'end' }
    const [showPicker, setShowPicker] = useState(false)
    const [gradientSide, setGradientSide] = useState(null)

    const updateGradient = (update) => {
        let newColor = {}
        newColor[gradientSide] = update
        let gradientParams = {
            ...props.valueFromProps,
            ...newColor,
        }
        setShowPicker(false)
        props.handleChange(gradientParams)
    }

    const showStartPicker = () => {
        setGradientSide(gradientSides.start)
        setShowPicker(true)
    }

    const showEndPicker = () => {
        setGradientSide(gradientSides.end)
        setShowPicker(true)
    }

    const { projectColors, tooltipText } = props
    let { start, end } = props.valueFromProps

    const startThumbnailStyles = {
        background: start,
    }

    const endThumbnailStyles = {
        background: end,
    }

    const gradientThumbPreviewStyles = {
        background: `linear-gradient(to right, ${start}, ${end})`,
    }

    return (
        <div className="gradient-adjustment">
            <div className="gradient-adjustment__gradient-thumbnail">
                <div
                    className="gradient-adjustment__gradient-thumbnail-preview"
                    style={gradientThumbPreviewStyles}
                />
                <div
                    className={'gradient-adjustment__gradient-start-thumbnail'}
                    onClick={showStartPicker}
                    style={startThumbnailStyles}
                />
                <div
                    className={'gradient-adjustment__gradient-end-thumbnail'}
                    onClick={showEndPicker}
                    style={endThumbnailStyles}
                />
            </div>
            <ColorPicker
                colors={projectColors}
                updateColor={updateGradient}
                show={showPicker}
            />
        </div>
    )
}

export default GradientInput
