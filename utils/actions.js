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
    SELECT_ALL_LAYERS,
    TOGGLE_IMAGE_PICKER,
    UNDO_ACTION,
    UPDATE_TEXT,
} from './constants'

export function addLayer(layerType, image) {
    return {
        type: ADD_LAYER,
        layerType,
        image,
    }
}

export function adjustLayers(adjustmentGroup, propertyName, value) {
    return {
        type: ADJUST_LAYERS,
        adjustmentGroup,
        propertyName,
        value,
    }
}

export function bumpLayers(axis, distance) {
    return {
        type: BUMP_LAYERS,
        axis,
        distance,
    }
}

export function copyLayers() {
    return {
        type: COPY_LAYERS,
    }
}

export function deleteLayers() {
    return {
        type: DELETE_LAYERS,
    }
}

export function deselectLayers() {
    return {
        type: DESELECT_LAYERS,
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
export function pasteLayers() {
    return {
        type: PASTE_LAYERS,
    }
}

export function rotateLayer(degrees) {
    return {
        type: ROTATE_LAYER,
        degrees,
    }
}

export function scaleLayer(scaleDirectives, previewOnly) {
    return {
        type: SCALE_LAYER,
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

export function selectAllLayers() {
    return {
        type: SELECT_ALL_LAYERS,
    }
}

export function toggleImagePicker(artboardId) {
    return {
        type: TOGGLE_IMAGE_PICKER,
        artboardId,
    }
}

export function undoAction() {
    return {
        type: UNDO_ACTION,
    }
}

export function updateText(artboardId, text) {
    return {
        type: UPDATE_TEXT,
        artboardId,
        text,
    }
}
