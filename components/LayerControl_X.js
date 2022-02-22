import { useEffect, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'

import { getLayerDimensions, scaleDimension } from '../utils/artboardUtils'
import { selectLayer } from '../utils/actions'
import ResizeHandle from './ResizeHandle'

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
        let selectedLayers = _.filter(props.layers, (layer) => {
            return _.includes(props.selections, layer.id)
        })
        setDimensions(getLayerDimensions(selectedLayers))
    }, [props.selections])

    // Drag-and-drop handling
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.LAYER_CONTROL,
        item: { selections: props.selections },
        collect: (monitor) => {
            return {
                isDragging: !!monitor.isDragging(),
                offset: monitor.getDifferenceFromInitialOffset(),
            }
        },
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult()
            if (item && dropResult) {
                console.log(dropResult, monitor.getSourceClientOffset())
            }
        },
    }))

    const layerControlStyles = {
        position: 'absolute',
        left: 0,
        top: 0,
        width: props.artboardSize,
        height: props.artboardWidth,
        pointerEvents: 'default',
    }

    // console.log(offset)

    if (props.selections.length > 0) {
        return (
            <div
                className="resize-handle__wrapper"
                ref={drag}
                style={layerControlStyles}
                onClick={(e) => {
                    console.log(e)
                    e.stopPropagation()
                    props.selectLayer(props.layer.id)
                    e.shiftKey
                }}
            >
                <ResizeHandle
                    artboard={props.artboard}
                    // artboardSize={props.artboardSize}
                    dimensions={dimensions}
                    selections={props.artboard.selections}
                    dispatch={props.dispatch}
                    layers={props.artboard.layers}
                    scaleFactor={props.scaleFactor}
                />
            </div>
        )
    } else {
        return null
    }
}

export default LayerControl
