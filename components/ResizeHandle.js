import _ from 'lodash'
import { useDrag } from 'react-dnd'

const ResizeHandle = (props) => {
    const { className, directions, dimensions } = props

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
        background: 'magenta',
        border: '.125rem solid white',
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
        pointerEvents: 'auto',
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
            onClick={(e) => {
                console.log('clicked resize-handle')
            }}
            style={resizeHandleStyles}
        />
    )
}

export default ResizeHandle