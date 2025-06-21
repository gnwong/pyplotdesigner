import json
from pyplotdesigner.gui.handlers import handle_update_layout

base_request_data = {
    'elements': [
        {'id': 'axis-0', 'type': 'axis', 'x': 0.2, 'y': 0.3, 'width': 1, 'height': 1, 'text': 'left_panel'},
        {'id': 'axis-1', 'type': 'axis', 'x': 2., 'y': 1.795, 'width': 0.5, 'height': 1, 'text': 'right_panel'}
    ],
    'constraints': [
        {'target': {'id': 'axis-1', 'attr': 'x'}, 'source': {'id': 'axis-0', 'attr': 'right'}, 'multiply': {'id': None, 'attr': 1}, 'add_before': {'id': None, 'attr': 0}, 'add_after': {'id': 'spacing', 'attr': None}}, 
        {'target': {'id': 'axis-1', 'attr': 'y'}, 'source': {'id': 'axis-0', 'attr': 'top'}, 'multiply': {'id': None, 'attr': 1}, 'add_before': {'id': None, 'attr': 0}, 'add_after': {'id': None, 'attr': 0}},
        {'target': {'id': 'axis-0', 'attr': 'x'}, 'source': {'id': None, 'attr': None}, 'multiply': {'id': None, 'attr': 1}, 'add_before': {'id': None, 'attr': 0.2}, 'add_after': {'id': None, 'attr': 0}},
        {'target': {'id': 'axis-0', 'attr': 'y'}, 'source': {'id': None, 'attr': None}, 'multiply': {'id': None, 'attr': 1}, 'add_before': {'id': None, 'attr': 0}, 'add_after': {'id': 'y_offset', 'attr': None}}
    ],
    'constants': [
        {'id': 'y_offset', 'value': 0.3},
        {'id': 'spacing', 'value': 0.12}
    ],
    'viewport': {'width': 2252, 'height': 1000, 'scale': 200, 'figureWidth': 7, 'figureHeight': 5}
}


def test_add():

    # constraint additions are handled by the frontend

    # test adding a new axis
    request = base_request_data.copy()
    request['action'] = "add"
    request['new_type'] = "axis"

    response_data = handle_update_layout(request)
    layout_data = json.loads(response_data.body.decode('utf-8'))

    assert 'error' not in layout_data
    elements = layout_data.get("elements", [])
    assert len(elements) == 3

    # check that the new axis was added
    new_axis = next((el for el in elements if el['id'] == 'axis-2'), None)
    assert new_axis is not None
    assert new_axis['type'] == 'axis'
    assert new_axis['x'] == 0.2
    assert new_axis['y'] == 0.2
    assert new_axis['width'] == 1
    assert new_axis['height'] == 1
    assert new_axis['text'] == 'axis-2'

    # test adding a new constant
    request = base_request_data.copy()
    request['action'] = "add"
    request['new_type'] = "constant"

    response_data = handle_update_layout(request)
    layout_data = json.loads(response_data.body.decode('utf-8'))

    assert 'error' not in layout_data
    constants = layout_data.get("constants", [])
    assert len(constants) == 3

    # check that the new constant was added
    new_constant = next((c for c in constants if c['id'] == 'constant0'), None)
    assert new_constant is not None
    assert new_constant['id'] == 'constant0'
    assert new_constant['value'] == 0.0


def test_update():

    # constraint and element updates are handled by the frontend

    # test update constant
    request = base_request_data.copy()
    request['action'] = "update_constant"
    request['id'] = "y_offset"
    request['constant'] = {'type': "constant", 'id': "y_offset", 'value': 0.1}

    response_data = handle_update_layout(request)
    layout_data = json.loads(response_data.body.decode('utf-8'))

    assert 'error' not in layout_data
    elements = layout_data.get("elements", [])
    constants = layout_data.get("constants", [])

    assert len(elements) == 2
    assert len(constants) == 2

    y_offset = next((c for c in constants if c['id'] == 'y_offset'), None)
    assert y_offset is not None
    assert y_offset['value'] == 0.1


def test_delete():

    # test delete element when there are no constraints that rely on it
    request = base_request_data.copy()
    request['action'] = "delete"
    request['element_id'] = "axis-1"

    response_data = handle_update_layout(request)
    layout_data = json.loads(response_data.body.decode('utf-8'))

    assert 'error' not in layout_data
    elements = layout_data.get("elements", [])
    constraints = layout_data.get("constraints", [])
    assert len(elements) == 1
    assert len(constraints) == 2

    # test delete element when constraints do rely on it
    request = base_request_data.copy()
    request['action'] = "delete"
    request['element_id'] = "axis-0"

    response_data = handle_update_layout(request)
    layout_data = json.loads(response_data.body.decode('utf-8'))

    assert 'error' not in layout_data
    elements = layout_data.get("elements", [])
    constraints = layout_data.get("constraints", [])

    assert len(elements) == 1
    assert len(constraints) == 0

    # TODO: test delete constant
    # TODO: test delete constraint


def test_error_messages():

    # when action not recognized
    request = base_request_data.copy()
    request['action'] = "unknown_action"
    response_data = handle_update_layout(request)
    layout_data = json.loads(response_data.body.decode('utf-8'))
    assert 'error' in layout_data

    # when add not recognized
    request = base_request_data.copy()
    request['action'] = "add"
    request['new_type'] = "unknown_type"
    response_data = handle_update_layout(request)
    layout_data = json.loads(response_data.body.decode('utf-8'))
    assert 'error' in layout_data

    # given circular dependency
    request = base_request_data.copy()
    # TODO
    #request = base_request_data.copy()
    #request['action'] = "update_constant"
    #request['id'] = "y_offset"
    #request['constant'] = {'type': "constant", 'id': "y_offset", 'value': 0.1}


def test_handle_layout():

    response_data = handle_update_layout(base_request_data)

    assert response_data is not None
    assert isinstance(response_data.body, bytes)

    layout_data = json.loads(response_data.body.decode('utf-8'))
    elements = layout_data.get("elements", [])
    constraints = layout_data.get("constraints", [])
    constants = layout_data.get("constants", [])

    # test that we have the expected constants, elements, and constraints
    known_constants = [('y_offset', 0.3), ('spacing', 0.12)]
    for const in constants:
        assert (const['id'], const['value']) in known_constants
    known_elements = [('axis-0', 'axis', 0.2, 0.3, 1, 1, 'left_panel'),
                      ('axis-1', 'axis', 1.3199999999999998, 1.3, 0.5, 1, 'right_panel')]
    for el in elements:
        assert (el['id'], el['type'], el['x'], el['y'], el['width'], el['height'], el['text']) in known_elements
    known_constraints = [
        ('axis-1', 'x', 'axis-0', 'right', None, 1, None, 0, 'spacing', None),
        ('axis-1', 'y', 'axis-0', 'top', None, 1, None, 0, None, 0),
        ('axis-0', 'x', None, None, None, 1, None, 0.2, None, 0),
        ('axis-0', 'y', None, None, None, 1, None, 0, 'y_offset', None)
    ]
    for constraint in constraints:
        target = constraint['target']
        source = constraint['source']
        multiply = constraint['multiply']
        add_before = constraint['add_before']
        add_after = constraint['add_after']
        assert (target['id'], target['attr'], source['id'], source['attr'],
                multiply['id'], multiply['attr'], add_before['id'], add_before['attr'],
                add_after['id'], add_after['attr']) in known_constraints


if __name__ == "__main__":

    test_handle_layout()
    test_error_messages()
    test_add()
    test_update()
    test_delete()
