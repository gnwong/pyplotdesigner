const DEFAULT_STATUS = Object.freeze({
    text: 'Ready',
    level: 'ready'
});

const DEFAULT_TOAST_TIMEOUT_MS = 2500;

let stickyStatus = { ...DEFAULT_STATUS };
let transientStatus = null;
let transientTimer = null;
let activeMode = null;
let modeCounter = 0;
let isInitialized = false;

function getStatusElements() {
    return {
        bar: document.getElementById('status-bar'),
        text: document.getElementById('status-text'),
        action: document.getElementById('status-action')
    };
}

function clearTransientTimer() {
    if (transientTimer) {
        clearTimeout(transientTimer);
        transientTimer = null;
    }
}

function normalizeStatus(statusOrText, options = {}) {
    if (typeof statusOrText === 'string') {
        return {
            text: statusOrText,
            ...options
        };
    }
    return {
        ...(statusOrText || {}),
        ...options
    };
}

function getDisplayStatus() {
    if (stickyStatus.level === 'error') {
        return stickyStatus;
    }

    if (activeMode) {
        return {
            text: activeMode.text,
            level: 'mode',
            action: activeMode.cancelable ? {
                label: activeMode.cancelLabel,
                onClick: cancelActiveMode
            } : null
        };
    }

    if (transientStatus) {
        return transientStatus;
    }

    return stickyStatus;
}

function renderStatusBar() {
    const { bar, text, action } = getStatusElements();
    if (!bar || !text || !action) {
        return;
    }

    const displayStatus = getDisplayStatus();
    text.textContent = `Status: ${displayStatus.text}`;
    bar.dataset.level = displayStatus.level;

    if (displayStatus.action) {
        action.textContent = displayStatus.action.label;
        action.onclick = displayStatus.action.onClick;
        action.style.display = 'inline-block';
    } else {
        action.onclick = null;
        action.style.display = 'none';
    }
}

export function initializeStatusBar() {
    if (!isInitialized) {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                cancelActiveMode();
            }
        });
        isInitialized = true;
    }

    renderStatusBar();
}

export function setStatus(statusOrText, options = {}) {
    const status = normalizeStatus(statusOrText, options);
    if (!status.text) {
        return;
    }

    if (status.sticky === false) {
        transientStatus = {
            text: status.text,
            level: status.level || 'info'
        };
        renderStatusBar();

        clearTransientTimer();
        const timeoutMs = status.timeoutMs ?? DEFAULT_TOAST_TIMEOUT_MS;
        if (timeoutMs > 0) {
            transientTimer = setTimeout(() => {
                transientStatus = null;
                transientTimer = null;
                renderStatusBar();
            }, timeoutMs);
        }
        return;
    }

    stickyStatus = {
        text: status.text,
        level: status.level || 'info'
    };
    renderStatusBar();
}

export function showToast(text, options = {}) {
    setStatus(text, {
        ...options,
        sticky: false
    });
}

export function clearStatus() {
    stickyStatus = { ...DEFAULT_STATUS };
    transientStatus = null;
    clearTransientTimer();
    renderStatusBar();
}

export function enterMode({
    id = `mode-${++modeCounter}`,
    text = 'Waiting for input.',
    cancelable = true,
    cancelLabel = 'Cancel',
    onCancel = null
} = {}) {
    activeMode = {
        id,
        text,
        cancelable,
        cancelLabel,
        onCancel
    };
    renderStatusBar();
    return id;
}

export function exitMode(id, { doneText = null, doneLevel = 'info', timeoutMs } = {}) {
    if (!activeMode) {
        return false;
    }
    if (id && activeMode.id !== id) {
        return false;
    }

    activeMode = null;
    renderStatusBar();

    if (doneText) {
        showToast(doneText, { level: doneLevel, timeoutMs });
    }
    return true;
}

export function cancelActiveMode() {
    if (!activeMode || !activeMode.cancelable) {
        return false;
    }

    const modeToCancel = activeMode;
    activeMode = null;
    renderStatusBar();

    if (typeof modeToCancel.onCancel === 'function') {
        modeToCancel.onCancel();
    }
    return true;
}
