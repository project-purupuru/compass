/**
 * World — lightweight holder for archetypes. For the session-16 leaf proof,
 * a World is essentially a named registry: register an archetype once, look
 * it up by name. Multi-archetype scheduling (entity → archetype routing on
 * component change) is intentionally NOT here yet — fixtures are stable
 * (per the empirical scene analysis), so we don't need it.
 *
 * When a churning use-case shows up (dynamic spawns, status effects), the
 * World gains a SparseSet path. Until then this stays a Map.
 */

import type { Archetype, EntityId } from "./archetype";

export class World {
  private readonly _archetypes = new Map<string, Archetype<string>>();

  register<TCols extends string>(name: string, archetype: Archetype<TCols>): void {
    if (this._archetypes.has(name)) {
      throw new Error(`World: archetype "${name}" already registered`);
    }
    this._archetypes.set(name, archetype as unknown as Archetype<string>);
  }

  archetype<TCols extends string = string>(name: string): Archetype<TCols> | undefined {
    return this._archetypes.get(name) as Archetype<TCols> | undefined;
  }

  /** Convenience: create an entity in the given archetype. */
  createEntity<TCols extends string>(
    archetype: Archetype<TCols>,
    init?: Parameters<Archetype<TCols>["add"]>[0],
  ): EntityId {
    return archetype.add(init);
  }

  /** Convenience: destroy an entity from the given archetype. */
  destroyEntity<TCols extends string>(
    archetype: Archetype<TCols>,
    id: EntityId,
  ): void {
    archetype.destroy(id);
  }
}
