import { useEffect, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'

import { scaleDimension } from '../utils/artboardUtils'

const ItemTypes = {
    LAYER_CONTROL: 'LAYER_CONTROL',
}

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

    // Drag-and-drop handling
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.LAYER_CONTROL,
        item: { id: props.layer.id },
        collect: (monitor) => {
            return {
                isDragging: !!monitor.isDragging(),
                offset: monitor.getDifferenceFromInitialOffset(),
            }
        },
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult()
            if (item && dropResult) {
                // console.log(dropResult, monitor.getSourceClientOffset())
            }
        },
    }))

    const isHighlighted = props.highlightedLayer === props.layer.id
    const isSelected = props.selectedLayer === props.layer.id

    const layerControlStyles = {
        position: 'absolute',
        left: scaleDimension(dimensions.x, props.scaleFactor),
        top: scaleDimension(dimensions.y, props.scaleFactor),
        width: scaleDimension(dimensions.width, props.scaleFactor),
        height: scaleDimension(dimensions.height, props.scaleFactor),
        background: 'rgba(255,0,0,0.5',
        border: `${
            isHighlighted || isSelected
                ? '1px solid magenta'
                : '1px solid transparent'
        }`,
    }

    // console.log(offset)

    return (
        <div
            ref={drag}
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
