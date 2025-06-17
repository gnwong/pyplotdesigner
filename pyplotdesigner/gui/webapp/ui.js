export function restorePanelSizes() {
    ['left-panel', 'right-panel'].forEach(id => {
        const savedWidth = localStorage.getItem(id + '-width');
        if (savedWidth) {
            const panel = document.getElementById(id);
            panel.style.width = savedWidth + 'px';
        }
    });
}

export function toggleDarkMode() {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark') ? 'on' : 'off');
}

export function setupResizablePanels() {
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
