"""Recreate the tutorial layout and export it for the GUI and plotting example."""

from pathlib import Path
from pyplotdesigner.core.design import Design


def create_layout():
    design = Design(figure_width=6, figure_height=3)
    left = design.add_element(id='axis-0', type='axis', text='left_panel',
                              x=0.6, y=0.5, width=2.2, height=2)
    right = design.add_element(id='axis-1', type='axis', text='right_panel')
    spacing = design.add_constant(id='spacing', value=0.2)
    design.add_constraint(right.x, left.right, add_after=spacing.value)
    design.add_constraint(right.y, left.y)
    design.add_constraint(right.width, left.width)
    design.add_constraint(right.height, left.height)
    design.solve()
    return design


if __name__ == '__main__':
    output = Path(__file__).with_name('two_panels.layout.txt')
    output.write_text(create_layout().get_b64_string(compressed=True) + '\n')
