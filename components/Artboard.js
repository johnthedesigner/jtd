import { useDrop } from 'react-dnd'

import { dragLayers } from '../utils/actions'

const Artboard = (props) => {
    const [{ isOver }, drop] = useDrop(
        () => ({
            accept: 'LAYER_CONTROL',
            drop: (item, monitor) => {
                let offset = monitor.getDifferenceFromInitialOffset()
                console.log(item, offset)
                props.dispatch(
                    dragLayers(
                        'artboardId',
                        [item.id],
                        offset.x,
                        offset.y,
                        false
                    )
                )
            },
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
                offset: monitor.getDifferenceFromInitialOffset(),
            }),
        }),
        []
    )
    const frameStyles = {
        width: props.artboardSize.viewportWidth,
        height: props.artboardSize.viewportHeight,
    }

    return (
        <div ref={drop} style={frameStyles}>
            {props.children}
        </div>
    )
}

export default Artboard
