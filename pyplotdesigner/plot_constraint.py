__copyright__ = """Copyright (C) 2023 George N. Wong"""
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


class PlotConstraint:
    """
    Relationship between two plot elements. The parent element is used to 
    determine how the child should be modified to satisfy the constraint.

    Constraints may be between any two of:
        PlotElements (e.g., for copying dimensions)
        anchor points on PlotElements (e.g., for setting spacings)

    Valid anchor points are:
    - n: north edge
    - s: south edge
    - w: west edge
    - e: east edge
    - nw: northwest corner
    - ne: northeast corner
    - sw: southwest corner
    - se: southeast corner

    Constraints will be satisfied by performing one of the following "constraint
    type" operations:
    - move: translate child element keeping same dimensions
    - resize: resize child element keeping same location for non-anchored edges

    Constraints are defined by one of the following "constraint type" strings:
    - separation: translate child element until separation of :arg value: attained
    - duplicate: duplicate dimension to child element
    - equalize: reflexively equalize dimensions until ratio=value attained
    """

    _constraint_map = {
        'move': 'm',
        'resize': 'r',
        'separation': 's',
        'equalize': 'e',
        'duplicate': 'd'
    }

    def __init__(self, parent, child, parent_anchor, child_anchor, constraint_type, value):
        """
        Create a constraint between two plot elements.

        :arg parent: parent element
        :arg child: child element
        :arg parent_anchor: anchor point on parent element
        :arg child_anchor: anchor point on child element
        :arg constraint_type: type of constraint (type and operation)
        :arg value: value to use for constraint
        """
        
        if parent_anchor not in ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']:
            raise Exception('Invalid parent anchor')
        if child_anchor not in ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']:
            raise Exception('Invalid child anchor')
        
        constraints = PlotConstraint._standardize_constraint_type(constraint_type)

        remaining_constraints = constraints
        for valid_constraint in PlotConstraint._constraint_map.values():
            remaining_constraints = remaining_constraints.replace(valid_constraint, '')
        if len(remaining_constraints) > 0:
            raise Exception(f'Invalid constraint type {constraint_type}')
        
        # TODO verify valid parent/child type for ctype

        self.parent = parent
        self.child = child
        self.parent_anchor = parent_anchor.lower()
        self.child_anchor = child_anchor.lower()
        self.value = value
        self.constraints = constraints
    
    def __repr__(self):
        parent = self.parent.name if hasattr(self.parent, 'name') else self.parent
        child = self.child.name if hasattr(self.child, 'name') else self.child
        return f"PlotConstraint<{parent}.{self.parent_anchor} {self.constraints}:{self.value} {child}.{self.child_anchor}>"
    
    @classmethod
    def _standardize_constraint_type(cls, constraint_type):
        constraint_type = constraint_type.lower()
        for key in PlotConstraint._constraint_map:
            constraint_type = constraint_type.replace(key, PlotConstraint._constraint_map[key])
        return constraint_type
