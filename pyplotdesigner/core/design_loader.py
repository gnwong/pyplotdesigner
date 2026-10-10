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


import matplotlib.pyplot as plt
from pyplotdesigner.core.design import Design


def load_design(import_string):
    """
    Decode a layout string into a Design that can be edited before rendering.

    Accepts legacy base64 JSON and ppd1: gzip layout strings. Constraints are
    solved when make_figure_from_design() creates the figure.

    :arg import_string: legacy or compressed layout string
    :return: Design
    """
    design = Design()
    design.load(import_string)
    return design


def make_figure_from_b64(json_b64, **kwargs):
    """
    Decode a legacy base64 JSON or ppd1: gzip string representing a design layout,
    build the Design object, and return a matplotlib Figure and Axes.

    :arg json_b64: legacy base64 JSON or a ppd1: gzip layout string
    :arg kwargs: additional keyword arguments for matplotlib figure creation
    :return: (Figure, Dict[str, Axes])
    """

    return make_figure_from_design(load_design(json_b64), **kwargs)


def make_figure_from_design(design, **kwargs):
    """
    Create a matplotlib Figure and Axes from a Design object.

    :arg design: Design object containing layout information
    :arg kwargs: additional keyword arguments for matplotlib figure creation
    :return: (Figure, Dict[str, Axes])
    """

    design.solve()

    width = design.figure_width
    height = design.figure_height

    fig = plt.figure(figsize=(width, height), **kwargs)
    axes = dict()

    for el in design.elements:
        dimensions = [el._x/width, el._y/height, el._width/width, el._height/height]
        axes[el.text] = fig.add_axes(dimensions, label=el.text)

    return fig, axes
