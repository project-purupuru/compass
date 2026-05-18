/**
 * MutationContract / MutationGuard — defensive mutation pattern.
 *
 * Enforces "register or crash" for shared mutable state. The state itself
 * is closure-captured so direct .push / .splice / assignment from
 * outside the guard is impossible. Every mutation is named, validated,
 * and logged.
 *
 * Doctrine: grimoires/loa/proposals/registry-doctrine-2026-05-12.md
 *
 * Use when:
 *   - You have mutable state with multiple potential writers
 *   - State is NOT MatchSnapshot (the substrate reducer owns that)
 *   - You want AI codegen to find a wall when it tries to mutate ad-hoc
 *
 * Don't use when:
 *   - State is local to a component (useState is fine)
 *   - State is the substrate snapshot (use match.reducer)
 *   - Lookup-only registries (Record literals are fine)
 */

export interface MutationContract<TState, TInput> {
  /** Stable identifier — must be unique within a guard. */
  readonly name: string;
  /** Human-readable description for the registry index + AI grounding. */
  readonly description: string;
  /** Optional pre-validation. Return true OR an error message string. */
  readonly validate?: (input: TInput) => true | string;
  /** Pure transformation: state + input → new state. */
  readonly apply: (state: TState, input: TInput) => TState;
}

export interface MutationLogEntry {
  readonly name: string;
  readonly at: number;
  readonly inputPreview?: unknown;
}

export class MutationGuard<TState> {
  private contracts = new Map<string, MutationContract<TState, unknown>>();
  private state: TState;
  private listeners = new Set<(s: TState) => void>();
  private log: MutationLogEntry[] = [];
  private logCap = 100;

  constructor(initial: TState) {
    this.state = initial;
  }

  /** Register a mutation contract. Throws if name already taken. */
  register<TInput>(contract: MutationContract<TState, TInput>): void {
    if (this.contracts.has(contract.name)) {
      throw new Error(
        `MutationGuard: contract "${contract.name}" already registered. ` +
          `Mutation names are unique per guard.`,
      );
    }
    this.contracts.set(contract.name, contract as MutationContract<TState, unknown>);
  }

  /** Apply a registered mutation. Throws if name unknown or validation fails. */
  apply<TInput>(name: string, input: TInput): TState {
    const c = this.contracts.get(name);
    if (!c) {
      const known = Array.from(this.contracts.keys()).slice(0, 8).join(", ");
      throw new Error(
        `MutationGuard: unregistered mutation "${name}". ` +
          `Register a MutationContract via guard.register(...). ` +
          `Known mutations: [${known}${this.contracts.size > 8 ? ", ..." : ""}]`,
      );
    }
    if (c.validate) {
      const result = c.validate(input);
      if (result !== true) {
        throw new Error(`MutationGuard: "${name}" rejected — ${result}`);
      }
    }
    this.state = c.apply(this.state, input);
    this.log.push({ name, at: Date.now(), inputPreview: previewInput(input) });
    if (this.log.length > this.logCap) this.log.shift();
    for (const fn of this.listeners) fn(this.state);
    return this.state;
  }

  /** Read-only view of current state. */
  read(): Readonly<TState> {
    return this.state;
  }

  /** Subscribe to state changes. Returns unsubscribe. */
  subscribe(fn: (s: TState) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** List registered mutation names — for tweakpane / introspection. */
  registeredMutations(): readonly string[] {
    return Array.from(this.contracts.keys());
  }

  /** Recent mutation log — for tweakpane Monitor binding. */
  recentLog(limit = 20): readonly MutationLogEntry[] {
    return this.log.slice(-limit);
  }
}

function previewInput(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input === "object") {
    try {
      const s = JSON.stringify(input);
      return s.length > 80 ? `${s.slice(0, 77)}...` : s;
    } catch {
      return "<unstringifiable>";
    }
  }
  return input;
}
