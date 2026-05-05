/**
 * Shared DTO mapping for credential list and detail public APIs.
 */

const CREDENTIAL_KIND = ["PERSONAL", "ORGANIZATIONAL", "PRODUCT", "UNKNOWN"] as const;
export type CredentialKind = (typeof CREDENTIAL_KIND)[number];
const CREDENTIAL_CATEGORIES = [
  "identity",
  "business",
  "finance",
  "health",
  "travel",
  "professional",
  "compliance",
  "trade",
] as const;
type CredentialCategory = (typeof CREDENTIAL_CATEGORIES)[number];

export interface AggregatedCatalog {
  credentials: Array<{
    id: string;
    displayName?: string;
    shortDescription?: string;
    authority?: { name?: string; url?: string };
    subjectType?: string;
    vcFormat?: string;
    schemaUrl?: string;
    rulebookUrl?: string;
    updatedAt?: string;
    tags?: string[];
    sectors?: string[];
    ecosystems?: string[];
    themes?: string[];
    category?: string;
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
  issuerAvailability?: { hasIssuers: boolean; issuerCount: number },
): Record<string, unknown> {
  const dto: Record<string, unknown> = {};
  dto.id = c.id;
  dto.credentialKind = subjectTypeToCredentialKind(c.subjectType || "");
  if (typeof c.authority?.name === "string" && c.authority.name.length) {
    dto.authority = c.authority.name;
  }
  dto.tags = Array.isArray(c.tags) ? [...c.tags] : [];
  dto.sectors = Array.isArray(c.sectors) ? [...c.sectors] : [];
  dto.ecosystems = Array.isArray(c.ecosystems) ? [...c.ecosystems] : [];
  dto.themes = Array.isArray(c.themes) ? [...c.themes] : [];
  if (
    typeof c.category === "string" &&
    (CREDENTIAL_CATEGORIES as readonly string[]).includes(c.category)
  ) {
    dto.category = c.category as CredentialCategory;
  }
  if (c.vcFormat) dto.vcFormat = c.vcFormat;
  if (c.schemaUrl) dto.schemaUrl = c.schemaUrl;
  if (c.shortDescription) dto.schemaInfo = c.shortDescription;
  if (c.rulebookUrl) dto.trustFrameworkUrl = c.rulebookUrl;
  dto.hasIssuers = Boolean(issuerAvailability?.hasIssuers);
  dto.issuerCount = Math.max(0, Number(issuerAvailability?.issuerCount || 0));
  return dto;
}
