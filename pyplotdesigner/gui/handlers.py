from fastapi.responses import JSONResponse
from pyplotdesigner.core.engine import Engine
from pyplotdesigner.core.models import Element, SetValueConstraint


def handle_update_layout(data):

    engine = Engine()
    elements = data.get("elements", [])
    constraints = data.get("constraints", [])

    for el in elements:
        e = Element(**el)
        engine.add_element(e)

    for constraint in constraints:
        target = engine.get_element_attribute(constraint.get('target_id', None), constraint.get('target_attr', None))
        source = engine.get_element_attribute(constraint.get('source_id', None), constraint.get('source_attr', None))
        if target is None or source is None:
            continue
        engine.add_constraint(SetValueConstraint(
            target,
            source,
            multiply=constraint.get("multiply", 1.0),
            add_before=constraint.get("add_before", 0.0),
            add_after=constraint.get("add_after", 0.0)
        ))

    action = data.get("action", None)

    if action == "add":
        new_type = data.get("new_type", None)
        if new_type == "axis":
            engine.add_empty_element(element_type="axis")
        else:
            print(new_type, 'not recognized')  # TODO
    elif action is not None:
        print('action not recognized:', action)  # TODO
        for key in data:
            print(key, data[key])

    print('\nEngine info:')  # TODO
    engine.print_info()  # TODO
    print()  # TODO

    try:
        engine.solve(verbose=True)
    except RuntimeError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    return JSONResponse(content={
        "elements": [e.to_dict() for e in engine.elements]
    })
