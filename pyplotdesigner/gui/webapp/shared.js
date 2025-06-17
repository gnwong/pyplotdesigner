export const canvas = document.getElementById('canvas');
export const gridCanvas = document.getElementById('grid');
export const arrowCanvas = document.getElementById('arrows');

export const scale = 200;
export const borderWidth = 2;
export const offsetX = scale / 2;
export const offsetY = scale / 2;

let selectedItem = null;

export function setSelectedItem(id) {
    selectedItem = id;
}

export function getSelectedItem() {
    return selectedItem;
}
