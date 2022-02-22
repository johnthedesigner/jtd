import { useEffect, useState } from 'react'
import _ from 'lodash'

import RectangleLayer from './RectangleLayer'
import ImageLayer from './ImageLayer'
import TextLayer from './TextLayer'
import EllipseLayer from './EllipseLayer'
import { selectLayer } from '../utils/actions'

export const layerTypes = {
    ellipse: 'ellipse',
    image: 'image',
    rectangle: 'rectangle',
    text: 'text',
}

const Layer = (props) => {
    const { artboard } = props
    const { dimensions, tempDimensions } = props.layer

    const [renderDimensions, setRenderDimensions] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: '0',
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

    const handleClick = (e) => {
        e.stopPropagation()
        props.dispatch(selectLayer(props.layer.id, e.shiftKey))
    }

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
                if (props.artboard.editableTextLayer === layer.id) {
                    return null
                } else {
                    return (
                        <TextLayer
                            dimensions={renderDimensions}
                            layer={layer}
                            isScaled={props.isScaled}
                            scaleFactor={props.scaleFactor}
                        />
                    )
                }

            default:
                console.log('Unrecognized layer type: ', layer.type)
        }
    }

    let { layer } = props

    return (
        <g key={`g${layer.id}`} onClick={handleClick} onMouseDown={handleClick}>
            {layerType(layer)}
        </g>
    )
}

export default Layer
