/**
 * Shared DTO mapping for credential list and detail public APIs.
 */

const CREDENTIAL_KIND = ["PERSONAL", "ORGANIZATIONAL", "PRODUCT", "UNKNOWN"] as const;
export type CredentialKind = (typeof CREDENTIAL_KIND)[number];

export interface AggregatedCatalog {
  credentials: Array<{
    id: string;
    displayName?: string;
    shortDescription?: string;
    subjectType?: string;
    vcFormat?: string;
    schemaUrl?: string;
    rulebookUrl?: string;
    updatedAt?: string;
    sectors?: string[];
    ecosystems?: string[];
    themes?: string[];
  }>;
}

export function subjectTypeToCredentialKind(subjectType: string): CredentialKind {
  const s = String(subjectType || "").trim();
  if (s === "Person") return "PERSONAL";
  if (s === "Organization") return "ORGANIZATIONAL";
  if (s === "Product") return "PRODUCT";
  return "UNKNOWN";
}

/** CredentialTypeDto: only fields we have; issuer fields omitted. */
export function toCredentialTypeDto(
  c: AggregatedCatalog["credentials"][0],
): Record<string, unknown> {
  const dto: Record<string, unknown> = {};
  dto.id = c.id;
  dto.credentialKind = subjectTypeToCredentialKind(c.subjectType || "");
  dto.sectors = Array.isArray(c.sectors) ? [...c.sectors] : [];
  dto.ecosystems = Array.isArray(c.ecosystems) ? [...c.ecosystems] : [];
  dto.themes = Array.isArray(c.themes) ? [...c.themes] : [];
  if (c.vcFormat) dto.vcFormat = c.vcFormat;
  if (c.schemaUrl) dto.schemaUrl = c.schemaUrl;
  if (c.shortDescription) dto.schemaInfo = c.shortDescription;
  if (c.rulebookUrl) dto.trustFrameworkUrl = c.rulebookUrl;
  return dto;
}
