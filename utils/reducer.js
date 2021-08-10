import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'

import artboardJson from '../artboard'
import { mapArtboard } from '../utils/artboardUtils'
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

// Get artboard data from JSON file
const mappedArtboard = mapArtboard(artboardJson)

// Set up initial state for reducer
export const initialState = {
    artboard: mappedArtboard,
    history: [],
}

export default function Reducer(state, a) {
    // Clone state to apply updates
    const newState = _.cloneDeep(state)
    console.log(state.history)

    // Get timestamp for this batch of updates
    const rightNow = Date.now()

    // Add an updated artboard to its own history
    const updateHistory = (artboard) => {
        newState.history.push(_.cloneDeep(artboard))
    }

    // var upsertLayer = function (layers, layerId, newLayer) {
    //     var match = _.find(layers, { id: layerId })
    //     if (match) {
    //         var index = _.indexOf(arr, _.find(layers, { id: layerId }))
    //         arr.splice(index, 1, newLayer)
    //     } else {
    //         arr.push(newLayer)
    //     }
    // }

    // Add initial history entry if one isn't present
    if (newState.artboard && newState.history.length === 0) {
        updateHistory(newState.artboard)
    }

    // Log action (in dev environment only)
    consoleGroup(a.type, [a])

    // Switching between action types
    switch (a.type) {
        case ADD_LAYER:
            let newLayer
            if (a.layerType === 'image') {
                newLayer = newLayers[a.layerType](a.image)
            } else {
                newLayer = newLayers[a.layerType]()
            }
            newLayer.id = uuidv4()
            newLayer.order = newState.artboard.layers.length + 1
            newState.artboard.layers.push(newLayer)
            newState.artboard.selections = [newLayer.id]
            updateHistory(newState.artboard)
            break

        case ADJUST_LAYERS:
            let adjustedLayers = newState.artboard.selections
            _.each(adjustedLayers, (layerId) => {
                _.find(newState.artboard.layers, { id: layerId }).adjustments[
                    a.adjustmentGroup
                ][a.propertyName] = a.value
            })
            updateHistory(newState.artboard)
            break

        case BUMP_LAYERS:
            const { axis, distance } = a
            let bumpedLayers = newState.artboard.selections
            _.each(bumpedLayers, (layerId) => {
                let bumpedLayer = _.find(newState.artboard.layers, {
                    id: layerId,
                })
                bumpedLayer.dimensions[axis] += distance
            })
            updateHistory(newState.artboard)
            break

        case COPY_LAYERS:
            let copiedLayers = _.map(
                newState.artboard.selections,
                (layerId) => {
                    return Object.assign(
                        {},
                        _.find(newState.artboard.layers, (layer) => {
                            return layer.id === layerId
                        })
                    )
                }
            )
            newState.pasteBuffer = copiedLayers
            break

        case DELETE_LAYERS:
            let newLayers = {}
            _.each(newState.artboard.layers, (layer) => {
                if (!_.includes(newState.artboard.selections, layer.id)) {
                    newLayers[layer.id] = {
                        ...newState.artboard.layers[layer.id],
                    }
                }
            })
            newState.artboard.layers = newLayers
            newState.artboard.selections = []
            updateHistory(newState.artboard)
            break

        case DESELECT_LAYERS:
            newState.artboard.selections = []
            break

        case DRAG_LAYERS:
            let affectedLayers = newState.artboard.selections
            // For each selected layer apply offset to all points
            _.each(affectedLayers, (layerId) => {
                let nextDraggedLayer = _.find(newState.artboard.layers, {
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
                    updateHistory(newState.artboard)
                }
            })
            break

        case ENABLE_TEXT_EDITOR:
            newState.artboard.editableTextLayer = a.layerId
            break

        // TODO: Figure out whether to resurrect this
        case HIGHLIGHT_LAYER:
            newState.highlights = { layerId: a.layerId }
            break

        case MOVE_LAYERS:
            let movedLayers = _.orderBy(
                _.map(newState.artboard.selections, (layerId) => {
                    return _.find(newState.artboard.layers, { id: layerId })
                }),
                'order'
            )

            let unmovedLayers = []
            _.each(_.orderBy(newState.artboard.layers, 'order'), (layer) => {
                if (!_.includes(newState.artboard.selections, layer.id)) {
                    unmovedLayers.push(layer)
                }
            })

            // Add selected layer back to the front or back of the list
            let newLayerOrder =
                a.direction === 'front'
                    ? [...unmovedLayers, ...movedLayers]
                    : [...movedLayers, ...unmovedLayers]
            let newlyOrderedLayers = _.keyBy(
                _.map(newLayerOrder, (orderedLayer, index) => {
                    orderedLayer.order = index
                    return orderedLayer
                }),
                'id'
            )
            newState.artboard.layers = newlyOrderedLayers
            updateHistory(newState.artboard)
            break

        case PASTE_LAYERS:
            let pastedLayerIds = []
            _.map(state.pasteBuffer, (layer) => {
                let pastedLayer = _.cloneDeep(layer)
                pastedLayer.id = uuidv4()
                pastedLayerIds.push(pastedLayer.id)
                newState.artboard.layers[pastedLayer.id] = pastedLayer
            })
            newState.artboard.selections = pastedLayerIds
            updateHistory(newState.artboard)
            break

        case ROTATE_LAYER:
            console.log('ROTATE THE LAYER!!!!', a)
            const { degrees } = a
            let rotatedLayerId = newState.artboard.selections[0]
            let rotatedLayer = _.find(newState.artboard.layers, {
                id: rotatedLayerId,
            })
            rotatedLayer.dimensions.rotation = degrees
            updateHistory(newState.artboard)
            break

        case SCALE_LAYER:
            let scaledSelections = newState.artboard.selections
            // Only attempt to apply new adjustments if a single layer is selected
            if (scaledSelections.length === 1) {
                // Get the affected layer and its dimensions
                let scaledLayer = _.find(newState.artboard.layers, {
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
                    updateHistory(newState.artboard)
                }
            }
            break

        case SELECT_LAYER:
            if (
                _.includes(newState.artboard.selections, a.layerId) &&
                !a.shiftKey
            ) {
                // Do nothing
                // return state
            } else {
                newState.artboard.selections = a.shiftKey
                    ? _.xor(newState.artboard.selections, [a.layerId])
                    : [a.layerId]
                // return Object.assign({}, state, {
                //     ...newState.artboard,
                // })
            }
            break

        case TOGGLE_IMAGE_PICKER:
            newState.artboard.showImagePicker =
                !newState.artboard.showImagePicker
            break

        case UNDO_ACTION:
            // Allow undo action if there is a history
            if (newState.history && newState.history.length > 1) {
                // Overwrite the artboard with the previous history item
                newState.artboard =
                    newState.history[newState.history.length - 2]
                // drop undone history items
                newState.history = _.slice(
                    newState.history,
                    0,
                    newState.history.length - 1
                )
                updateHistory(newState.artboard)
            }
            break

        case UPDATE_TEXT:
        // let newTextLayer = _.filter(newState.artboard.layers, (layer) => {
        //     return layer.id === newState.artboard.editableTextLayer
        // })[0]
        // newTextLayer.text = a.text
        // updateHistory(newState.artboard)

        // return Object.assign({}, state, {
        //     artboards: clonedArtboards,
        // })

        default:
        // If there's no recognized action, take no action
        // return state
    }
    return Object.assign({}, state, newState)
}
