import { canvas, arrowCanvas, scale, borderWidth, offsetX, offsetY, setSelectedItem, getSelectedItem } from './shared.js';
import { restorePanelSizes, toggleDarkMode, setupResizablePanels } from './ui.js';
import { drawGrid, getImageCoords, getScreenCoords } from './canvas.js';
import { getConstraintDescription,  } from './constraints.js';
import { getLayoutPayload, sendAdd, sendDelete, sendLayoutUpdate, saveState } from './api.js'
import { renderConstantsList, renderConstraintsList, renderLayout, updateElementFromProps } from './render.js'

function shouldAutosave() {
    return localStorage.getItem('autosave-enabled') === 'true';
}
  
function updateAutosaveButtonUI() {
    const btn = document.getElementById('autosave-toggle');
    const enabled = shouldAutosave();
    btn.textContent = `Autosave: ${enabled ? 'ON' : 'OFF'}`;
    btn.classList.toggle('active', enabled);
}

function toggleAutosave() {
    localStorage.setItem('autosave-enabled', shouldAutosave() ? 'false' : 'true');
    updateAutosaveButtonUI();
}

function resetLayout() {
    localStorage.removeItem('pyplotdesigner-state');
    location.reload();
}

canvas.addEventListener('click', (e) => {
    if (e.target === canvas || e.target.id === 'grid') {
        document.querySelectorAll('.draggable').forEach(div => div.style.borderColor = 'black');
        setSelectedItem(null);
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
        target: { id: targetId, attr: targetAttr },
        source: { id: document.getElementById('constraint-source-id').value, attr: document.getElementById('constraint-source-attr').value },
        multiply: parseFloat(document.getElementById('constraint-multiply').value),
        add_before: parseFloat(document.getElementById('constraint-before').value),
        add_after: parseFloat(document.getElementById('constraint-after').value)
    };

    window.constraints = window.constraints || [];
    window.constraints.push(constraint);
    sendLayoutUpdate();
}

function toggleLock(id, attr) {
    const selector = `[data-id="${id}"] [data-prop="${attr}"]`;
    const input = document.querySelector(selector) || document.querySelector(`#props input[data-prop="${attr}"]`);
    if (input && input.type === 'number') {
        createConstraintForLock(id, attr, parseFloat(input.value));
    }
}

function createConstraintForLock(targetId, targetAttr, value) {
    const constraint = {
        target: { id: targetId, attr: targetAttr },
        source: { id: null, attr: null },
        multiply: { id: null, attr: 1 },
        add_before: { id: null, attr: value },
        add_after: { id: null, attr: 0 }
    };

    window.constraints = window.constraints || [];
    window.constraints.push(constraint);
    sendLayoutUpdate();
}

// expose functions required for global interface
window.sendAdd = sendAdd;
window.toggleDarkMode = toggleDarkMode;
window.resetLayout = resetLayout;
window.toggleAutosave = toggleAutosave;

// expose functions for modifying layout and constraints
window.toggleLock = toggleLock;
window.updateElementFromProps = updateElementFromProps;

// attach event listeners
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
    
    if (shouldAutosave()) {
        document.getElementById('autosave-toggle').checked = true;
    }
    updateAutosaveButtonUI();

    // possibly restore state
    const saved = localStorage.getItem('pyplotdesigner-state');
    if (saved) {
        const parsed = JSON.parse(saved);
        window.constraints = parsed.constraints || [];
        window.constants = parsed.constants || [];
        renderLayout(parsed.elements || []);
    } else {
        sendLayoutUpdate();
    }
});
