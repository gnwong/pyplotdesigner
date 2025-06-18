import { sendLayoutUpdate, updateConstant } from './api.js';

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