import { canvas, setSelectedItem, setScale, setFigureSize } from './shared.js';
import { restorePanelSizes, toggleDarkMode, setupResizablePanels } from './ui.js';
import { drawGrid, openLayoutModal } from './canvas.js';
import { sendAdd, sendLayoutUpdate, getLayoutPayload, processReceivedPayload } from './api.js'
import { renderLayout, updateElementFromProps } from './render.js'
import { updateConstantFromProps } from './constants.js';

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

function openImportExportModal() {
    const modal = document.createElement('div');
    modal.className = 'import-export-modal';

    const textarea = document.createElement('textarea');
    textarea.className = 'import-export-textarea';
    textarea.value = btoa(JSON.stringify(getLayoutPayload()));

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => modal.remove();

    const importButton = document.createElement('button');
    importButton.textContent = 'Import';
    importButton.onclick = () => {
        try {
            const data = JSON.parse(atob(textarea.value));
            processReceivedPayload(data);
            modal.remove();
        } catch (err) {
            alert('Unable to load layout: ' + err.message);
        }
    };

    const controls = document.createElement('div');
    controls.className = 'import-export-controls';
    controls.appendChild(importButton);
    controls.appendChild(closeButton);

    modal.appendChild(textarea);
    modal.appendChild(controls);
    document.body.appendChild(modal);
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
window.openImportExportModal = openImportExportModal;
window.openLayoutModal = openLayoutModal;

// expose functions for modifying layout and constraints
window.toggleLock = toggleLock;
window.updateElementFromProps = updateElementFromProps;
window.updateConstantFromProps = updateConstantFromProps;

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
        setScale(parsed.viewport?.scale || 100);
        setFigureSize(parsed.viewport?.figureWidth || 7, parsed.viewport?.figureHeight || 5);
        renderLayout(parsed.elements || []);
    } else {
        sendLayoutUpdate();
    }
});
