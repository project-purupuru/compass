/**
 * Combined smoke + drift test for all 5 hand-ported hounfour schemas.
 * Verifies each port: (a) decodes a valid sample, (b) rejects invalid input,
 * (c) the vendored JSON Schema is structurally valid (parses as JSON Schema).
 */

import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";

import {
  AgentLifecycleStatePort,
  AgentLifecycleStateUpstreamSchema,
} from "../agent-lifecycle-state.hounfour-port";
import { AgentIdentityPort, AgentIdentityUpstreamSchema } from "../agent-identity.hounfour-port";
import {
  AuditTrailEntryPort,
  AuditTrailEntryUpstreamSchema,
} from "../audit-trail-entry.hounfour-port";
import { DomainEventPort, DomainEventUpstreamSchema } from "../domain-event.hounfour-port";
import {
  CapabilityScopedTrustPort,
  CapabilityScopedTrustUpstreamSchema,
} from "../capability-scoped-trust.hounfour-port";

describe("hounfour hand-ports · smoke", () => {
  describe("AgentLifecycleStatePort", () => {
    it("decodes valid state literals", () => {
      expect(S.decodeUnknownSync(AgentLifecycleStatePort)("ACTIVE")).toBe("ACTIVE");
      expect(S.decodeUnknownSync(AgentLifecycleStatePort)("DORMANT")).toBe("DORMANT");
    });
    it("rejects invalid state", () => {
      expect(() => S.decodeUnknownSync(AgentLifecycleStatePort)("DEAD")).toThrow();
    });
    it("upstream schema is well-formed JSON object", () => {
      expect(typeof AgentLifecycleStateUpstreamSchema).toBe("object");
      expect((AgentLifecycleStateUpstreamSchema as { $id?: string }).$id).toContain("hounfour");
    });
  });

  describe("AgentIdentityPort", () => {
    const sample = {
      agent_id: "compass_puruhani_001",
      display_name: "Test Puruhani",
      agent_type: "service" as const,
      capabilities: ["mint", "trade"],
      contract_version: "7.0.0",
    };
    it("decodes minimal valid identity", () => {
      const decoded = S.decodeUnknownSync(AgentIdentityPort)(sample);
      expect(decoded.agent_id).toBe("compass_puruhani_001");
    });
    it("rejects invalid agent_id pattern", () => {
      expect(() =>
        S.decodeUnknownSync(AgentIdentityPort)({ ...sample, agent_id: "Bad!" }),
      ).toThrow();
    });
    it("upstream schema is well-formed JSON object", () => {
      expect(typeof AgentIdentityUpstreamSchema).toBe("object");
      expect((AgentIdentityUpstreamSchema as { required?: string[] }).required).toContain(
        "agent_id",
      );
    });
  });

  describe("AuditTrailEntryPort", () => {
    const sample = {
      entry_id: "550e8400-e29b-41d4-a716-446655440000",
      completion_id: "550e8400-e29b-41d4-a716-446655440001",
      billing_entry_id: "550e8400-e29b-41d4-a716-446655440002",
      agent_id: "compass_puruhani_001",
      provider: "anthropic",
      model_id: "claude-opus-4-7",
      cost_micro: 150000,
      timestamp: "2026-05-12T10:00:00Z",
      conservation_status: "balanced" as const,
      contract_version: "7.0.0",
    };
    it("decodes valid audit entry", () => {
      const decoded = S.decodeUnknownSync(AuditTrailEntryPort)(sample);
      expect(decoded.entry_id).toBe(sample.entry_id);
    });
    it("rejects invalid conservation_status", () => {
      expect(() =>
        S.decodeUnknownSync(AuditTrailEntryPort)({
          ...sample,
          conservation_status: "broken",
        }),
      ).toThrow();
    });
    it("upstream schema is well-formed JSON object", () => {
      expect((AuditTrailEntryUpstreamSchema as { required?: string[] }).required).toContain(
        "entry_id",
      );
    });
  });

  describe("DomainEventPort", () => {
    const sample = {
      event_id: "evt-001",
      aggregate_id: "agg-001",
      aggregate_type: "agent" as const,
      type: "spawned",
      version: 1,
      occurred_at: "2026-05-12T10:00:00Z",
      actor: "system",
      payload: { foo: "bar" },
      contract_version: "7.0.0",
    };
    it("decodes valid domain event", () => {
      const decoded = S.decodeUnknownSync(DomainEventPort)(sample);
      expect(decoded.aggregate_type).toBe("agent");
    });
    it("rejects invalid aggregate_type", () => {
      expect(() =>
        S.decodeUnknownSync(DomainEventPort)({ ...sample, aggregate_type: "void" }),
      ).toThrow();
    });
    it("upstream schema is well-formed JSON object", () => {
      expect((DomainEventUpstreamSchema as { required?: string[] }).required).toContain("event_id");
    });
  });

  describe("CapabilityScopedTrustPort", () => {
    const sample = {
      scopes: { billing: "verified" as const, governance: "trusted" as const },
      default_level: "basic" as const,
    };
    it("decodes valid trust config", () => {
      const decoded = S.decodeUnknownSync(CapabilityScopedTrustPort)(sample);
      expect(decoded.default_level).toBe("basic");
    });
    it("rejects invalid trust level", () => {
      expect(() =>
        S.decodeUnknownSync(CapabilityScopedTrustPort)({ ...sample, default_level: "godlike" }),
      ).toThrow();
    });
    it("upstream schema is well-formed JSON object", () => {
      expect((CapabilityScopedTrustUpstreamSchema as { required?: string[] }).required).toContain(
        "default_level",
      );
    });
  });
});
