export const canvas = document.getElementById('canvas');
export const gridCanvas = document.getElementById('grid');
export const arrowCanvas = document.getElementById('arrows');

export const borderWidth = 2;

export let figureWidth = 7;
export let figureHeight = 5;

export function setFigureSize(width, height) {
    figureWidth = width;
    figureHeight = height;
}

export function getFigureSize() {
    return { width: figureWidth, height: figureHeight };
}

export let scale = 200;
export let offsetX = scale / 2;
export let offsetY = scale / 2;

export function setScale(newScale) {
    scale = newScale;
    offsetX = scale / 2;
    offsetY = scale / 2;
}

export function getScale() {
    return scale;
}

export let selectedItem = null;

export function setSelectedItem(id) {
    selectedItem = id;
}
export function getSelectedItem() {
    return selectedItem;
}

export let selectionCallback = null;

export function startSelecting(callback) {
    selectionCallback = callback;
}

export function completeSelection(reference) {
    // returns true when we have consumed the selection
    if (selectionCallback) {
        selectionCallback(reference);
        selectionCallback = null;
        return true;
    }
    return false;
}