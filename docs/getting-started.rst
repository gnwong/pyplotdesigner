Getting started
===============

Install and launch
------------------

Install the published package with pip:

.. code-block:: bash

   python -m pip install pyplotdesigner
   python -m pyplotdesigner.gui.main

The GUI runs on your computer and opens a browser at ``http://127.0.0.1:8080/ui``. Keep the terminal running while you edit and press Ctrl+C in that terminal to stop the server when you're done.

Build a layout
--------------

This example uses two axes side by side in a 6-by-3-inch figure. Each axis is represented by a box in the designer.

1. Click **Set Layout** in the toolbar. Set **Figure width** to ``6`` and **Figure height** to ``3`` inches, then click **Apply**.
2. Click **Add Axis** once to create the first axis. Click its entry in the **Elements** list to show its properties in the inspector. New axes appear near the bottom-left of the canvas; scroll down in the canvas area if the box is out of view.
3. Change **Name** to ``left_panel``. This name will be the key you use to access the axis in Python. Set **X** to ``0.6``, **Y** to ``0.5``, **Width** to ``2.2``, and **Height** to ``2``. These values are in inches; X and Y locate the box's lower-left corner. Press Tab after editing each field to apply the change.
4. Click **Add Axis** once more to create the second axis. Each click creates one axis, so you now have two boxes. Select the new axis from the **Elements** list, name it ``right_panel``, and set **X** to ``3`` and **Y** to ``0.5``.
5. With ``right_panel`` selected, find **Match Dimensions** under **Apply Preset Constraint** in the inspector and click it. Then click the ``left_panel`` box on the canvas to choose the source. The right panel takes on the left panel's width and height, and follows future changes to those dimensions.
6. Select ``right_panel`` again, click **Align Bottom**, then click ``left_panel`` as the source. The panels' bottom edges now stay aligned.

The layout now contains two equal-sized axes with a 0.2-inch gap between them. You can drag the boxes to adjust properties that are not controlled by constraints.

See :doc:`designing-layouts` to add spacing constants and other relationships.

Import the example layout
-------------------------

You can also import the example instead of building it manually. Copy the complete string below, click **Import/Export**, replace the text in the dialog with this string, and click **Import**. This replaces the current layout with the two named panels above and a ``spacing`` constant that controls the gap between them.

.. literalinclude:: examples/two_panels.layout.txt
   :language: text

The :doc:`worked-example` shows how to change that spacing in Python and add data to both panels.

Copy into Python
----------------

Click **Quick Copy**, then paste the four-line snippet into your plotting script:

.. code-block:: python

   from pyplotdesigner.core.design_loader import load_design, make_figure_from_design
   import_string = "PASTE_EXPORTED_STRING"
   design = load_design(import_string)
   fig, axes = make_figure_from_design(design)

Plot into the named axes:

.. code-block:: python

   axes['left_panel'].plot([0, 1, 2], [0, 1, 0])
   axes['right_panel'].scatter([0, 1, 2], [1, 0, 1])
   fig.savefig('my_figure.pdf')

Use **Import/Export** to copy a layout string by itself or paste a saved string back into the GUI. :doc:`using-python` explains how to edit constants before the figure is created.
