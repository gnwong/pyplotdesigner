Editing and building the docs
=============================

The source for the documentation lives in ``docs/``. You can edit the ``.rst`` files as ordinary text, then build them to inspect the result. The API reference reads Python docstrings.

Local build
-----------

From the repository root, install the package and documentation tools into your chosen Python environment:

.. code-block:: bash

   python -m pip install -e .
   python -m pip install -r docs/requirements.txt
   python -m sphinx -b html -W --keep-going docs docs/_build/html

Open ``docs/_build/html/index.html`` in your browser. Alternatively, serve the built files locally:

.. code-block:: bash

   python -m http.server 8090 --bind 127.0.0.1 --directory docs/_build/html

Then open ``http://127.0.0.1:8090``. Stop the preview server with Ctrl+C.

Check the examples
------------------

.. code-block:: bash

   python -m sphinx -b doctest -W --keep-going docs docs/_build/doctest

This executes the worked example, including its subplot-spacing assertions. Both commands fail on warnings so missing references and broken examples can be fixed before publishing.

Source format
-------------

A small reStructuredText page looks like this:

.. code-block:: rst

   My page
   =======

   Explain the feature in a paragraph.

   .. code-block:: python

      design.get_constant('spacing').value.set(0.4)

Add a new page's filename, without ``.rst``, to the ``toctree`` in ``docs/index.rst`` to include it in navigation.
