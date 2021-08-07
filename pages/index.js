import { useEffect, useReducer, useState } from 'react'
import _ from 'lodash'
import Head from 'next/head'
import Color from 'color'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import Artboard from '../components/Artboard'
import artboardJson from '../artboard'
import { mapArtboard, scaleDimension } from '../utils/artboardUtils'
import { colorsWithFallback } from '../utils/colorUtils'
import Layer from '../components/Layer'
import Reducer from '../utils/reducer'
import { dragLayers, selectLayer } from '../utils/actions'
import DragHandle from '../components/DragHandle'
import ResizeHandle from '../components/ResizeHandle'
import {
    getLayerDimensions,
    scaleAllDimensions,
    unscaleDimension,
} from '../utils/artboardUtils'

export default function Home() {
    const artboardWrapperStyles = {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: '#EEEEEE',
        backgroundImage: 'radial-gradient(#BBBBBB 1px, transparent 0)',
        backgroundSize: '24px 24px',
        backgroundPosition: '-6px -6px',
    }

    // const [artboard, setArtboard] = useState({ layers: [] })
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

    let lastDragUpdate = 0
    let lastOffset = { x: 0, y: 0 }

    const [collectedProps, dropTarget] = useDrop(() => ({
        accept: 'LAYER',
        collect: (monitor, props) => {
            return { isDragging: monitor.isOver() }
        },
        hover: (item, monitor) => {
            // Get layer offset while hovering and round it off so we don't move less than a pixel
            let rawOffset = monitor.getDifferenceFromInitialOffset()
            let offset = {
                x: Math.round(rawOffset.x),
                y: Math.round(rawOffset.y),
            }
            let rightNow = Date.now()
            let dragInterval = rightNow - lastDragUpdate
            // Only do something if the pointer has moved
            // Also wait at least a little between updates to limit updates per second
            if (
                (offset.x !== lastOffset.x || offset.y !== lastOffset.y) &&
                dragInterval > 10
            ) {
                lastOffset = offset
                lastDragUpdate = rightNow
                dispatch(
                    dragLayers(
                        [artboard.selections],
                        unscaleDimension(offset.x, scaleFactor),
                        unscaleDimension(offset.y, scaleFactor),
                        true
                    )
                )
                dispatch(selectLayer(item.id))
            }
        },
        drop: (item, monitor) => {
            let offset = monitor.getDifferenceFromInitialOffset()
            dispatch(
                dragLayers(
                    item.id,
                    unscaleDimension(offset.x, scaleFactor),
                    unscaleDimension(offset.y, scaleFactor),
                    false
                )
            )
        },
    }))

    let mappedArtboard = mapArtboard(artboardJson)

    const [artboard, dispatch] = useReducer(Reducer, mappedArtboard)

    let selectedLayers = _.filter(artboard.layers, (layer) => {
        return _.includes(artboard.selections, layer.id)
    })
    let selectionDimensions = scaleAllDimensions(
        getLayerDimensions(selectedLayers),
        scaleFactor,
        true
    )

    const resizeableControlStyles = {
        position: 'absolute',
        top: selectionDimensions.y,
        left: selectionDimensions.x,
        width: selectionDimensions.width,
        height: selectionDimensions.height,
        transform: `rotate(${selectionDimensions.rotation}deg)`,
        pointerEvents: 'none',
        display: collectedProps.isDragging ? 'none' : 'block',
    }

    useEffect(() => {
        const resizeArtboard = () => {
            // Get appropriate size for artboard based on viewport size
            let wrapper = document.getElementById(`artboard-wrapper`)
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

        if (document != null) {
            setTimeout(resizeArtboard, 20)
        }

        window.addEventListener('resize', resizeArtboard)

        return () => {
            window.removeEventListener('resize', resizeArtboard)
        }
    }, [])

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
                                dispatch(selectLayer(null, false))
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
                                    >
                                        <i>top</i>
                                    </ResizeHandle>
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
                </Artboard>
            </div>
        </div>
    )
}
