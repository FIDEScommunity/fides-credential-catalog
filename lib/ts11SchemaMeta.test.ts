import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  deterministicSchemaId,
  findAttestationType,
  toTs11SchemaMeta,
  type AggregatedAttestationType
} from "./ts11SchemaMeta";

const pid: AggregatedAttestationType = {
  id: "cred:eu:pid",
  displayName: "Person Identification Data",
  version: "1.0",
  semverVersion: "1.0.0",
  formats: [
    { formatIdentifier: "sd_jwt_vc", nativeIdentifier: "urn:eu.europa.ec.eudi:pid:1" },
    { formatIdentifier: "mdoc", nativeIdentifier: "eu.europa.ec.eudi.pid.1" },
    { formatIdentifier: "anoncreds", nativeIdentifier: "pid" }
  ],
  schemaURIs: [
    { formatIdentifier: "sd_jwt_vc", uri: "https://example.test/pid-sd-jwt.json" },
    { formatIdentifier: "sd_jwt_vc", uri: "https://example.test/pid-sd-jwt.json" },
    { formatIdentifier: "anoncreds", uri: "https://example.test/pid-anoncreds.json" }
  ],
  rulebookUrl: "https://example.test/pid-rulebook",
  attestationLoS: "iso_18045_high",
  bindingType: "key",
  trustedAuthorities: [
    {
      frameworkType: "etsi_tl",
      registryId: "treg:eidas-2-0:lote",
      registryUrl: "https://example.test/lote",
      schemeId: "scheme:eidas-2-0",
      isLoTE: true
    },
    { frameworkType: "aki", registryUrl: "https://example.test/no-registry-id" }
  ],
  aliasIds: ["cred:eu:pid-mdoc:mdoc", "cred:eu:pid-vc-sd-jwt:sd-jwt-vc"]
};

test("format identifiers are mapped to TS11 and unmappable formats are dropped", () => {
  const meta = toTs11SchemaMeta(pid);
  assert.deepEqual(meta.supportedFormats, ["dc+sd-jwt", "mso_mdoc"]);
  assert.deepEqual(
    meta.schemaURIs.map((uri) => uri.formatIdentifier),
    ["dc+sd-jwt"]
  );
});

test("a trusted authority without a registry reference is not published", () => {
  const meta = toTs11SchemaMeta(pid);
  assert.equal(meta.trustedAuthorities.length, 1);
  assert.equal(meta.trustedAuthorities[0].registryId, "treg:eidas-2-0:lote");
  assert.equal(meta.trustedAuthorities[0].value, "https://example.test/lote");
  assert.equal(meta.trustedAuthorities[0].isLoTE, true);
});

test("conformance reports what is missing rather than claiming full TS11", () => {
  assert.deepEqual(toTs11SchemaMeta(pid).conformance, { level: "full", missing: [] });

  const bare: AggregatedAttestationType = { id: "cred:acme:thing", formats: [{ formatIdentifier: "mdoc" }] };
  const bareMeta = toTs11SchemaMeta(bare);
  assert.equal(bareMeta.conformance.level, "partial");
  assert.deepEqual(bareMeta.conformance.missing, [
    "version",
    "rulebookURI",
    "attestationLoS",
    "bindingType",
    "schemaURIs",
    "trustedAuthorities"
  ]);

  const noTs11Format: AggregatedAttestationType = {
    id: "cred:acme:anoncred",
    formats: [{ formatIdentifier: "anoncreds" }]
  };
  assert.equal(toTs11SchemaMeta(noTs11Format).conformance.level, "compatible");
});

test("schema ids are stable UUID v5 values", () => {
  const id = deterministicSchemaId("cred:eu:pid");
  assert.equal(id, deterministicSchemaId("cred:eu:pid"));
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(id, deterministicSchemaId("cred:eu:pda1"));
});

test("lookup accepts the UUID, the attestation type id and legacy per-format ids", () => {
  const types = [pid];
  assert.equal(findAttestationType(types, "cred:eu:pid")?.id, "cred:eu:pid");
  assert.equal(findAttestationType(types, deterministicSchemaId("cred:eu:pid"))?.id, "cred:eu:pid");
  assert.equal(findAttestationType(types, "cred:eu:pid-mdoc:mdoc")?.id, "cred:eu:pid");
  assert.equal(findAttestationType(types, "cred:eu:unknown"), undefined);
});
