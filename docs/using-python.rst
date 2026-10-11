Using layouts in Python
=======================

Load, adjust, render
--------------------

Quick Copy gives you a :class:`~pyplotdesigner.core.design.Design` before creating the figure:

.. code-block:: python

   from pyplotdesigner.core.design_loader import load_design, make_figure_from_design
   import_string = "PASTE_EXPORTED_STRING"
   design = load_design(import_string)
   fig, axes = make_figure_from_design(design)

You can use that design object to edit properties of the layout between loading and rendering. For example, if your layout contains a constant named ``spacing``:

.. code-block:: python

   design.get_constant('spacing').value.set(0.4)

Rendering then solves the constraints using the new value when you ask for the ``fig`` and ``axes`` objects. Dependent axes move or resize accordingly. See :doc:`worked-example` for a complete runnable script.

An unknown constant name returns ``None``. Check names that come from user input:

.. code-block:: python

   spacing = design.get_constant('spacing')
   if spacing is None:
       raise ValueError('This layout has no spacing constant')
   spacing.value.set(0.4)

Axis names and properties
-------------------------

The returned ``axes`` dictionary uses the names entered in the GUI:

.. code-block:: python

   axes['left_panel'].set_title('Measurements')
   axes['left_panel'].plot([0, 1], [0, 1])

For direct layout edits, use the internal ID stored in the exported layout:

.. code-block:: python

   panel = design.get_element('axis-0')
   panel.width.set(2.0)

Solving overwrites a direct edit if a constraint assigns that property. You can change the constant used by the constraint to parameterize such properties.

Reusing and exporting a design
------------------------------

Figure options such as DPI pass through to Matplotlib:

.. code-block:: python

   fig, axes = make_figure_from_design(design, dpi=200)

You can always change constants and render again. Each call creates a new figure; already created figures retain their existing positions.

.. code-block:: python

   design.get_constant('spacing').value.set(0.6)
   another_fig, another_axes = make_figure_from_design(design)

Export a modified design with:

.. code-block:: python

   compressed_string = design.get_b64_string(compressed=True)
   legacy_string = design.get_b64_string()

If you changed constraints or constants and want exported geometry to reflect them, call ``design.solve()`` before exporting.

String compatibility
--------------------

The GUI exports gzip-compressed strings beginning with ``ppd1:``. Both ``load_design()`` and the GUI importer also accept legacy base64 JSON strings. Compression preserves the layout without rounding coordinates or changing IDs.

Existing one-step Python code still works:

.. code-block:: python

   from pyplotdesigner.core.design_loader import make_figure_from_b64
   fig, axes = make_figure_from_b64(import_string)

Package releases before 0.6.0 cannot read ``ppd1:`` strings or import ``load_design``. Upgrade the package to use these features:

.. code-block:: bash

   python -m pip install --upgrade pyplotdesigner
