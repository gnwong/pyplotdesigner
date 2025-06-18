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


def load_figure_from_b64(json_b64, **kwargs):
    """
    Decode a base64-encoded JSON string representing a design layout,
    build the Design object, and return a matplotlib Figure and Axes.

    :arg json_b64: base64-encoded JSON string
    :arg kwargs: additional keyword arguments for matplotlib figure creation
    :return: (Figure, Dict[str, Axes])
    """

    design = Design()
    design.load(json_b64)
    design.solve()

    width = design.figure_width
    height = design.figure_height

    fig = plt.figure(figsize=(width, height), **kwargs)
    axes = dict()

    for el in design.elements:
        dimensions = [el._x/width, el._y/height, el._width/width, el._height/height]
        axes[el.text] = fig.add_axes(dimensions, label=el.text)

    return fig, axes
