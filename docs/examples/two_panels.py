"""Load the tutorial layout, change spacing, and plot into its named axes."""

import matplotlib.pyplot as plt
import numpy as np
from pyplotdesigner.core.design_loader import load_design, make_figure_from_design


def make_example(spacing=0.4):
    import_string = (
        "ppd1:H4sIAAAAAAACA82TQW6DMBBF7zJrFzmk7YIT9AZdVFXkwgCWHGOZcQKKuHvtAKZEkcimVdnAoGf"
        "/Z5i5ACo8oqYWso8LyAIyEJ1snzgwoN7gVPuqg4wnrwz6cH9hcJYF1ZClScqgRlnV5Au/CDv/AApLOhi"
        "hUcHAfm68u7fxPuHr63kjJ+ExyYZXc9Qng7zRLVkh5zORsBV68FZCEFlfd94P2sbZHNcMX5hrROCOTpE"
        "0qp9J7ZSaqV3CPSGK4vCFZWPxHsMjI0pCGwNbI3Kpq5gY1gzhu23I9w/I978ofos8oDz+zm3tyP0f9an"
        "7tt0X8K/k574Xq0le2uoklMPApgE9STybxl5PWsrKWXwfh8yP91i/TYO2H4ZvqRWEXCMEAAA="
    )
    design = load_design(import_string)
    design.get_constant('spacing').value.set(spacing)
    fig, axes = make_figure_from_design(design)

    x = np.linspace(0, 2 * np.pi, 100)
    axes['left_panel'].plot(x, np.sin(x), color='#2463a6')
    axes['right_panel'].plot(x, np.cos(x), color='#bc562f')
    for name, title in [('left_panel', 'Sine'), ('right_panel', 'Cosine')]:
        axes[name].set_title(title)
        axes[name].set_xlabel('x')
    axes['left_panel'].set_ylabel('Amplitude')
    return fig, axes


if __name__ == '__main__':
    fig, axes = make_example()
    fig.savefig('two_panels.svg')
    plt.close(fig)
