from fastapi.responses import JSONResponse
from pyplotdesigner.core.design import Design
from pyplotdesigner.core.models import Element, SetValueConstraint


def handle_update_layout(data, verbose=False):

    # TODO: disallow constraints with the same target

    def _get_attribute_or_value(val, default):
        """
        Helper function to get the value of an attribute or return the value itself.
        """
        if isinstance(val, dict):
            id = val.get('id', None)
            attr = val.get('attr', None)
            if id is None:
                return float(attr)
            if attr is None:
                constv = design.get_constant_value(id)
                return constv if constv is not None else default
            elattr = design.get_element_attribute(id, attr)
            return elattr if elattr is not None else default
        elif isinstance(val, (int, float)):
            return float(val)
        return default

    design = Design()
    elements = data.get("elements", [])
    constraints = data.get("constraints", [])
    constants = data.get("constants", [])

    for el in elements:
        e = Element(**el)
        design.add_element(e)

    for constant in constants:
        id = constant.get('id', None)
        value = constant.get('value', None)
        if id is None or value is None:
            continue
        design.add_constant(id=id, value=value)

    for constraint in constraints:

        target = constraint.get('target', None)
        source = constraint.get('source', None)
        multiply = constraint.get('multiply', None)
        add_before = constraint.get('add_before', None)
        add_after = constraint.get('add_after', None)

        # all constraints must have a target
        if target is None:
            continue
        target = design.get_element_attribute(target.get('id', None),
                                              target.get('attr', None))

        # source is either an element attribute or None
        if source is not None:
            source = design.get_element_attribute(source.get('id', None),
                                                  source.get('attr', None))

        # other fields could be element attributes, numeric values, or None
        multiply = _get_attribute_or_value(multiply, 1.)
        add_before = _get_attribute_or_value(add_before, 0.)
        add_after = _get_attribute_or_value(add_after, 0.)

        # get new constraint
        new_constraint = SetValueConstraint(
            target, source, multiply=multiply, add_before=add_before, add_after=add_after
        )

        design.add_constraint(new_constraint)

    action = data.get("action", None)

    if action == "add":
        new_type = data.get("new_type", None)
        if new_type == "axis":
            design.add_empty_element(element_type="axis")
        elif new_type == "constant":
            design.add_constant()
        else:
            print('action:add', new_type, 'not recognized')
    elif action == "delete":
        element_id = data.get("element_id", None)
        design.remove_element_by_id(element_id)
    elif action == "update_constant":
        constant_id = data.get("id", None)
        constant_data = data.get("constant", None)
        design.update_constant(constant_id, constant_data)
    elif action is not None:
        print('action not recognized:', action)
        for key in data:
            print(key, data[key])

    if verbose:
        print('Design info:')
        design.print_info()

    try:
        design.solve()
    except RuntimeError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    return JSONResponse(content={
        "elements": [e.to_dict() for e in design.elements],
        "constraints": [c.to_dict() for c in design.constraints],
        "constants": [c.to_dict() for c in design.constants]
    })
