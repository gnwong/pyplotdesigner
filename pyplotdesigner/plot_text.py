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


class PlotText(PlotElement):
    """
    # TODO
    Rectangular plot element subclass of :class:`PlotElement`. Can
    be rendered into a matplotlib.pyplot.axis object.

    .. attribute:: name

        name of the axis used when generating python code and for internal bookkeeping

    .. attribute:: x0

        left x-coordinate of the axis in figure units

    .. attribute:: y0

        bottom y-coordinate of the axis in figure units

    .. attribute:: width

        width of the axis in figure units

    .. attribute:: height

        height of the axis in figure units
    """

    def __init__(self, name, x0, y0, text=None, **kwargs):

        super().__init__(name, x0, y0)

        self.text = text
        self.kwargs = kwargs
        self.kwargs.setdefault('va', 'center')
        self.kwargs.setdefault('ha', 'center')
        self.kwargs.setdefault('rotation', 0)

        #self.width = width
        #self.height = height
        #self._wl = self._hl = self._xrl = self._yrl = 0

    def __repr__(self):
        return f"PlotText<{self.name}, x0={self.x0}, y0={self.y0}, text={self.text}>"

    @classmethod
    def load_dictionary(cls, d):
        """
        Load a :class:`PlotText` from a dictionary.

        :arg d: dictionary representation of a :class:`PlotText`
        """
        return cls(d['name'], d['x0'], d['y0'], d['text'])

    def to_dictionary(self):
        """
        Get a dictionary representation of this :class:`PlotText`.
        """
        return {
            'name': self.name,
            'x0': self.x0,
            'y0': self.y0,
            'text': self.text,
        }

    def reset_locks(self, state=0):
        """
        Reset all locks to a given state.

        :arg state: state to reset locks to
        """

        super()._reset_locks(state=state)

    def move(self, anchor, target_x, target_y, lock=1):
        # TODO
        pass

    def resize(self, anchor, target_x, target_y, lock=1):
        # TODO
        pass

    def update_dimension(self, anchor, target_dimension):
        # TODO
        pass

    def get_cursor(self, length):
        """
        Return two lines that intersect at the center of the text
        and are oriented along the text's horizontal and vertical
        directions.

        :arg length: length of the lines in figure units
        """

        hline = None
        vline = None

        if self.kwargs['ha'] == 'center':
            hline = [[self.x0 - length/2, self.x0 + length/2], [0, 0]]
        elif self.kwargs['ha'] == 'left':
            hline = [[0, self.x0 + length], [0, 0]]
        elif self.kwargs['ha'] == 'right':
            hline = [[self.x0 - length, 0], [0, 0]]

        if self.kwargs['va'] == 'center':
            vline = [[0, 0], [self.y0 - length/2, self.y0 + length/2]]
        elif self.kwargs['va'] == 'bottom' or self.kwargs['va'] == 'baseline':
            vline = [[0, 0], [0, self.y0 + length]]
        elif self.kwargs['va'] == 'top':
            vline = [[0, 0], [self.y0 - length, 0]]

        return hline, vline


"""
    def move(self, anchor, tx, ty, lock=1):
        # TODO maybe move to PlotElement?
        if tx is not None:
            if 'w' in anchor:
                self.x0 = tx
                self._x0l = lock
            elif 'e' in anchor:
                self.x0 = tx - self.width
                self._xrl = lock
        if ty is not None:
            if 'n' in anchor:
                self.y0 = ty - self.height
                self._yrl = lock
            elif 's' in anchor:
                self.y0 = ty
                self._y0l = lock

    def resize(self, anchor, tx, ty, lock=1):
        # TODO maybe move to PlotElement?
        if tx is not None:
            if 'w' in anchor:
                self.width += self.x0 - tx
                self.x0 = tx
                self._x0l = lock
            elif 'e' in anchor:
                self.width += tx - self.width - self.x0
                self.x0 = tx - self.width
                self._xrl = lock
        if ty is not None:
            if 'n' in anchor:
                self.height = ty - self.y0
                self.y0 = ty - self.height
                self._yrl = lock
            elif 's' in anchor:
                self.height = self.y0 - ty + self.height
                self.y0 = ty
                self._y0l = lock
        if self.width < 0:
            self.width = 0
        if self.height < 0:
            self.height = 0

    def update_dimension(self, loc, tdim):
        # TODO maybe move to PlotElement?
        # TODO clean up (loc -> anchor, tdim -> target_dimension)

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
    """


"""
    def __init__(self, position, text, size=12, color='black', fontweight='normal', **kwargs):
        self.position = position
        self.text = text
        self.size = size
        self.color = color
        self.fontweight = fontweight
        self.kwargs = kwargs
        """
