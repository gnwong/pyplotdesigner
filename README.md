<img alt="pyplotdesigner" src="docs/assets/pyplotdesigner-icon.svg" width="400">

Design matplotlib figure layouts visually, then reuse them in Python.

PyPI package: https://pypi.org/project/pyplotdesigner/

## Quickstart (recommended: PyPI)

## 1) Install with pip
```bash
pip install -U pip
pip install pyplotdesigner
```

## 2) Start the GUI
```bash
python -m pyplotdesigner.gui.main
```

This opens your browser automatically. If it does not, open:
- `http://127.0.0.1:8080/ui`

Optional:
- `python -m pyplotdesigner.gui.main --no-browser` (disable auto-open)
- `python -m pyplotdesigner.gui.main --reload` (enable auto-reload for dev)

## 3) Build a layout in the GUI
1. Click **Add Axis**.
2. Drag boxes into place.
3. Add constraints (align, match size, aspect ratio, spacing, etc.).
4. Click **Quick Copy** to copy the code directly to your clipboard or alternatively click **Import/Export** for access to the layout string.

## 4) Use the exported layout in Python
```python
# following lines will be automatically copied to your clipboard
from pyplotdesigner.core.design_loader import make_figure_from_b64
layout_b64 = "PASTE_EXPORTED_STRING"
fig, axes = make_figure_from_b64(layout_b64)

# example usage:
# left_panel = axes['left_panel']
# left_panel.plot([0, 1], [0, 1])
```

## If you need to: clone and install locally
```bash
git clone git@github.com:gnwong/pyplotdesigner.git
cd pyplotdesigner
pip install -U pip
pip install -e .
```

## Run tests
```bash
pip install pytest
pytest
```

## Frontend E2E tests (Playwright)
These tests exercise the real browser UI against the FastAPI app.

Install once:
```bash
npm install
npx playwright install chromium
```

Run E2E suite:
```bash
npm run e2e
```

Useful variants:
```bash
npm run e2e:headed
npm run e2e:ui
```

## Contributing
Contributions are welcome.

Expected workflow:
1. Open an issue (or reference an existing one) describing the change.
2. Create a focused branch and implement the change.
3. Add or update tests for any new feature or behavior change.
4. Run tests locally (`pytest`) and make sure they pass.
5. Open a PR with a clear summary and testing notes.

Guidelines:
- Keep changes focused and minimal.
- Preserve existing behavior unless your PR intentionally changes it.
- If behavior changes, document it and include regression coverage.

## License
MIT (see `LICENSE`).
