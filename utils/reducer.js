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
    SELECT_ALL_LAYERS,
    SELECT_LAYER,
    TOGGLE_IMAGE_PICKER,
    UNDO_ACTION,
    UPDATE_TEXT,
} from './constants.js'
import { mergeAdjustments } from './mergeAdjustments'
import { newLayers } from './newLayers'

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

    // Get timestamp for this batch of updates
    const rightNow = Date.now()

    // Add an updated artboard to its own history
    const updateHistory = (state) => {
        newState.history.push(_.cloneDeep(state.artboard))
    }

    // Add initial history entry if one isn't present
    if (newState.artboard && newState.history.length === 0) {
        updateHistory(newState)
    }

    // Update selection adjustments
    const updateAdjustments = (newState) => {
        // Get the layers to which adjustments will be applied
        let adjustedLayers = _.filter(newState.artboard.layers, (layer) => {
            return _.includes(newState.artboard.selections, layer.id)
        })

        // Apply merged adjustments
        newState.artboard.selection.adjustments =
            mergeAdjustments(adjustedLayers)
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
            console.log(newLayer)
            newLayer.id = uuidv4()
            // Put layer in the middle of visible area
            console.log(a)
            newLayer.adjustments.dimensions.x =
                a.offset.x / 2 - newLayer.adjustments.dimensions.width / 2
            newLayer.adjustments.dimensions.y =
                a.offset.y / 2 - newLayer.adjustments.dimensions.height / 2
            newLayer.order = _.keys(newState.artboard.layers).length + 1
            newState.artboard.layers[newLayer.id] = newLayer
            newState.artboard.selections = [newLayer.id]
            updateAdjustments(newState)
            updateHistory(newState)
            break

        case ADJUST_LAYERS:
            let adjustedLayers = newState.artboard.selections
            _.each(adjustedLayers, (layerId) => {
                _.find(newState.artboard.layers, { id: layerId }).adjustments[
                    a.adjustmentGroup
                ][a.propertyName] = a.value
            })
            updateAdjustments(newState)
            updateHistory(newState)
            break

        case BUMP_LAYERS:
            const { axis, distance } = a
            let bumpedLayers = newState.artboard.selections
            _.each(bumpedLayers, (layerId) => {
                let bumpedLayer = _.find(newState.artboard.layers, {
                    id: layerId,
                })
                bumpedLayer.adjustments.dimensions[axis] += distance
            })
            updateAdjustments(newState)
            updateHistory(newState)
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
            let layersAfterUpdate = {}
            _.each(newState.artboard.layers, (layer) => {
                if (!_.includes(newState.artboard.selections, layer.id)) {
                    layersAfterUpdate[layer.id] = {
                        ...newState.artboard.layers[layer.id],
                    }
                }
            })
            newState.artboard.layers = layersAfterUpdate
            newState.artboard.selections = []
            updateAdjustments(newState)
            updateHistory(newState)
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
                let draggedDimensions = _.cloneDeep(
                    nextDraggedLayer.adjustments.dimensions
                )
                draggedDimensions.x += Math.round(a.x)
                draggedDimensions.y += Math.round(a.y)
                if (a.previewOnly) {
                    nextDraggedLayer.adjustments.tempDimensions =
                        draggedDimensions
                } else {
                    nextDraggedLayer.adjustments.dimensions = draggedDimensions
                    nextDraggedLayer.adjustments.tempDimensions = undefined
                    updateAdjustments(newState)
                    updateHistory(newState)
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
            updateAdjustments(newState)
            updateHistory(newState)
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
            updateAdjustments(newState)
            updateHistory(newState)
            break

        case ROTATE_LAYER:
            const { degrees } = a
            let rotatedLayerId = newState.artboard.selections[0]
            let rotatedLayer = _.find(newState.artboard.layers, {
                id: rotatedLayerId,
            })
            rotatedLayer.adjustments.dimensions.rotation = degrees
            updateAdjustments(newState)
            updateHistory(newState)
            break

        case SCALE_LAYER:
            let scaledSelections = newState.artboard.selections
            // Only attempt to apply new adjustments if a single layer is selected
            if (scaledSelections.length === 1) {
                // Get the affected layer and its dimensions
                let scaledLayer = _.find(newState.artboard.layers, {
                    id: scaledSelections[0],
                })
                let newDimensions = _.cloneDeep(
                    scaledLayer.adjustments.dimensions
                )

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
                    let resizeAxis = _.clone(newDimensions.rotation)
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
                    scaledLayer.adjustments.tempDimensions = newDimensions
                } else {
                    scaledLayer.adjustments.dimensions.x = newDimensions.x
                    scaledLayer.adjustments.dimensions.y = newDimensions.y
                    scaledLayer.adjustments.dimensions.width =
                        newDimensions.width
                    scaledLayer.adjustments.dimensions.height =
                        newDimensions.height
                    scaledLayer.adjustments.dimensions.rotation =
                        newDimensions.rotation
                    scaledLayer.adjustments.tempDimensions = undefined
                    updateAdjustments(newState)
                    updateHistory(newState)
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
                updateAdjustments(newState)
            }
            break

        case SELECT_ALL_LAYERS:
            newState.artboard.selections = _.map(newState.layers, (layer) => {
                return layer.id
            })
            updateAdjustments(newState)
            break

        case TOGGLE_IMAGE_PICKER:
            newState.artboard.showImagePicker =
                !newState.artboard.showImagePicker
            break

        case UNDO_ACTION:
            // Allow undo action if there is a history
            if (newState.history && newState.history.length > 1) {
                // Overwrite the artboard with the previous history item
                newState.artboard = _.cloneDeep(
                    newState.history[newState.history.length - 2]
                )
                // drop undone history items
                newState.history = _.cloneDeep(
                    _.slice(newState.history, 0, newState.history.length - 1)
                )
                updateAdjustments(newState)
            }
            break

        case UPDATE_TEXT:
            let newTextLayer = _.filter(newState.artboard.layers, (layer) => {
                return layer.id === newState.artboard.editableTextLayer
            })[0]
            newTextLayer.text = a.text
            updateHistory(newState)
            break

        default:
            // update artboard adjustments based on selections
            let newAdjustments = _.cloneDeep(
                mergeAdjustments(
                    _.filter(newState.artboard.layers, (layer) => {
                        return _.includes(
                            newState.artboard.selections,
                            layer.id
                        )
                    })
                )
            )
            newState.artboard.adjustments = newAdjustments
    }
    updateAdjustments(newState)
    return Object.assign({}, state, newState)
}
