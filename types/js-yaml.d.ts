/**
 * Minimal js-yaml type shim — only the surface lib/purupuru/content/loader.ts
 * actually uses. The full @types/js-yaml package is more ergonomic, but a
 * local shim avoids modifying package.json + pnpm-lock.yaml (which the
 * parallel autonomous ECS sprint-2 work also has open).
 *
 * Authored 2026-05-17 to clear the implicit-any error at loader.ts:16.
 * Promote to @types/js-yaml when convenient: `pnpm add -D @types/js-yaml`.
 */

declare module "js-yaml" {
  export interface LoadOptions {
    readonly filename?: string;
    readonly onWarning?: (warning: Error) => void;
    readonly schema?: unknown;
    readonly json?: boolean;
  }

  export interface DumpOptions {
    readonly indent?: number;
    readonly noArrayIndent?: boolean;
    readonly skipInvalid?: boolean;
    readonly flowLevel?: number;
    readonly sortKeys?: boolean | ((a: string, b: string) => number);
    readonly lineWidth?: number;
    readonly noRefs?: boolean;
    readonly noCompatMode?: boolean;
    readonly condenseFlow?: boolean;
    readonly quotingType?: '"' | "'";
    readonly forceQuotes?: boolean;
    readonly replacer?: (key: string, value: unknown) => unknown;
  }

  export function load(input: string, options?: LoadOptions): unknown;
  export function loadAll(
    input: string,
    iterator?: null,
    options?: LoadOptions,
  ): unknown[];
  export function loadAll(
    input: string,
    iterator: (doc: unknown) => void,
    options?: LoadOptions,
  ): void;
  export function dump(obj: unknown, options?: DumpOptions): string;

  export class YAMLException extends Error {
    name: "YAMLException";
    reason: string;
    mark: { name?: string; buffer?: string; position: number; line: number; column: number };
  }
}
