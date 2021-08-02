import { useEffect, useState } from 'react'

import { scaleDimension } from '../utils/artboardUtils'

const Artboard = (props) => {
    // Hard-coded artboard heights and widths
    let defaultWidth = 1000
    let defaultHeight = 1000

    const [width, setWidth] = useState(1000)
    const [height, setHeight] = useState(1000)

    const { scaleFactor } = props

    useEffect(() => {
        setWidth(scaleDimension(defaultWidth, scaleFactor))
        setHeight(scaleDimension(defaultHeight, scaleFactor))
    }, [scaleFactor])

    const frameStyles = {
        width,
        height,
    }

    return <div style={frameStyles}>{props.children}</div>
}

export default Artboard
