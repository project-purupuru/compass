/**
 * Compass-Blender wire protocol · the framing schema.
 *
 * Solves the bug class "Incomplete JSON response received" that affects ALL
 * existing Blender MCP servers (ahujasid, sandraschi, Hermes, …) by
 * length-prefixing every frame with a 4-byte big-endian uint32 header.
 *
 * Reference: memory/reference_length-prefixed-framing-tcp-bug-class
 * Reference: grimoires/loa/context/blender-adapter-design-brief-2026-05-18.md
 *
 * Frame layout on the wire:
 *   [4 bytes: big-endian uint32 body-length][UTF-8 JSON body]
 *
 * The encoding/decoding helpers live alongside the schemas so producers and
 * consumers share one source of truth.
 */

import { Schema } from "effect";

// ── Command (client → Blender addon) ──────────────────────────────────────

/**
 * A single command from compass to the Blender addon. cmdId is the
 * idempotency key — if the response is lost mid-flight, the client can
 * retry with the same cmdId and the addon will dedupe.
 */
export const WireCommand = Schema.Struct({
  cmdId: Schema.String, // UUID v4 recommended
  op: Schema.String, // e.g. "blender.data.listObjects"
  params: Schema.Unknown, // op-specific (validated by op-handler schemas)
  ts: Schema.Number, // client wall-clock ms
});
export type WireCommandT = typeof WireCommand.Type;

// ── Response (Blender addon → client) ─────────────────────────────────────

export const WireResponseSuccess = Schema.Struct({
  _tag: Schema.Literal("Success"),
  cmdId: Schema.String,
  result: Schema.Unknown, // op-specific
  ts: Schema.Number, // server wall-clock ms
});

export const WireResponseError = Schema.Struct({
  _tag: Schema.Literal("Error"),
  cmdId: Schema.String,
  message: Schema.String,
  /**
   * Structured error kind for client-side branching. Keep this enum tight;
   * add a new variant only when client behavior must differ per kind.
   */
  kind: Schema.Literal(
    "BadParams", // schema validation failed at boundary
    "PollFailed", // bpy.ops.poll() returned false (wrong context)
    "BlenderError", // bpy raised an exception
    "Timeout", // op took longer than timeout budget
    "UnknownOp", // op name not registered in addon
    "EscapeHatchError", // run_python_code raised
  ),
  /**
   * Optional traceback (string) from Blender's try/except — never raw,
   * always sanitized of cwd / user paths if surfaced to a 3rd party.
   */
  traceback: Schema.optional(Schema.String),
  ts: Schema.Number,
});

export const WireResponse = Schema.Union(WireResponseSuccess, WireResponseError);
export type WireResponseT = typeof WireResponse.Type;

// ── Encoding / decoding helpers ───────────────────────────────────────────

const HEADER_BYTES = 4 as const;

/**
 * Encode a WireCommand to a length-prefixed Buffer ready for socket.write.
 *
 * Output layout:
 *   [4 bytes BE uint32 body-length][UTF-8 JSON body]
 */
export function encodeCommand(cmd: WireCommandT): Uint8Array {
  const body = new TextEncoder().encode(JSON.stringify(cmd));
  const frame = new Uint8Array(HEADER_BYTES + body.length);
  // Big-endian uint32 length header
  const view = new DataView(frame.buffer, frame.byteOffset, HEADER_BYTES);
  view.setUint32(0, body.length, false); // false = big-endian
  frame.set(body, HEADER_BYTES);
  return frame;
}

/**
 * Streaming-safe decoder for incoming wire bytes.
 *
 * The socket layer may deliver bytes in arbitrary chunks. Feed every chunk
 * into `feed()` and call `drain()` to pull out any complete frames whose
 * body bytes have all arrived.
 *
 * Returns parsed WireResponse values. Schema validation happens at the
 * boundary — invalid bodies surface as ParseError, NOT silent drops.
 */
export class WireResponseDecoder {
  private buffer: Uint8Array = new Uint8Array(0);

  feed(chunk: Uint8Array): void {
    if (this.buffer.length === 0) {
      this.buffer = chunk;
      return;
    }
    const next = new Uint8Array(this.buffer.length + chunk.length);
    next.set(this.buffer, 0);
    next.set(chunk, this.buffer.length);
    this.buffer = next;
  }

  /**
   * Pull all complete frames out of the buffer. Each returned value is a
   * raw JSON-parsed object that callers MUST Schema-validate via
   * `WireResponse` before trusting fields.
   */
  drainRaw(): unknown[] {
    const out: unknown[] = [];
    while (this.buffer.length >= HEADER_BYTES) {
      const view = new DataView(
        this.buffer.buffer,
        this.buffer.byteOffset,
        HEADER_BYTES,
      );
      const bodyLen = view.getUint32(0, false);
      const frameLen = HEADER_BYTES + bodyLen;
      if (this.buffer.length < frameLen) break; // incomplete · wait for more
      const bodyBytes = this.buffer.subarray(HEADER_BYTES, frameLen);
      const bodyText = new TextDecoder().decode(bodyBytes);
      out.push(JSON.parse(bodyText));
      this.buffer = this.buffer.subarray(frameLen);
    }
    return out;
  }

  /** Bytes still waiting for the rest of their frame. */
  pendingBytes(): number {
    return this.buffer.length;
  }
}
