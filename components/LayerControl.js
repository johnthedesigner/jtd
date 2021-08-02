import { useEffect, useState } from 'react'

import { scaleDimension } from '../utils/artboardUtils'

const LayerControl = (props) => {
    const [dimensions, setDimensions] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
    })

    useEffect(() => {
        if (props.layer.dimensions) setDimensions(props.layer.dimensions)
    }, [props.layer.dimensions])

    const isHighlighted = props.highlightedLayer === props.layer.id
    const isSelected = props.selectedLayer === props.layer.id

    const layerControlStyles = {
        position: 'absolute',
        left: scaleDimension(dimensions.x, props.scaleFactor),
        top: scaleDimension(dimensions.y, props.scaleFactor),
        width: scaleDimension(dimensions.width, props.scaleFactor),
        height: scaleDimension(dimensions.height, props.scaleFactor),
        border: `${
            isHighlighted || isSelected
                ? '1px solid magenta'
                : '1px solid transparent'
        }`,
    }

    return (
        <div
            style={layerControlStyles}
            onMouseOver={() => props.highlightLayer(props.layer.id)}
            onMouseOut={() => props.highlightLayer(null)}
            onClick={(e) => {
                e.stopPropagation()
                props.selectLayer(props.layer.id)
            }}
        />
    )
}

export default LayerControl
