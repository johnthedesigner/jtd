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
} from './constants'

export function addLayer(artboardId, layerType, image) {
    return {
        type: ADD_LAYER,
        artboardId,
        layerType,
        image,
    }
}

export function adjustLayers(artboardId, adjustmentGroup, propertyName, value) {
    return {
        type: ADJUST_LAYERS,
        artboardId,
        adjustmentGroup,
        propertyName,
        value,
    }
}

export function bumpLayers(artboardId, axis, distance) {
    return {
        type: BUMP_LAYERS,
        artboardId,
        axis,
        distance,
    }
}

export function copyLayers(artboardId) {
    return {
        type: COPY_LAYERS,
        artboardId,
    }
}

export function deleteLayers(artboardId) {
    return {
        type: DELETE_LAYERS,
        artboardId,
    }
}

export function deselectLayers(artboardId) {
    return {
        type: DESELECT_LAYERS,
        artboardId,
    }
}

export function dragLayers(layerIds, x, y, previewOnly) {
    return {
        type: DRAG_LAYERS,
        layerIds,
        x,
        y,
        previewOnly,
    }
}

export function enableTextEditor(artboardId, layerId) {
    return {
        type: ENABLE_TEXT_EDITOR,
        artboardId,
        layerId,
    }
}

export function highlightLayer(layerId) {
    return {
        type: HIGHLIGHT_LAYER,
        layerId,
    }
}

export function moveLayers(artboardId, direction) {
    return {
        type: MOVE_LAYERS,
        artboardId,
        direction,
    }
}
export function pasteLayers(artboardId) {
    return {
        type: PASTE_LAYERS,
        artboardId,
    }
}

export function rotateLayer(artboardId, degrees) {
    return {
        type: ROTATE_LAYER,
        artboardId,
        degrees,
    }
}

export function scaleLayer(artboardId, scaleDirectives, previewOnly) {
    return {
        type: SCALE_LAYER,
        artboardId,
        scaleDirectives,
        previewOnly,
    }
}

export function selectLayer(layerId, shiftKey) {
    return {
        type: SELECT_LAYER,
        layerId,
        shiftKey,
    }
}

export function toggleImagePicker(artboardId) {
    return {
        type: TOGGLE_IMAGE_PICKER,
        artboardId,
    }
}

export function undoAction(artboardId) {
    return {
        type: UNDO_ACTION,
        artboardId,
    }
}

export function updateText(artboardId, text) {
    return {
        type: UPDATE_TEXT,
        artboardId,
        text,
    }
}
