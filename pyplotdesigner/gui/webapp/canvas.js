import { canvas, gridCanvas, getScale, setScale, offsetX, offsetY, setFigureSize, getFigureSize } from './shared.js';
import { renderLayout } from './render.js';
import { sendLayoutUpdate } from './api.js';

export function openLayoutModal() {

    const existing = document.getElementById('layout-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'layout-modal';
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal-content';

    const heading = document.createElement('h3');
    heading.textContent = 'Layout Settings';
    modal.appendChild(heading);

    function createInputRow(labelText, defaultValue, id) {
        const row = document.createElement('div');
        row.className = 'modal-input-row';

        const label = document.createElement('label');
        label.textContent = labelText;
        label.setAttribute('for', id);
        row.appendChild(label);

        const input = document.createElement('input');
        input.type = 'number';
        input.id = id;
        input.value = defaultValue;
        input.step = '0.1';
        input.min = '0';
        row.appendChild(input);

        modal.appendChild(row);
        return input;
    }

    const figureDimensions = getFigureSize();
    const scaleInput = createInputRow('Pixels per inch:', getScale(), 'scale-input');
    const widthInput = createInputRow('Figure width (inches):', figureDimensions.width || 7, 'width-input');
    const heightInput = createInputRow('Figure height (inches):', figureDimensions.height || 5, 'height-input');

    const buttonRow = document.createElement('div');
    buttonRow.className = 'modal-button-row';

    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply';
    applyButton.className = 'add-constraint-button';
    applyButton.onclick = () => {
        const scale = parseFloat(scaleInput.value);
        const width = parseFloat(widthInput.value);
        const height = parseFloat(heightInput.value);

        if (!isNaN(scale) && !isNaN(width) && !isNaN(height)) {
            setScale(scale);
            setFigureSize(width, height);
            renderLayout();
            drawGrid();
            sendLayoutUpdate();
            document.body.removeChild(overlay);
        }
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => {
        document.body.removeChild(overlay);
    };

    buttonRow.appendChild(applyButton);
    buttonRow.appendChild(cancelButton);
    modal.appendChild(buttonRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

export function drawGrid() {

    const scale = getScale();

    const ctx = gridCanvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    gridCanvas.width = w;
    gridCanvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < w; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = h - offsetY; y >= 0; y -= scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, h - offsetY);
    ctx.lineTo(w, h - offsetY);
    ctx.stroke();

    const figureDimensions = getFigureSize();
    const screenHeight = figureDimensions.height * scale;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(offsetX, h - offsetY - screenHeight, figureDimensions.width * scale, screenHeight);
}

export function getImageCoords(x, y, width, height) {
    const scale = getScale();
    const imageX = (x - offsetX) / scale;
    const imageY = (canvas.clientHeight - offsetY - y - height) / scale;
    const imageWidth = width / scale;
    const imageHeight = height / scale;
    return { imageX, imageY, imageWidth, imageHeight };
}

export function getScreenCoords(x, y, width, height) {
    const scale = getScale();
    const screenX = x * scale + offsetX;
    const screenY = canvas.clientHeight - offsetY - (y + height) * scale;
    const screenWidth = width * scale;
    const screenHeight = height * scale;
    return { screenX, screenY, screenWidth, screenHeight };
}
