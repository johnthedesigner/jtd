import { useEffect, useState } from 'react'

import RectangleLayer from './RectangleLayer'
import ImageLayer from './ImageLayer'
import TextLayer from './TextLayer'
import EllipseLayer from './EllipseLayer'

export const layerTypes = {
    ellipse: 'ellipse',
    image: 'image',
    rectangle: 'rectangle',
    text: 'text',
}

const Layer = (props) => {
    const { dimensions, tempDimensions } = props.layer

    const [renderDimensions, setRenderDimensions] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: '0deg',
    })

    useEffect(() => {
        let layerDimensions = {}
        if (tempDimensions !== undefined) {
            layerDimensions = tempDimensions
        } else {
            layerDimensions = dimensions
        }
        setRenderDimensions(layerDimensions)
    }, [dimensions, tempDimensions])

    const layerType = (layer) => {
        switch (layer.type) {
            case layerTypes.ellipse:
                return (
                    <EllipseLayer dimensions={renderDimensions} layer={layer} />
                )

            case layerTypes.image:
                return (
                    <ImageLayer dimensions={renderDimensions} layer={layer} />
                )

            case layerTypes.rectangle:
                return (
                    <RectangleLayer
                        dimensions={renderDimensions}
                        layer={layer}
                    />
                )

            case layerTypes.text:
                return (
                    <TextLayer
                        dimensions={renderDimensions}
                        layer={layer}
                        isScaled={props.isScaled}
                        scaleFactor={props.scaleFactor}
                        // scaleLayer={props.scaleLayer}
                    />
                )

            default:
                console.log('Unrecognized layer type: ', layer.type)
        }
    }

    let { layer } = props

    return <g key={`g${layer.id}`}>{layerType(layer)}</g>
}

export default Layer
