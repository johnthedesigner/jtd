import { useEffect, useState } from 'react'

import MaskedTextInput from './MaskedTextInput'
import { bumpLayers, scaleLayer, rotateLayer } from '../utils/actions'

const DimensionsAdjustment = (props) => {
    let adjustmentGroup = 'dimensions'

    const [adjustments, setAdjustments] = useState({
        x: '',
        y: '',
        width: '',
        height: '',
        rotation: '',
    })
    const { dispatch } = props

    useEffect(() => {
        setAdjustments(props.adjustments)
    }, [props.adjustments])

    const setX = (newX) => {
        let distance = Math.floor(newX - adjustments.x)
        dispatch(bumpLayers('x', distance))
    }
    const setY = (newY) => {
        let distance = Math.floor(newY - adjustments.y)
        dispatch(bumpLayers('y', distance))
    }
    const setWidth = (newWidth) => {
        let distance = Math.floor(newWidth - adjustments.width)
        dispatch(scaleLayer([{ direction: 'right', distance }], false))
    }
    const setHeight = (newHeight) => {
        let distance = Math.floor(newHeight - adjustments.height)
        dispatch(scaleLayer([{ direction: 'bottom', distance }], false))
    }
    const setRotation = (degrees) => {
        console.log(`rotate ${degrees} degrees`)
        dispatch(rotateLayer(Math.floor(degrees)))
    }
    if (adjustments) {
        return (
            <div>
                <div className="adjustments-panel__header">Dimensions</div>
                <div className="adjustments-panel__adjustment-block">
                    <MaskedTextInput
                        key={adjustmentGroup + 'x'}
                        propertyName={'x'}
                        label="X"
                        setValue={setX}
                        suffix="px"
                        tooltipText="X offset"
                        type="number"
                        valueFromProps={adjustments.x}
                    />
                    <MaskedTextInput
                        key={adjustmentGroup + 'y'}
                        propertyName={'y'}
                        label="Y"
                        setValue={setY}
                        suffix="px"
                        tooltipText="Y offset"
                        type="number"
                        valueFromProps={adjustments.y}
                    />
                    <MaskedTextInput
                        key={adjustmentGroup + 'width'}
                        propertyName={'width'}
                        label="W"
                        setValue={setWidth}
                        suffix="px"
                        tooltipText="Width"
                        type="number"
                        valueFromProps={adjustments.width}
                    />
                    <MaskedTextInput
                        key={adjustmentGroup + 'height'}
                        propertyName={'height'}
                        label="H"
                        setValue={setHeight}
                        suffix="px"
                        tooltipText="Height"
                        type="number"
                        valueFromProps={adjustments.height}
                    />
                    <MaskedTextInput
                        key={adjustmentGroup + 'rotation'}
                        propertyName={'rotation'}
                        label="R"
                        setValue={setRotation}
                        suffix="deg"
                        tooltipText="Rotation"
                        type="number"
                        valueFromProps={adjustments.rotation}
                    />
                </div>
            </div>
        )
    } else {
        return null
    }
}

export default DimensionsAdjustment
