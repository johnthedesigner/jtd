import _ from 'lodash'
import { useEffect, useState } from 'react'

// import BlendAdjustment from './BlendAdjustment'
import DimensionsAdjustment from './DimensionsAdjustment'
import FillAdjustment from './FillAdjustment'
// import StrokeAdjustment from './StrokeAdjustment'
// import TextAdjustment from './TextAdjustment'
import {
    adjustLayers,
    bumpLayers,
    rotateLayer,
    scaleLayer,
} from '../utils/actions'
import { mergeAdjustments } from '../utils/mergeAdjustments'

const AdjustmentsPanel = (props) => {
    const [adjustments, setAdjustments] = useState({
        blending: {},
        dimensions: {},
        fill: {},
        stroke: {},
        text: {},
    })

    useEffect(() => {
        let artboardClone = _.cloneDeep(artboard)
        let selectedLayers = _.filter(artboardClone.layers, (layer) => {
            return _.includes(artboardClone.selections, layer.id)
        })
        setAdjustments(mergeAdjustments(selectedLayers))
    }, [props.artboard])

    const handleClick = (e) => {
        e.stopPropagation()
    }

    const { artboard, projectColors, dimensions, dispatch } = props

    const adjustmentPanelStyles = {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
    }

    return (
        <div
            className={'adjustments-panel__wrapper'}
            onClick={handleClick}
            style={adjustmentPanelStyles}
        >
            <DimensionsAdjustment
                adjustLayers={adjustLayers}
                bumpLayers={bumpLayers}
                dispatch={dispatch}
                rotateLayer={rotateLayer}
                scaleLayer={scaleLayer}
                adjustments={adjustments.dimensions}
            />
            <FillAdjustment
                adjustLayers={adjustLayers}
                adjustments={adjustments.fill}
                dispatch={dispatch}
                projectColors={props.projectColors}
            />
            {/* <StrokeAdjustment
                adjustLayers={adjustLayers}
                adjustments={adjustments.stroke}
                projectColors={projectColors}
            />
            <TextAdjustment
                adjustLayers={adjustLayers}
                adjustments={adjustments.text}
                projectColors={projectColors}
            />
            <BlendAdjustment
                adjustLayers={adjustLayers}
                adjustments={adjustments.blending}
            /> */}
        </div>
    )
}

export default AdjustmentsPanel
