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

import json
import matplotlib.pyplot as plt

from itertools import count

from .plot_element import PlotElement
from .plot_axis import PlotAxis
from .plot_text import PlotText
from .plot_constraint import PlotConstraint
from .equalize_network import EqualizeNetwork


class PlotDescription:
    """
    Collection of axes, text, and constraints that can be used to describe a
    plot. A :class:`PlotDescription` is schematically similar to figures and
    can be rendered into one.

    .. attribute:: width

        width of the final full plot. if rendering to matplotlib, likely to
        be interpreted as inches.

    .. attribute:: height

        height of the final full plot. if rendering to matplotlib, likely to
        be interpreted as inches.
    """

    _supported_versions = ['1']

    def __init__(self, width, height):

        self.width = width
        self.height = height
        self.axes = []
        self.texts = []
        self.constraints = []

        # dummy variables for standardizing constraint solving
        self.x0 = 0
        self.y0 = 0

    def __repr__(self):
        return f"PlotDescription<{self.width}x{self.height}, {len(self.axes)} axes, {len(self.texts)} text elements>"

    @classmethod
    def load(cls, fname):
        """
        Load a :class:`PlotDescription` from a file.

        :arg fname: name of the file to load from
        """

        with open(fname, 'r') as fp:
            dd = json.load(fp)

        print(dd)
        pd = cls(6, 6)  # TODO support this

        version = dd.get('version')
        if not version:
            raise Exception('Version not specified')
        elif version not in PlotDescription._supported_versions:
            raise Exception(f'Unsupported version {version}')

        if 'axes' in dd:
            pd.axes += [PlotAxis.load_dictionary(axis) for axis in dd['axes']]

        if 'texts' in dd:
            print("Texts:", dd['texts'])

        return pd

    def get_element(self, element, error=True):
        """
        Get a :class:`PlotElement` by name or instance.

        :arg name: name or instance of element to be retrieved
        :arg error: whether to raise an error if the element is not found (default ``True``)

        :returns: :class:`PlotElement` with the given name or ``None`` if not found and ``error=False``
        """

        if element is None:
            return None

        if isinstance(element, PlotElement):
            if element in self.axes + self.texts:
                return element
            elif error:
                raise Exception(f'Element {element} not found')

        name = element
        for element in self.axes + self.texts:
            if element.name == name:
                return element

        if error:
            raise Exception(f'Element {name} not found')

        return None

    def get_unique_name(self, element):
        """
        Get a unique name for a :class:`PlotElement` based on its type.

        :arg element: type or instance of element to be named

        :returns: unique name for the :class:`PlotElement`
        """

        if element is PlotAxis or isinstance(element, PlotAxis):
            prefix = 'axis'
        elif element is PlotText or isinstance(element, PlotText):
            prefix = 'text'
        else:
            raise Exception(f"Unknown PlotElement {element} with type {type(element)}")

        for i in count():
            name = f'{prefix}_{i}'
            if self.get_element(name, error=False) is None:
                return name

    def add_axis(self, *args, **kwargs):
        """
        Add an axis. Input can be either a :class:`PlotAxis` object or a list of
        arguments to be passed to the :class:`PlotAxis` constructor. For more
        information, see :class:`PlotAxis`.

        :arg name: keyword argument for name of the axis (if not provided, a unique name will be generated)

        :returns: reference to the new axis
        """

        if len(args) == 1 and isinstance(args[0], PlotAxis):
            axis = args[0]
        else:
            name = kwargs.pop('name', None)
            if name is None:
                name = self.get_unique_name(PlotAxis)
            axis = PlotAxis(name, *args, **kwargs)

        self.axes.append(axis)

        return axis

    def add_text(self, *args, **kwargs):
        """
        Add text element. Input can be either a :class:`PlotText` object or a list
        of arguments to be passed to the :class:`PlotText` constructor. For more
        information, see :class:`PlotText`.

        :arg name: keyword argument for name of the text element (if not provided, a unique name will be generated)

        :returns: reference to the new text element
        """

        if len(args) == 1 and isinstance(args[0], PlotText):
            text = args[0]
        else:
            name = kwargs.pop('name', None)
            if name is None:
                name = self.get_unique_name(PlotText)
            text = PlotText(name, *args, **kwargs)

        self.texts.append(text)

        return text.name

    def add_constraint(self, parents, children, parent_anchor, child_anchor, constraint_type, value):
        """
        Add a constraint. For more information, see :class:`PlotConstraint`.

        :arg parents: name of the parent element(s)
        :arg children: name of the child element(s)
        :arg parent_anchor: anchor point on the parent element
        :arg child_anchor: anchor point on the child element
        :arg constraint_type: type of constraint
        :arg value: value of the constraint
        """

        if not isinstance(parents, list):
            parents = [parents]
        if not isinstance(children, list):
            children = [children]

        parents = [self.get_element(parent) for parent in parents]
        children = [self.get_element(child) for child in children]

        for parent in parents:
            for child in children:
                self.constraints.append(PlotConstraint(parent, child, parent_anchor, child_anchor, constraint_type, value))

    def _reset_locks(self, state=0):
        """
        Reset the locks of all :class:`PlotElements` belonging to this :class:`PlotDescription`.

        :arg state: state to reset the locks to (default ``0``)
        """

        for axis in self.axes:
            axis.reset_locks(state=state)
        for text in self.texts:
            text.reset_locks(state=state)

    def apply_constraints(self, iterations=5):
        """
        Attempt to adjust positions and size of all :class:`PlotElement`
        objects belonging to this :class:`PlotDescription` in order to
        satisfy constraints. Constraints are applied iteratively until
        positions and sizes converge.

        :arg iterations: number of times to apply constraints (default ``5``)
        """

        if iterations < 1:
            return

        self._reset_locks()
        equalize_network = EqualizeNetwork()

        # iterate through all constraints adjusting where possible before
        # applying equalize constraints
        for constraint in self.constraints:

            to_equalize = constraint.apply(self)
            if to_equalize is not None:
                equalize_network.add_constraint(to_equalize)

        for update in equalize_network.get_update_list():
            update[0].update_dimension(update[1], update[2])

        self.apply_constraints(iterations=iterations-1)

    def get_matplotlib_figure(self, **kwargs):
        """
        Get a matplotlib figure from this :class:`PlotDescription`.

        :arg kwargs: additional arguments to pass to matplotlib.pyplot.figure

        :returns: matplotlib figure
        """

        fig = plt.figure(figsize=(self.width, self.height), **kwargs)

        for axis in self.axes:
            width = axis.width / self.width
            height = axis.height / self.height
            x0 = axis.x0 / self.width
            y0 = axis.y0 / self.height
            ax = fig.add_axes([x0, y0, width, height], label=axis.name)
            ax.set_xticks([])
            ax.set_yticks([])

        # TODO add text

        return fig
