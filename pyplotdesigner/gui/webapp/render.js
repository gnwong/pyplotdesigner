import { canvas, arrowCanvas, borderWidth, setSelectedItem, getSelectedItem } from './shared.js';
import { drawGrid, getImageCoords, getScreenCoords } from './canvas.js';
import { getConstraintDescription, constraintsEqual } from './constraints.js';
import { sendLayoutUpdate, sendDelete, deleteConstant, deleteConstraint } from './api.js';

export function renderConstantsList(constants) {
    const constantsContainer = document.getElementById('constants-list');
    constantsContainer.innerHTML = '';

    constants.forEach(constant => {
        const constantItem = document.createElement('div');
        constantItem.className = 'list-item';
        constantItem.innerHTML = `
            <span>${constant.id} = ${constant.value}</span>
        `;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => deleteConstant(constant);
        constantItem.appendChild(deleteButton);
        constantsContainer.appendChild(constantItem);
    });
}

export function renderConstraintsList(constraints) {
    const constraintsContainer = document.getElementById('constraints-list');
    constraintsContainer.innerHTML = '';

    constraints.forEach(constraint => {
        const constraintItem = document.createElement('div');
        constraintItem.className = 'list-item';
        constraintItem.innerHTML = `
            <span>${getConstraintDescription(constraint)}</span>
        `;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => deleteConstraint(constraint);
        constraintItem.appendChild(deleteButton);
        constraintsContainer.appendChild(constraintItem);
    });
}

export function renderLayout(elements) {
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
        div.dataset.text = el.text || '';
        div.innerText = el.text || el.type;
        div.style.left = screenX + 'px';
        div.style.top = screenY + 'px';
        div.style.width = screenWidth - 2 * borderWidth + 'px';
        div.style.height = screenHeight - 2 * borderWidth + 'px';
        div.style.padding = '0px';
        div.style.borderWidth = borderWidth + 'px';
        div.style.borderColor = (div.dataset.id == getSelectedItem()) ? 'red' : 'black';
        makeDraggable(div);
        canvas.appendChild(div);
    });

    // rerender constraints and lists/properties
    drawConstraintsArrows(elements, window.constraints || []);
    renderConstraintsList(window.constraints || []);
    renderConstantsList(window.constants || []);
    populatePlotElementsList(elements);
    setActiveFromId(getSelectedItem());
}

function createPropBlock({ id, label, value, propName, type = "text", locked = false, showLock = true, readonly = false }) {
    const lockButton = showLock ? `<button onclick="toggleLock('${id}', '${propName}')">${locked ? '🔒' : '🔓'}</button>` : '';
    const readonlyAttribute = readonly ? 'readonly' : '';
    return `
      <div class="prop-block">
        <div class="prop-header">
          <label for="${propName}-input">${label}</label>
        </div>
        <div class="prop-row">
          <input id="${propName}-input" type="${type}" value="${value}" data-prop="${propName}" ${readonlyAttribute} onchange="updateElementFromProps('${id}')">
          ${lockButton}
        </div>
      </div>
    `;
}

function updateProps(el) {
    
    const screenX = parseInt(el.style.left, 10);
    const screenY = parseInt(el.style.top, 10);
    const screenWidth = parseInt(el.style.width, 10) + 2 * borderWidth;
    const screenHeight = parseInt(el.style.height, 10) + 2 * borderWidth;
    const { imageX, imageY, imageWidth, imageHeight } = getImageCoords(screenX, screenY, screenWidth, screenHeight);

    let props = document.getElementById('props');
    props.innerHTML = `
    <div class="prop-section">
        <h3><em>Properties</em></h3>
        ${createPropBlock({ id: el.dataset.id, label: "Type", value: el.dataset.type, propName: "type", showLock: false, readonly: true })}
        ${createPropBlock({ id: el.dataset.id, label: "Name", value: el.dataset.text, propName: "text" })}
        ${createPropBlock({ id: el.dataset.id, label: "X", value: imageX, propName: "x", type: "number" })}
        ${createPropBlock({ id: el.dataset.id, label: "Y", value: imageY, propName: "y", type: "number" })}
        ${createPropBlock({ id: el.dataset.id, label: "Width", value: imageWidth, propName: "width", type: "number" })}
        ${createPropBlock({ id: el.dataset.id, label: "Height", value: imageHeight, propName: "height", type: "number" })}
    </div>
    <div id="constraint-form" class="prop-section">
        <h3><em>Constraints</em></h3>
    </div>
    `;
}

export function updateElementFromProps(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    const props = document.getElementById('props');

    const inputs = props.querySelectorAll('input[data-prop]');
    const values = {};
    inputs.forEach(input => {
        const prop = input.dataset.prop;
        const parsedValue = parseFloat(input.value);
        values[prop] = isNaN(parsedValue) ? input.value : parsedValue;
    });

    const { screenX, screenY, screenWidth, screenHeight } = getScreenCoords(
        values.x, values.y, values.width, values.height
    );

    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;
    el.style.width = `${screenWidth - 2 * borderWidth}px`;
    el.style.height = `${screenHeight - 2 * borderWidth}px`;

    el.dataset.text = values.text || el.dataset.text;

    sendLayoutUpdate();
}

function setActiveFromId(elementId) {
    const el = document.querySelector(`[data-id="${elementId}"]`);
    if (el) {
        setActiveFromElement(el);
    }
}

function setActiveFromElement(el) {
    const all = document.querySelectorAll('.draggable');
    all.forEach(div => div.style.borderColor = 'black');
    el.style.borderColor = 'red';
    setSelectedItem(el.dataset.id);
    updateProps(el);
}

function populatePlotElementsList(elements) {
    const listContainer = document.getElementById('elements-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    elements.forEach(el => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';

        listItem.innerHTML = `
            <div class="element-entry">
                <span><strong>${el.type}</strong>: ${el.text || '(Unnamed)'}</span>
            </div>
        `;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => sendDelete(el.id);
        listItem.appendChild(deleteButton);

        listItem.addEventListener('click', () => {
            setActiveFromId(el.id);
        });

        listContainer.appendChild(listItem);
    });
}

function makeDraggable(el) {
    el.onmousedown = function (e) {
        setActiveFromElement(el);
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
        switch (attr) {
            case 'x': return [screenX, screenY + screenHeight / 2];
            case 'y': return [screenX + screenWidth / 2, screenY];
            case 'width': return [screenX + screenWidth, screenY + screenHeight / 2];
            case 'height': return [screenX + screenWidth / 2, screenY + screenHeight];
            default: return [screenX, screenY];
        }
    }

    function drawArrow(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 5 * Math.cos(angle - Math.PI / 6), y2 - 5 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - 5 * Math.cos(angle + Math.PI / 6), y2 - 5 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }

    for (const c of constraints) {
        const target = elements.find(e => e.id === c.target?.id);
        if (!target || !c.target.attr) continue;
        const [x2, y2] = getAttrPos(target, c.target.attr);

        const sources = [c.source, c.multiply, c.add_before, c.add_after];
        for (const ref of sources) {
            if (ref?.id) {
                const source = elements.find(e => e.id === ref.id);
                if (!source || !ref.attr) continue;
                const [x1, y1] = getAttrPos(source, ref.attr);
                drawArrow(x1, y1, x2, y2);
            }
        }
    }
}
