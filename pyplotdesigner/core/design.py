__copyright__ = """Copyright (C) 2025 George N. Wong"""
__license__ = """
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""


import json
import base64

from .models import Variable, Element, Constant, SetValueConstraint


class Design:
    """
    The Design is responsible for managing layout elements and constraints, and
    solving them to compute final positions and dimensions for all elements.

    It performs dependency analysis on the constraints to determine a valid
    evaluation order and applies each constraint once all its input values are
    resolved.
    """

    def __init__(self, figure_width=7, figure_height=5):
        """
        Initialize a new constraint-solving engine with empty elements and constraints.

        :arg figure_width: (default=7) width of the figure in inches
        :arg figure_height: (default=5) height of the figure in inches
        """
        self.elements = []
        self.constraints = []
        self.constants = []
        self.figure_width = figure_width
        self.figure_height = figure_height

    # set and get general design properties

    def print_info(self):
        """
        Print all registered elements and constraints for debugging or inspection.
        """
        print('Figure dimensions:', self.figure_width, 'x', self.figure_height)
        for constant in self.constants:
            print(constant)
        for element in self.elements:
            print(element)
        for constraint in self.constraints:
            print(constraint)

    def set_viewport(self, figure_width=None, figure_height=None):
        """
        Set figure dimensions.

        :arg figure_width: (default=None) width of the figure in inches
        :arg figure_height: (default=None)height of the figure in inches
        """
        if figure_width is not None:
            self.figure_width = figure_width
        if figure_height is not None:
            self.figure_height = figure_height

    def get_figure_width(self):
        """
        Get the width of the figure in inches.
        """
        return self.figure_width

    def get_figure_height(self):
        """
        Get the height of the figure in inches.
        """
        return self.figure_height

    def get_unique_id(self, prefix="widget-"):
        """
        Generate a unique identifier for a new element based on the current
        number of elements.

        :arg prefix: prefix for the ID (default="widget-")
        :return: unique ID string
        """
        for nid in range(10000):
            unique_id = f"{prefix}{nid}"
            if not any(el.id == unique_id for el in self.elements) and \
               not any(c.id == unique_id for c in self.constants):
                return unique_id
        raise RuntimeError("Failed to generate unique ID after 10000 attempts")

    def solve(self, verbose=False):
        """
        Solve all registered constraints to compute final positions and
        dimensions for all elements.

        This method will apply constraints in a valid order based on their
        dependencies, ensuring that all required inputs are resolved before
        applying each constraint.

        :arg verbose: (default=False) print order of applied constraints

        :raises: RuntimeError - circular or unsatisfiable constraint detected
        """
        for _ in range(len(self.constraints)):
            self._solve_once(verbose=verbose)

    def _solve_once(self, verbose=False):
        """
        Solve all registered constraints in a valid order based on
        their dependencies.

        Works by identifying all known variables (those not assigned by a
        constraint) and then repeatedly applying constraints whose inputs
        variables are already resolved. If no progress has been made in a
        step but constraints remain, then we assume that an unsatisfiable
        or circular dependency exists and raise a RuntimeError.

        :arg verbose: (default=False) print order of applied constraints

        :raises: RuntimeError - circular or unsatisfiable constraint detected
        """
        resolved = set()

        # start with all known values from the elements
        for element in self.elements:
            for attr in element.get_valid_attributes():
                var = getattr(element, attr, None)
                if isinstance(var, Variable):
                    resolved.add(var)
        for constant in self.constants:
            resolved.add(constant.value)

        # remove targets since they are assigned via constraints
        for constraint in self.constraints:
            if constraint.target in resolved:
                resolved.remove(constraint.target)

        # map constraints to their input dependencies
        dependency_map = {}
        for constraint in self.constraints:
            deps = set()
            for attr in ['source', 'add_before', 'add_after', 'multiply']:
                v = getattr(constraint, attr, None)
                if hasattr(v, 'get'):
                    deps.add(v)
            dependency_map[constraint] = deps

        applied = set()

        # repeatedly apply constraints with all inputs resolved
        while len(applied) < len(self.constraints):
            progress = False
            for constraint in self.constraints:
                if constraint in applied:
                    continue
                if all(dep in resolved for dep in dependency_map[constraint]):
                    constraint.apply()
                    applied.add(constraint)
                    resolved.add(constraint.target)
                    progress = True
            if not progress:
                raise RuntimeError("Circular or unsatisfiable constraint detected")

        if verbose:
            print("Constraints applied in order:")
            for c in applied:
                print("  ", c)

    # input/output utilities

    def _get_attribute_or_value_from_json(self, val, default):
        if isinstance(val, dict):
            id = val.get('id', None)
            attr = val.get('attr', None)
            if id is None:
                return float(attr)
            if attr is None:
                try:
                    return self.get_constant_value(id)
                except ValueError:
                    return default
            try:
                return self.get_element_attribute(id, attr)
            except ValueError:
                return default
        elif isinstance(val, (int, float)):
            return float(val)
        return default

    def load(self, b64string):
        """
        Load a Design instance from a base64-encoded JSON string.

        :arg b64string: base64-encoded JSON string representing the design
        """
        self.from_json_string(base64.b64decode(b64string).decode('utf-8'))

    def from_json_string(self, json_str):
        """
        Load a Design instance from a JSON string.

        :arg json_str: JSON-encoded design dictionary
        """
        data = json.loads(json_str)

        elements = data.get("elements", [])
        constraints = data.get("constraints", [])
        constants = data.get("constants", [])
        viewport = data.get("viewport", None)

        if viewport is not None:
            self.figure_width = viewport.get('figureWidth', 7)
            self.figure_height = viewport.get('figureHeight', 5)

        for el in elements:
            e = Element(**el)
            self.add_element(e)

        for constant in constants:
            id = constant.get('id')
            value = constant.get('value')
            if id is not None and value is not None:
                self.add_constant(id=id, value=value)

        for constraint in constraints:
            target_def = constraint.get('target')
            source_def = constraint.get('source')
            multiply = self._get_attribute_or_value_from_json(constraint.get('multiply'), 1)
            add_before = self._get_attribute_or_value_from_json(constraint.get('add_before'), 0)
            add_after = self._get_attribute_or_value_from_json(constraint.get('add_after'), 0)

            if target_def is None:
                continue

            try:
                target = self.get_element_attribute(target_def.get('id'),
                                                    target_def.get('attr'))
            except ValueError:
                continue

            source = None
            if source_def is not None:
                try:
                    source = self.get_element_attribute(source_def.get('id'),
                                                        source_def.get('attr'))
                except ValueError:
                    source = None

            constraint_obj = SetValueConstraint(
                target, source,
                multiply=multiply, add_before=add_before, add_after=add_after
            )
            self.add_constraint(constraint_obj)

    # constant utilities

    def add_constant(self, id=None, value=0.0):
        """
        Add a constant value to the design, which can be used in constraints.

        :arg id: unique identifier for the constant (default=None, auto-generated)
        :arg value: numeric value of the constant (default=0.0)
        """
        if id is None:
            id = self.get_unique_id(prefix="constant")
        constant = Constant(id=id, value=value)
        self.constants.append(constant)

    def get_constant(self, id):
        """
        Return the Constant object identified by its unique ID.

        :arg id: unique identifier of the constant to retrieve
        :return: Constant object or None if not found
        """
        if id is None:
            return None
        for constant in self.constants:
            if constant.id == id:
                return constant
        return None

    def update_constant(self, id, constant):
        """
        Safely update constant value identified by its current (-> previous) id.

        :arg id: unique identifier of the constant to update
        :arg constant: new Constant object with updated value
        """
        if id is None or constant is None:
            return
        new_id = constant.get('id', None)
        new_value = constant.get('value', None)
        if new_id is None or new_value is None:
            return

        existing_constant = next((c for c in self.constants if c.id == id), None)
        if existing_constant is None:
            return

        # check if the new constant id already exists
        if any(c.id == new_id for c in self.constants if c.id != id):
            print(f"Constant with id '{new_id}' already exists, cannot update.")
            return

        # update the existing constant
        existing_constant.id = new_id
        existing_constant.value = new_value

        # TODO, check all constraints for references to this constant and update appropriately

    def get_constant_value(self, constant):
        """
        Get the value of a constant by its ID.

        :arg constant: ID of the constant to retrieve
        """
        if constant is None:
            return None
        if isinstance(constant, Constant):
            return constant.value
        const = next((c for c in self.constants if c.id == constant), None)
        if const is None:
            raise ValueError(f"Constant with ID '{constant}' not found")
        return const.value

    # element utilities

    def add_empty_element(self, element_type="axis", id=None, text=None):
        """
        Add a new empty layout element of the specified type with default
        position and size.

        :arg element_type: type of the element to create (default="axis")
        :arg id: unique identifier for the element (default=None, auto-generated)
        """
        if id is None:
            id = self.get_unique_id(prefix=f"{element_type}-")
        if text is None:
            text = id
        x = 0.1 * len(self.elements)
        y = 0.1 * len(self.elements)
        element = Element(id=id, type=element_type, x=x, y=y, width=1, height=1, text=text)
        self.add_element(element)

    def get_element(self, element_id):
        """
        Retrieve a layout element by its unique ID.

        :arg element_id: ID of the element to retrieve
        :return: element object if found or None
        """
        for element in self.elements:
            if element.id == element_id:
                return element
        return None

    def remove_element_by_id(self, element_id):
        """
        Safely remove an element from the design, including constraints
        that reference it.

        :arg element_id: ID of the element to remove
        """
        element = self.get_element(element_id)
        if element is None:
            return

        for constraint in self.constraints:
            if constraint.includes_element(element):
                self.constraints.remove(constraint)

        self.elements.remove(element)

    def get_element_attribute(self, element_id, attr):
        """
        Get the value of a specific attribute for an element by its ID.

        :arg element_id: ID of the element to retrieve
        :arg attr: attribute name (e.g., 'x', 'y', 'width', 'height')
        :return: reference value of the specified attribute
        """
        if element_id is None or attr is None:
            return None
        element = self.get_element(element_id)
        if element is None:
            raise ValueError(f"Element with ID '{element_id}' not found")
        return getattr(element, attr)

    # constraint utilities

    def add_element(self, element):
        """
        Register a new layout element in the design.

        :arg element: the layout element to track
        """
        self.elements.append(element)

    def add_constraint(self, constraint):
        """
        Register a new constraint that governs relationships between
        element attributes.

        :arg constraint: constraint with .target and .apply()
        """
        self.constraints.append(constraint)
