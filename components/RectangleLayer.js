import { useEffect, useState } from 'react'

const RectangleLayer = (props) => {
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

    let { layer } = props
    let { stroke } = layer.adjustments
    let rotateOriginX = dimensions.x + dimensions.width / 2
    let rotateOriginY = dimensions.y + dimensions.height / 2

    let opacity = layer.adjustments.blending.opacity
    let blendMode = layer.adjustments.blending.mode
    let layerStyles = {
        mixBlendMode: blendMode ? blendMode : 'normal',
    }

    return (
        <rect
            key={`rect${props.layer.id}`}
            draggable={false}
            x={dimensions ? dimensions.x : 0}
            y={dimensions.y}
            width={dimensions.width}
            height={dimensions.height}
            fill={`url(#gradient${props.layer.id})`}
            opacity={opacity}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            style={layerStyles}
            // transform={`rotate(${dimensions.rotation} ${rotateOriginX} ${rotateOriginY})`}
        />
    )
}

export default RectangleLayer
