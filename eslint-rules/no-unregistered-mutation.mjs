/**
 * eslint-rules/no-unregistered-mutation.mjs
 *
 * Custom ESLint flat-config rule. Bans direct `.push(...)` and
 * `.splice(...)` calls on a list of REGISTERED identifiers. Forces
 * those mutations to route through their MutationGuard contract.
 *
 * Doctrine: grimoires/loa/proposals/registry-doctrine-2026-05-12.md
 *
 * Why:
 *   - AI codegen tends to grab a module-level array and `.push()` to it.
 *   - Multiple writers to a shared mutable cause "where did X come from?"
 *     debugging hell.
 *   - The MutationGuard pattern requires every mutation to be named +
 *     validated, but only enforces at runtime. This rule moves the
 *     enforcement to the IDE/CI layer.
 *
 * Configuration (rule options):
 *   {
 *     forbiddenIdentifiers: ["extras", "SOUND_REGISTRY", ...],
 *     allowedFiles: ["lib/registry/", "lib/activity/index.ts"]
 *   }
 *
 * The allowed-files allowlist permits the registry's OWN file to mutate
 * its closure-captured state — every other consumer hits the rule.
 */

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid direct .push()/.splice()/.shift()/.unshift() on registered shared-mutable identifiers. Route through MutationGuard.",
      recommended: true,
    },
    messages: {
      directMutation:
        "Direct .{{method}}() on registered identifier '{{name}}' is forbidden. Route the mutation through its MutationGuard contract — see grimoires/loa/proposals/registry-doctrine-2026-05-12.md.",
    },
    schema: [
      {
        type: "object",
        properties: {
          forbiddenIdentifiers: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          allowedFiles: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const opts = context.options[0] ?? {};
    const forbidden = new Set(opts.forbiddenIdentifiers ?? []);
    const allowed = opts.allowedFiles ?? [];
    const filename = context.getFilename();
    if (allowed.some((p) => filename.includes(p))) return {};
    const MUTATION_METHODS = new Set(["push", "splice", "shift", "unshift", "pop"]);
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression") return;
        if (callee.property.type !== "Identifier") return;
        if (!MUTATION_METHODS.has(callee.property.name)) return;
        const obj = callee.object;
        if (obj.type !== "Identifier") return;
        if (!forbidden.has(obj.name)) return;
        context.report({
          node,
          messageId: "directMutation",
          data: { method: callee.property.name, name: obj.name },
        });
      },
    };
  },
};
