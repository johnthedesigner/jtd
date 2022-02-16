import { useEffect, useState } from 'react'

import MaskedTextInput from './MaskedTextInput'
import { bumpLayers, scaleLayer, rotateLayer } from '../utils/actions'

const DimensionsAdjustment = (props) => {
    let adjustmentGroup = 'dimensions'

    const [x, setX] = useState('')
    const [y, setY] = useState('')
    const [width, setWidth] = useState('')
    const [height, setHeight] = useState('')
    const [rotation, setRotation] = useState('')

    // const [adjustments, setAdjustments] = useState({
    //     x: '',
    //     y: '',
    //     width: '',
    //     height: '',
    //     rotation: '',
    // })
    const { adjustments, dispatch } = props

    useEffect(() => {
        // let { adjustments } = props
        if (adjustments) {
            if (adjustments.x) setX(adjustments.x)
            if (adjustments.y) setY(adjustments.y)
            if (adjustments.width) setWidth(adjustments.width)
            if (adjustments.height) setHeight(adjustments.height)
            if (adjustments.rotation) setRotation(adjustments.rotation)
        } else {
            setX('')
            setY('')
            setWidth('')
            setHeight('')
            setRotation('')
        }
        // setAdjustments(props.adjustments)
    }, [
        adjustments,
        // adjustments.x,
        // adjustments.y,
        // adjustments.width,
        // adjustments.height,
        // adjustments.rotation,
    ])

    const dispatchX = (newX) => {
        let distance = Math.floor(newX - x)
        dispatch(bumpLayers('x', distance))
    }
    const dispatchY = (newY) => {
        let distance = Math.floor(newY - y)
        dispatch(bumpLayers('y', distance))
    }
    const dispatchWidth = (newWidth) => {
        let distance = Math.floor(newWidth - width)
        dispatch(scaleLayer([{ direction: 'right', distance }], false))
    }
    const dispatchHeight = (newHeight) => {
        let distance = Math.floor(newHeight - height)
        dispatch(scaleLayer([{ direction: 'bottom', distance }], false))
    }
    const dispatchRotation = (degrees) => {
        dispatch(rotateLayer(Math.floor(degrees)))
    }
    if (x || y || width || height || rotation) {
        return (
            <div>
                <div className="adjustments-panel__header">Dimensions</div>
                <div className="adjustments-panel__adjustment-block">
                    <MaskedTextInput
                        key={adjustmentGroup + 'x'}
                        propertyName={'x'}
                        label="X"
                        setValue={dispatchX}
                        suffix="px"
                        tooltipText="X offset"
                        type="number"
                        valueFromProps={x}
                    />
                    <MaskedTextInput
                        key={adjustmentGroup + 'y'}
                        propertyName={'y'}
                        label="Y"
                        setValue={dispatchY}
                        suffix="px"
                        tooltipText="Y offset"
                        type="number"
                        valueFromProps={y}
                    />
                    <MaskedTextInput
                        key={adjustmentGroup + 'width'}
                        propertyName={'width'}
                        label="W"
                        setValue={dispatchWidth}
                        suffix="px"
                        tooltipText="Width"
                        type="number"
                        valueFromProps={width}
                    />
                    <MaskedTextInput
                        key={adjustmentGroup + 'height'}
                        propertyName={'height'}
                        label="H"
                        setValue={dispatchHeight}
                        suffix="px"
                        tooltipText="Height"
                        type="number"
                        valueFromProps={height}
                    />
                    <MaskedTextInput
                        key={adjustmentGroup + 'rotation'}
                        propertyName={'rotation'}
                        label="R"
                        setValue={dispatchRotation}
                        suffix="deg"
                        tooltipText="Rotation"
                        type="number"
                        valueFromProps={rotation}
                    />
                </div>
            </div>
        )
    } else {
        return null
    }
}

export default DimensionsAdjustment
