import { useEffect, useReducer, useState } from 'react'
import _ from 'lodash'
import Head from 'next/head'
import Color from 'color'
import { useDrop } from 'react-dnd'

import Artboard from '../components/Artboard'
import ArtboardShortcutsWrapper from '../components/ArtboardShortcutsWrapper'
import { colorsWithFallback } from '../utils/colorUtils'
import Layer from '../components/Layer'
import AdjustmentsPanel from '../components/AdjustmentsPanel'
import { mergeAdjustments } from '../utils/mergeAdjustments'
import Reducer, { initialState } from '../utils/reducer'
import {
    deselectLayers,
    dragLayers,
    scaleLayer,
    selectLayer,
} from '../utils/actions'
import DragHandle from '../components/DragHandle'
import ResizeHandle from '../components/ResizeHandle'
import {
    getLayerDimensions,
    scaleAllDimensions,
    unscaleDimension,
} from '../utils/artboardUtils'

// Reference values for preventing unnecessary erenders on drag and resize
// const [dragUpdate, setDragUpdate] = useState(0)
const dragState = {
    lastDragUpdate: 0,
    lastOffset: {
        x: 0,
        y: 0,
    },
}

export default function Home(props) {
    const [scaleFactor, setScaleFactor] = useState(1)
    const [isScaled, setIsScaled] = useState(false)
    const [artboardSize, setArtboardSize] = useState({
        artboardWidth: 1000,
        artboardHeight: 1000,
        containerWidth: 1000,
        containerHeight: 1000,
        xOffset: 0,
        yOffset: 0,
    })

    // Set up reducer
    const [appState, dispatch] = useReducer(Reducer, initialState)

    const { artboard } = appState

    const resizeArtboard = (wrapper) => {
        // Get appropriate size for artboard based on viewport size
        let viewportWidth = wrapper.clientWidth
        let viewportHeight = wrapper.clientHeight
        let newScaleFactor =
            _.min([wrapper.clientWidth, wrapper.clientHeight]) / 1000
        let artboardSize = 1000 * newScaleFactor
        setArtboardSize({
            artboardWidth: artboardSize,
            artboardHeight: artboardSize,
            containerWidth: viewportWidth,
            containerHeight: viewportHeight,
            xOffset: (viewportWidth - artboardSize) / 2,
            yOffset: (viewportHeight - artboardSize) / 2,
        })
        setScaleFactor(newScaleFactor)
        setIsScaled(true)
    }

    let selectedLayers = _.filter(artboard.layers, (layer) => {
        // console.log('looping through selected layers')
        return _.includes(artboard.selections, layer.id)
    })
    let selectionDimensions = scaleAllDimensions(
        getLayerDimensions(selectedLayers),
        scaleFactor,
        true
    )

    useEffect(() => {
        // Resize artboard based on viewport size
        let wrapper = document.getElementById(`artboard-wrapper`)

        if (document != null) {
            setTimeout(() => resizeArtboard(wrapper), 20)
        }

        window.addEventListener('resize', () => resizeArtboard(wrapper))

        return () => {
            window.removeEventListener('resize', () => resizeArtboard(wrapper))
        }
    }, [
        artboard,
        artboard.selections,
        artboard.adjustments,
        artboard.dimensions,
    ])

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
        [artboardSize]
    )

    const artboardWrapperStyles = {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: '#b9ffff',
        backgroundImage: 'radial-gradient(#00d0d0 1px, transparent 0)',
        backgroundSize: '24px 24px',
        backgroundPosition: '-6px -6px',
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
        <div>
            <link
                href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,400,400i,700,700i,900,900i|IBM+Plex+Mono:200,200i,400,400i"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/icon?family=Material+Icons"
                rel="stylesheet"
            />

            <Head>
                <title>Create Next App</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div id="artboard-wrapper" style={artboardWrapperStyles}>
                <ArtboardShortcutsWrapper dispatch={dispatch}>
                    <Artboard
                        scaleFactor={scaleFactor}
                        artboardSize={artboardSize}
                        dispatch={dispatch}
                    >
                        <div
                            className="artboard__svg-wrapper"
                            style={{
                                position: 'relative',
                                width: artboardSize.artboardWidth,
                                height: artboardSize.artboardHeight,
                                margin: `${artboardSize.yOffset}px ${artboardSize.xOffset}px`,
                            }}
                        >
                            <svg
                                width={artboardSize.width}
                                height={artboardSize.height}
                                viewBox="0 0 1000 1000"
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
                                ref={dropTarget}
                                className="layer-control__drop-target"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    left: 0,
                                }}
                                onClick={() => {
                                    dispatch(deselectLayers())
                                }}
                            >
                                <div
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
                                                    layer={layer}
                                                    isDragging={
                                                        collectedProps.isDragging
                                                    }
                                                    scaleFactor={scaleFactor}
                                                    selections={
                                                        artboard.selections
                                                    }
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
                        <AdjustmentsPanel
                            appState={appState}
                            artboard={artboard}
                            adjustments={artboard.adjustments}
                            dispatch={dispatch}
                            projectColors={artboard.projectColors}
                        />
                    </Artboard>
                </ArtboardShortcutsWrapper>
            </div>
        </div>
    )
}
