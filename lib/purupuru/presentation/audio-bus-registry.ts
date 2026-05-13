/**
 * Audio-bus registry — audio routing channels for presentation beats.
 *
 * Per SDD r1 §3 / §6 + Codex SKP-HIGH-005.
 */

import type { ContentId } from "../contracts/types";

export type AudioBusId = ContentId;

export interface AudioBusHandle {
  readonly id: AudioBusId;
  readonly registeredAt: number;
}

export interface AudioBusRegistry {
  register(id: AudioBusId): AudioBusHandle;
  get(id: AudioBusId): AudioBusHandle | undefined;
  has(id: AudioBusId): boolean;
  unregister(id: AudioBusId): boolean;
  reset(): void;
  list(): readonly AudioBusId[];
}

export function createAudioBusRegistry(): AudioBusRegistry {
  const map = new Map<AudioBusId, AudioBusHandle>();
  return {
    register(id) {
      const h: AudioBusHandle = { id, registeredAt: performance.now() };
      map.set(id, h);
      return h;
    },
    get(id) {
      return map.get(id);
    },
    has(id) {
      return map.has(id);
    },
    unregister(id) {
      return map.delete(id);
    },
    reset() {
      map.clear();
    },
    list() {
      return [...map.keys()];
    },
  };
}
