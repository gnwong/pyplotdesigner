# Changelog

All notable changes to this project are documented in this file.

## [0.6.0] - 2026-10-11

### Added
- Added `load_design()` and `make_figure_from_design()` so exported layouts can be edited in Python before rendering.
- Added a Match Dimensions preset and keyboard shortcuts for matching dimensions and aligning axes.
- Added user guides, a runnable worked example, and an API reference with Read the Docs build configuration.

### Changed
- Import/Export and Quick Copy now produce gzip-compressed layout strings with a `ppd1:` prefix. Legacy base64 layouts remain supported, and `design.get_b64_string()` retains its legacy output by default.
- Quick Copy now exposes the design object before figure creation, allowing named constants to be changed locally.

### Fixed
- Fixed constraint descriptions showing `undefined` instead of constant names.

## [0.5.2] - 2026-02-24

### Changed
- Add logo and improve README explanations.

## [0.5.1] - 2026-02-21

### Changed
- Improved wheel packaging so installed distributions consistently include the full GUI module and bundled webapp assets.

## [0.5.0] - 2026-02-18

### Changed
- Adopted semantic versioning (`MAJOR.MINOR.PATCH`), replacing the previous date-based versioning scheme (`YYYY.MM.DD`). No functional changes. This release coincides with yanking previous versioning scheme versions on pypi.

## [2026.2.17] - 2026-02-17

### Added
- Added a status bar in the GUI for clearer interaction feedback.
- Added direct selection from the canvas to speed up editing workflows.
- Added a quick-copy button in the GUI to copy generated output faster.
- Added extensive frontend end-to-end coverage (Playwright), including reset, layout equivalence, status bar, and export/import checks.

### Changed
- Improved handling of constants in the GUI and export action-sequence flow.
- Refined CSS/layout organization and unified styling behavior across views.
- Improved graphical mouseover hints and selection feedback in the web UI.
- Updated GUI behavior to better support source-as-variable workflows.

## [2025.7.21] - 2025-07-21

### Changed
- CSS cleanup and packaging update for the previous PyPI release.
