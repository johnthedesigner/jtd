import { useEffect, useState } from 'react'
import _ from 'lodash'
import { DndProvider, DragDropContext, DropTarget } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import DragHandle from './DragHandle'
import ResizeHandle from './ResizeHandle'
import { scaleAllDimensions, unscaleDimension } from '../utils/artboardUtils'
import { dragLayers } from '../utils/actions'

const LayerControl = (props) => {
    const [dimensions, setDimensions] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
    })
    const [pointerOffsets, setPointerOffsets] = useState({})
    const [lastDragUpdate, setLastDragUpdate] = useState(0)

    useEffect(() => {
        let { dimensions, layers, selections } = props
        // If only one layer is selected, grab tempDimensions from that layer
        let tempDimensions =
            selections.length === 1
                ? layers[selections[0]].tempDimensions
                : false
        // setLayerDimensions(dimensions, tempDimensions);

        let layerDimensions = {}
        if (tempDimensions) {
            layerDimensions = tempDimensions
        } else {
            layerDimensions = dimensions
        }

        // If selection dimensions are present, update component state
        if (layerDimensions.x !== null) {
            setDimensions(
                scaleAllDimensions(layerDimensions, props.scaleFactor, true)
            )
        }
    }, [])

    const calculateLayerResize = (offset, handleInfo) => {
        let { scaleFactor } = props
        let { x, y } = offset
        let getVectoredDistance = (direction) => {
            // Get original drag distance
            let distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
            // Adjust Offset coordinates realative to each side
            let adjustedOffset = [x, y]
            switch (direction) {
                case 'top':
                    adjustedOffset = [-1 * y, x]
                    break
                case 'right':
                    adjustedOffset = [x, y]
                    break
                case 'bottom':
                    adjustedOffset = [y, -1 * x]
                    break
                case 'left':
                    adjustedOffset = [-1 * x, -1 * y]
                    break
                default:
                // Do nothing
            }
            // Get drag angle in degrees adjusted for scale factor
            let angleRadians = Math.atan2(adjustedOffset[1], adjustedOffset[0])
            angleRadians -= dimensions.rotation * (Math.PI / 180)
            // Get vectored drag distance and undo scale factor
            let vectoredDistance = distance * Math.cos(angleRadians)
            vectoredDistance = unscaleDimension(vectoredDistance, scaleFactor)
            return vectoredDistance
        }
        // Return an array of directions/scale distances
        return _.map(handleInfo.directions, (direction) => {
            return {
                direction,
                distance: getVectoredDistance(direction),
            }
        })
    }

    const handleDrag = (layerId, x, y) => {
        // console.log(layerId, x, y)
        // props.dispatch(dragLayers(layerId, x, y))
    }

    const handleResize = (resizeDirectives, previewOnly) => {
        props.scaleLayer(resizeDirectives, previewOnly)
    }

    const { canDrop, enableTextEditor, isActive, layers, selectLayer } = props
    const { x, y, width, height, rotation } = dimensions
    const toggleActive = () => {
        return isActive ? ' is-active' : ''
    }

    const dropTargetStyles = {
        display: isActive ? 'block' : 'none',
        position: 'absolute',
        top: canDrop ? -1000 : 0,
        right: canDrop ? -1000 : 0,
        bottom: canDrop ? -1000 : 0,
        left: canDrop ? -1000 : 0,
    }

    const resizeableControlStyles = {
        position: 'absolute',
        top: y,
        left: x,
        width,
        height,
        transform: `rotate(${rotation}deg)`,
        pointerEvents: 'none',
    }

    return (
        <div>
            <DndProvider backend={HTML5Backend}>
                <div
                    className="resize-control__drop-target"
                    style={dropTargetStyles}
                />
                {_.map(_.orderBy(layers, 'order'), (layer, index) => {
                    return (
                        <DragHandle
                            artboard={props.artboard}
                            dispatch={props.dispatch}
                            enableTextEditor={enableTextEditor}
                            handleDrag={handleDrag}
                            HTML5Backend={HTML5Backend}
                            key={layer.id}
                            layer={layer}
                            scaleFactor={props.scaleFactor}
                        />
                    )
                })}
                <div
                    className={'resize-control__wrapper' + toggleActive()}
                    style={resizeableControlStyles}
                >
                    <ResizeHandle
                        className="resize-handle__top"
                        directions={['top']}
                    />
                    <ResizeHandle
                        className="resize-handle__right"
                        directions={['right']}
                    />
                    <ResizeHandle
                        className="resize-handle__bottom"
                        directions={['bottom']}
                    />
                    <ResizeHandle
                        className="resize-handle__left"
                        directions={['left']}
                    />
                    <ResizeHandle
                        className="resize-handle__top-left"
                        directions={['top', 'left']}
                    />
                    <ResizeHandle
                        className="resize-handle__top-right"
                        directions={['top', 'right']}
                    />
                    <ResizeHandle
                        className="resize-handle__bottom-right"
                        directions={['bottom', 'right']}
                    />
                    <ResizeHandle
                        className="resize-handle__bottom-left"
                        directions={['bottom', 'left']}
                    />
                </div>
            </DndProvider>
        </div>
    )
}

// Capture handle drag and drop activity
const dropTargetSpec = {
    drop(props, monitor, component) {
        let handleType = monitor.getItemType()
        switch (handleType) {
            case 'RESIZEABLE':
                let resizeDirectives = component.calculateLayerResize(
                    monitor.getDifferenceFromInitialOffset(),
                    monitor.getItem()
                )
                props.scaleLayer(resizeDirectives, false)
                break

            case 'DRAGGABLE':
                let dragOffset = monitor.getDifferenceFromInitialOffset()
                let layerId = monitor.getItem().layerId
                props.dragLayers(
                    layerId,
                    unscaleDimension(dragOffset.x, props.scaleFactor),
                    unscaleDimension(dragOffset.y, props.scaleFactor),
                    false
                )
                break

            default:
                break
        }
    },
    hover(props, monitor, component) {
        let newPointerOffset = monitor.getDifferenceFromInitialOffset()
        let rightNow = Date.now()
        let dragInterval = rightNow - component.state.lastDragUpdate
        // Only do something if the pointer has moved
        // Also wait at least a little between updates to limit updates per second
        if (
            (newPointerOffset.x !== component.state.pointerOffset.x ||
                newPointerOffset.y !== component.state.pointerOffset.y) &&
            dragInterval > 20
        ) {
            let handleType = monitor.getItemType()
            switch (handleType) {
                case 'RESIZEABLE':
                    let resizeDirectives = component.calculateLayerResize(
                        newPointerOffset,
                        monitor.getItem()
                    )
                    // Set latest pointer offset before dispatching drag event
                    component.state.pointerOffset = newPointerOffset
                    component.state.lastDragUpdate = rightNow
                    props.scaleLayer(resizeDirectives, true)
                    break

                case 'DRAGGABLE':
                    let dragOffset = monitor.getDifferenceFromInitialOffset()
                    let layerId = monitor.getItem().layerId
                    component.state.pointerOffset = newPointerOffset
                    component.state.lastDragUpdate = rightNow
                    props.dragLayers(
                        layerId,
                        unscaleDimension(dragOffset.x, props.scaleFactor),
                        unscaleDimension(dragOffset.y, props.scaleFactor),
                        true
                    )
                    break

                default:
                    break
            }
        } else {
            // component.state.pointerOffset = newPointerOffset
            // component.state.lastDragUpdate = rightNow
        }
    },
}

// Inject props from layer resize handle activity
function collect(connect, monitor) {
    return {
        // Call this function inside render()
        // to let React DnD handle the drag events:
        connectDropTarget: connect.dropTarget(),
        // You can ask the monitor about the current drag state:
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver(),
        canDrop: monitor.canDrop(),
        itemType: monitor.getItemType(),
    }
}

export default DragDropContext(HTML5Backend)(
    DropTarget(
        ['RESIZEABLE', 'DRAGGABLE'],
        dropTargetSpec,
        collect
    )(LayerControl)
)
