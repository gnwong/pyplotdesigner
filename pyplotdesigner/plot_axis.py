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

from .plot_element import PlotElement


class PlotAxis(PlotElement):
    """
    Rectangular plot axis with name, location, and dimension. Can
    be rendered into a matplotlib Axes object.
    """

    def __init__(self, name, x0, y0, width, height):
        """
        Create a new PlotAxis object.

        :arg name: Name of the axis
        :arg x0: left x-coordinate of the axis location
        :arg y0: bottom y-coordinate of the axis location
        :arg width: Width of the axis
        :arg height: Height of the axis
        """

        super().__init__(name, x0, y0)

        self.width = width
        self.height = height
        self._wl = self._hl = self._xrl = self._yrl = 0

    def __repr__(self):
        return f"PlotAxis<{self.name}, x0={self.x0}, y0={self.y0}, w={self.width}, h={self.height}>"
        
    @classmethod
    def load_dictionary(cls, d):
        """
        Load a PlotAxis from a dictionary.
        """
        return cls(d['name'], d['x0'], d['y0'], d['w'], d['h'])

    def to_dictionary(self):
        """
        Get a dictionary representation of this PlotAxis.
        """
        return {
            'name': self.name,
            'x0': self.x0,
            'y0': self.y0,
            'w': self.w,
            'h': self.h
        }
    
    def reset_locks(self, state=0):
        """
        Reset all locks to a given state.

        :arg state: State to reset locks to
        """
        
        super()._reset_locks(state=state)

        self._wl = state
        self._hl = state
        self._xrl = state
        self._yrl = state

    def move(self, anchor, tx, ty, lock=1):
        ## TODO maybe move to PlotElement?
        if tx != None:
            if 'w' in anchor:
                self.x0 = tx
                self._x0l = lock
            elif 'e' in anchor:
                self.x0 = tx - self.width
                self._xrl = lock
        if ty != None:
            if 'n' in anchor:
                self.y0 = ty - self.height
                self._yrl = lock
            elif 's' in anchor:
                self.y0 = ty
                self._y0l = lock

    def resize(self, anchor, tx, ty, lock=1):
        ## TODO maybe move to PlotElement?
        if tx != None:
            if 'w' in anchor:
                self.width += self.x0 - tx
                self.x0 = tx
                self._x0l = lock
            elif 'e' in anchor:
                self.width += tx - self.width - self.x0
                self.x0 = tx - self.width
                self._xrl = lock
        if ty != None:
            if 'n' in anchor:
                self.height = ty - self.y0
                self.y0 = ty - self.height
                self._yrl = lock
            elif 's' in anchor:
                self.height = self.y0 - ty + self.height
                self.y0 = ty
                self._y0l = lock

    def update_dimension(self, loc, tdim):
        ## TODO maybe move to PlotElement?
        ## TODO clean up (loc -> anchor, tdim -> target_dimension)

        if 'n' in loc or 's' in loc:
            if self._wl == 1:
                raise Exception('Cannot set width (locked)')
            self._wl = 2
            if self._xrl == 0:
                self.width = tdim
                if self._x0l == 1:
                    self._xrl = 2
            elif self._x0l == 0:
                self.x0 -= tdim - self.width
                self.width = tdim
                self._x0l = 2
            else:
                print(" - bad")
        elif 'w' in loc or 'e' in loc:
            if self._hl == 1:
                raise Exception('Cannot set height (locked)')
            self._hl = 2
            if self._yrl == 0:
                self.height = tdim
                if self._y0l == 1:
                    self._yrl = 2
            elif self._y0l == 0:
                self.y0 -= tdim - self.height
                self.height = tdim
                self._y0l = 2
            else:
                print(" - bad")

