import { useEffect, useState } from 'react'

const EllipseLayer = (props) => {
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
        <ellipse
            draggable={false}
            cx={dimensions.x + dimensions.width / 2}
            cy={dimensions.y + dimensions.height / 2}
            rx={dimensions.width / 2}
            ry={dimensions.height / 2}
            fill={`url(#gradient${layer.id})`}
            opacity={opacity}
            stroke={stroke.color ? stroke.color : 'rgba(32,32,32)'}
            strokeWidth={stroke.width}
            style={layerStyles}
            // transform={`rotate(${dimensions.rotation} ${rotateOriginX} ${rotateOriginY})`}
        />
    )
}

export default EllipseLayer
