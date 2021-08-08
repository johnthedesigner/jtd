import { useEffect, useState } from 'react'
import { useDrag } from 'react-dnd'

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

    useEffect(() => {
        setDimensions(
            scaleAllDimensions(props.layer.dimensions, props.scaleFactor, true)
        )
        if (_.includes(props.selections, props.layer.id)) {
            setIsSelected(true)
        } else {
            setIsSelected(false)
        }
    }, [props.layer.dimensions, props.selections])

    const handleClick = (e) => {
        e.stopPropagation()
        props.dispatch(selectLayer(props.layer.id, e.shiftKey))
    }

    const handleDoubleClick = (e) => {
        e.stopPropagation()
        if (props.layer.type === 'text') {
            props.enableTextEditor(props.layer.id)
        }
    }

    const { layer } = props
    const { x, y, width, height, rotation } = dimensions
    console.log(rotation)
    const dragHandleStyles = {
        position: 'absolute',
        top: y ? y : 0,
        left: x ? x : 0,
        zIndex: 99,
        width: width ? width : 0,
        height: height ? height : 0,
        transform: `rotate(${rotation}deg)`,
        opacity: props.isDragging && isSelected ? 0 : 1,
        border: isSelected ? '1px solid magenta' : 'none',
        borderRadius: layer.type === 'ellipse' ? '50%' : 0,
        cursor: 'pointer',
    }

    const [collected, dragSource] = useDrag(() => ({
        type: 'DRAG',
        item: { id: props.layer.id },
    }))

    return (
        <div
            ref={dragSource}
            className={`drag-handle ${layer.isSelected ? 'is-selected' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            style={dragHandleStyles}
        />
    )
}

export default DragHandle
