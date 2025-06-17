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


from .models import Variable, Element


class Engine:
    """
    The Engine is responsible for managing layout elements and constraints, and
    solving them to compute final positions and dimensions for all elements.

    It performs dependency analysis on the constraints to determine a valid
    evaluation order and applies each constraint once all its input values are
    resolved.
    """

    def __init__(self):
        """
        Initialize a new constraint-solving engine with empty elements and constraints.
        """
        self.elements = []
        self.constraints = []

    def print_info(self):
        """
        Print all registered elements and constraints for debugging or inspection.
        """
        for element in self.elements:
            print(element)
        for constraint in self.constraints:
            print(constraint)

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
        Safely remove an element from the engine, including constraints
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

    def get_unique_id(self, prefix="widget-"):
        """
        Generate a unique identifier for a new element based on the current
        number of elements.

        :arg prefix: prefix for the ID (default="widget-")
        :return: unique ID string
        """
        for nid in range(10000):
            unique_id = f"{prefix}{nid}"
            if not any(el.id == unique_id for el in self.elements):
                return unique_id
        raise RuntimeError("Failed to generate unique ID after 10000 attempts")

    def add_element(self, element):
        """
        Register a new layout element in the engine.

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

    def solve(self, verbose=False):
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
            for attr in ['x', 'y', 'width', 'height']:
                var = getattr(element, attr, None)
                if isinstance(var, Variable):
                    resolved.add(var)

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
