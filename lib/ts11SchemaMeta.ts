/**
 * ARF TS11 SchemaMeta projection over the attestation types in aggregated.json.
 *
 * This is a read-only, unsigned projection: same object shape and the exact TS11
 * enum values, so tooling that speaks TS11 can consume it interchangeably with the
 * European Commission catalogue. FIDES is not the Commission, so every record
 * carries a `conformance` object saying what is and is not populated.
 * See docs/TS11-ALIGNMENT.md and docs/TS11-COMPLIANCE-PLAN.md.
 */

import { createHash } from "crypto";

/** FIDES vcFormat → TS11 formatIdentifier. Absent means "no TS11 counterpart". */
const TS11_FORMAT_IDENTIFIERS: Record<string, string> = {
  sd_jwt_vc: "dc+sd-jwt",
  mdoc: "mso_mdoc",
  jwt_vc: "jwt_vc_json",
  vcdm_1_1: "ldp_vc",
  vcdm_2_0: "ldp_vc",
};

/** Fixed namespace so a schemaId stays the same across crawls and deployments. */
const FIDES_UUID_NAMESPACE = "b9f0f0e2-3f3a-4a4f-9a1a-2c2f6d5e7a10";

export interface AggregatedAttestationType {
  id: string;
  displayName?: string;
  shortDescription?: string;
  version?: string;
  semverVersion?: string;
  formats?: Array<{
    formatIdentifier?: string;
    nativeIdentifier?: string;
    schemaURIs?: Array<{ formatIdentifier?: string; uri?: string; integrity?: string }>;
  }>;
  schemaURIs?: Array<{ formatIdentifier?: string; uri?: string; integrity?: string }>;
  rulebookUrl?: string;
  rulebookIntegrity?: string;
  trustedAuthorities?: Array<{
    frameworkType?: string;
    registryId?: string;
    registryUrl?: string;
    schemeId?: string;
    schemeName?: string;
    registryName?: string;
    isLoTE?: boolean;
    values?: string[];
  }>;
  attestationLoS?: string;
  bindingType?: string;
  sectors?: string[];
  ecosystems?: string[];
  themes?: string[];
  category?: string;
  aliasIds?: string[];
  updatedAt?: string;
}

export interface Ts11SchemaMeta {
  id: string;
  attestationType: string;
  title?: string;
  description?: string;
  version?: string;
  supportedFormats: string[];
  schemaURIs: Array<{ formatIdentifier: string; uri: string; integrity?: string }>;
  rulebookURI?: string;
  rulebookIntegrity?: string;
  attestationLoS?: string;
  bindingType?: string;
  trustedAuthorities: Array<{
    frameworkType: string;
    value?: string;
    isLoTE?: boolean;
    registryId: string;
    schemeId?: string;
  }>;
  conformance: { level: "full" | "partial" | "compatible"; missing: string[] };
  /** FIDES extensions, namespaced so a strict TS11 consumer can ignore them. */
  fides: {
    attestationTypeId: string;
    aliasIds: string[];
    sectors: string[];
    ecosystems: string[];
    themes?: string[];
    category?: string;
    updatedAt?: string;
  };
}

/**
 * Deterministic UUID v5 over the attestation type id.
 *
 * TS11 requires a UUID for `id` and consumers pin it, so it must not change
 * between crawls. Implemented with the SHA-1 construction from RFC 4122 §4.3 to
 * avoid adding a dependency.
 */
export function deterministicSchemaId(attestationTypeId: string): string {
  const namespaceBytes = Buffer.from(FIDES_UUID_NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1")
    .update(namespaceBytes)
    .update(Buffer.from(attestationTypeId, "utf-8"))
    .digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function ts11Format(vcFormat: string | undefined): string | undefined {
  return vcFormat ? TS11_FORMAT_IDENTIFIERS[vcFormat] : undefined;
}

export function toTs11SchemaMeta(type: AggregatedAttestationType): Ts11SchemaMeta {
  const supportedFormats = Array.from(
    new Set(
      (type.formats || [])
        .map((format) => ts11Format(format.formatIdentifier))
        .filter((format): format is string => Boolean(format))
    )
  );

  const schemaURIs: Ts11SchemaMeta["schemaURIs"] = [];
  const seenSchemaUris = new Set<string>();
  for (const uri of type.schemaURIs || []) {
    const formatIdentifier = ts11Format(uri.formatIdentifier);
    if (!formatIdentifier || !uri.uri) continue;
    const key = `${formatIdentifier}|${uri.uri}`;
    if (seenSchemaUris.has(key)) continue;
    seenSchemaUris.add(key);
    schemaURIs.push({
      formatIdentifier,
      uri: uri.uri,
      ...(uri.integrity ? { integrity: uri.integrity } : {}),
    });
  }

  const trustedAuthorities = (type.trustedAuthorities || [])
    .filter((authority) => authority.frameworkType && authority.registryId)
    .map((authority) => ({
      frameworkType: String(authority.frameworkType),
      // TS11 expects a resolvable value; the registryId stays alongside it so a
      // FIDES consumer can follow the reference into the trust scheme catalog.
      ...(authority.registryUrl ? { value: authority.registryUrl } : {}),
      ...(authority.isLoTE === undefined ? {} : { isLoTE: authority.isLoTE }),
      registryId: String(authority.registryId),
      ...(authority.schemeId ? { schemeId: authority.schemeId } : {}),
    }));

  const missing: string[] = [];
  if (!type.semverVersion) missing.push("version");
  if (!type.rulebookUrl) missing.push("rulebookURI");
  if (!type.attestationLoS) missing.push("attestationLoS");
  if (!type.bindingType) missing.push("bindingType");
  if (schemaURIs.length === 0) missing.push("schemaURIs");
  if (trustedAuthorities.length === 0) missing.push("trustedAuthorities");

  const level: Ts11SchemaMeta["conformance"]["level"] =
    supportedFormats.length === 0 ? "compatible" : missing.length === 0 ? "full" : "partial";

  return {
    id: deterministicSchemaId(type.id),
    attestationType: type.id,
    ...(type.displayName ? { title: type.displayName } : {}),
    ...(type.shortDescription ? { description: type.shortDescription } : {}),
    ...(type.semverVersion ? { version: type.semverVersion } : {}),
    supportedFormats,
    schemaURIs,
    ...(type.rulebookUrl ? { rulebookURI: type.rulebookUrl } : {}),
    ...(type.rulebookIntegrity ? { rulebookIntegrity: type.rulebookIntegrity } : {}),
    ...(type.attestationLoS ? { attestationLoS: type.attestationLoS } : {}),
    ...(type.bindingType ? { bindingType: type.bindingType } : {}),
    trustedAuthorities,
    conformance: { level, missing },
    fides: {
      attestationTypeId: type.id,
      aliasIds: [...(type.aliasIds || [])],
      sectors: [...(type.sectors || [])],
      ecosystems: [...(type.ecosystems || [])],
      ...(type.themes?.length ? { themes: [...type.themes] } : {}),
      ...(type.category ? { category: type.category } : {}),
      ...(type.updatedAt ? { updatedAt: type.updatedAt } : {}),
    },
  };
}

/**
 * Resolve a schema identifier to an attestation type.
 *
 * Accepts the TS11 UUID, the `cred:<authority>:<key>` attestation type id, and a
 * legacy per-format `cred:...:<format>` id, so links published before the TS11
 * alignment keep resolving.
 */
export function findAttestationType(
  types: AggregatedAttestationType[],
  identifier: string
): AggregatedAttestationType | undefined {
  const wanted = identifier.trim();
  if (!wanted) return undefined;
  return types.find(
    (type) =>
      type.id === wanted ||
      deterministicSchemaId(type.id) === wanted.toLowerCase() ||
      (type.aliasIds || []).includes(wanted)
  );
}
