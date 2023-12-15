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


class PlotElement:
    """
    A plot element is any object that can be placed on a plot. It minimally
    has a name and a location. Its subclasses determine how it can be moved
    and what its location means.

    :arg name: name of the element
    :arg x0: x-coordinate of the element's location
    :arg y0: y-coordinate of the element's location
    """
    
    def __init__(self, name, x0, y0):
        self.name = name
        self.x0 = x0
        self.y0 = y0
        self._x0l = 0
        self._y0l = 0

    def resetLocks(self, state=0):
        self._x0l = state
        self._y0l = state

    def move(self, loc, tx, ty):
        raise Exception('TODO unimplemented')
    
    def resize(self, loc, tx, ty):
        raise Exception('TODO unimplemented')
    
    def updateDimension(self, loc, tdim):
        raise Exception('TODO unimplemented')
    
    def _getTargetLocationFromConstraint(self, constraint):
        raise Exception('TODO unimplemented')
        tx = None
        ty = None
        if 'n' in constraint.ploc:
            ty = self.h + constraint.value
        if 's' in constraint.ploc:
            ty = constraint.value
        if 'e' in constraint.ploc:
            tx = self.w + constraint.value
        if 'w' in constraint.ploc:
            tx = constraint.value
        return (tx, ty)
    
    def _getTargetDimensionFromConstraint(self, constraint):
        raise Exception('TODO unimplemented')
        if 'n' in constraint.ploc or 's' in constraint.ploc:
            return self.w * constraint.value
        elif 'w' in constraint.ploc or 'e' in constraint.ploc:
            return self.h * constraint.value
        return None
