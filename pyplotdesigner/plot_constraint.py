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

    If the parent element is None, the full Plot is used as the parent.

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

    _valid_anchor_points = ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']

    def __init__(self, parent, child, parent_anchor, child_anchor, constraint_type, value):
        """
        Create a constraint between two plot elements.

        :arg parent: parent element
        :arg child: child element
        :arg parent_anchor: anchor point on parent element
        :arg child_anchor: anchor point on child element
        :arg constraint_type: type of constraint (both type and operation)
        :arg value: value to use for constraint
        """
        
        if parent_anchor not in PlotConstraint._valid_anchor_points:
            raise Exception(f'Invalid parent anchor {parent_anchor}')
        if child_anchor not in PlotConstraint._valid_anchor_points:
            raise Exception(f'Invalid child anchor {child_anchor}')
        
        constraint = PlotConstraint._standardize_constraint_type(constraint_type)

        remaining_constraint = constraint
        for valid_constraint in PlotConstraint._constraint_map.values():
            remaining_constraint = remaining_constraint.replace(valid_constraint, '')
        if len(remaining_constraint.strip()) > 0:
            raise Exception(f'Invalid constraint type {constraint_type}')
        
        # TODO verify valid parent/child type for ctype

        self.parent = parent
        self.child = child
        self.parent_anchor = parent_anchor.lower()
        self.child_anchor = child_anchor.lower()
        self.value = value
        self.constraint = constraint
    
    def __repr__(self):
        parent = self.parent.name if hasattr(self.parent, 'name') else self.parent
        child = self.child.name if hasattr(self.child, 'name') else self.child
        return f"PlotConstraint<{parent}.{self.parent_anchor} {self.constraint}:{self.value} {child}.{self.child_anchor}>"
    
    @classmethod
    def _standardize_constraint_type(cls, constraint_type):
        constraint_type = constraint_type.lower()
        for key in PlotConstraint._constraint_map:
            constraint_type = constraint_type.replace(key, PlotConstraint._constraint_map[key])
        return constraint_type
    
    def _get_target_location(self, relative_element):
        """
        Get the target location for how to adjust the child element to satisfy this constraint.

        :arg relative_element: Element to use as the reference for the target location

        :returns: (tx, ty) target location
        """

        tx = None
        ty = None

        if 'n' in self.parent_anchor:
            ty = relative_element.y0 + relative_element.height + self.value
        elif 's' in self.parent_anchor:
            ty = self.value
        
        if 'e' in self.parent_anchor:
            tx = relative_element.x0 + relative_element.width + self.value
        elif 'w' in self.parent_anchor:
            tx = self.value

        return tx, ty

    def _get_target_dimension(self, relative_element):
        """
        Get the target dimension for how to adjust the child element to satisfy this constraint.
        
        :arg relative_element: Element to use as the reference for the target dimension

        :returns: target dimension  ## TODO more detail, note None
        """

        if any(anchor in self.parent_anchor for anchor in ['n', 's']):
            return relative_element.width * self.value
        elif any(anchor in self.parent_anchor for anchor in ['w', 'e']):
            return relative_element.height * self.value
        
        return None

    def apply(self, plot_description):
        """
        Attempt to apply this constraint to the child element. If this is an
        equalize constraint, return self so that the constraint can be input
        into the EqualizerNetwork.

        :arg plot_description: PlotDescription container in which to apply the constraint
        """

        if 'e' in self.constraint:
            return self

        if 's' in self.constraint:

            target_x = None
            target_y = None
            lock = 1

            if self.parent is None:
                target_x, target_y = self._get_target_location(plot_description)
            else:
                target_x, target_y = self._get_target_location(self.parent)
                lock = 0

            if 'm' in self.constraint:
                self.child.move(self.child_anchor, target_x, target_y, lock=lock)
            elif 'r' in self.constraint:
                self.child.resize(self.child_anchor, target_x, target_y, lock=lock)
            
        elif 'd' in self.constraint:

            target_dimension = None

            if self.parent is None:
                target_dimension = self._get_target_dimension(plot_description)
            else:
                target_dimension = self._get_target_dimension(self.parent)

            self.child.update_dimension(self.child_anchor, target_dimension)
