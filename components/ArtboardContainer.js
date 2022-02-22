import { useEffect, useReducer, useRef, useState } from 'react'
import _ from 'lodash'
import Head from 'next/head'
import Link from 'next/link'
import Color from 'color'
import { palettes } from '../utils/colorUtils'
import { useDrop } from 'react-dnd'

import ArtboardShortcutsWrapper from '../components/ArtboardShortcutsWrapper'
import { colorsWithFallback } from '../utils/colorUtils'
import Layer from '../components/Layer'
import TextLayerEditor from '../components/TextLayerEditor'
import ActionBars from '../components/ActionBars'
import AdjustmentsPanel from '../components/AdjustmentsPanel'
import Logo from '../components/Logo'
import Reducer, { initialState } from '../utils/reducer'
import {
    deselectLayers,
    dragLayers,
    enableTextEditor,
    scaleLayer,
    selectLayer,
    updateText,
} from '../utils/actions'
import DragHandle from '../components/DragHandle'
import ResizeHandle from '../components/ResizeHandle'
import {
    getLayerDimensions,
    scaleAllDimensions,
    unscaleDimension,
} from '../utils/artboardUtils'
import AdjustmentOptions from '../components/AdjustmentOptions'
import MenuButton from '../components/MenuButton'

// Reference values for preventing unnecessary erenders on drag and resize
const dragState = {
    lastDragUpdate: 0,
    lastOffset: {
        x: 0,
        y: 0,
    },
}

let artboardBackgroundColor = '#F5F5F5'
let artboardDotColor = palettes.blue[3]
let artboardDotSize = '1.3px'

export default function Home() {
    const [scaleFactor, setScaleFactor] = useState(1)
    const [isScaled, setIsScaled] = useState(false)
    const [artboardSize, setArtboardSize] = useState({
        artboardWidth: 10000,
        artboardHeight: 10000,
        containerWidth: 1000,
        containerHeight: 1000,
    })
    const scrollContainer = useRef(null)

    // adjustment state
    const [currentAdjustment, setCurrentAdjustment] = useState(null)

    // Set up reducer
    const [appState, dispatch] = useReducer(Reducer, initialState)

    const { artboard } = appState

    let selectedLayers = _.filter(artboard.layers, (layer) => {
        // console.log('looping through selected layers')
        return _.includes(artboard.selections, layer.id)
    })
    let selectionDimensions = scaleAllDimensions(
        getLayerDimensions(selectedLayers),
        scaleFactor,
        true
    )

    // If selected layers change, close adjustments pane
    useEffect(() => {
        setCurrentAdjustment(null)
    }, [
        _.join(
            _.map(selectedLayers, (layer) => {
                return layer.id
            })
        ),
    ])

    useEffect(() => {
        // Resize artboard based on viewport size
        let wrapper = document.getElementById(`artboard-wrapper`)

        // Establish sizes to base our artboard on, scaled to viewport size
        let viewAreaBase = 1000
        let artboardSizeBase = 3000
        // Get appropriate size for artboard based on viewport size
        let viewportWidth = wrapper.clientWidth
        let viewportHeight = wrapper.clientHeight
        let newScaleFactor =
            _.min([viewportWidth, viewportHeight]) / viewAreaBase
        let artboardSizeScaled = artboardSizeBase * newScaleFactor
        // Set scaled sizes in state
        setArtboardSize({
            artboardWidth: artboardSizeScaled,
            artboardHeight: artboardSizeScaled,
            containerWidth: viewportWidth,
            containerHeight: viewportHeight,
        })
        setScaleFactor(newScaleFactor)
        setIsScaled(true)

        // Scroll artboard to center on first load
        wrapper.scrollTop = (artboardSizeScaled - viewportHeight) / 2
        wrapper.scrollLeft = (artboardSizeScaled - viewportWidth) / 2
    }, [])

    // Handle Layer Drag Input
    const handleDrag = (item, monitor, previewOnly) => {
        // Get layer offset while hovering and round it off so we don't move less than a pixel
        let rawOffset = monitor.getDifferenceFromInitialOffset()
        let offset = {
            x: Math.round(rawOffset.x),
            y: Math.round(rawOffset.y),
        }
        let rightNow = Date.now()
        let dragInterval = rightNow - dragState.lastDragUpdate
        // Only do something if the pointer has moved
        // Also wait at least a little between updates to limit updates per second
        if (
            ((Math.abs(offset.x - dragState.lastOffset.x) > 1 ||
                Math.abs(offset.x - dragState.lastOffset.x) > 1) &&
                dragInterval > 20) ||
            !previewOnly
        ) {
            dragState.lastDragUpdate = rightNow
            dragState.lastOffset = offset
            if (!previewOnly) dispatch(selectLayer(item.id, false))
            dispatch(
                dragLayers(
                    [artboard.selections],
                    unscaleDimension(offset.x, scaleFactor),
                    unscaleDimension(offset.y, scaleFactor),
                    previewOnly
                )
            )
        }
    }

    // Translate Resize Handle Input into Scaling Instructions
    const calculateLayerResize = (offset, handleInfo) => {
        let { x, y } = offset
        let getVectoredDistance = (direction) => {
            // Get original drag distance
            let distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
            // Adjust Offset coordinates realative to each side
            let adjustedOffset = [x, y]
            switch (direction) {
                case 'top':
                    adjustedOffset = [-1 * y, x]
                    break
                case 'right':
                    adjustedOffset = [x, y]
                    break
                case 'bottom':
                    adjustedOffset = [y, -1 * x]
                    break
                case 'left':
                    adjustedOffset = [-1 * x, -1 * y]
                    break
                default:
                // Do nothing
            }
            // Get drag angle in degrees adjusted for scale factor
            let angleRadians = Math.atan2(adjustedOffset[1], adjustedOffset[0])
            angleRadians -= selectionDimensions.rotation * (Math.PI / 180)
            // Get vectored drag distance and undo scale factor
            let vectoredDistance = distance * Math.cos(angleRadians)
            vectoredDistance = unscaleDimension(vectoredDistance, scaleFactor)
            return vectoredDistance
        }
        // Return an array of directions/scale distances
        return _.map(handleInfo.directions, (direction) => {
            return {
                direction,
                distance: getVectoredDistance(direction),
            }
        })
    }
    // Handle Layer Resize Handle Input
    const handleResize = (item, monitor, previewOnly) => {
        let rightNow = Date.now()
        let dragInterval = rightNow - dragState.lastDragUpdate
        if (dragInterval > 20 || !previewOnly) {
            dragState.lastDragUpdate = rightNow
            let resizeDirectives = calculateLayerResize(
                monitor.getDifferenceFromInitialOffset(),
                monitor.getItem()
            )
            dispatch(scaleLayer(resizeDirectives, previewOnly))
        }
    }

    // Collect Drag Input
    const [collectedProps, dropTarget] = useDrop(
        () => ({
            accept: ['DRAG', 'RESIZE'],
            collect: (monitor, props) => {
                return { isDragging: monitor.isOver() }
            },
            hover: (item, monitor) => {
                switch (monitor.getItemType()) {
                    case 'DRAG':
                        handleDrag(item, monitor, true)
                        break

                    case 'RESIZE':
                        handleResize(item, monitor, true)
                        break

                    default:
                        break
                }
            },
            drop: (item, monitor) => {
                switch (monitor.getItemType()) {
                    case 'DRAG':
                        handleDrag(item, monitor, false)
                        break

                    case 'RESIZE':
                        handleResize(item, monitor, false)
                        break

                    default:
                        break
                }
            },
        }),
        [artboard, artboardSize, selectedLayers]
    )

    // When text editing is enabled, display the appropriate layer
    const EditableTextLayer = (props) => {
        if (artboard.editableTextLayer.length > 0) {
            let textLayer = _.filter(artboard.layers, (layer) => {
                // Show editable text layer
                return layer.id === artboard.editableTextLayer
            })
            // return null
            return (
                <TextLayerEditor
                    dispatch={dispatch}
                    enableTextEditor={enableTextEditor}
                    key={textLayer.id}
                    layer={textLayer[0]}
                    isScaled={isScaled}
                    scaleFactor={scaleFactor}
                    updateText={updateText}
                />
            )
        } else {
            return null
        }
    }

    const artboardWrapperStyles = {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'scroll',
    }

    const svgWrapperStyles = {
        position: 'relative',
        width: artboardSize.artboardWidth,
        height: artboardSize.artboardHeight,
        backgroundColor: artboardBackgroundColor,
        backgroundImage: `radial-gradient(${artboardDotColor} ${artboardDotSize}, transparent 0),radial-gradient(${artboardDotColor} ${artboardDotSize}, transparent 0),radial-gradient(${artboardDotColor} ${artboardDotSize}, transparent 0),radial-gradient(${artboardDotColor} ${artboardDotSize}, transparent 0)`,
        backgroundSize: '48px 48px',
        backgroundPosition: '-6px -6px, 18px 18px, -6px 18px, 18px -6px',
    }

    const resizeableControlStyles = {
        position: 'absolute',
        top: selectionDimensions.y,
        left: selectionDimensions.x,
        width: selectionDimensions.width,
        height: selectionDimensions.height,
        zIndex: 100,
        transform: `rotate(${selectionDimensions.rotation}deg)`,
        display:
            collectedProps.isDragging || artboard.selections.length != 1
                ? 'none'
                : 'block',
        pointerEvents: 'none',
    }

    return (
        <>
            <div
                ref={scrollContainer}
                id="artboard-wrapper"
                style={artboardWrapperStyles}
            >
                <ArtboardShortcutsWrapper
                    artboard={artboard}
                    dispatch={dispatch}
                >
                    <div
                        id="artboard__scroll-container"
                        className="artboard__svg-wrapper"
                        style={svgWrapperStyles}
                    >
                        <svg
                            id="artboard__svg"
                            width={artboardSize.artboardWidth}
                            height={artboardSize.artboardHeight}
                            viewBox="0 0 3000 3000"
                            overflow="visible"
                        >
                            <defs>
                                {_.map(artboard.layers, (layer) => {
                                    let { fill } = layer.adjustments
                                    if (fill === undefined) return null
                                    let fillColors = colorsWithFallback(
                                        fill.color,
                                        fill.gradient
                                    )
                                    let fillConfig
                                    if (fill.type === 'gradient') {
                                        fillConfig = fillColors.gradient
                                    } else {
                                        fillConfig = {
                                            angle: 0,
                                            start: fillColors.solid,
                                            end: fillColors.solid,
                                        }
                                    }

                                    return (
                                        <linearGradient
                                            key={layer.id}
                                            id={`gradient${layer.id}`}
                                            x1="0%"
                                            x2="0%"
                                            y1="0%"
                                            y2="100%"
                                        >
                                            <stop
                                                className="stop1"
                                                offset="0%"
                                                stopColor={Color(
                                                    fillConfig.start
                                                ).hex()}
                                            />
                                            <stop
                                                className="stop2"
                                                offset="100%"
                                                stopColor={Color(
                                                    fillConfig.end
                                                ).hex()}
                                            />
                                        </linearGradient>
                                    )
                                })}
                            </defs>
                            {_.map(
                                _.orderBy(artboard.layers, 'order'),
                                (layer, index) => {
                                    return (
                                        <Layer
                                            artboard={artboard}
                                            dispatch={dispatch}
                                            key={layer.id}
                                            layer={layer}
                                            isScaled={isScaled}
                                            scaleFactor={scaleFactor}
                                        />
                                    )
                                }
                            )}
                        </svg>
                    </div>
                    <div>
                        <div
                            className="layer-control__drop-target"
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                            }}
                            onClick={() => {
                                setCurrentAdjustment(null)
                                dispatch(deselectLayers())
                            }}
                        >
                            <div
                                ref={dropTarget}
                                className="layer-control__artboard-area"
                                style={{
                                    position: 'absolute',
                                    width: artboardSize.artboardWidth,
                                    height: artboardSize.artboardHeight,
                                    margin: `${artboardSize.yOffset}px ${artboardSize.xOffset}px`,
                                }}
                            >
                                {_.map(
                                    _.orderBy(artboard.layers, 'order'),
                                    (layer, index) => {
                                        return (
                                            <DragHandle
                                                key={layer.id}
                                                enableTextEditor={
                                                    enableTextEditor
                                                }
                                                layer={layer}
                                                isDragging={
                                                    collectedProps.isDragging
                                                }
                                                scaleFactor={scaleFactor}
                                                selections={artboard.selections}
                                                dispatch={dispatch}
                                            />
                                        )
                                    }
                                )}
                                <div
                                    className={'resize-control__wrapper'}
                                    style={resizeableControlStyles}
                                >
                                    <ResizeHandle
                                        className="resize-handle__top"
                                        directions={['top']}
                                        dimensions={selectionDimensions}
                                    />
                                    <ResizeHandle
                                        className="resize-handle__right"
                                        directions={['right']}
                                        dimensions={selectionDimensions}
                                    />
                                    <ResizeHandle
                                        className="resize-handle__bottom"
                                        directions={['bottom']}
                                        dimensions={selectionDimensions}
                                    />
                                    <ResizeHandle
                                        className="resize-handle__left"
                                        directions={['left']}
                                        dimensions={selectionDimensions}
                                    />
                                    <ResizeHandle
                                        className="resize-handle__top-left"
                                        directions={['top', 'left']}
                                        dimensions={selectionDimensions}
                                    />
                                    <ResizeHandle
                                        className="resize-handle__top-right"
                                        directions={['top', 'right']}
                                        dimensions={selectionDimensions}
                                    />
                                    <ResizeHandle
                                        className="resize-handle__bottom-right"
                                        directions={['bottom', 'right']}
                                        dimensions={selectionDimensions}
                                    />
                                    <ResizeHandle
                                        className="resize-handle__bottom-left"
                                        directions={['bottom', 'left']}
                                        dimensions={selectionDimensions}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="artboard__action-bar">
                        <ActionBars
                            adjustments={artboard.adjustments}
                            dispatch={dispatch}
                            buttonFill={'black'}
                            layerIds={artboard.selection.layers}
                            scrollContainer={scrollContainer}
                            scaleFactor={scaleFactor}
                            viewportWidth={artboardSize.containerWidth}
                            viewportHeight={artboardSize.containerHeight}
                        />
                    </div>
                    <AdjustmentsPanel
                        appState={appState}
                        artboard={artboard}
                        adjustments={artboard.adjustments}
                        dispatch={dispatch}
                        projectColors={artboard.projectColors}
                    />
                    <AdjustmentOptions
                        adjustments={artboard.adjustments}
                        artboard={artboard}
                        currentAdjustment={currentAdjustment}
                        dispatch={dispatch}
                        projectColors={artboard.projectColors}
                        setCurrentAdjustment={setCurrentAdjustment}
                    />
                    <EditableTextLayer />
                </ArtboardShortcutsWrapper>
            </div>
            <div
                style={{
                    position: 'fixed',
                    top: -500,
                    left: -500,
                    width: 11000,
                    height: 11000,
                    backgroundColor: '#ffffb9',
                    backgroundImage:
                        'radial-gradient(#d0d000 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                    backgroundPosition: '-6px -6px',
                    pointerEvents: 'none',
                    display: 'none',
                }}
            />
        </>
    )
}
