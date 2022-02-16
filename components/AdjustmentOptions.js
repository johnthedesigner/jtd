import _ from 'lodash'
import { useEffect, useState } from 'react'

import BlendAdjustment from './BlendAdjustment'
import DimensionsAdjustment from './DimensionsAdjustment'
import FillAdjustment from './FillAdjustment'
import StrokeAdjustment from './StrokeAdjustment'
import TextAdjustment from './TextAdjustment'
import {
    adjustLayers,
    bumpLayers,
    rotateLayer,
    scaleLayer,
} from '../utils/actions'
import { mergeAdjustments } from '../utils/mergeAdjustments'

const AdjustmentOptions = (props) => {
    const {
        artboard,
        currentAdjustment,
        setCurrentAdjustment,
        dispatch,
        projectColors,
    } = props

    const [adjustments, setAdjustments] = useState({
        blending: {},
        dimensions: {},
        fill: {},
        stroke: {},
        text: {},
    })

    useEffect(() => {
        // let artboardClone = _.cloneDeep(artboard)
        // let selectedLayers = _.filter(artboardClone.layers, (layer) => {
        //     return _.includes(artboardClone.selections, layer.id)
        // })
        setAdjustments(artboard.selection.adjustments)
    }, [artboard.selection.adjustments])

    const AdjustmentPane = ({ children, type }) => {
        if (currentAdjustment === type) {
            return <div className="adjustments-pane">{children}</div>
        } else {
            return null
        }
    }

    const AdjustmentIconWrapper = ({ children, showIcon }) => {
        if (showIcon) {
            return <>{children}</>
        } else {
            return null
        }
    }

    // Build classes to hide adjustment options when there are no selected layers
    let adjustmentOptionsClasses = `adjustment-options ${
        artboard.selections.length === 0 ? 'adjustment-options--hidden' : ''
    }`

    let adjustmentIconClasses = (type) => {
        return `adjustment-options__icon ${
            type === currentAdjustment ? 'adjustment-options__icon--active' : ''
        }`
    }

    return (
        <>
            <AdjustmentPane type="dimensions">
                <DimensionsAdjustment
                    adjustLayers={adjustLayers}
                    bumpLayers={bumpLayers}
                    dispatch={dispatch}
                    rotateLayer={rotateLayer}
                    scaleLayer={scaleLayer}
                    adjustments={adjustments.dimensions}
                />
            </AdjustmentPane>
            <AdjustmentPane type="fill">
                <FillAdjustment
                    adjustLayers={adjustLayers}
                    adjustments={adjustments.fill}
                    dispatch={dispatch}
                    projectColors={props.projectColors}
                />
                <StrokeAdjustment
                    adjustments={adjustments.stroke}
                    dispatch={dispatch}
                    projectColors={projectColors}
                />
            </AdjustmentPane>
            <AdjustmentPane type="text">
                <TextAdjustment
                    adjustLayers={adjustLayers}
                    adjustments={adjustments.text}
                    dispatch={dispatch}
                    projectColors={projectColors}
                />
            </AdjustmentPane>
            <AdjustmentPane type="blending">
                <BlendAdjustment
                    adjustLayers={adjustLayers}
                    adjustments={adjustments.blending}
                    dispatch={dispatch}
                />
            </AdjustmentPane>
            <div className={adjustmentOptionsClasses}>
                <AdjustmentIconWrapper showIcon={adjustments.dimensions}>
                    <span
                        className={adjustmentIconClasses('dimensions')}
                        onClick={() => {
                            setCurrentAdjustment(
                                currentAdjustment === 'dimensions'
                                    ? null
                                    : 'dimensions'
                            )
                        }}
                    />
                </AdjustmentIconWrapper>
                <AdjustmentIconWrapper showIcon={adjustments.text}>
                    <span
                        className={adjustmentIconClasses('text')}
                        onClick={() => {
                            setCurrentAdjustment(
                                currentAdjustment === 'text' ? null : 'text'
                            )
                        }}
                    />
                </AdjustmentIconWrapper>
                <AdjustmentIconWrapper showIcon={adjustments.fill}>
                    <span
                        className={adjustmentIconClasses('fill')}
                        onClick={() => {
                            setCurrentAdjustment(
                                currentAdjustment === 'fill' ? null : 'fill'
                            )
                        }}
                    />
                </AdjustmentIconWrapper>
                <AdjustmentIconWrapper showIcon={adjustments.blending}>
                    <span
                        className={adjustmentIconClasses('blending')}
                        onClick={() => {
                            setCurrentAdjustment(
                                currentAdjustment === 'blending'
                                    ? null
                                    : 'blending'
                            )
                        }}
                    />
                </AdjustmentIconWrapper>
            </div>
        </>
    )
}

export default AdjustmentOptions
