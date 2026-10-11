Troubleshooting
===============

Address already in use
----------------------

Another process is listening on the selected port. If it is an existing pyplotdesigner instance, open ``http://127.0.0.1:8080/ui`` or stop it with Ctrl+C in its terminal. You can also choose another port:

.. code-block:: bash

   python -m pyplotdesigner.gui.main --port 8081

Browser does not open
---------------------

Open ``http://127.0.0.1:8080/ui`` manually, substituting your chosen port. To run without automatically opening a browser:

.. code-block:: bash

   python -m pyplotdesigner.gui.main --no-browser

Changing a constant fails
-------------------------

``get_constant(name)`` returns ``None`` if the constant does not exist. Use its exact name from the GUI. Editing an axis property directly can have no lasting effect if a constraint controls it; edit that constraint's constant.

The layout stops updating
-------------------------

Check that the Python server is running. Circular or incompatible constraints can prevent solving; remove the conflicting relationship. Import-format errors appear in a dialog; export failures appear in the status bar.
