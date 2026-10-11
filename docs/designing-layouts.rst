Designing layouts
=================

Coordinates and names
---------------------

Pyplotdesigner measures axis positions and dimensions in inches. **X** and **Y** locate the lower-left corner, and **Width** and **Height** describe the axes rectangle. The origin is the lower-left corner of the figure. You can use **Set Layout** to change the figure dimensions and the editor's display scale in pixels per inch. When creating the figure, pyplotdesigner converts these measurements to the fractions of figure width and height used by Matplotlib.

The rectangle defines the plotting area. Tick labels, titles, and legends can extend beyond it. Saving with ``bbox_inches='tight'`` is useful because it automatically expands the saved bounding box to include content outside the nominal figure boundary and trims unused outer space, so you do not need to fit everything within the figure size chosen in the designer since the axes keep their physical sizes and spacing. Figure creation uses explicit axes positions; leave automatic layout tools such as ``tight_layout()`` off when you want to preserve this placement.

If the figure needs to fit a specific publication width, designing at that final size also lets you choose font sizes directly in points. For example, 10-point text stays 10-point text when the saved figure is placed at its original physical size. Resizing the image afterward scales the text too. To preserve the exact figure dimensions, fit the axes and their labels within the chosen boundary and save without a tight bounding box. If your Matplotlib settings enable tight cropping by default, set ``matplotlib.rcParams['savefig.bbox'] = None`` before saving.

.. code-block:: python

   fig.savefig('my_figure.pdf', bbox_inches='tight')

An axis has an internal ID such as ``axis-0`` and a separate name such as ``left_panel``. Renaming an axis in the inspector changes its name, not its ID. Use distinct names: duplicate names overwrite earlier entries in the returned ``axes`` dictionary.

Free properties and constraints
-------------------------------

A property without a constraint keeps the value you enter in the inspector or set by dragging. A constraint determines that property's value using another axis, a constant, or a number. Updates go to the Python server, which solves the constraints and returns the resulting positions. Dragging submits the update when you release the mouse.

The custom constraint editor displays:

.. code-block:: text

   target = a + m * (source + b)

Here ``a`` is added after multiplication, ``m`` is the multiplier, and ``b`` is added before multiplication. These values can reference constants or axis properties.

For example, you can position the right panel relative to the left panel using a constant named ``spacing``:

.. code-block:: text

   right_panel.x = left_panel.right + spacing

In the right panel's **X** constraint, choose the left panel's ``right`` as **Source**, select ``spacing`` for **a**, and leave **m = 1** and **b = 0**. ``right`` means ``x + width``. Other available properties include ``top``, ``bottom``, ``left``, ``center_x``, and ``center_y``.

The lock button adds a constraint fixing a property to its current value. Delete that constraint to make it free again. Use one constraint per target and avoid circular relationships.

Named constants
---------------

Click **Add Constant**, select it in the list, and give it a name and numeric value. Reference it from constraints to control several properties together. Distances use inches; ratios and multipliers are dimensionless.

One ``spacing`` constant can control several subplot gaps. After export, edit it in Python as described in :doc:`using-python`.

Presets and shortcuts
---------------------

Select the target axis first, choose a preset, then select the source axis from the canvas or list. The status bar describes the pending selection; Escape cancels it. Shortcuts apply when you are not typing into a field.

.. list-table::
   :header-rows: 1

   * - Preset
     - Key
     - Relationship
   * - Match Dimensions
     - D
     - Match width and height
   * - Match Width
     - W
     - Match width
   * - Match Height
     - H
     - Match height
   * - Align Left
     - L
     - Match x position
   * - Align Bottom
     - B
     - Match y position

Saving your work
----------------

**Import/Export** saves a portable string. **Quick Copy** wraps it in Python code. The string contains axes, constants, constraints, and viewport settings; it does not include plotted data or Matplotlib styling.

Autosave uses this browser's local storage. **Reset** clears the saved layout.
