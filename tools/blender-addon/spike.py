# Compass ↔ Blender Adapter — S0 Calibration Spike
#
# Cycle: blender-adapter-2026-05-18 · Sprint 0 · Task 0.1
# THROWAWAY: per the FR-0 contract this file self-deletes after S0 audit.
# It is NOT production code — it exists to surface real-Blender ground truth
# (length-prefix framing · 60 FPS timer feasibility · temp_override
# reachability · multi-file package loading) BEFORE S1 commits to a design.
#
# Mirrors the framing protocol in lib/blender/wire.ts:
#   frame = [4-byte BE uint32 body-length][UTF-8 JSON body]
#
# The framing codec (encode_frame / decode_frames) is pure and unit-tested
# in tests/test_spike_framing.py — bpy is import-guarded so the test can load
# this module outside Blender.

bl_info = {
    "name": "Compass Blender Adapter — S0 Calibration Spike",
    "author": "compass · blender-adapter-2026-05-18",
    "version": (0, 0, 1),
    "blender": (4, 5, 0),
    "category": "Development",
    "description": "S0 calibration spike — throwaway. Echoes one length-prefixed frame; probes 60FPS timer + temp_override.",
}

import json
import queue
import socket
import struct
import threading
import time

try:  # import-guarded so tests/test_spike_framing.py can load the codec
    import bpy
except ImportError:  # pragma: no cover — exercised only outside Blender
    bpy = None

HOST = "127.0.0.1"
PORT = 9876
HEADER_BYTES = 4
TIMER_INTERVAL_S = 0.016  # 60-FPS-equivalent · validates FR-5 r1
MAX_DRAIN_PER_TICK = 20
RECV_DEADLINE_S = 30.0


# ── Framing codec (pure · no bpy · unit-tested) ───────────────────────────

def encode_frame(obj):
    """dict → length-prefixed bytes. Mirrors wire.ts encodeCommand."""
    body = json.dumps(obj).encode("utf-8")
    return struct.pack(">I", len(body)) + body


def decode_frames(buf):
    """Streaming-safe. Returns (list_of_objs, remaining_buf).

    Pulls every COMPLETE frame out of buf; leaves a partial trailing frame
    in the remainder. Mirrors wire.ts WireResponseDecoder.drainRaw.
    """
    frames = []
    while len(buf) >= HEADER_BYTES:
        (body_len,) = struct.unpack(">I", buf[:HEADER_BYTES])
        frame_len = HEADER_BYTES + body_len
        if len(buf) < frame_len:
            break  # incomplete — wait for more bytes
        body = buf[HEADER_BYTES:frame_len]
        frames.append(json.loads(body.decode("utf-8")))
        buf = buf[frame_len:]
    return frames, buf


# ── Module-private state ──────────────────────────────────────────────────

_inbox = queue.Queue()
_stop = threading.Event()
_thread = None
_drain_latencies_ms = []
_temp_override_ok = None  # None=untested · True/False after first tick


def _accept_loop():
    """BG thread: bind, accept one connection, decode one frame, enqueue it.

    NEVER touches bpy — the echo + probes happen on the main thread.
    """
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        srv.bind((HOST, PORT))
    except OSError as exc:
        print(f"[spike] BIND FAILED on {HOST}:{PORT} — {exc}")
        srv.close()
        return
    srv.listen(1)
    srv.settimeout(0.5)
    print(f"[spike] listening on {HOST}:{PORT}")
    while not _stop.is_set():
        try:
            conn, _ = srv.accept()
        except socket.timeout:
            continue
        conn.settimeout(RECV_DEADLINE_S)
        buf = b""
        while not _stop.is_set():
            try:
                chunk = conn.recv(4096)
            except socket.timeout:
                print("[spike] recv deadline — closing half-open connection")
                break
            if not chunk:
                break
            buf += chunk
            frames, buf = decode_frames(buf)
            if frames:
                _inbox.put((conn, frames[0]))  # main thread owns the reply
                break
    srv.close()
    print("[spike] accept loop stopped")


def _drain_tick():
    """Main-thread timer callback: drain inbox, echo, probe, measure.

    Returns TIMER_INTERVAL_S to re-arm — wrapped in try/except so a single
    failure cannot kill the timer (the SKP-002-780 lesson, pre-applied).
    """
    global _temp_override_ok
    t0 = time.perf_counter()
    try:
        for _ in range(MAX_DRAIN_PER_TICK):
            try:
                conn, frame = _inbox.get_nowait()
            except queue.Empty:
                break
            # probe: is bpy.context.temp_override reachable from a timer cb?
            if _temp_override_ok is None and bpy is not None:
                try:
                    with bpy.context.temp_override():
                        pass
                    _temp_override_ok = True
                except Exception as exc:  # noqa: BLE001 — probe, record outcome
                    _temp_override_ok = False
                    print(f"[spike] temp_override UNREACHABLE — {exc}")
                print(f"[spike] temp_override reachable: {_temp_override_ok}")
            # echo the frame back, framed
            try:
                conn.sendall(encode_frame({"echo": frame}))
            except OSError as exc:
                print(f"[spike] echo send failed — {exc}")
            finally:
                conn.close()
    except Exception as exc:  # noqa: BLE001 — keep the timer alive
        print(f"[spike] drain tick error (timer survives) — {exc}")
    finally:
        dt_ms = (time.perf_counter() - t0) * 1000.0
        _drain_latencies_ms.append(dt_ms)
        if len(_drain_latencies_ms) % 120 == 0:  # ~every 2s at 60FPS
            ordered = sorted(_drain_latencies_ms)
            p50 = ordered[len(ordered) // 2]
            p99 = ordered[min(len(ordered) - 1, int(len(ordered) * 0.99))]
            print(f"[spike] drain latency p50={p50:.3f}ms p99={p99:.3f}ms "
                  f"(n={len(ordered)} · interval={TIMER_INTERVAL_S}s)")
    return TIMER_INTERVAL_S


def register():
    global _thread
    _stop.clear()
    _drain_latencies_ms.clear()
    _thread = threading.Thread(target=_accept_loop, name="spike-accept", daemon=True)
    _thread.start()
    if bpy is not None:
        bpy.app.timers.register(_drain_tick, persistent=True)
    print("[spike] registered — timer @ 60FPS · accept thread up")


def unregister():
    _stop.set()
    if bpy is not None:
        try:
            bpy.app.timers.unregister(_drain_tick)
        except (ValueError, Exception):  # noqa: BLE001 — idempotent teardown
            pass
    if _thread is not None:
        _thread.join(timeout=2.0)
        if _thread.is_alive():
            print("[spike] WARNING: accept thread did not join in 2s")
    print("[spike] unregistered")
