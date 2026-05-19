// S0 spike — frame sender for the Task 0.2 manual calibration run.
//
// Cycle: blender-adapter-2026-05-18 · Sprint 0 · Task 0.2
// THROWAWAY: self-deletes with spike.py after S0 audit (FR-0 contract).
//
// Sends ONE length-prefixed frame to the spike addon listening inside
// Blender (127.0.0.1:9876), reads the framed echo, prints round-trip latency.
//
// Framing is [4-byte BE uint32 body-length][UTF-8 JSON body] — byte-identical
// to lib/blender/wire.ts encodeCommand / WireResponseDecoder. The Python side
// (spike.py decode_frames) is proven against this exact format by
// tests/test_spike_framing.py. Self-contained (no build step) on purpose so
// the operator can run it with a bare `node`.
//
// Run (with Blender open + spike addon enabled):
//   node tools/blender-addon/scripts/spike-send.mjs

import net from "node:net";

const HOST = "127.0.0.1";
const PORT = 9876;
const HEADER_BYTES = 4;

function encodeFrame(obj) {
  const body = Buffer.from(JSON.stringify(obj), "utf-8");
  const header = Buffer.alloc(HEADER_BYTES);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

function decodeFrames(buf) {
  const frames = [];
  let rest = buf;
  while (rest.length >= HEADER_BYTES) {
    const bodyLen = rest.readUInt32BE(0);
    const frameLen = HEADER_BYTES + bodyLen;
    if (rest.length < frameLen) break;
    frames.push(JSON.parse(rest.subarray(HEADER_BYTES, frameLen).toString("utf-8")));
    rest = rest.subarray(frameLen);
  }
  return { frames, rest };
}

const command = {
  cmdId: `s0-spike-${Date.now()}`,
  op: "blender.spike.echo",
  params: { probe: "length-prefix round-trip" },
  ts: Date.now(),
};

const sock = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log(`[spike-send] connected ${HOST}:${PORT}`);
  globalThis.__t0 = process.hrtime.bigint();
  sock.write(encodeFrame(command));
  console.log(`[spike-send] sent cmdId=${command.cmdId}`);
});

let inbound = Buffer.alloc(0);
sock.on("data", (chunk) => {
  inbound = Buffer.concat([inbound, chunk]);
  const { frames } = decodeFrames(inbound);
  if (frames.length > 0) {
    const dtMs = Number(process.hrtime.bigint() - globalThis.__t0) / 1e6;
    console.log(`[spike-send] echo received in ${dtMs.toFixed(3)}ms`);
    console.log(`[spike-send] echo body: ${JSON.stringify(frames[0])}`);
    const ok = JSON.stringify(frames[0]?.echo) === JSON.stringify(command);
    console.log(`[spike-send] round-trip integrity: ${ok ? "PASS" : "FAIL"}`);
    sock.end();
    process.exit(ok ? 0 : 1);
  }
});

sock.on("error", (err) => {
  console.error(`[spike-send] connection error — ${err.message}`);
  console.error("[spike-send] is Blender open with the S0 spike addon enabled?");
  process.exit(1);
});

setTimeout(() => {
  console.error("[spike-send] TIMEOUT — no framed echo within 10s");
  process.exit(1);
}, 10_000);
