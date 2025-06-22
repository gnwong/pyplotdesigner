from fastapi.responses import JSONResponse
from pyplotdesigner.core.design import Design
from pyplotdesigner.core.models import SetValueConstraint


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
                try:
                    constv = design.get_constant_value(id)
                except ValueError:
                    return None
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
        design.add_element(**el)

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

        # other fields could be element attributes, numeric values, constants, or None
        multiply = _get_attribute_or_value(multiply, 1.)
        add_before = _get_attribute_or_value(add_before, 0.)
        add_after = _get_attribute_or_value(add_after, 0.)

        # get new constraint
        design.add_constraint(target=target, source=source, multiply=multiply,
                              add_before=add_before, add_after=add_after)

    action = data.get("action", None)
    action_error_message = None

    if action == "add":
        new_type = data.get("new_type", None)
        if new_type == "axis":
            design.add_empty_element(element_type="axis")
        elif new_type == "constant":
            design.add_constant()
        else:
            action_error_message = f'action:add {new_type} not recognized'
    elif action == "delete":
        element_id = data.get("element_id", None)
        design.remove_element_by_id(element_id)
    elif action == "update_constant":
        constant_id = data.get("id", None)
        constant_data = data.get("constant", None)
        design.update_constant(constant_id, constant_data)
    elif action is not None:
        action_error_message = f'action {action} not recognized'

    if verbose:
        print('Design info:')
        design.print_info()

    # try to solve, returning error messsage in response if it fails
    error_message = None

    try:
        design.solve()
    except RuntimeError as e:
        error_message = dict(content=str(e))

    response = {
        "elements": [e.to_dict() for e in design.elements],
        "constraints": [c.to_dict() for c in design.constraints],
        "constants": [c.to_dict() for c in design.constants]
    }

    if error_message or action_error_message:
        response['error'] = []
    if error_message:
        response['error'].append(error_message)
    if action_error_message:
        response['error'].append(action_error_message)

    return JSONResponse(content=response)
