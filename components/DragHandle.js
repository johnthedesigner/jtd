import { useEffect, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'

import { scaleAllDimensions } from '../utils/artboardUtils'
import { selectLayer } from '../utils/actions'
import _ from 'lodash'

const DragHandle = (props) => {
    const [dimensions, setDimensions] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
    })

    const [isSelected, setIsSelected] = useState(false)
    const [isHighlighted, setIsHighlighted] = useState(false)

    useEffect(() => {
        setDimensions(
            scaleAllDimensions(props.layer.dimensions, props.scaleFactor, true)
        )
        if (_.includes(props.selections, props.layer.id)) {
            setIsSelected(true)
        } else {
            setIsSelected(false)
        }
    }, [props.layer.dimensions, props.selections, props.scaleFactor])

    const handleClick = (e) => {
        e.stopPropagation()
        props.dispatch(selectLayer(props.layer.id, e.shiftKey))
    }

    const handleDoubleClick = (e) => {
        e.stopPropagation()
        if (props.layer.type === 'text') {
            props.dispatch(props.enableTextEditor(props.layer.id))
        }
    }

    const handleDragStart = (e) => {
        // e.stopPropagation()
        props.dispatch(selectLayer(props.layer.id, e.shiftKey))
    }

    const { layer } = props
    const { x, y, width, height, rotation } = dimensions
    const dragHandleStyles = {
        position: 'absolute',
        top: y ? y : 0,
        left: x ? x : 0,
        zIndex: 99,
        width: width ? width : 0,
        height: height ? height : 0,
        transform: `rotate(${rotation}deg)`,
        border:
            !props.isDragging && (isSelected || isHighlighted)
                ? '1px solid magenta'
                : 'none',
        borderRadius: layer.type === 'ellipse' ? '50%' : 0,
        cursor: 'pointer',
    }

    const [collected, dragSource, preview] = useDrag(() => ({
        type: 'DRAG',
        item: { id: props.layer.id },
    }))

    // Disable drag previews
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true })
    }, [])

    return (
        <div
            ref={dragSource}
            className={`drag-handle ${layer.isSelected ? 'is-selected' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onDragStart={handleDragStart}
            onMouseOver={() => setIsHighlighted(true)}
            onMouseOut={() => setIsHighlighted(false)}
            style={dragHandleStyles}
        />
    )
}

export default DragHandle
