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
  | "swiyu";

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

export interface CredentialEntry {
  id: string;
  slug?: string;
  displayName: string;
  shortDescription?: string;
  authority: EntityReference;
  subjectType: SubjectType;
  vcFormat: VCFormat;
  nativeIdentifier?: string;
  nativeIdentifierType?: "vct" | "docType" | "type" | "schema_said" | "other";
  schemaUrl: string;
  schemaType: "JSON Schema" | "JSON-LD Context" | "ISO Data Model" | "ACDC Schema" | "Other";
  rulebookUrl?: string;
  version: string;
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

export interface AggregatedCredentialCatalog {
  schemaVersion: string;
  catalogType: "credential";
  lastUpdated: string;
  credentials: NormalizedCredential[];
  stats: {
    totalCredentials: number;
    byFormat: Record<string, number>;
    bySubjectType: Record<SubjectType, number>;
    withSchemaAttributes: number;
    bySector: Record<string, number>;
    byEcosystem: Record<string, number>;
    byTheme: Record<string, number>;
    byCategory: Record<string, number>;
  };
}
