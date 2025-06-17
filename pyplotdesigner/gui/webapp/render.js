import { canvas, arrowCanvas, borderWidth, setSelectedItem, getSelectedItem, startSelecting, completeSelection } from './shared.js';
import { drawGrid, getImageCoords, getScreenCoords } from './canvas.js';
import { getConstraintDescription, getNameOfElement, getVariableDescription, constraintsEqual } from './constraints.js';
import { sendLayoutUpdate, sendDelete, deleteConstant, deleteConstraint, updateConstant } from './api.js';

export function updateConstantFromProps(id) {
    const inputs = props.querySelectorAll('input[data-prop]');
    const values = {};
    inputs.forEach(input => {
        const prop = input.dataset.prop;
        const parsedValue = parseFloat(input.value);
        values[prop] = isNaN(parsedValue) ? input.value : parsedValue;
    });
    updateConstant(id, values);
    sendLayoutUpdate();
    renderConstantDetail(values);
}

function renderConstantDetail(constant) {
    let props = document.getElementById('props');
    props.innerHTML = `
    <div class="prop-section">
        <h3><em>Properties</em></h3>
        ${createPropBlock({ id: constant.id, label: "Type", value: 'constant', propName: "type", showLock: false, readonly: true })}
        ${createPropBlock({ id: constant.id, label: "Name", value: constant.id, propName: "id", showLock: false, updateFn: "updateConstantFromProps" })}
        ${createPropBlock({ id: constant.id, label: "value", value: constant.value, propName: "value", showLock: false, type: "number", updateFn: "updateConstantFromProps" })}
    </div>
    <div id="constraint-form" class="prop-section">
        <h3><em>Constraints</em></h3>
    </div>
    `;
}

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
        constantItem.addEventListener('click', () => {
            if (!completeSelection({ type: 'constant', id: constant.id })) {
                setActiveFromElement(null);
                renderConstantDetail(constant);
            }
        });        
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
        constraintItem.addEventListener('click', () => {
            setActiveFromId(constraint.target.id)
            openConstraintEditor(constraint);
        });
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
    renderConstantsList(window.constants || []);
    drawConstraintsArrows(elements, window.constraints || []);
    renderConstraintsList(window.constraints || []);
    populatePlotElementsList(elements);
    setActiveFromId(getSelectedItem());
}

function createPropBlock({id, label, value, propName, type = "text", locked = false, showLock = true, readonly = false, updateFn = "updateElementFromProps"}) {
    const lockButton = showLock
        ? `<button onclick="toggleLock('${id}', '${propName}')">${locked ? '🔒' : '🔓'}</button>`
        : '';
    const readonlyAttribute = readonly ? 'readonly' : '';
    return `
      <div class="prop-block">
        <div class="prop-header">
          <label for="${propName}-input">${label}</label>
        </div>
        <div class="prop-row">
          <input id="${propName}-input" type="${type}" value="${value}" data-prop="${propName}" ${readonlyAttribute}
                 onchange="${updateFn}('${id}')">
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
        ${createPropBlock({ id: el.dataset.id, label: "Name", value: el.dataset.text, propName: "text", showLock: false })}
        ${createPropBlock({ id: el.dataset.id, label: "X", value: imageX, propName: "x", type: "number" })}
        ${createPropBlock({ id: el.dataset.id, label: "Y", value: imageY, propName: "y", type: "number" })}
        ${createPropBlock({ id: el.dataset.id, label: "Width", value: imageWidth, propName: "width", type: "number" })}
        ${createPropBlock({ id: el.dataset.id, label: "Height", value: imageHeight, propName: "height", type: "number" })}
    </div>
    <div id="constraint-form" class="prop-section">
        <h3><em>Constraints</em></h3>
    </div>
    `;

    renderElementConstraintsSection(el);
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
    if (el === null) {
        setSelectedItem(null);
    } else {
        el.style.borderColor = 'red';
        setSelectedItem(el.dataset.id);
        updateProps(el);
    }
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
            if (!completeSelection({ type: 'element', id: el.id })) {
                setActiveFromId(el.id);
            }
        });

        listContainer.appendChild(listItem);
    });
}

function createConstraintPropBlock(id, label, propName) {
    const constraint = (window.constraints || []).find(c =>
        c.target?.id === id && c.target?.attr === propName
    );

    const block = document.createElement('div');
    block.className = 'prop-block';

    const header = document.createElement('div');
    header.className = 'prop-header';
    header.innerHTML = `<label for="${propName}-input">${label}</label>`;
    block.appendChild(header);

    const row = document.createElement('div');
    row.className = 'prop-row';
    const list = document.createElement('div');
    list.className = 'list-container';

    // add constraint info if it exists
    if (constraint) {
        const constraintItem = document.createElement('div');
        constraintItem.className = 'list-item';

        const span = document.createElement('span');
        span.textContent = getConstraintDescription(constraint);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => {
            deleteConstraint(constraint);
            sendLayoutUpdate();
        };

        constraintItem.appendChild(span);
        constraintItem.appendChild(deleteButton);

        constraintItem.onclick = () => {
            openConstraintEditor(constraint);
        };

        list.appendChild(constraintItem);
    } else {
        const constraintItem = document.createElement('div');
        constraintItem.className = 'list-item';

        const span = document.createElement('span');
        span.textContent = '(none)';

        const addButton = document.createElement('button');
        addButton.textContent = 'Add Constraint';
        addButton.className = 'add-constraint-button';
        addButton.onclick = () => openConstraintEditor(
            { 
                target: { id: id, attr: propName },
                source: { id: null, attr: null },
                multiply: { id: null, attr: 1 },
                add_before: { id: null, attr: 0 },
                add_after: { id: null, attr: 0 }
            }
        );

        constraintItem.appendChild(span);
        constraintItem.appendChild(addButton);
        list.appendChild(constraintItem);
    }

    row.appendChild(list);
    block.appendChild(row);
    return block;
}

function createConstraintComponentBlock({ name, label, value = null, showSelect = true, readonly = false, type='variable' }) {
    const block = document.createElement('div');
    block.className = 'prop-block';

    const header = document.createElement('div');
    header.className = 'prop-header';
    header.innerHTML = `<label for="${name}-constraint-editor-input">${label}</label>`;
    block.appendChild(header);

    const row = document.createElement('div');
    row.className = 'prop-row';
    const list = document.createElement('div');
    list.className = 'list-container';

    const constraintItem = document.createElement('div');
    constraintItem.className = 'list-item';

    const input = document.createElement('input');
    input.id = `${name}-constraint-editor-input`;
    input.type = 'text';
    input.disabled = readonly;
    input.style.marginRight = '8px';

    // record information about the constraint so far
    const valueString = getVariableDescription(value);

    if (type === 'variable') {
        input.dataset.type = 'variable';
        input.dataset.vid = null;
        input.dataset.attr = value;
        input.value = valueString;
    } else if (type === 'element') {
        input.dataset.type = 'element';
        if (value && value.id) {
            input.dataset.vid = value.id;
            input.dataset.attr = value.attr || null;
            input.value = valueString;
        } else {
            input.dataset.vid = null;
            input.dataset.attr = null;
            input.value = '(none)';
        }
    } else if (type === 'constant') {
        input.dataset.type = 'constant';
        input.dataset.vid = value.id;
        input.dataset.attr = null;
        input.value = value;
    }

    constraintItem.appendChild(input);

    if (showSelect) {
        const selectButton = document.createElement('button');
        selectButton.textContent = 'Select';
        selectButton.className = 'select-target-button';
        
        selectButton.onclick = () => {
            startSelecting((reference) => {
                if (reference.type === 'constant') {
                    input.dataset.type = 'constant';
                    input.dataset.vid = reference.id;
                    input.dataset.attr = null;
                    input.value = `${reference.id}`;
                } else if (reference.type === 'element') {
                    let attr = prompt("Enter attribute (x, y, width, height, left, right, top, bottom):", "x");
                    input.dataset.type = 'element';
                    input.dataset.vid = reference.id;
                    input.dataset.attr = attr;
                    input.value = `${getNameOfElement(reference.id)}.${attr}`;
                }
            });
        };

        constraintItem.appendChild(selectButton);
    }

    list.appendChild(constraintItem);
    row.appendChild(list);
    block.appendChild(row);
    return block;
}

function extractConstraintComponent(input) {
    const type = input.dataset.type;
    const vid = input.dataset.vid;
    const attr = input.dataset.attr;

    if (type === 'variable') {
        const val = parseFloat(input.value);
        return isNaN(val) ? 0 : val;
    }

    if (type === 'element') {
        if (vid === 'null' || vid === '' || vid === null) {
            return { };
        }
        return { id: vid, attr: attr || 'value' };
    }

    if (type === 'constant') {
        if (vid === 'null' || vid === '' || vid === null) {
            return { };
        }
        return { id: vid };
    }

    return null;
}

function openConstraintEditor(constraint) {

    const editor = document.getElementById('constraint-editor');
    editor.innerHTML = '';

    const info = document.createElement('div');
    info.className = 'constraint-info';
    info.innerHTML = '<em>target ← a + m * (source + b)</em>';
    editor.appendChild(info);
    
    editor.appendChild(createConstraintComponentBlock({ name: 'target', label: 'Target', type: 'element',
        value: constraint.target, showSelect: false, readonly: true }));
    editor.appendChild(createConstraintComponentBlock({ name: 'source', label: 'Source', type: 'element',
        value: constraint.source, readonly: true }));
    editor.appendChild(createConstraintComponentBlock({ name: 'add-after', label: 'a', 
        value: constraint.add_after }));
    editor.appendChild(createConstraintComponentBlock({ name: 'multiply', label: 'm', 
        value: constraint.multiply }));
    editor.appendChild(createConstraintComponentBlock({ name: 'add-before', label: 'b', 
        value: constraint.add_before }));

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Apply';
    submitButton.className = 'add-constraint-button';
    submitButton.onclick = () => {

        const targetInput = document.querySelector('#target-constraint-editor-input');
        const sourceInput = document.querySelector('#source-constraint-editor-input');
        const addBeforeInput = document.querySelector('#add-before-constraint-editor-input');
        const multiplyInput = document.querySelector('#multiply-constraint-editor-input');
        const addAfterInput = document.querySelector('#add-after-constraint-editor-input');

        const newConstraint = {
            target: extractConstraintComponent(targetInput),
            source: extractConstraintComponent(sourceInput),
            add_before: extractConstraintComponent(addBeforeInput),
            multiply: extractConstraintComponent(multiplyInput),
            add_after: extractConstraintComponent(addAfterInput)
        };

        // actually push the constraint now
        window.constraints = window.constraints || [];
        const existingIndex = window.constraints.findIndex(c => constraintsEqual(c, constraint));

        if (existingIndex !== -1) {
            window.constraints[existingIndex] = newConstraint;
        } else {
            window.constraints.push(newConstraint);
        }

        sendLayoutUpdate();
    };

    editor.appendChild(submitButton);
}

function addPresetConstraint(elementId, type) {

    switch (type) {
        case 'aspectRatioH':
            let ratioH = prompt("Enter aspect ratio (e.g., 0.5 for H = 0.5×W):", "1");
            if (!ratioH || isNaN(parseFloat(ratioH))) return;
            window.constraints.push({
                target: { id: elementId, attr: 'height' },
                source: { id: elementId, attr: 'width' },
                multiply: parseFloat(ratioH),
                add_before: 0,
                add_after: 0
              });
            break;
        case 'aspectRatioW':
            let ratioW = prompt("Enter aspect ratio (e.g., 0.5 for W = 0.5×H):", "1");
            if (!ratioW || isNaN(parseFloat(ratioW))) return;
            window.constraints.push({
                target: { id: elementId, attr: 'width' },
                source: { id: elementId, attr: 'height' },
                multiply: parseFloat(ratioW),
                add_before: 0,
                add_after: 0
              });
            break;
        case 'matchWidth':
            break;
        case 'matchHeight':
            break;
    }

    sendLayoutUpdate();
}

function renderElementConstraintsSection(el) {

    const container = document.getElementById('constraint-form');
    if (!container) return;
    
    container.innerHTML = '';
    const heading = document.createElement('h3');
    heading.innerHTML = '<em>Constraints</em>';
    container.appendChild(heading);

    container.appendChild(createConstraintPropBlock(el.dataset.id, 'X', 'x'));
    container.appendChild(createConstraintPropBlock(el.dataset.id, 'Y', 'y'));
    container.appendChild(createConstraintPropBlock(el.dataset.id, 'Width', 'width'));
    container.appendChild(createConstraintPropBlock(el.dataset.id, 'Height', 'height'));

    const presetSection = document.createElement('div');
    presetSection.className = 'constraint-add-buttons';

    const presetHeading = document.createElement('h4');
    presetHeading.textContent = 'Apply Preset Constraint';
    presetSection.appendChild(presetHeading);

    const presetRow = document.createElement('div');
    presetRow.className = 'preset-row';

    const presets = [
        { label: 'Aspect Ratio (Width → Height)', type: 'aspectRatioH' },
        { label: 'Aspect Ratio (Height → Width)', type: 'aspectRatioW' },
        /*{ label: 'Match Width', type: 'matchWidth' },
        { label: 'Match Height', type: 'matchHeight' },
        { label: 'Center Horizontally', type: 'centerX' },
        { label: 'Center Vertically', type: 'centerY' }*/
    ];

    presets.forEach(preset => {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '4px';
    
        const button = document.createElement('button');
        button.className = 'add-constraint-button';
        button.textContent = preset.label;
        button.onclick = () => addPresetConstraint(el.dataset.id, preset.type);
    
        wrapper.appendChild(button);
        presetRow.appendChild(wrapper);
    });

    presetSection.appendChild(presetRow);
    container.appendChild(presetSection);

    const editorSection = document.createElement('div');

    const editorHeading = document.createElement('h4');
    editorHeading.textContent = 'Custom Constraint Editor';
    editorSection.appendChild(editorHeading);

    const constraintRow = document.createElement('div');
    constraintRow.className = 'preset-row';
    constraintRow.id = 'constraint-editor';

    editorSection.appendChild(constraintRow);
    container.appendChild(editorSection);
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

    // TODO, clean this up and draw arrows where actually desired

    return;

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
