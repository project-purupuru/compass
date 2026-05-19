# S0 spike — framing codec unit tests.
#
# Cycle: blender-adapter-2026-05-18 · Sprint 0 · Task 0.1
# THROWAWAY: self-deletes with spike.py after S0 audit (FR-0 contract).
#
# Proves the length-prefix codec (encode_frame / decode_frames) BEFORE the
# operator runs the addon in Blender — so a framing bug surfaces here, not in
# a confusing "Incomplete JSON" failure during the manual Task 0.2 run.
#
# Run: cd tools/blender-addon && python -m pytest tests/test_spike_framing.py -v
# (spike.py import-guards bpy, so this loads fine outside Blender.)

import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import spike  # noqa: E402 — path inserted above


def test_round_trip_single_frame():
    obj = {"cmdId": "abc", "op": "blender.data.listObjects", "ts": 1}
    frames, rest = spike.decode_frames(spike.encode_frame(obj))
    assert frames == [obj]
    assert rest == b""


def test_header_is_4_byte_big_endian():
    frame = spike.encode_frame({"k": "v"})
    body_len = len(frame) - spike.HEADER_BYTES
    assert struct.unpack(">I", frame[:4])[0] == body_len


def test_multiple_frames_in_one_buffer():
    a = spike.encode_frame({"n": 1})
    b = spike.encode_frame({"n": 2})
    frames, rest = spike.decode_frames(a + b)
    assert frames == [{"n": 1}, {"n": 2}]
    assert rest == b""


def test_partial_trailing_frame_is_held_back():
    full = spike.encode_frame({"n": 1})
    partial = spike.encode_frame({"n": 2})[:-3]  # 3 body bytes missing
    frames, rest = spike.decode_frames(full + partial)
    assert frames == [{"n": 1}]
    assert rest == partial  # incomplete frame preserved for next chunk


def test_chunk_boundary_split_mid_header():
    """Bytes can arrive split anywhere — even inside the 4-byte header."""
    whole = spike.encode_frame({"hello": "world"})
    buf = b""
    collected = []
    for i in range(len(whole)):  # feed one byte at a time
        buf += whole[i:i + 1]
        frames, buf = spike.decode_frames(buf)
        collected.extend(frames)
    assert collected == [{"hello": "world"}]
    assert buf == b""


def test_empty_buffer_yields_nothing():
    frames, rest = spike.decode_frames(b"")
    assert frames == []
    assert rest == b""


def test_large_payload_round_trip():
    """1 MB payload — the AP-1 'Incomplete JSON' regression class."""
    obj = {"blob": "x" * (1024 * 1024)}
    frames, rest = spike.decode_frames(spike.encode_frame(obj))
    assert frames == [obj]
    assert rest == b""
