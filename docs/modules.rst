API reference
=============

Loading and rendering
---------------------

.. automodule:: pyplotdesigner.core.design_loader
   :members: load_design, make_figure_from_design, make_figure_from_b64

Design
------

Element IDs identify objects within a layout; axis names are the keys in the dictionary returned by the rendering functions. ``get_constant()`` and ``get_element()`` return ``None`` for unknown IDs.

.. autoclass:: pyplotdesigner.core.design.Design
   :members: get_constant, get_element, solve, load, get_b64_string, get_json_string, set_viewport, add_element, add_constant, add_constraint, get_constraint, remove_element_by_id

Values
------

Constants and axis properties expose a ``Variable`` with ``get()`` and ``set()``:

.. code-block:: python

   design.get_constant('spacing').value.get()
   design.get_constant('spacing').value.set(0.4)

.. autoclass:: pyplotdesigner.core.models.Variable
   :members: get, set
