/**
 * Command queue — typed enqueue / drain with input-lock check + CardCommitted emission.
 *
 * Per PRD r2 FR-12 + SDD r1 §6.5.
 *
 * Per orchestrator-flatline SKP-002 question (where does CardCommitted emit
 * from?): the queue emits it on accepted PlayCard enqueue. The resolver
 * later includes it in its semanticEvents output too (redundant for
 * downstream consumers but ensures the lifecycle event fires regardless of
 * whether the resolver is invoked synchronously).
 */

import type {
  CardDefinition,
  ContentDatabase,
  GameCommand,
  PlayCardCommand,
} from "../contracts/types";
import type { EventBus } from "./event-bus";
import type { InputLockRegistry } from "./input-lock";

export interface CommandQueue {
  enqueue(command: GameCommand): EnqueueResult;
  drain(): readonly GameCommand[];
  size(): number;
  reset(): void;
}

export type EnqueueResult =
  | { readonly accepted: true; readonly command: GameCommand }
  | { readonly accepted: false; readonly reason: string };

export interface CommandQueueDeps {
  readonly bus: EventBus;
  readonly lock: InputLockRegistry;
  readonly content: ContentDatabase;
  /** Lock-owner identity for player-initiated commands. */
  readonly playerOwnerId?: string;
}

const DEFAULT_PLAYER_OWNER = "player";

export function createCommandQueue(deps: CommandQueueDeps): CommandQueue {
  const queue: GameCommand[] = [];
  const playerOwner = deps.playerOwnerId ?? DEFAULT_PLAYER_OWNER;

  const isPlayerCommand = (cmd: GameCommand): boolean =>
    cmd.source === "player" || cmd.source === "tutorial";

  return {
    enqueue(command) {
      // Input-lock check for player commands
      if (isPlayerCommand(command) && deps.lock.isLockedByOther(playerOwner)) {
        if (command.type === "PlayCard") {
          deps.bus.emit({
            type: "CardPlayRejected",
            cardInstanceId: command.cardInstanceId,
            reason: "input_locked",
          });
        }
        return { accepted: false, reason: "input_locked" };
      }

      // PlayCard-specific validation: card must exist in content database
      if (command.type === "PlayCard") {
        const card = lookupPlayedCard(deps.content, command);
        if (!card) {
          deps.bus.emit({
            type: "CardPlayRejected",
            cardInstanceId: command.cardInstanceId,
            reason: "unknown_card_definition",
          });
          return { accepted: false, reason: "unknown_card_definition" };
        }
        // Emit CardCommitted (lifecycle event · resolver consumes downstream)
        deps.bus.emit({
          type: "CardCommitted",
          cardInstanceId: command.cardInstanceId,
          cardDefinitionId: card.id,
          target: command.target,
        });
      }

      queue.push(command);
      return { accepted: true, command };
    },
    drain() {
      const drained = [...queue];
      queue.length = 0;
      return drained;
    },
    size() {
      return queue.length;
    },
    reset() {
      queue.length = 0;
    },
  };
}

/**
 * Cycle-1 helper: PlayCardCommand carries `cardInstanceId` (instance id) but
 * the ContentDatabase is keyed by `definitionId`. For cycle 1 we treat
 * `cardInstanceId` as a free-form id that the test fixture maps to a known
 * definition (the resolver also accepts pre-resolved definitions).
 *
 * The fixture in `core_wood_demo_001` uses `hand_003` as the instance id and
 * the loader-built ContentDatabase has the definition under `wood_awakening`.
 * The queue looks up the definition via a definition-id hint or (for the
 * cycle-1 happy path) by trying the instance id as a definition id directly.
 */
function lookupPlayedCard(
  content: ContentDatabase,
  command: PlayCardCommand,
): CardDefinition | undefined {
  // Cycle-1: try the instance id as the definition id (works for replay fixtures
  // that use definitionId as instanceId). Cycle-2 will need a CardInstanceState
  // → definitionId resolution path through GameState.
  return content.getCardDefinition(command.cardInstanceId);
}
