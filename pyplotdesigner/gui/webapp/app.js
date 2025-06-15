let canvas = document.getElementById('canvas');
let gridCanvas = document.getElementById('grid');
let selectedItem = null;

function drawGrid() {
    const ctx = gridCanvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    gridCanvas.width = w;
    gridCanvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;

    for (let x = 0; x < w; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    // draw main axes
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
}

function sendAdd(type) {
    fetch('/api/update_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', type: type })
    })
    .then(res => res.json())
    .then(data => renderLayout(data.elements));
}

async function sendLayoutUpdate() {
    const layout = Array.from(canvas.children)
        .filter(el => el.classList.contains('draggable'))
        .map(el => ({
            id: el.dataset.id,
            type: el.dataset.type,
            x: parseInt(el.style.left, 10),
            y: parseInt(el.style.top, 10),
            width: parseInt(el.style.width, 10),
            height: parseInt(el.style.height, 10),
            text: el.innerText
        }));

    const response = await fetch('/api/update_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements: layout })
    });

    const newLayout = await response.json();
    renderLayout(newLayout.elements);
}

function renderLayout(elements) {
    const existingGrid = document.getElementById('grid');
    canvas.innerHTML = '';
    canvas.appendChild(existingGrid);
    drawGrid();

    elements.forEach(el => {
        const div = document.createElement('div');
        div.classList.add('draggable');
        div.dataset.type = el.type;
        div.dataset.id = el.id;
        div.innerText = el.text || el.type;
        div.style.left = el.x + 'px';
        div.style.top = el.y + 'px';
        div.style.width = el.width + 'px';
        div.style.height = el.height + 'px';
        makeDraggable(div);
        canvas.appendChild(div);
    });
}

function makeDraggable(el) {
    el.onmousedown = function (e) {
        selectedItem = el;
        updateProps(el);
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

function updateProps(el) {
    let props = document.getElementById('props');
    props.innerHTML = `
        <p>ID: ${el.dataset.id}</p>
        <p>Type: ${el.dataset.type}</p>
        <label>X: <input type="number" value="${el.offsetLeft}" onchange="updateStyle('left', this.value)"></label><br>
        <label>Y: <input type="number" value="${el.offsetTop}" onchange="updateStyle('top', this.value)"></label><br>
        <label>Width: <input type="number" value="${el.offsetWidth}" onchange="updateStyle('width', this.value)"></label><br>
        <label>Height: <input type="number" value="${el.offsetHeight}" onchange="updateStyle('height', this.value)"></label>
    `;
}

function updateStyle(prop, value) {
    if (!selectedItem) return;
    selectedItem.style[prop] = value + 'px';
    updateProps(selectedItem);
    sendLayoutUpdate();
}

window.addEventListener('resize', drawGrid);
window.addEventListener('load', () => {
    drawGrid();
    sendLayoutUpdate();
});
