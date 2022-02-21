import _ from 'lodash'
import { useState } from 'react'
import { useDrag } from 'react-dnd'

const ResizeHandle = (props) => {
    const { className, directions, dimensions } = props

    const [hover, setHover] = useState()

    let positions = {}

    const handleOffset = '-0.375rem'

    switch (_.join(directions, '-')) {
        case 'top-right':
            positions.top = handleOffset
            positions.right = handleOffset
            break

        case 'bottom-right':
            positions.right = handleOffset
            positions.bottom = handleOffset
            break

        case 'bottom-left':
            positions.bottom = handleOffset
            positions.left = handleOffset
            break

        case 'top-left':
            positions.top = handleOffset
            positions.left = handleOffset
            break

        case 'top':
            positions.top = handleOffset
            positions.left = `calc(${dimensions.width / 2}px - .375rem)`
            break

        case 'bottom':
            positions.bottom = handleOffset
            positions.left = `calc(${dimensions.width / 2}px - .375rem)`
            break

        case 'left':
            positions.left = handleOffset
            positions.top = `calc(${dimensions.height / 2}px - .375rem)`
            break

        case 'right':
            positions.top = `calc(${dimensions.height / 2}px - .375rem)`
            positions.right = handleOffset
            break

        default:
            // do nothing
            break
    }

    const resizeHandleStyles = {
        background: hover ? 'white' : 'black',
        border: '.125rem solid magenta',
        borderRadius: '50%',
        width: '.75rem',
        height: '.75rem',
        opacity: false ? 0 : 1,
        position: 'absolute',
        top: 'auto',
        right: 'auto',
        bottom: 'auto',
        left: 'auto',
        boxSizing: 'border-box',
        cursor: 'pointer',
        cursor: 'grab',
        pointerEvents: 'auto',
        transition: 'background linear .1s',
        ...positions,
    }

    const [collected, dragSource] = useDrag(() => ({
        type: 'RESIZE',
        item: { directions: props.directions },
    }))

    return (
        <div
            ref={dragSource}
            className={`resize-handle ${className}`}
            onMouseOver={() => setHover(true)}
            onMouseOut={() => setHover(false)}
            style={resizeHandleStyles}
        />
    )
}

export default ResizeHandle
