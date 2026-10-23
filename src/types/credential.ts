export type SubjectType =
  | "Person"
  | "Organization"
  | "Product"
  | "Dataset"
  | "Software"
  | "Document";

export type VCFormat =
  | "sd_jwt_vc"
  | "mdoc"
  | "jwt_vc"
  | "vcdm_1_1"
  | "vcdm_2_0"
  | "anoncreds"
  | "idemix"
  | "apple_wallet_pass"
  | "google_wallet_pass"
  | "acdc";

/** Same values as OrganizationSectorCode in organization-catalog.schema.json (keep in sync). */
export type CredentialSectorCode =
  | "public_sector"
  | "finance"
  | "trade"
  | "supply_chain"
  | "manufacturing"
  | "energy"
  | "agriculture"
  | "food"
  | "retail"
  | "healthcare"
  | "education"
  | "construction"
  | "mobility"
  | "digital";

export type CredentialEcosystemCode =
  | "eudi_wallet"
  | "uncefact"
  | "gaia_x"
  | "open_badges"
  | "iso_mdl"
  | "india_stack"
  | "swiyu"
  | "yivi";

/** Cross-sector use-case themes (optional on each credential). */
export type CredentialThemeCode =
  | "person_identity"
  | "organizational_identity"
  | "payments"
  | "compliance_reporting"
  | "trade_documents"
  | "education"
  | "digital_product_passports"
  | "dataspaces"
  | "agentic_ai";

export type CredentialCategoryCode =
  | "identity"
  | "business"
  | "finance"
  | "health"
  | "travel"
  | "professional"
  | "compliance"
  | "trade";

export interface EntityReference {
  name: string;
  url?: string;
}

export interface CredentialReference {
  id: string;
  displayName?: string;
}

export interface VocabularyReference {
  name: string;
  authority?: EntityReference;
  url?: string;
}

export type NativeIdentifierType = "vct" | "docType" | "type" | "schema_said" | "other";

export type SchemaType =
  | "JSON Schema"
  | "JSON-LD Context"
  | "ISO Data Model"
  | "ACDC Schema"
  | "Other";

/** ARF TS11 trust anchor reference type; identical to the trust scheme catalog enum. */
export type TrustAnchorReferenceType = "aki" | "etsi_tl" | "openid_federation";

/** TS11 schemaURIs entry: one schema document per attestation format. */
export interface SchemaURI {
  formatIdentifier: VCFormat;
  uri: string;
  schemaType?: SchemaType;
  integrity?: string;
}

/** TS11 supported format of one attestation type. */
export interface CredentialFormat {
  formatIdentifier: VCFormat;
  nativeIdentifier?: string;
  nativeIdentifierType?: NativeIdentifierType;
  schemaURIs?: SchemaURI[];
  /** Per-format catalog id, kept as deep link alias after the multi-format merge. */
  credentialId?: string;
}

/** TS11 attestationLoS: ISO/IEC 18045 attack potential, not an eIDAS assurance level. */
export type AttestationLoS =
  | "iso_18045_basic"
  | "iso_18045_enhanced-basic"
  | "iso_18045_moderate"
  | "iso_18045_high";

/** TS11 bindingType. */
export type BindingType = "claim" | "key" | "biometric" | "none";

/** TS11 TrustAuthority, pointing at a registry in fides-trust-scheme-catalog. */
export interface TrustedAuthority {
  frameworkType: TrustAnchorReferenceType;
  registryId: string;
  schemeId?: string;
  values?: string[];
}

/** Registry and scheme metadata resolved from the trust scheme catalog at crawl time. */
export interface ResolvedTrustedAuthority extends TrustedAuthority {
  schemeId: string;
  registryName: string;
  schemeName: string;
  registryUrl?: string;
  registryProfile?: string;
  machineReadable?: boolean;
  access?: string;
  /** TS11 isLoTE: the registry is a List of Trusted Entities (ETSI TS 119 602). */
  isLoTE?: boolean;
}

export interface CredentialEntry {
  id: string;
  /** Legacy per-format ids that resolve to this attestation type (seed-merge §5.3). */
  aliasIds?: string[];
  slug?: string;
  displayName: string;
  shortDescription?: string;
  authority: EntityReference;
  subjectType: SubjectType;
  vcFormat: VCFormat;
  nativeIdentifier?: string;
  nativeIdentifierType?: NativeIdentifierType;
  schemaUrl: string;
  schemaType: SchemaType;
  rulebookUrl?: string;
  rulebookIntegrity?: string;
  version: string;
  attestationTypeId?: string;
  formats?: CredentialFormat[];
  schemaURIs?: SchemaURI[];
  trustedAuthorities?: TrustedAuthority[];
  attestationLoS?: AttestationLoS;
  bindingType?: BindingType;
  extends?: CredentialReference[];
  vocabularies?: VocabularyReference[];
  tags?: string[];
  sectors: CredentialSectorCode[];
  ecosystems: CredentialEcosystemCode[];
  themes?: CredentialThemeCode[];
  category?: CredentialCategoryCode;
}

export interface Provider {
  name: string;
  did?: string;
  website?: string;
  logo?: string;
  contact?: {
    email?: string;
    support?: string;
  };
}

export interface CredentialCatalogFile {
  $schema: string;
  /** Organization catalog id; crawler resolves provider fields from organization aggregated.json */
  orgId: string;
  credentials: CredentialEntry[];
  lastUpdated?: string;
}

export interface EnrichedAttribute {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  /** Zero-based depth for nested fields (0 = top-level); used for UI indentation. */
  depth?: number;
}

export interface NormalizedCredential extends CredentialEntry {
  orgId: string;
  /** Always present in aggregated output: explicit, or derived from the id. */
  attestationTypeId: string;
  /** Always present in aggregated output: explicit, or derived from vcFormat. */
  formats: CredentialFormat[];
  /** Present when the entry declares trust registries and they resolved. */
  resolvedTrustedAuthorities?: ResolvedTrustedAuthority[];
  /** Resolved from organization catalog at crawl time (same shape as former inline provider). */
  provider: Provider;
  catalogUrl: string;
  source: "local";
  fetchedAt: string;
  updatedAt: string;
  firstSeenAt: string;
  attributes: EnrichedAttribute[];
  /** Root-level description extracted from the credential JSON Schema (schema.description). */
  schemaDescription?: string;
}

/**
 * TS11-shaped projection: one entry per attestation type, with the formats it is
 * available in. After seed-merge (§5.3) `credentials[]` is also type-level; legacy
 * per-format ids remain in `aliasIds` (and formats[].credentialId) for deeplinks.
 */
export interface AttestationType {
  id: string;
  displayName: string;
  shortDescription?: string;
  orgId: string;
  provider: Provider;
  authority: EntityReference;
  subjectType: SubjectType;
  version: string;
  /** TS11 requires SemVer; absent when the authored version cannot be normalized. */
  semverVersion?: string;
  formats: CredentialFormat[];
  schemaURIs: SchemaURI[];
  rulebookUrl?: string;
  rulebookIntegrity?: string;
  trustedAuthorities: ResolvedTrustedAuthority[];
  attestationLoS?: AttestationLoS;
  bindingType?: BindingType;
  sectors: CredentialSectorCode[];
  ecosystems: CredentialEcosystemCode[];
  themes?: CredentialThemeCode[];
  category?: CredentialCategoryCode;
  /** Per-format credential ids that resolve to this attestation type. */
  aliasIds: string[];
  updatedAt: string;
}

export interface AggregatedCredentialCatalog {
  schemaVersion: string;
  catalogType: "credential";
  lastUpdated: string;
  credentials: NormalizedCredential[];
  attestationTypes: AttestationType[];
  stats: {
    totalCredentials: number;
    totalAttestationTypes: number;
    withTrustedAuthorities: number;
    byFormat: Record<string, number>;
    bySubjectType: Record<SubjectType, number>;
    withSchemaAttributes: number;
    bySector: Record<string, number>;
    byEcosystem: Record<string, number>;
    byTheme: Record<string, number>;
    byCategory: Record<string, number>;
  };
}
