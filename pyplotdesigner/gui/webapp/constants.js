import { updateConstant } from './api.js';

export function updateConstantFromProps(id) {
    const props = document.getElementById('props');
    if (!props) {
        return;
    }

    const inputs = props.querySelectorAll('input[data-prop]');
    const values = {};
    inputs.forEach(input => {
        const prop = input.dataset.prop;
        const parsedValue = parseFloat(input.value);
        values[prop] = isNaN(parsedValue) ? input.value : parsedValue;
    });

    updateConstant(id, values);

    // Re-select the updated constant so the inspector is rebuilt with fresh handlers.
    const updatedId = String(values.id ?? id);
    const updatedItem = Array.from(document.querySelectorAll('#constants-list .list-item')).find((item) => {
        return item instanceof HTMLElement && item.dataset.id === updatedId;
    });
    if (updatedItem instanceof HTMLElement) {
        updatedItem.click();
    }
}
