import asyncio
import base64
import gzip
import json

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pytest
from fastapi import HTTPException, Request

from pyplotdesigner.core.design import Design
from pyplotdesigner.core.design_loader import (
    load_design, make_figure_from_b64, make_figure_from_design,
)
from pyplotdesigner.core.serialization import decode_layout, encode_layout
from pyplotdesigner.gui.main import export_layout, import_layout


def sample_layout():
    design = Design(figure_width=6, figure_height=4)
    axis = design.add_element(id='axis-0', type='axis', text='温度', x=0.25)
    gap = design.add_constant(id='gap', value=0.5)
    design.add_constraint(axis.width, gap.value, multiply=2)
    design.solve()
    payload = json.loads(design.get_json_string())
    payload['viewport'].update(width=1000, height=800, scale=120)
    return payload


@pytest.mark.parametrize('compressed', [False, True])
def test_layout_roundtrip_and_matplotlib(compressed):
    payload = sample_layout()
    serialized = encode_layout(payload, compressed=compressed)
    assert serialized.startswith('ppd1:') == compressed
    assert decode_layout(serialized) == payload
    fig, axes = make_figure_from_b64(serialized)
    try:
        assert list(axes) == ['温度']
        assert tuple(fig.get_size_inches()) == (6, 4)
        assert axes['温度'].get_position().width == pytest.approx(1 / 6)
    finally:
        plt.close(fig)


def test_python_export_keeps_legacy_default():
    design = Design()
    design.add_element(id='axis-0', type='axis', text='panel')
    legacy = design.get_b64_string()
    assert base64.b64decode(legacy).decode('utf-8') == design.get_json_string()
    compressed = design.get_b64_string(compressed=True)
    assert json.loads(gzip.decompress(base64.b64decode(compressed[5:]))) == \
        json.loads(design.get_json_string())
    loaded = Design()
    loaded.load(compressed)
    assert loaded.is_equivalent_to(design)


@pytest.mark.parametrize('compressed', [False, True])
def test_edit_loaded_constant_before_rendering(compressed):
    original = load_design(encode_layout(sample_layout()))
    first = original.get_element('axis-0')
    neighbor = original.add_element(id='axis-1', type='axis', text='neighbor')
    gap = original.get_constant('gap')
    original.add_constraint(neighbor.x, first.right, add_after=gap.value)
    original.solve()

    design = load_design(original.get_b64_string(compressed=compressed))
    assert isinstance(design, Design)
    assert design.get_element('axis-1').x.get() == pytest.approx(1.75)
    design.get_constant('gap').value.set(0.4)
    fig, axes = make_figure_from_design(design, dpi=160)
    try:
        assert fig.dpi == 160
        assert axes['温度'].get_position().width == pytest.approx(0.8 / 6)
        assert axes['neighbor'].get_position().x0 == pytest.approx(1.45 / 6)
        assert design.get_element('axis-0').width.get() == pytest.approx(0.8)
        assert design.get_element('axis-1').x.get() == pytest.approx(1.45)
        assert original.get_constant('gap').value.get() == 0.5
    finally:
        plt.close(fig)


def request_with_json(payload):
    async def receive():
        return {'type': 'http.request', 'body': json.dumps(payload).encode('utf-8')}
    return Request({'type': 'http', 'method': 'POST', 'headers': []}, receive)


def test_server_export_preserves_browser_payload():
    payload = sample_layout()
    result = asyncio.run(export_layout(request_with_json(payload)))
    assert result['layout_string'].startswith('ppd1:')
    assert decode_layout(result['layout_string']) == payload
    fig, axes = make_figure_from_b64(result['layout_string'])
    plt.close(fig)
    assert '温度' in axes


@pytest.mark.parametrize('compressed', [False, True])
def test_server_import_supports_both_formats(compressed):
    payload = sample_layout()
    request = request_with_json({'layout_string': encode_layout(payload, compressed)})
    assert asyncio.run(import_layout(request)) == payload


@pytest.mark.parametrize('serialized', [
    '', 'not base64!', 'ppd2:AAAA', None,
    'ppd1:' + base64.b64encode(b'{}').decode(),
    'ppd1:' + base64.b64encode(gzip.compress(b'{}')[:-4]).decode(),
    'ppd1:' + base64.b64encode(gzip.compress(b'{}')[:10] + b'\x07' + b'\x00' * 8).decode(),
    base64.b64encode(b'[]').decode(),
    base64.b64encode(b'{"elements": 1}').decode(),
])
def test_invalid_import_is_reported(serialized):
    with pytest.raises(ValueError):
        decode_layout(serialized)
    with pytest.raises(HTTPException) as error:
        asyncio.run(import_layout(request_with_json({'layout_string': serialized})))
    assert error.value.status_code == 400


def test_compressed_import_accepts_surrounding_whitespace():
    payload = sample_layout()
    assert decode_layout('\n ' + encode_layout(payload, True) + '\n') == payload


@pytest.mark.parametrize('compressed', [False, True])
def test_import_accepts_omitted_base64_padding(compressed):
    payload = sample_layout()
    assert decode_layout(encode_layout(payload, compressed).rstrip('=')) == payload


def test_invalid_export_is_reported():
    with pytest.raises(HTTPException) as error:
        asyncio.run(export_layout(request_with_json([])))
    assert error.value.status_code == 400
