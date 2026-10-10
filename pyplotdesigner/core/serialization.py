"""Read legacy base64 JSON and versioned gzip layout strings."""

import base64
import gzip
import json
import zlib


COMPRESSED_PREFIX = 'ppd1:'


def _validate_layout(payload):
    if not isinstance(payload, dict):
        raise ValueError('Layout must be a JSON object')
    for field in ('elements', 'constraints', 'constants'):
        if field in payload and not isinstance(payload[field], list):
            raise ValueError(f'Layout {field} must be a list')
    if 'viewport' in payload and payload['viewport'] is not None and \
            not isinstance(payload['viewport'], dict):
        raise ValueError('Layout viewport must be an object')


def encode_layout(payload, compressed=False):
    """Encode a layout, retaining the legacy format unless compression is requested."""
    _validate_layout(payload)
    raw = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    if compressed:
        raw = gzip.compress(raw, mtime=0)
    encoded = base64.b64encode(raw).decode('ascii')
    return COMPRESSED_PREFIX + encoded if compressed else encoded


def decode_layout(serialized):
    """Decode either format without changing layout values or identifiers."""
    if not isinstance(serialized, str):
        raise ValueError('Layout string must be text')
    serialized = serialized.strip()
    compressed = serialized.startswith(COMPRESSED_PREFIX)
    if compressed:
        serialized = serialized[len(COMPRESSED_PREFIX):]
    elif ':' in serialized:
        raise ValueError('Unsupported layout string version')
    try:
        # Browser atob() also accepts legacy strings with omitted padding.
        encoded = ''.join(serialized.split())
        encoded += '=' * (-len(encoded) % 4)
        raw = base64.b64decode(encoded, validate=True)
        if compressed:
            raw = gzip.decompress(raw)
        payload = json.loads(raw.decode('utf-8'))
    except (ValueError, OSError, EOFError, zlib.error) as exc:
        raise ValueError('Invalid layout string') from exc
    _validate_layout(payload)
    return payload
