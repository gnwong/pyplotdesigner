let canvas = document.getElementById('canvas');
let gridCanvas = document.getElementById('grid');
let arrowCanvas = document.getElementById('arrows');

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
    ctx.moveTo(0, 1000 - scale);
    ctx.lineTo(w, 1000 - scale);
    ctx.stroke();
}

function drawConstraintsArrows(elements, constraints) {
    const ctx = arrowCanvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    arrowCanvas.width = w;
    arrowCanvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.lineWidth = 1;

    function getAttrPos(el, attr) {
        const { screenX, screenY, screenWidth, screenHeight } = getScreenCoords(el.x, el.y, el.width, el.height);
        if (attr === 'x') return [screenX, screenY + screenHeight / 2];
        if (attr === 'y') return [screenX + screenWidth / 2, screenY];
        if (attr === 'width') return [screenX + screenWidth, screenY + screenHeight / 2];
        if (attr === 'height') return [screenX + screenWidth / 2, screenY + screenHeight];
        return [screenX, screenY];
    }

    for (const c of constraints) {
        const source = elements.find(e => e.id === c.source_id);
        const target = elements.find(e => e.id === c.target_id);
        if (!source || !target) continue;
        const [x1, y1] = getAttrPos(source, c.source_attr);
        const [x2, y2] = getAttrPos(target, c.target_attr);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 5 * Math.cos(angle - Math.PI / 6), y2 - 5 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - 5 * Math.cos(angle + Math.PI / 6), y2 - 5 * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(x2, y2);
        ctx.fill();
    }
}

function renderConstraintList() {
    const list = document.getElementById('constraint-list');
    if (!list) return;
    const constraints = window.constraints || [];
    list.innerHTML = '<strong>Constraints</strong><ul>' + constraints.map(c =>
        `<li>${c.target_id}.${c.target_attr} ← (${c.source_id}.${c.source_attr} + ${c.add_before}) × ${c.multiply} + ${c.add_after}</li>`
    ).join('') + '</ul>';
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

    const constraints = window.constraints || [];

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
    canvas.appendChild(arrowCanvas);
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
        div.style.borderColor = (div.dataset.id == selectedItem) ? 'red' : 'black';
        makeDraggable(div);
        canvas.appendChild(div);
    });

    drawConstraintsArrows(elements, window.constraints || []);
    renderConstraintList();
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

function addConstraint(targetId, targetAttr) {
    const allIds = Array.from(document.querySelectorAll('.draggable')).map(el => el.dataset.id);
    const form = document.getElementById('constraint-form');
    form.innerHTML = `
        <hr><p><strong>Add Constraint</strong></p>
        <label>Source ID:
            <select id="constraint-source-id">
                ${allIds.map(id => `<option value="${id}">${id}</option>`).join('')}
            </select>
        </label><br>
        <label>Source Attr:
            <select id="constraint-source-attr">
                <option value="x">x</option>
                <option value="y">y</option>
                <option value="width">width</option>
                <option value="height">height</option>
            </select>
        </label><br>
        <label>Multiply: <input type="number" id="constraint-multiply" value="1"></label><br>
        <label>Add Before: <input type="number" id="constraint-before" value="0"></label><br>
        <label>Add After: <input type="number" id="constraint-after" value="0"></label><br>
        <button onclick="confirmConstraint('${targetId}', '${targetAttr}')">Confirm</button>
    `;
}

function confirmConstraint(targetId, targetAttr) {
    const constraint = {
        target_id: targetId,
        target_attr: targetAttr,
        source_id: document.getElementById('constraint-source-id').value,
        source_attr: document.getElementById('constraint-source-attr').value,
        multiply: parseFloat(document.getElementById('constraint-multiply').value),
        add_before: parseFloat(document.getElementById('constraint-before').value),
        add_after: parseFloat(document.getElementById('constraint-after').value)
    };

    window.constraints = window.constraints || [];
    window.constraints.push(constraint);
    sendLayoutUpdate();
}

function updateProps(el) {
    const screenX = parseInt(el.style.left, 10);
    const screenY = parseInt(el.style.top, 10);
    const screenWidth = parseInt(el.style.width, 10) + 2 * borderWidth;
    const screenHeight = parseInt(el.style.height, 10) + 2 * borderWidth;
    const { imageX, imageY, imageWidth, imageHeight } = getImageCoords(screenX, screenY, screenWidth, screenHeight);

    let props = document.getElementById('props');
    props.innerHTML = `
        <p>ID: ${el.dataset.id}</p>
        <p>Type: ${el.dataset.type}</p>
        <label>X: 
            <input type="number" value="${imageX}" data-prop="x" onchange="updateElementFromProps('${el.dataset.id}');">
            <button onclick="addConstraint('${el.dataset.id}', 'x')">Add Constraint</button>
        </label><br>
        <label>Y: 
            <input type="number" value="${imageY}" data-prop="y" onchange="updateElementFromProps('${el.dataset.id}');">
            <button onclick="addConstraint('${el.dataset.id}', 'y')">Add Constraint</button>
        </label><br>
        <label>Width: 
            <input type="number" value="${imageWidth}" data-prop="width" onchange="updateElementFromProps('${el.dataset.id}');">
            <button onclick="addConstraint('${el.dataset.id}', 'width')">Add Constraint</button>
        </label><br>
        <label>Height: 
            <input type="number" value="${imageHeight}" data-prop="height" onchange="updateElementFromProps('${el.dataset.id}');">
            <button onclick="addConstraint('${el.dataset.id}', 'height')">Add Constraint</button>
        </label><br>
        <div id="constraint-form"></div>
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

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark') ? 'on' : 'off');
}

function setupResizablePanels() {
    document.querySelectorAll('.resizer').forEach(resizer => {
        const direction = resizer.dataset.resize;
        const isLeft = direction === 'left';

        const panelId = isLeft ? 'left-panel' : 'right-panel';
        const panel = document.getElementById(panelId);

        resizer.addEventListener('mousedown', (e) => {
            function onMouseMove(e) {
                const newWidth = isLeft ? e.clientX : window.innerWidth - e.clientX;
                panel.style.width = newWidth + 'px';
                localStorage.setItem(panelId + '-width', newWidth);
            }

            function onMouseUp() {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    });
}

function restorePanelSizes() {
    ['left-panel', 'right-panel'].forEach(id => {
        const savedWidth = localStorage.getItem(id + '-width');
        if (savedWidth) {
            const panel = document.getElementById(id);
            panel.style.width = savedWidth + 'px';
        }
    });
}

window.addEventListener('resize', drawGrid);
window.addEventListener('load', () => {
    drawGrid();
    sendLayoutUpdate();
});
window.addEventListener('DOMContentLoaded', () => {
    restorePanelSizes();
    setupResizablePanels();

    if (localStorage.getItem('darkMode') === 'on') {
        document.body.classList.add('dark');
    }
});