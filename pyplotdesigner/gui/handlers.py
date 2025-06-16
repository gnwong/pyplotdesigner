from fastapi.responses import JSONResponse
from pyplotdesigner.core.engine import Engine
from pyplotdesigner.core.models import Element, SetValueConstraint


def handle_update_layout(data):

    engine = Engine()
    elements = data.get("elements", [])

    for el in elements:
        e = Element(**el)
        engine.add_element(e)
        
    # TODO handle constraints

    action = data.get("action", None)

    print(data)

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

    return JSONResponse(content={
        "elements": [e.to_dict() for e in engine.elements]
    })
