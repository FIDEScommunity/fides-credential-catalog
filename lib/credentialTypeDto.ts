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

export interface DtoTrustedAuthority {
  frameworkType?: string;
  registryId?: string;
  registryName?: string;
  registryUrl?: string;
  schemeId?: string;
  schemeName?: string;
  isLoTE?: boolean;
}

export interface AggregatedCatalog {
  credentials: Array<{
    id: string;
    attestationTypeId?: string;
    displayName?: string;
    shortDescription?: string;
    authority?: { name?: string; url?: string };
    subjectType?: string;
    vcFormat?: string;
    formats?: Array<{ formatIdentifier?: string }>;
    schemaUrl?: string;
    rulebookUrl?: string;
    rulebookIntegrity?: string;
    resolvedTrustedAuthorities?: DtoTrustedAuthority[];
    attestationLoS?: string;
    bindingType?: string;
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
  if (typeof c.displayName === "string" && c.displayName.length) {
    dto.displayName = c.displayName;
  }
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

  // TS11 additions; additive so existing consumers keep working.
  if (c.attestationTypeId) dto.attestationTypeId = c.attestationTypeId;
  const formats = (c.formats || [])
    .map((format) => format?.formatIdentifier)
    .filter((format): format is string => typeof format === "string" && format.length > 0);
  if (formats.length) dto.formats = formats;
  if (c.rulebookIntegrity) dto.rulebookIntegrity = c.rulebookIntegrity;
  if (c.attestationLoS) dto.attestationLoS = c.attestationLoS;
  if (c.bindingType) dto.bindingType = c.bindingType;
  const trustedAuthorities = (c.resolvedTrustedAuthorities || []).filter((authority) => authority?.registryId);
  if (trustedAuthorities.length) {
    dto.trustedAuthorities = trustedAuthorities.map((authority) => ({
      frameworkType: authority.frameworkType,
      registryId: authority.registryId,
      registryName: authority.registryName,
      registryUrl: authority.registryUrl,
      schemeId: authority.schemeId,
      schemeName: authority.schemeName,
      ...(authority.isLoTE === undefined ? {} : { isLoTE: authority.isLoTE })
    }));
  }

  dto.hasIssuers = Boolean(issuerAvailability?.hasIssuers);
  dto.issuerCount = Math.max(0, Number(issuerAvailability?.issuerCount || 0));
  return dto;
}
