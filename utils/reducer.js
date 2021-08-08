import _ from 'lodash'
import uuid from 'uuid'

import { newLayers } from './newLayers'
import {
    ADD_LAYER,
    ADJUST_LAYERS,
    BUMP_LAYERS,
    COPY_LAYERS,
    DELETE_LAYERS,
    DESELECT_LAYERS,
    DRAG_LAYERS,
    ENABLE_TEXT_EDITOR,
    HIGHLIGHT_LAYER,
    MOVE_LAYERS,
    PASTE_LAYERS,
    ROTATE_LAYER,
    SCALE_LAYER,
    SELECT_LAYER,
    TOGGLE_IMAGE_PICKER,
    UNDO_ACTION,
    UPDATE_TEXT,
} from './constants.js'

// Indent console logs with a title
export function consoleGroup(title, logArray) {
    if (process.env.NODE_ENV === 'development') {
        console.group(title)
        logArray.forEach((line) => console.log(line))
        console.groupEnd()
    }
}

export default function Reducer(state = {}, a) {
    // Add an updated artboard to its own history
    const updateHistory = (artboard) => {
        state.history.push(artboard)
    }

    // Prepare cloned artboard
    let clonedArtboard = _.cloneDeep(state)

    // Prepare cloned layer
    let cloneLayer = (layerId) => {
        return _.cloneDeep(state.layers[layerId])
    }

    var upsertLayer = function (layers, layerId, newLayer) {
        var match = _.find(layers, { id: layerId })
        if (match) {
            var index = _.indexOf(arr, _.find(layers, { id: layerId }))
            arr.splice(index, 1, newLayer)
        } else {
            arr.push(newLayer)
        }
    }

    // Add initial history entry if one isn't present
    if (clonedArtboard && state.history.length === 0) {
        state.history.push(_.cloneDeep(clonedArtboard))
    }

    // Switching between action types
    switch (a.type) {
        case ADD_LAYER:
            consoleGroup(a.type, [a])
            let newLayer
            if (a.layerType === 'image') {
                newLayer = newLayers[a.layerType](a.image)
            } else {
                newLayer = newLayers[a.layerType]()
            }
            newLayer.id = uuid.v1()
            newLayer.order = clonedArtboard.layers.length + 1
            clonedArtboard.layers.push(newLayer)
            clonedArtboard.selections = [newLayer.id]
            updateHistory(clonedArtboard)
            return Object.assign({}, state, { artboards: clonedArtboards })

        case ADJUST_LAYERS:
            consoleGroup(a.type, [a])
            let adjustedLayers = clonedArtboard.selections
            _.each(adjustedLayers, (layerId) => {
                _.find(clonedArtboard.layers, { id: layerId }).adjustments[
                    a.adjustmentGroup
                ][a.propertyName] = a.value
            })
            updateHistory(clonedArtboard)
            return Object.assign({}, state, { artboards: clonedArtboards })

        case BUMP_LAYERS:
            consoleGroup(a.type, [a])
            const { axis, distance } = a
            let bumpedLayers = clonedArtboard.selections
            _.each(bumpedLayers, (layerId) => {
                let bumpedLayer = _.find(clonedArtboard.layers, { id: layerId })
                bumpedLayer.dimensions[axis] += distance
            })
            updateHistory(clonedArtboard)
            return Object.assign({}, state, { artboards: clonedArtboards })

        case COPY_LAYERS:
            consoleGroup(a.type, [a])
            let copiedLayers = _.map(clonedArtboard.selections, (layerId) => {
                return Object.assign(
                    {},
                    _.find(clonedArtboard.layers, (layer) => {
                        return layer.id === layerId
                    })
                )
            })
            return Object.assign({}, state, {
                pasteBuffer: _.cloneDeep(copiedLayers),
            })

        case DELETE_LAYERS:
            consoleGroup(a.type, [a])
            clonedArtboard.layers = _.remove(clonedArtboard.layers, (layer) => {
                return !_.includes(clonedArtboard.selections, layer.id)
            })
            clonedArtboard.selections = []
            updateHistory(clonedArtboard)
            return Object.assign({}, state, { artboards: clonedArtboards })

        case DESELECT_LAYERS:
            consoleGroup(a.type, [a])
            clonedArtboards[a.artboardId].selections = []
            return Object.assign({}, state, {
                artboards: clonedArtboards,
            })

        case DRAG_LAYERS:
            consoleGroup(a.type, [a])
            let affectedLayers = clonedArtboard.selections
            // For each selected layer apply offset to all points
            _.each(affectedLayers, (layerId) => {
                let nextDraggedLayer = _.find(clonedArtboard.layers, {
                    id: layerId,
                })
                let draggedDimensions = _.cloneDeep(nextDraggedLayer.dimensions)
                draggedDimensions.x += Math.round(a.x)
                draggedDimensions.y += Math.round(a.y)
                if (a.previewOnly) {
                    nextDraggedLayer.tempDimensions = draggedDimensions
                } else {
                    nextDraggedLayer.dimensions = draggedDimensions
                    nextDraggedLayer.tempDimensions = undefined
                    updateHistory(clonedArtboard)
                }
            })
            return Object.assign({}, state, clonedArtboard)

        case ENABLE_TEXT_EDITOR:
            consoleGroup(a.type, [a])
            clonedArtboard.editableTextLayer = a.layerId
            return Object.assign({}, state, { artboards: clonedArtboards })

        // TODO: Figure out whether to resurrect this
        case HIGHLIGHT_LAYER:
            consoleGroup(a.type, [a])
            return Object.assign({}, state, {
                highlights: Object.assign({}, state.highlights, {
                    layerId: a.layerId,
                }),
            })

        case MOVE_LAYERS:
            consoleGroup(a.type, [a])
            let movedLayers = _.orderBy(
                _.map(clonedArtboard.selections, (layerId) => {
                    return _.find(clonedArtboard.layers, { id: layerId })
                }),
                'order'
            )
            _.each(_.orderBy(movedLayers, 'order'), (layer) => {
                // Remove each selected layer
                _.remove(clonedArtboard.layers, (checkLayer) => {
                    return checkLayer.id === layer.id
                })
            })
            // Add selected layer back to the front or back of the list
            clonedArtboard.layers =
                a.direction === 'front'
                    ? [...clonedArtboard.layers, ...movedLayers]
                    : [...movedLayers, ...clonedArtboard.layers]
            _.each(clonedArtboard.layers, (layer, index) => {
                layer.order = index
            })
            updateHistory(clonedArtboard)
            return Object.assign({}, state, { artboards: clonedArtboards })

        case PASTE_LAYERS:
            consoleGroup(a.type, [a])
            let pastedLayers = _.map(state.pasteBuffer, (layer) => {
                let pastedLayer = _.cloneDeep(layer)
                pastedLayer.id = uuid.v4()
                return pastedLayer
            })
            let pastedLayerIds = _.map(pastedLayers, (layer) => {
                return layer.id
            })
            clonedArtboard.layers = [...clonedArtboard.layers, ...pastedLayers]
            clonedArtboard.selections = pastedLayerIds
            updateHistory(clonedArtboard)
            return Object.assign({}, state, { artboards: clonedArtboards })

        case ROTATE_LAYER:
            consoleGroup(a.type, [a])
            const { degrees } = a
            let rotatedLayerId = clonedArtboard.selections[0]
            let rotatedLayer = _.find(clonedArtboard.layers, {
                id: rotatedLayerId,
            })
            rotatedLayer.dimensions.rotation = degrees
            updateHistory(clonedArtboard)
            return Object.assign({}, state, { artboards: clonedArtboards })

        case SCALE_LAYER:
            consoleGroup(a.type, [a])
            console.log(a)
            let scaledSelections = clonedArtboard.selections
            // Only attempt to apply new adjustments if a single layer is selected
            if (scaledSelections.length === 1) {
                // Get the affected layer and its dimensions
                let scaledLayer = _.find(clonedArtboard.layers, {
                    id: scaledSelections[0],
                })
                let newDimensions = _.cloneDeep(scaledLayer.dimensions)

                // Calculate how much additional offset is needed for rotated layers
                const getRotationOffset = (axis, distance) => {
                    return {
                        x: distance * Math.cos((axis % 360) * (Math.PI / 180)),
                        y: distance * Math.sin((axis % 360) * (Math.PI / 180)),
                    }
                }

                // For each resize direction apply scale and position offsets
                _.each(a.scaleDirectives, (directive) => {
                    let { direction, distance } = directive

                    // First, apply position and scale offsets based on unrotated layer
                    let resizeAxis = newDimensions.rotation
                    switch (direction) {
                        case 'right':
                            newDimensions.width += distance
                            newDimensions.x -= distance / 2
                            break
                        case 'bottom':
                            resizeAxis += 90
                            newDimensions.height += distance
                            newDimensions.y -= distance / 2
                            break
                        case 'left':
                            resizeAxis += 180
                            newDimensions.width += distance
                            newDimensions.x -= distance / 2
                            break
                        case 'top':
                            resizeAxis += 270
                            newDimensions.height += distance
                            newDimensions.y -= distance / 2
                            break
                        default:
                        // Do nothing
                    }

                    // Then apply additional offset for rotated layers
                    newDimensions.x += getRotationOffset(
                        resizeAxis,
                        distance / 2
                    ).x
                    newDimensions.y += getRotationOffset(
                        resizeAxis,
                        distance / 2
                    ).y

                    // Make sure we end up with integers
                    newDimensions.x = Math.round(newDimensions.x)
                    newDimensions.y = Math.round(newDimensions.y)
                })
                // Apply new dimensions temporarily (on drag) or permanently (on drop)
                if (a.previewOnly) {
                    scaledLayer.tempDimensions = newDimensions
                } else {
                    scaledLayer.dimensions = newDimensions
                    scaledLayer.tempDimensions = undefined
                    updateHistory(clonedArtboard)
                }
            }
            return Object.assign({}, state, clonedArtboard)

        case SELECT_LAYER:
            consoleGroup(a.type, [a])
            if (
                _.includes(clonedArtboard.selections, a.layerId) &&
                !a.shiftKey
            ) {
                return state
            } else {
                clonedArtboard.selections = a.shiftKey
                    ? _.xor(clonedArtboard.selections, [a.layerId])
                    : [a.layerId]
                return Object.assign({}, state, {
                    ...clonedArtboard,
                })
            }

        case TOGGLE_IMAGE_PICKER:
            consoleGroup(a.type, [a])
            clonedArtboard.showImagePicker = !clonedArtboard.showImagePicker
            return Object.assign({}, state, {
                artboards: clonedArtboards,
            })

        case UNDO_ACTION:
            consoleGroup(a.type, [a])
            let artboardHistory = _.cloneDeep(state.history[a.artboardId])
            // Allow undo action if there is a history
            if (artboardHistory && artboardHistory.length > 1) {
                // Overwrite the artboard with the previous history item
                clonedArtboards[a.artboardId] =
                    artboardHistory[artboardHistory.length - 2]
                // drop undone history items
                state.history[a.artboardId] = _.slice(
                    artboardHistory,
                    0,
                    artboardHistory.length - 1
                )
                return Object.assign({}, state, {
                    artboards: clonedArtboards,
                })
            } else {
                // If there's no previous history, don't do anything
                return state
            }

        case UPDATE_TEXT:
            consoleGroup(a.type, [a])
            let newTextLayer = _.filter(clonedArtboard.layers, (layer) => {
                return layer.id === clonedArtboard.editableTextLayer
            })[0]
            newTextLayer.text = a.text
            updateHistory(clonedArtboard)
            return Object.assign({}, state, {
                artboards: clonedArtboards,
            })

        default:
            return state
    }
}
