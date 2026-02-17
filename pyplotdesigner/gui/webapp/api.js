import { canvas, borderWidth, setScale, getScale, getFigureSize, setFigureSize } from './shared.js';
import { renderLayout, renderConstantsList, renderConstraintsList } from './render.js';
import { constraintsEqual } from './constraints.js';
import { getImageCoords } from './canvas.js';

let layoutRequestQueue = Promise.resolve();

function queueLayoutRequest(payload) {
    layoutRequestQueue = layoutRequestQueue
        .catch(() => {
            // Keep the queue alive after previous failures.
        })
        .then(() =>
            fetch('/api/update_layout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                processReceivedPayload(data);
            })
        );
    return layoutRequestQueue;
}

export function getLayoutPayload() {
    const elements = Array.from(canvas.children)
        .filter(el => el.classList.contains('draggable'))
        .map(el => {
            const screenX = parseInt(el.style.left, 10);
            const screenY = parseInt(el.style.top, 10);
            const screenWidth = parseInt(el.style.width, 10) + 2 * borderWidth;
            const screenHeight = parseInt(el.style.height, 10) + 2 * borderWidth;

            const { imageX, imageY, imageWidth, imageHeight } = getImageCoords(screenX, screenY, screenWidth, screenHeight);

            return {
                id: el.dataset.id,
                type: el.dataset.type,
                x: imageX,
                y: imageY,
                width: imageWidth,
                height: imageHeight,
                text: el.dataset.text
            };
        });

    const constraints = window.constraints || [];
    const constants = window.constants || [];

    const viewport = {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        scale: getScale(),
        figureWidth: getFigureSize().width,
        figureHeight: getFigureSize().height
    };

    return { elements, constraints, constants, viewport };
}

export function deleteConstant(constant) {
    window.constants = window.constants.filter(c => c.id !== constant.id);
    sendLayoutUpdate();
    renderConstantsList(window.constants);
}

export function deleteConstraint(constraint) {
    window.constraints = window.constraints.filter(c => !constraintsEqual(c, constraint));
    sendLayoutUpdate();
    renderConstraintsList(window.constraints);
}

export function updateConstant(id, constant) {
    const payload = getLayoutPayload();
    payload.action = 'update_constant';
    payload.id = id;
    payload.constant = constant;

    const idsToReplace = new Set([id, constant?.id].filter(Boolean));
    window.constants = window.constants.filter(c => !idsToReplace.has(c.id));
    window.constants.push({
        id: constant.id,
        value: constant.value
    });

    // Re-render constants immediately so subsequent edits bind to the latest id.
    renderConstantsList(window.constants);

    queueLayoutRequest(payload);
}

export function sendAdd(type) {
    const payload = getLayoutPayload();
    payload.action = 'add';
    payload.new_type = type;

    queueLayoutRequest(payload);
}

export function saveState(payload) {
    const isEmpty = (payload.elements || []).length === 0 &&
        (payload.constants || []).length === 0 &&
        (payload.constraints || []).length === 0;

    if (isEmpty) {
        localStorage.removeItem('pyplotdesigner-state');
        return;
    }

    if (localStorage.getItem('autosave-enabled') === 'true') {
        localStorage.setItem('pyplotdesigner-state', JSON.stringify(payload));
    }
}

export function sendDelete(elementId) {
    const payload = getLayoutPayload();
    payload.action = 'delete';
    payload.element_id = elementId;

    queueLayoutRequest(payload);
}

export function sendLayoutUpdate() {
    const payload = getLayoutPayload();

    queueLayoutRequest(payload);
}

export function processReceivedPayload(data) {
    if (data.error) {
        console.error('Error received from server:', data.error);
        return;
    }
    window.constraints = data.constraints || [];
    window.constants = data.constants || [];
    if (data.viewport?.scale !== undefined) {
        setScale(data.viewport.scale);
    }
    if (data.viewport?.figureWidth !== undefined && data.viewport?.figureHeight !== undefined) {
        setFigureSize(data.viewport.figureWidth, data.viewport.figureHeight);
    }
    renderLayout(data.elements);
    saveState(getLayoutPayload());
}
