function getNameOfElement(id) {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
        return element.dataset.text;
    }
    return id;
}

function getVariableDescription(varinfo) {
    if (!varinfo || typeof varinfo !== 'object') return 0;
    if (varinfo.id === null) {
      return varinfo.attr != null ? varinfo.attr : 0;
    } else {
      return `${getNameOfElement(varinfo.id)}.${varinfo.attr || 'null'}`;
    }
}

export function getConstraintDescription(constraint) {
    const target = getVariableDescription(constraint.target);
    const source = getVariableDescription(constraint.source);
    const multiply = getVariableDescription(constraint.multiply);
    const add_before = getVariableDescription(constraint.add_before);
    const add_after = getVariableDescription(constraint.add_after);

    let expr = '';
    if (add_before !== 0 && source !== 0) expr = `(${expr} + ${add_before})`;
    else if (add_before !== 0) expr = `${add_before}`;
    else if (source !== 0) expr = `${source}`;
    if (multiply !== 1) expr = `${expr} × ${multiply}`;
    if (add_after !== 0) expr = `${expr} + ${add_after}`;
  
    return `${target} ← ${expr}`;
}

export function constraintsEqual(c1, c2) {
    if (c1.target.id !== c2.target.id || c1.target.attr !== c2.target.attr) return false;
    if (c1.source.id !== c2.source.id || c1.source.attr !== c2.source.attr) return false;
    if (c1.multiply.id !== c2.multiply.id || c1.multiply.attr !== c2.multiply.attr) return false;
    if (c1.add_before.id !== c2.add_before.id || c1.add_before.attr !== c2.add_before.attr) return false;
    if (c1.add_after.id !== c2.add_after.id || c1.add_after.attr !== c2.add_after.attr) return false;
    return true;
}