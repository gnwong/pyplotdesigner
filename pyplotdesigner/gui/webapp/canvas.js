import { canvas, gridCanvas, scale, offsetX, offsetY } from './shared.js';

export function drawGrid() {
    const ctx = gridCanvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    gridCanvas.width = w;
    gridCanvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < w; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = offsetY; y < h; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 1000 - offsetY);
    ctx.lineTo(w, 1000 - offsetY);
    ctx.stroke();
}

export function getImageCoords(x, y, width, height) {
    const imageX = (x - offsetX) / scale;
    const imageY = (canvas.clientHeight - offsetY - y - height) / scale;
    const imageWidth = width / scale;
    const imageHeight = height / scale;
    return { imageX, imageY, imageWidth, imageHeight };
}

export function getScreenCoords(x, y, width, height) {
    const screenX = x * scale + offsetX;
    const screenY = canvas.clientHeight - offsetY - (y + height) * scale;
    const screenWidth = width * scale;
    const screenHeight = height * scale;
    return { screenX, screenY, screenWidth, screenHeight };
}
