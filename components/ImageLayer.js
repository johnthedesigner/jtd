import { useEffect, useState } from 'react'

import imageLibrary from '../utils/imageLibrary'

const ImageLayer = (props) => {
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
    let rotateOriginX = dimensions.x + dimensions.width / 2
    let rotateOriginY = dimensions.y + dimensions.height / 2
    let selectedImage = imageLibrary[layer.imageId]

    let blendMode = layer.adjustments.blending.mode
    let layerStyles = {
        mixBlendMode: blendMode ? blendMode : 'normal',
    }

    let opacity = layer.adjustments.blending.opacity

    return (
        <image
            key={`rect${layer.id}`}
            draggable={false}
            x={dimensions.x}
            y={dimensions.y}
            width={dimensions.width}
            height={dimensions.height}
            xlinkHref={selectedImage.url}
            href={selectedImage.url.src}
            opacity={opacity}
            style={layerStyles}
            transform={`rotate(${dimensions.rotation} ${rotateOriginX} ${rotateOriginY})`}
        />
    )
}

export default ImageLayer
