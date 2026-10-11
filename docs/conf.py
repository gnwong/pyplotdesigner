"""Sphinx settings for local builds and Read the Docs."""

from pathlib import Path
import os
import sys

DOCS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(DOCS_DIR.parent))
os.environ.setdefault('MPLBACKEND', 'Agg')

project = 'pyplotdesigner'
copyright = '2023–2026, George N. Wong'
author = 'George N. Wong'
extensions = ['sphinx.ext.autodoc', 'sphinx.ext.doctest']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']
html_theme = 'sphinx_rtd_theme'
html_logo = 'assets/pyplotdesigner-icon.svg'
html_theme_options = {
    'logo_only': True,
    'style_nav_header_background': '#f4f8fb',
}
html_static_path = ['_static']
html_css_files = ['custom.css']
html_baseurl = os.environ.get('READTHEDOCS_CANONICAL_URL', '')
doctest_global_setup = (
    'from pathlib import Path\n'
    'import matplotlib.pyplot as plt\n'
    f'example_dir = Path({str(DOCS_DIR / "examples")!r})\n'
)
doctest_global_cleanup = 'plt.close("all")'
