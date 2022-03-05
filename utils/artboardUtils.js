import _ from 'lodash'

import { mergeAdjustments } from './mergeAdjustments'

// Scale an individual Dimension for artboard resizing
export const scaleDimension = (dimension, scaleFactor) => {
    return Math.round(dimension * scaleFactor)
}

// Unscale an individual Dimension for artboard resizing
export const unscaleDimension = (dimension, scaleFactor) => {
    return Math.round(dimension / scaleFactor)
}

// Scale full set of layer dimensions for artboard resizing
export const scaleAllDimensions = (dimensions, scaleFactor, scaleIn) => {
    let { x, y, width, height, rotation } = dimensions
    function scale(dimension) {
        if (scaleIn) {
            return scaleDimension(dimension, scaleFactor)
        } else {
            return unscaleDimension(dimension, scaleFactor)
        }
    }
    return {
        x: scale(x),
        y: scale(y),
        width: scale(width),
        height: scale(height),
        rotation,
    }
}

// Get full set of collective dimenions from a set of layers
// If no layers are supplied, return 0 for all dimensions
export const getLayerDimensions = (layers) => {
    let x = layers[0]
        ? _.first(
              _.orderBy(
                  _.map(layers, (layer) => {
                      return layer.adjustments.dimensions.x
                  })
              )
          )
        : null

    let y = layers[0]
        ? _.first(
              _.orderBy(
                  _.map(layers, (layer) => {
                      return layer.adjustments.dimensions.y
                  })
              )
          )
        : null

    let width = layers[0]
        ? _.last(
              _.orderBy(
                  _.map(layers, (layer) => {
                      return (
                          layer.adjustments.dimensions.x -
                          x +
                          layer.adjustments.dimensions.width
                      )
                  })
              )
          )
        : null

    let height = layers[0]
        ? _.last(
              _.orderBy(
                  _.map(layers, (layer) => {
                      return (
                          layer.adjustments.dimensions.y -
                          y +
                          layer.adjustments.dimensions.height
                      )
                  })
              )
          )
        : null

    let firstLayerDimensions = layers[0] ? layers[0].dimensions : {}
    let rotation = layers.length === 1 ? firstLayerDimensions.rotation : 0

    return { x, y, width, height, rotation }
}

// Map state to layers
let mapLayers = (layers, selections, editableTextLayer) => {
    return _.keyBy(
        _.map(layers, (layer) => {
            return {
                ...layer,
                isSelected: _.includes(selections, layer.id),
                isEditable: _.includes(editableTextLayer, layer.id),
                adjustments: {
                    ...layer.adjustments,
                    dimensions: layer.adjustments.dimensions,
                },
            }
        }),
        'id'
    )
}

export const mapArtboard = (artboard) => {
    let selectedLayers = _.filter(artboard.layers, (layer) => {
        return _.includes(artboard.selections, layer.id)
    })
    return {
        ...artboard,
        isSelected: selectedLayers.length > 0,
        layerSelected:
            _.intersection(artboard.selections, artboard.layers).length > 0,
        layers: mapLayers(
            artboard.layers,
            artboard.selections,
            artboard.editableTextLayer
        ),
        selection: {
            isActive: selectedLayers.length > 0,
            adjustments: mergeAdjustments(selectedLayers),
            // dimensions: getLayerDimensions(selectedLayers),
        },
    }
}
