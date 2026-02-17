import { enterMode, exitMode, showToast } from './status.js';

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

export let scale = 120;
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
let selectionModeId = null;
let selectionOnCancel = null;
let selectionCancelText = 'Selection canceled.';
let selectionSuccessText = null;

function clearSelectionState() {
    selectionCallback = null;
    selectionModeId = null;
    selectionOnCancel = null;
    selectionCancelText = 'Selection canceled.';
    selectionSuccessText = null;
}

export function startSelecting(callback, options = {}) {
    if (typeof callback !== 'function') {
        return;
    }

    cancelSelection({ showFeedback: false });

    selectionCallback = callback;
    selectionOnCancel = options.onCancel || null;
    selectionCancelText = options.cancelText === false ? null : (options.cancelText || 'Selection canceled.');
    selectionSuccessText = options.successText || null;
    selectionModeId = options.modeId || `selection-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    enterMode({
        id: selectionModeId,
        text: options.promptText || 'Waiting for input: select an item.',
        cancelable: options.cancelable !== false,
        cancelLabel: options.cancelLabel || 'Cancel',
        onCancel: () => {
            const onCancel = selectionOnCancel;
            const cancelText = selectionCancelText;
            clearSelectionState();
            if (typeof onCancel === 'function') {
                onCancel();
            }
            if (cancelText) {
                showToast(cancelText, { level: 'info' });
            }
        }
    });
}

export function cancelSelection({ showFeedback = true } = {}) {
    if (!selectionCallback) {
        return false;
    }

    const modeId = selectionModeId;
    const onCancel = selectionOnCancel;
    const cancelText = selectionCancelText;

    clearSelectionState();
    if (modeId) {
        exitMode(modeId);
    }
    if (typeof onCancel === 'function') {
        onCancel();
    }
    if (showFeedback && cancelText) {
        showToast(cancelText, { level: 'info' });
    }
    return true;
}

export function completeSelection(reference) {
    // returns true when we have consumed the selection
    if (selectionCallback) {
        const callback = selectionCallback;
        const modeId = selectionModeId;
        const successText = selectionSuccessText;

        clearSelectionState();
        if (modeId) {
            exitMode(modeId);
        }

        callback(reference);
        if (successText) {
            showToast(successText, { level: 'info' });
        }
        return true;
    }
    return false;
}

export function runInteractiveAction({
    promptText = 'Waiting for input: select an item.',
    cancelText = 'Selection canceled.',
    successText = null,
    cancelable = true,
    cancelLabel = 'Cancel',
    onCancel = null,
    validate = null,
    invalidText = 'Invalid selection.',
    invalidLevel = 'warn',
    onInvalid = null,
    onSelect = null
} = {}) {
    if (typeof onSelect !== 'function') {
        return false;
    }

    const beginSelection = () => {
        startSelecting((reference) => {
            if (typeof validate === 'function' && !validate(reference)) {
                if (typeof onInvalid === 'function') {
                    onInvalid(reference);
                } else if (invalidText) {
                    showToast(invalidText, { level: invalidLevel });
                }
                beginSelection();
                return;
            }

            onSelect(reference);
        }, {
            promptText,
            cancelText,
            successText,
            cancelable,
            cancelLabel,
            onCancel
        });
    };

    beginSelection();
    return true;
}
