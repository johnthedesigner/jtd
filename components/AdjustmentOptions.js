import _ from 'lodash'
import { useEffect, useState } from 'react'

import BlendAdjustment from './BlendAdjustment'
import DimensionsAdjustment from './DimensionsAdjustment'
import FillAdjustment from './FillAdjustment'
import StrokeAdjustment from './StrokeAdjustment'
import TextAdjustment from './TextAdjustment'
import {
    addLayer,
    adjustLayers,
    bumpLayers,
    moveLayers,
    rotateLayer,
    scaleLayer,
} from '../utils/actions'
import ActionIcon from './ActionIcons'

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

    let actionIconClasses = (type) => {
        return `action-bar__button ${
            type === currentAdjustment ? 'action-bar__button--active' : null
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
                    <button
                        className={actionIconClasses('dimensions')}
                        onClick={() => {
                            setCurrentAdjustment(
                                currentAdjustment === 'dimensions'
                                    ? null
                                    : 'dimensions'
                            )
                        }}
                    >
                        <ActionIcon iconType="resize" fill={props.buttonFill} />
                    </button>
                </AdjustmentIconWrapper>
                <AdjustmentIconWrapper showIcon={adjustments.text}>
                    <button
                        className={actionIconClasses('text')}
                        onClick={() => {
                            setCurrentAdjustment(
                                currentAdjustment === 'text' ? null : 'text'
                            )
                        }}
                    >
                        <ActionIcon iconType="text" fill={props.buttonFill} />
                    </button>
                </AdjustmentIconWrapper>
                <AdjustmentIconWrapper showIcon={adjustments.fill}>
                    <button
                        className={actionIconClasses('fill')}
                        onClick={() => {
                            setCurrentAdjustment(
                                currentAdjustment === 'fill' ? null : 'fill'
                            )
                        }}
                    >
                        <ActionIcon iconType="fill" artboard={artboard} />
                    </button>
                </AdjustmentIconWrapper>
                <AdjustmentIconWrapper showIcon={adjustments.blending}>
                    <button
                        className={actionIconClasses('blending')}
                        onClick={() => {
                            setCurrentAdjustment(
                                currentAdjustment === 'blending'
                                    ? null
                                    : 'blending'
                            )
                        }}
                    >
                        <ActionIcon iconType="blending" />
                    </button>
                </AdjustmentIconWrapper>
                <AdjustmentIconWrapper showIcon={adjustments.dimensions}>
                    <button
                        className="action-bar__button"
                        onClick={(e) => {
                            dispatch(moveLayers('front'))
                        }}
                    >
                        <ActionIcon
                            iconType="bringToFront"
                            fill={props.buttonFill}
                        />
                    </button>
                </AdjustmentIconWrapper>
                <AdjustmentIconWrapper showIcon={adjustments.dimensions}>
                    <button
                        className="action-bar__button"
                        onClick={(e) => {
                            dispatch(moveLayers('back'))
                        }}
                    >
                        <ActionIcon
                            iconType="sendToBack"
                            fill={props.buttonFill}
                        />
                    </button>
                </AdjustmentIconWrapper>
                <AdjustmentIconWrapper showIcon={adjustments.dimensions}>
                    <div className="action-bar__divider" />
                </AdjustmentIconWrapper>
                <button
                    className="action-bar__button"
                    onClick={(e) => {
                        dispatch(
                            addLayer('rectangle', { x: 1500, y: 1500 }, false)
                        )
                    }}
                >
                    <ActionIcon
                        iconType="newRectangle"
                        fill={props.buttonFill}
                    />
                </button>
                <button
                    className="action-bar__button"
                    onClick={(e) => {
                        dispatch(
                            addLayer('ellipse', { x: 1500, y: 1500 }, false)
                        )
                    }}
                >
                    <ActionIcon iconType="newEllipse" fill={props.buttonFill} />
                </button>
                <button
                    className="action-bar__button"
                    onClick={(e) => {
                        dispatch(addLayer('text', { x: 1500, y: 1500 }, false))
                    }}
                >
                    <ActionIcon iconType="newText" fill={props.buttonFill} />
                </button>
            </div>
        </>
    )
}

export default AdjustmentOptions
