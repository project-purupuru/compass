/**
 * Purupuru runtime contracts — TypeScript types
 *
 * Hand-authored from `~/Downloads/purupuru_architecture_harness/contracts/purupuru.contracts.ts`
 * (advisory pseudocode per its own header) into runtime TypeScript that compiles against the
 * vendored JSON Schemas at `lib/purupuru/schemas/`.
 *
 * Per PRD r2 D2 + SDD r1 §3:
 *   • JSON Schemas are CANONICAL for persisted-content shape
 *   • This file is ADVISORY for runtime boundaries
 *   • Loader normalizes YAML `resolver.steps` → TS `resolverSteps` (camelCase mapper)
 *
 * Per SDD r1 §3.2: SemanticEvent union has 15 members. README §9 lists 5 additional names
 * (CardConsumed · ZoneBecameValidTarget · ZonePreviewed · DaemonRoutineChanged · TurnEnded)
 * which are README-only and deferred from cycle 1.
 *
 * Per PRD r2 D4 + SDD r1 §3.4: ResolverStep op union has 6 ops (5 active + daemon_assist
 * reserved as no-op stub for cycle-2 forward-compatibility).
 */

// ────────────────────────────────────────────────────────────────────────────
// Core identifiers
// ────────────────────────────────────────────────────────────────────────────

export type ElementId = "wood" | "fire" | "water" | "metal" | "earth";

export type EntityId = string;
export type ContentId = string;
export type LocalizationKey = string;

// ────────────────────────────────────────────────────────────────────────────
// State machines (harness §7)
// ────────────────────────────────────────────────────────────────────────────

export type UiMode =
  | "Boot"
  | "Loading"
  | "WorldMapIdle"
  | "CardHovered"
  | "CardArmed"
  | "Targeting"
  | "Confirming"
  | "Resolving"
  | "RewardPreview"
  | "TurnEnding"
  | "DayTransition";

export type CardLocation =
  | "InDeck"
  | "Drawn"
  | "InHand"
  | "Hovered"
  | "Armed"
  | "Committed"
  | "Resolving"
  | "Discarded"
  | "Exhausted"
  | "ReturnedToHand";

export type ZoneState =
  | "Locked"
  | "Idle"
  | "ValidTarget"
  | "InvalidTarget"
  | "Previewed"
  | "Active"
  | "Resolving"
  | "Afterglow"
  | "Resolved"
  | "Exhausted";

export type DaemonState =
  | "Hidden"
  | "IdleRoutine"
  | "Notice"
  | "React"
  | "Assist"
  | "ReturnToIdle";

// ────────────────────────────────────────────────────────────────────────────
// Game state
// ────────────────────────────────────────────────────────────────────────────

export interface WeatherState {
  readonly activeElement: ElementId;
  readonly intensity: number;
  readonly scope: "localized" | "global";
}

export interface CardInstanceState {
  readonly instanceId: EntityId;
  readonly definitionId: ContentId;
  readonly location: CardLocation;
  readonly ownerId: EntityId;
}

export interface ZoneRuntimeState {
  readonly zoneId: EntityId;
  readonly elementId: ElementId;
  readonly state: ZoneState;
  readonly activeEventIds: ContentId[];
  readonly activationLevel: number;
}

export interface DaemonRuntimeState {
  readonly daemonId: EntityId;
  readonly elementId: ElementId;
  readonly state: DaemonState;
  readonly zoneId?: EntityId;
  readonly currentRoutineId?: ContentId;
}

export interface GameState {
  readonly runId: string;
  readonly turn: number;
  readonly day: number;
  readonly weather: WeatherState;
  readonly activeZoneId?: EntityId;
  readonly cards: Record<EntityId, CardInstanceState>;
  readonly zones: Record<EntityId, ZoneRuntimeState>;
  readonly daemons: Record<EntityId, DaemonRuntimeState>;
  readonly resources: Record<ContentId, number>;
  readonly flags: Record<string, boolean | number | string>;
}

// ────────────────────────────────────────────────────────────────────────────
// Commands (harness §4.1 + SDD §3.3)
// ────────────────────────────────────────────────────────────────────────────

export interface CommandBase {
  readonly commandId: string;
  readonly issuedAtTurn: number;
  readonly source: "player" | "system" | "tutorial" | "replay";
}

export type TargetRef =
  | { readonly kind: "zone"; readonly zoneId: EntityId }
  | { readonly kind: "daemon"; readonly daemonId: EntityId }
  | { readonly kind: "card"; readonly cardInstanceId: EntityId }
  | { readonly kind: "self" };

export interface PlayCardCommand extends CommandBase {
  readonly type: "PlayCard";
  readonly cardInstanceId: EntityId;
  readonly target: TargetRef;
}

export interface EndTurnCommand extends CommandBase {
  readonly type: "EndTurn";
}

export interface ActivateZoneCommand extends CommandBase {
  readonly type: "ActivateZone";
  readonly zoneId: EntityId;
  readonly elementId: ElementId;
  readonly activationLevelDelta: number;
}

export interface SpawnEventCommand extends CommandBase {
  readonly type: "SpawnEvent";
  readonly eventId: ContentId;
  readonly zoneId: EntityId;
}

export interface GrantRewardCommand extends CommandBase {
  readonly type: "GrantReward";
  readonly rewardType:
    | "resource"
    | "card"
    | "daemon_affinity"
    | "story_flag"
    | "cosmetic";
  readonly id: ContentId;
  readonly quantity: number;
}

export type GameCommand =
  | PlayCardCommand
  | EndTurnCommand
  | ActivateZoneCommand
  | SpawnEventCommand
  | GrantRewardCommand;

// ────────────────────────────────────────────────────────────────────────────
// Semantic events — 15 members (harness §9 lists 20 names; 5 are README-only)
// ────────────────────────────────────────────────────────────────────────────

export type SemanticEvent =
  | { readonly type: "CardHovered"; readonly cardInstanceId: EntityId }
  | { readonly type: "CardArmed"; readonly cardInstanceId: EntityId }
  | {
      readonly type: "TargetPreviewed";
      readonly cardInstanceId: EntityId;
      readonly target: TargetRef;
      readonly valid: boolean;
    }
  | {
      readonly type: "TargetCommitted";
      readonly cardInstanceId: EntityId;
      readonly target: TargetRef;
    }
  | {
      readonly type: "CardPlayRejected";
      readonly cardInstanceId: EntityId;
      readonly reason: string;
    }
  | {
      readonly type: "CardCommitted";
      readonly cardInstanceId: EntityId;
      readonly cardDefinitionId: ContentId;
      readonly target: TargetRef;
    }
  | {
      readonly type: "CardResolved";
      readonly cardInstanceId: EntityId;
      readonly cardDefinitionId: ContentId;
    }
  | {
      readonly type: "ZoneActivated";
      readonly zoneId: EntityId;
      readonly elementId: ElementId;
      readonly activationLevel: number;
    }
  | {
      readonly type: "ZoneEventStarted";
      readonly zoneId: EntityId;
      readonly eventId: ContentId;
    }
  | {
      readonly type: "ZoneEventResolved";
      readonly zoneId: EntityId;
      readonly eventId: ContentId;
    }
  | {
      readonly type: "DaemonReacted";
      readonly daemonId: EntityId;
      readonly reactionSetId: ContentId;
      readonly zoneId?: EntityId;
    }
  | {
      readonly type: "RewardGranted";
      readonly rewardType: string;
      readonly id: ContentId;
      readonly quantity: number;
    }
  | {
      readonly type: "WeatherChanged";
      readonly activeElement: ElementId;
      readonly scope: "localized" | "global";
    }
  | {
      readonly type: "InputLocked";
      readonly ownerId: ContentId;
      readonly mode: "soft" | "hard";
    }
  | { readonly type: "InputUnlocked"; readonly ownerId: ContentId };

/** Marker events not in the typed SemanticEvent union (cycle-2 will promote to typed). */
export interface SemanticMarker {
  readonly type: "TurnEnded";
}

// ────────────────────────────────────────────────────────────────────────────
// Resolver (harness §4.1 + SDD §3.4 + §3.5)
// ────────────────────────────────────────────────────────────────────────────

export type ResolverOpKind =
  | "activate_zone"
  | "spawn_event"
  | "grant_reward"
  | "set_flag"
  | "add_resource"
  | "daemon_assist"; // RESERVED for cycle-2 · cycle-1 returns no-op stub

export type ResolverOpScope =
  | "self"
  | "target_zone"
  | "target_daemon"
  | "adjacent_zones"
  | "all_zones"
  | "global_map";

export interface ResolverStep {
  readonly id: ContentId;
  readonly op: ResolverOpKind;
  readonly scope: ResolverOpScope;
  readonly args: Record<string, unknown>;
  readonly emits?: readonly string[];
}

export interface ResolveResult {
  readonly nextState: GameState;
  readonly semanticEvents: readonly SemanticEvent[];
  readonly markers?: readonly SemanticMarker[];
  readonly rejected?: { readonly reason: string };
}

export interface CommandResolver {
  /**
   * Must be deterministic. Must not trigger VFX, audio, animation, or UI directly.
   */
  resolve(
    state: GameState,
    command: GameCommand,
    content: ContentDatabase,
  ): ResolveResult;
}

// ────────────────────────────────────────────────────────────────────────────
// Content database (harness §8)
// ────────────────────────────────────────────────────────────────────────────

export interface ContentDatabase {
  getCardDefinition(id: ContentId): CardDefinition | undefined;
  getZoneDefinition(id: ContentId): ZoneDefinition | undefined;
  getEventDefinition(id: ContentId): ZoneEventDefinition | undefined;
  getPresentationSequence(id: ContentId): PresentationSequence | undefined;
  getElementDefinition(id: ElementId): ElementDefinition | undefined;
}

// ────────────────────────────────────────────────────────────────────────────
// Element definition (harness §6)
// ────────────────────────────────────────────────────────────────────────────

export interface ElementDefinition {
  readonly schemaVersion: string;
  readonly id: ElementId;
  readonly nameKey: LocalizationKey;
  readonly summaryKey?: LocalizationKey;
  readonly verbs: readonly string[];
  readonly colorTokens: Record<string, string>;
  readonly motifs: Record<string, readonly string[]>;
  readonly vfxGrammar?: Record<string, readonly string[]>;
  readonly audioGrammar?: Record<string, readonly string[]>;
  readonly constraints?: Record<string, unknown>;
}

// ────────────────────────────────────────────────────────────────────────────
// Card definition (harness §11 · normalized: YAML resolver.steps → TS resolverSteps)
// ────────────────────────────────────────────────────────────────────────────

export interface TargetingDefinition {
  readonly mode: "none" | "zone" | "daemon" | "card" | "self";
  readonly maxTargets: number;
  readonly validZoneElements: readonly ElementId[];
  readonly validZoneTags: readonly string[];
  readonly invalidTargetFeedbackCueId?: ContentId;
  readonly previewCueId?: ContentId;
  readonly requiresCurrentWeatherElement?: boolean;
  readonly allowGlobalTarget: boolean;
}

export interface CardDefinition {
  readonly schemaVersion: string;
  readonly id: ContentId;
  readonly packId: ContentId;
  readonly nameKey: LocalizationKey;
  readonly descriptionKey?: LocalizationKey;
  readonly elementId: ElementId;
  readonly cardType: "activation" | "modifier" | "daemon" | "ritual" | "tool" | "event";
  readonly verbs: readonly string[];
  readonly cost: {
    readonly energy: number;
    readonly resources?: Record<ContentId, number>;
  };
  readonly targeting: TargetingDefinition;
  readonly resolverSteps: readonly ResolverStep[];
  readonly presentation: {
    readonly cardArtId?: ContentId;
    readonly cardFrameSkinId?: ContentId;
    readonly sequenceId: ContentId;
    readonly launchCueId?: ContentId;
    readonly hoverCueId?: ContentId;
  };
  readonly balance?: {
    readonly rarity?: "starter" | "common" | "uncommon" | "rare" | "boss";
    readonly powerBand?: "tutorial" | "common" | "uncommon" | "rare" | "boss";
    readonly maxCopies?: number;
    readonly minDay?: number;
    readonly tags?: readonly string[];
  };
  readonly constraints?: Record<string, unknown>;
}

// ────────────────────────────────────────────────────────────────────────────
// Zone definition (harness §7.3 + UI screen YAML)
// ────────────────────────────────────────────────────────────────────────────

export interface ZoneDefinition {
  readonly schemaVersion: string;
  readonly id: ContentId;
  readonly packId: ContentId;
  readonly nameKey: LocalizationKey;
  readonly elementId: ElementId;
  readonly zoneType: string;
  readonly tags: readonly string[];
  readonly anchors: Record<string, ContentId | readonly ContentId[]>;
  readonly structures?: readonly {
    readonly id: ContentId;
    readonly kind: string;
    readonly artId?: ContentId;
    readonly motifs?: readonly string[];
    readonly anchorId?: ContentId;
  }[];
  readonly residentDaemons?: readonly {
    readonly daemonId: EntityId;
    readonly elementId: ElementId;
    readonly defaultRoutineId?: ContentId;
    readonly reactionSetId?: ContentId;
    readonly affectsGameplay: boolean;
  }[];
  readonly activationRules: {
    readonly validCardElements: readonly ElementId[];
    readonly maxConcurrentEvents: number;
    readonly defaultEventTableId?: ContentId;
    readonly weatherBehavior: "localized_only" | "global_allowed" | "none";
    readonly requiresCurrentWeatherMatch?: boolean;
  };
  readonly presentation?: Record<string, ContentId>;
  readonly constraints?: Record<string, unknown>;
}

// ────────────────────────────────────────────────────────────────────────────
// Zone event definition (harness §15)
// ────────────────────────────────────────────────────────────────────────────

export interface ZoneEventDefinition {
  readonly schemaVersion: string;
  readonly id: ContentId;
  readonly packId: ContentId;
  readonly nameKey?: LocalizationKey;
  readonly descriptionKey?: LocalizationKey;
  readonly trigger: {
    readonly type: string;
    readonly source?: ContentId;
    readonly elementId?: ElementId;
  };
  readonly preconditions?: readonly unknown[];
  readonly resolverSteps: readonly ResolverStep[];
  readonly rewards?: readonly {
    readonly rewardType: string;
    readonly id: ContentId;
    readonly quantity: number;
  }[];
  readonly presentation?: {
    readonly sequenceId?: ContentId;
    readonly summaryCueId?: ContentId;
    readonly rewardRevealCueId?: ContentId;
  };
  readonly repeatability?: Record<string, unknown>;
  readonly constraints?: Record<string, unknown>;
}

// ────────────────────────────────────────────────────────────────────────────
// Presentation sequence (harness §10)
// ────────────────────────────────────────────────────────────────────────────

export type PresentationBeatAction =
  | "wait"
  | "set_ui_state"
  | "play_vfx"
  | "start_vfx_loop"
  | "stop_vfx_loop"
  | "play_audio"
  | "animate_actor"
  | "move_along_spline"
  | "set_zone_visual_state"
  | "camera_pulse"
  | "emit_presentation_event"
  | "lock_input"
  | "unlock_input"
  | "show_reward_preview"
  | "set_saliency_tier";

export interface PresentationBeat {
  readonly id: ContentId;
  readonly atMs: number;
  readonly durationMs: number;
  readonly action: PresentationBeatAction;
  readonly target: string;
  readonly requiresAnchors?: readonly ContentId[];
  readonly params: Record<string, unknown>;
  readonly saliencyTier?: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface PresentationSequence {
  readonly schemaVersion: string;
  readonly id: ContentId;
  readonly packId: ContentId;
  readonly category: string;
  readonly triggerEvents: readonly string[];
  readonly inputPolicy: {
    readonly lockMode: "none" | "soft" | "hard";
    readonly maxLockMs: number;
    readonly lockOwnerId?: ContentId;
  };
  readonly interruptPolicy?: Record<string, unknown>;
  readonly saliencyBudget?: Record<string, number>;
  readonly requiredAnchors: readonly ContentId[];
  readonly mutatesGameState: false;
  readonly beats: readonly PresentationBeat[];
}

export interface PresentationSequencer {
  /**
   * Consumes semantic events and plays view-layer cues.
   * Must not mutate GameState directly.
   */
  consume(
    events: readonly SemanticEvent[],
    state: GameState,
    content: ContentDatabase,
  ): void;
}

// ────────────────────────────────────────────────────────────────────────────
// Pack manifest (harness §15 content-pack governance)
// ────────────────────────────────────────────────────────────────────────────

export type PackTier = "core" | "official" | "community" | "experimental";

export interface PackManifest {
  readonly schemaVersion: string;
  readonly packId: ContentId;
  readonly packNameKey?: LocalizationKey;
  readonly version: string;
  readonly author?: { readonly name: string; readonly contact?: string };
  readonly tier: PackTier;
  readonly compatibility: {
    readonly gameVersionMin: string;
    readonly gameVersionMax?: string;
    readonly schemaVersion: string;
  };
  readonly dependencies?: readonly ContentId[];
  readonly permissions?: Record<string, boolean>;
  readonly files: readonly {
    readonly kind: string;
    readonly path: string;
    readonly schema: string;
  }[];
  readonly constraints?: Record<string, unknown>;
}

// ────────────────────────────────────────────────────────────────────────────
// Telemetry (harness §14.4)
// ────────────────────────────────────────────────────────────────────────────

export interface TelemetryEventDefinition {
  readonly schemaVersion: string;
  readonly id: ContentId;
  readonly eventName: string;
  readonly purpose: string;
  readonly privacyClass: string;
  readonly properties: readonly {
    readonly name: string;
    readonly type: string;
    readonly required: boolean;
    readonly allowedValues?: readonly string[];
  }[];
  readonly constraints?: Record<string, unknown>;
}

/** The cycle-1 telemetry event shape (per FR-26). */
export interface CardActivationClarity {
  readonly cardId: ContentId;
  readonly elementId: ElementId;
  readonly targetZoneId: ContentId;
  readonly timeFromCardArmedToCommitMs: number;
  readonly invalidTargetHoverCount: number;
  readonly sequenceSkipped: boolean;
  readonly inputLockDurationMs: number;
}

// ────────────────────────────────────────────────────────────────────────────
// UI screen (harness §11.1)
// ────────────────────────────────────────────────────────────────────────────

export interface UiScreenDefinition {
  readonly schemaVersion: string;
  readonly id: ContentId;
  readonly packId: ContentId;
  readonly screenType: string;
  readonly textPolicy: Record<string, unknown>;
  readonly safeArea: {
    readonly topPct: number;
    readonly bottomPct: number;
    readonly leftPct: number;
    readonly rightPct: number;
  };
  readonly layoutSlots: readonly {
    readonly id: ContentId;
    readonly region: string;
    readonly anchor: string;
    readonly sizePct: { readonly w: number; readonly h: number };
  }[];
  readonly components: readonly {
    readonly id: ContentId;
    readonly componentType: string;
    readonly slotId: ContentId;
    readonly interactive: boolean;
    readonly states: readonly string[];
    readonly artId?: ContentId;
    readonly bindsTo?: string;
    readonly hankoMarker?: boolean;
  }[];
  readonly constraints?: Record<string, unknown>;
}

// ────────────────────────────────────────────────────────────────────────────
// Design lint (harness §14.2)
// ────────────────────────────────────────────────────────────────────────────

export interface DesignLintResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}
