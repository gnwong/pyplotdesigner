import numpy as np
from pyplotdesigner.core.design import Design


def test_layout():

    json_b64 = "eyJlbGVtZW50cyI6W3siaWQiOiJheGlzLTAiLCJ0eXBlIjoiYXhpcyIsIngiOjAuMjMsInkiOjAuMTUsIndpZHRoIjowLjc2NSwiaGVpZ2h0IjoyLjYyLCJ0ZXh0IjoibGVmdF9wYW5lbCJ9LHsiaWQiOiJheGlzLTEiLCJ0eXBlIjoiYXhpcyIsIngiOjEuMTk1LCJ5IjowLjE1LCJ3aWR0aCI6MC43NjUsImhlaWdodCI6Mi42MiwidGV4dCI6ImNlbnRlcl9sZWZ0In0seyJpZCI6ImF4aXMtMiIsInR5cGUiOiJheGlzIiwieCI6Mi4zMywieSI6MS40OTUsIndpZHRoIjoxLjAyLCJoZWlnaHQiOjEuMjc1LCJ0ZXh0IjoidXBwZXJfbGVmdF9wYW5lbCJ9LHsiaWQiOiJheGlzLTMiLCJ0eXBlIjoiYXhpcyIsIngiOjMuNTUsInkiOjEuNDk1LCJ3aWR0aCI6MS4yNzUsImhlaWdodCI6MS4yNzUsInRleHQiOiJyaWdodCJ9LHsiaWQiOiJheGlzLTQiLCJ0eXBlIjoiYXhpcyIsIngiOjIuMzMsInkiOjAuMTU1LCJ3aWR0aCI6Mi41LCJoZWlnaHQiOjEuMSwidGV4dCI6IndpZGUifV0sImNvbnN0cmFpbnRzIjpbeyJ0YXJnZXQiOnsiaWQiOiJheGlzLTAiLCJhdHRyIjoieCJ9LCJzb3VyY2UiOnsiaWQiOm51bGwsImF0dHIiOm51bGx9LCJtdWx0aXBseSI6eyJpZCI6bnVsbCwiYXR0ciI6MX0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjB9LCJhZGRfYWZ0ZXIiOnsiaWQiOiJ4X29mZnNldCIsImF0dHIiOm51bGx9fSx7InRhcmdldCI6eyJpZCI6ImF4aXMtMCIsImF0dHIiOiJ5In0sInNvdXJjZSI6eyJpZCI6bnVsbCwiYXR0ciI6bnVsbH0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MH0sImFkZF9hZnRlciI6eyJpZCI6Inlfb2Zmc2V0IiwiYXR0ciI6bnVsbH19LHsidGFyZ2V0Ijp7ImlkIjoiYXhpcy0xIiwiYXR0ciI6InkifSwic291cmNlIjp7ImlkIjoiYXhpcy0wIiwiYXR0ciI6InkifSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjF9LCJhZGRfYmVmb3JlIjp7ImlkIjpudWxsLCJhdHRyIjowfSwiYWRkX2FmdGVyIjp7ImlkIjpudWxsLCJhdHRyIjowfX0seyJ0YXJnZXQiOnsiaWQiOiJheGlzLTEiLCJhdHRyIjoieCJ9LCJzb3VyY2UiOnsiaWQiOiJheGlzLTAiLCJhdHRyIjoicmlnaHQifSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjF9LCJhZGRfYmVmb3JlIjp7ImlkIjpudWxsLCJhdHRyIjowfSwiYWRkX2FmdGVyIjp7ImlkIjoiaF9zcGFjaW5nX3NtYWxsIiwiYXR0ciI6bnVsbH19LHsidGFyZ2V0Ijp7ImlkIjoiYXhpcy00IiwiYXR0ciI6InkifSwic291cmNlIjp7ImlkIjoiYXhpcy0xIiwiYXR0ciI6InkifSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjF9LCJhZGRfYmVmb3JlIjp7ImlkIjpudWxsLCJhdHRyIjowfSwiYWRkX2FmdGVyIjp7ImlkIjpudWxsLCJhdHRyIjowfX0seyJ0YXJnZXQiOnsiaWQiOiJheGlzLTMiLCJhdHRyIjoieCJ9LCJzb3VyY2UiOnsiaWQiOiJheGlzLTIiLCJhdHRyIjoicmlnaHQifSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjF9LCJhZGRfYmVmb3JlIjp7ImlkIjpudWxsLCJhdHRyIjowfSwiYWRkX2FmdGVyIjp7ImlkIjoiaF9zcGFjaW5nX3NtYWxsIiwiYXR0ciI6bnVsbH19LHsidGFyZ2V0Ijp7ImlkIjoiYXhpcy00IiwiYXR0ciI6IngifSwic291cmNlIjp7ImlkIjoiYXhpcy0xIiwiYXR0ciI6InJpZ2h0In0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MH0sImFkZF9hZnRlciI6eyJpZCI6Imhfc3BhY2luZ19sYXJnZSIsImF0dHIiOm51bGx9fSx7InRhcmdldCI6eyJpZCI6ImF4aXMtMyIsImF0dHIiOiJ5In0sInNvdXJjZSI6eyJpZCI6ImF4aXMtMiIsImF0dHIiOiJ5In0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MH19LHsidGFyZ2V0Ijp7ImlkIjoiYXhpcy0yIiwiYXR0ciI6InkifSwic291cmNlIjp7ImlkIjoiYXhpcy00IiwiYXR0ciI6InRvcCJ9LCJtdWx0aXBseSI6eyJpZCI6bnVsbCwiYXR0ciI6MX0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjB9LCJhZGRfYWZ0ZXIiOnsiaWQiOiJ2X3NwYWNpbmciLCJhdHRyIjpudWxsfX0seyJ0YXJnZXQiOnsiaWQiOiJheGlzLTEiLCJhdHRyIjoid2lkdGgifSwic291cmNlIjp7ImlkIjoiYXhpcy0wIiwiYXR0ciI6IndpZHRoIn0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MH19LHsidGFyZ2V0Ijp7ImlkIjoiYXhpcy0wIiwiYXR0ciI6ImhlaWdodCJ9LCJzb3VyY2UiOnsiaWQiOiJheGlzLTEiLCJhdHRyIjoiaGVpZ2h0In0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MH19LHsidGFyZ2V0Ijp7ImlkIjoiYXhpcy0zIiwiYXR0ciI6IndpZHRoIn0sInNvdXJjZSI6eyJpZCI6bnVsbCwiYXR0ciI6bnVsbH0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjotMX0sImFkZF9iZWZvcmUiOnsiaWQiOiJheGlzLTMiLCJhdHRyIjoieCJ9LCJhZGRfYWZ0ZXIiOnsiaWQiOiJheGlzLTQiLCJhdHRyIjoicmlnaHQifX0seyJ0YXJnZXQiOnsiaWQiOiJheGlzLTQiLCJhdHRyIjoid2lkdGgifSwic291cmNlIjp7ImlkIjpudWxsLCJhdHRyIjpudWxsfSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjF9LCJhZGRfYmVmb3JlIjp7ImlkIjpudWxsLCJhdHRyIjoyLjV9LCJhZGRfYWZ0ZXIiOnsiaWQiOm51bGwsImF0dHIiOjB9fSx7InRhcmdldCI6eyJpZCI6ImF4aXMtNCIsImF0dHIiOiJoZWlnaHQifSwic291cmNlIjp7ImlkIjoiYXhpcy0xIiwiYXR0ciI6ImhlaWdodCJ9LCJtdWx0aXBseSI6eyJpZCI6bnVsbCwiYXR0ciI6MC40Mn0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjB9LCJhZGRfYWZ0ZXIiOnsiaWQiOm51bGwsImF0dHIiOjB9fSx7InRhcmdldCI6eyJpZCI6ImF4aXMtMiIsImF0dHIiOiJ4In0sInNvdXJjZSI6eyJpZCI6ImF4aXMtNCIsImF0dHIiOiJ4In0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MH19LHsidGFyZ2V0Ijp7ImlkIjoiYXhpcy0yIiwiYXR0ciI6IndpZHRoIn0sInNvdXJjZSI6eyJpZCI6ImF4aXMtMiIsImF0dHIiOiJoZWlnaHQifSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjAuOH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjB9LCJhZGRfYWZ0ZXIiOnsiaWQiOm51bGwsImF0dHIiOjB9fSx7InRhcmdldCI6eyJpZCI6ImF4aXMtMiIsImF0dHIiOiJoZWlnaHQifSwic291cmNlIjp7ImlkIjpudWxsLCJhdHRyIjpudWxsfSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOi0xfSwiYWRkX2JlZm9yZSI6eyJpZCI6ImF4aXMtMiIsImF0dHIiOiJ5In0sImFkZF9hZnRlciI6eyJpZCI6ImF4aXMtMSIsImF0dHIiOiJ0b3AifX0seyJ0YXJnZXQiOnsiaWQiOiJheGlzLTMiLCJhdHRyIjoiaGVpZ2h0In0sInNvdXJjZSI6eyJpZCI6bnVsbCwiYXR0ciI6bnVsbH0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxfSwiYWRkX2JlZm9yZSI6eyJpZCI6ImF4aXMtMiIsImF0dHIiOiJoZWlnaHQifSwiYWRkX2FmdGVyIjp7ImlkIjpudWxsLCJhdHRyIjowfX1dLCJjb25zdGFudHMiOlt7ImlkIjoieV9vZmZzZXQiLCJ2YWx1ZSI6MC4xNX0seyJpZCI6Imhfc3BhY2luZ19zbWFsbCIsInZhbHVlIjowLjJ9LHsiaWQiOiJoX3NwYWNpbmdfbGFyZ2UiLCJ2YWx1ZSI6MC4zN30seyJpZCI6InZfc3BhY2luZyIsInZhbHVlIjowLjI0fSx7ImlkIjoieF9vZmZzZXQiLCJ2YWx1ZSI6MC4yM31dLCJ2aWV3cG9ydCI6eyJ3aWR0aCI6MjI1MiwiaGVpZ2h0IjoxMDAwLCJzY2FsZSI6MjAwLCJmaWd1cmVXaWR0aCI6NiwiZmlndXJlSGVpZ2h0Ijo0fX0="
    design = Design()
    design.load(json_b64)

    # check figure dimensions
    assert design.get_figure_width() == 6
    assert design.get_figure_height() == 4

    # check that we loaded all of the constants, elements, and constraints
    assert len(design.elements) == 5
    assert len(design.constants) == 5
    assert len(design.constraints) == 18

    # check elements are in the positions and sizes that we expect
    known_values = {
        'axis-0': (0.23, 0.15, 0.765, 2.62, "left_panel"),
        'axis-1': (1.195, 0.15, 0.765, 2.62, "center_left"),
        'axis-2': (2.33, 1.495, 1.02, 1.275, "upper_left_panel"),
        'axis-3': (3.55, 1.495, 1.275, 1.275, "right"),
        'axis-4': (2.33, 0.155, 2.5, 1.1, "wide")
    }
    for el_id, (x, y, width, height, name) in known_values.items():
        el = design.get_element(el_id)
        assert np.allclose(el._x, x)
        assert np.allclose(el._y, y)
        assert np.allclose(el._width, width)
        assert np.allclose(el._height, height)
        assert el.text == name

    # adjust constant and constraint and base locations
    design.get_constant('x_offset').value.set(0.5)
    design.get_element('axis-0').width.set(0.25)
    design.get_constraint('axis-4', 'height').set_attribute('multiply', 0.24)

    # adjust a more complicated constraint
    h_spacing_small = design.get_constant('h_spacing_small')
    center_left_axis = design.get_element('axis-1')
    design.get_constraint('axis-2', 'x').set_attribute('add_after', h_spacing_small.value)
    design.get_constraint('axis-2', 'x').set_attribute('source', center_left_axis.right)

    # solve again
    design.solve()

    # check positions
    known_values = {
        'axis-0': (0.5, 0.15, 0.25, 2.62, "left_panel"),
        'axis-1': (0.95, 0.15, 0.25, 2.62, "center_left"),
        'axis-2': (1.4, 1.0188, 1.40096, 1.7512, "upper_left_panel"),
        'axis-3': (3.00096, 1.0188, 1.06904, 1.7512, "right"),
        'axis-4': (1.57, 0.15, 2.5, 0.6288, "wide")
    }
    for el_id, (x, y, width, height, name) in known_values.items():
        el = design.get_element(el_id)
        assert np.allclose(el._x, x)
        assert np.allclose(el._y, y)
        assert np.allclose(el._width, width)
        assert np.allclose(el._height, height)
        assert el.text == name


if __name__ == "__main__":

    test_layout()
