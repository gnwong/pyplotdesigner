let canvas = document.getElementById('canvas');
let gridCanvas = document.getElementById('grid');
let selectedItem = null;
let scale = 200;
let borderWidth = 2;

function drawGrid() {
    const ctx = gridCanvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    gridCanvas.width = w;
    gridCanvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;

    for (let x = 0; x < w; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(scale, 0);
    ctx.lineTo(scale, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 1000-scale);
    ctx.lineTo(w, 1000-scale);
    ctx.stroke();
}

function getImageCoords(x, y, width, height) {
    const imageX = (x - scale) / scale;
    const imageY = (canvas.clientHeight - scale - y - height) / scale;
    const imageWidth = width / scale;
    const imageHeight = height / scale;
    return { imageX, imageY, imageWidth, imageHeight };
}

function getLayoutPayload() {
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
                text: el.innerText
            };
        });

    const constraints = [];

    const viewport = {
        width: canvas.clientWidth,
        height: canvas.clientHeight
    };

    return { elements, constraints, viewport };
}

function sendAdd(type) {
    const payload = getLayoutPayload();
    payload.action = 'add';
    payload.new_type = type;

    fetch('/api/update_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => renderLayout(data.elements));
}

function sendLayoutUpdate() {
    const payload = getLayoutPayload();

    fetch('/api/update_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => renderLayout(data.elements));
}

function getScreenCoords(x, y, width, height) {
    const screenX = x * scale + scale;
    const screenY = canvas.clientHeight - scale - (y + height) * scale;
    const screenWidth = width * scale;
    const screenHeight = height * scale;
    return { screenX, screenY, screenWidth, screenHeight };
}

function renderLayout(elements) {
    const existingGrid = document.getElementById('grid');
    canvas.innerHTML = '';
    canvas.appendChild(existingGrid);
    drawGrid();

    elements.forEach(el => {
        const { screenX, screenY, screenWidth, screenHeight } = getScreenCoords(el.x, el.y, el.width, el.height);
        const div = document.createElement('div');
        div.classList.add('draggable');
        div.dataset.type = el.type;
        div.dataset.id = el.id;
        div.innerText = el.text || el.type;
        div.style.left = screenX + 'px';
        div.style.top = screenY + 'px';
        div.style.width = screenWidth - 2 * borderWidth + 'px';
        div.style.height = screenHeight - 2 * borderWidth + 'px';
        div.style.padding = '0px';
        div.style.borderWidth = borderWidth + 'px';
        div.style.borderColor = 'black';
        if (div.dataset.id == selectedItem) {
            div.style.borderColor = 'red';
        }
        makeDraggable(div);
        canvas.appendChild(div);
    });
}

function makeDraggable(el) {
    el.onmousedown = function (e) {
        setActive(el);
        let offsetX = e.clientX - el.offsetLeft;
        let offsetY = e.clientY - el.offsetTop;

        function move(e) {
            el.style.left = (e.clientX - offsetX) + 'px';
            el.style.top = (e.clientY - offsetY) + 'px';
            updateProps(el);
        }

        function stop() {
            sendLayoutUpdate();
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', stop);
        }

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', stop);
    };
}

function setActive(el) {
    const all = document.querySelectorAll('.draggable');
    all.forEach(div => div.style.borderColor = 'black');
    el.style.borderColor = 'red';
    selectedItem = el.dataset.id;
    updateProps(el);
}

canvas.addEventListener('click', (e) => {
    if (e.target === canvas || e.target.id === 'grid') {
        document.querySelectorAll('.draggable').forEach(div => div.style.borderColor = 'black');
        selectedItem = null;
        document.getElementById('props').innerHTML = '';
    }
});

function updateProps(el) {
    // Convert screen coordinates and dimensions to image coordinates

    const screenX = parseInt(el.style.left, 10);
    const screenY = parseInt(el.style.top, 10);
    const screenWidth = parseInt(el.style.width, 10) + 2 * borderWidth;
    const screenHeight = parseInt(el.style.height, 10) + 2 * borderWidth;

    const { imageX, imageY, imageWidth, imageHeight } = getImageCoords(screenX, screenY, screenWidth, screenHeight);

    let props = document.getElementById('props');
    props.innerHTML = `
        <p>ID: ${el.dataset.id}</p>
        <p>Type: ${el.dataset.type}</p>
        <label>X: <input type="number" value="${imageX}" data-prop="x" onchange="updateElementFromProps('${el.dataset.id}');"></label><br>
        <label>Y: <input type="number" value="${imageY}" data-prop="y" onchange="updateElementFromProps('${el.dataset.id}');"></label><br>
        <label>Width: <input type="number" value="${imageWidth}" data-prop="width" onchange="updateElementFromProps('${el.dataset.id}');"></label><br>
        <label>Height: <input type="number" value="${imageHeight}" data-prop="height" onchange="updateElementFromProps('${el.dataset.id}');"></label><br>
    `;
}

function updateElementFromProps(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    const props = document.getElementById('props');

    const inputs = props.querySelectorAll('input[data-prop]');
    const values = {};
    inputs.forEach(input => {
        const prop = input.dataset.prop;
        values[prop] = parseFloat(input.value);
    });

    const { screenX, screenY, screenWidth, screenHeight } = getScreenCoords(
        values.x, values.y, values.width, values.height
    );

    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;
    el.style.width = `${screenWidth}px`;
    el.style.height = `${screenHeight}px`;
}

window.addEventListener('resize', drawGrid);
window.addEventListener('load', () => {
    drawGrid();
    sendLayoutUpdate();
});
