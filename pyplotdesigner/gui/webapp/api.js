import { canvas, borderWidth } from './shared.js';
import { getImageCoords } from './canvas.js';
import { renderLayout, renderConstantsList, renderConstraintsList } from './render.js';
import { constraintsEqual } from './constraints.js';

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
        height: canvas.clientHeight
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

    window.constants = window.constants.filter(c => c.id !== id);
    window.constants.push({
        id: constant.id,
        value: constant.value
    });

    fetch('/api/update_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        processReceivedPayload(data);
    });    
}

export function sendAdd(type) {
    const payload = getLayoutPayload();
    payload.action = 'add';
    payload.new_type = type;

    fetch('/api/update_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        processReceivedPayload(data);
    });    
}

export function saveState(payload) {
    if (localStorage.getItem('autosave-enabled') === 'true') {
        localStorage.setItem('pyplotdesigner-state', JSON.stringify(payload));
    }
}

export function sendDelete(elementId) {
    const payload = getLayoutPayload();
    payload.action = 'delete';
    payload.element_id = elementId;

    fetch('/api/update_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        processReceivedPayload(data);
    });    
}

export function sendLayoutUpdate() {
    const payload = getLayoutPayload();

    fetch('/api/update_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        processReceivedPayload(data);
    });
}

function processReceivedPayload(data) {
    window.constraints = data.constraints || [];
    window.constants = data.constants || [];
    renderLayout(data.elements);
    saveState(getLayoutPayload());
}