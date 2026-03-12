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
  | "vcdm_1_1"
  | "vcdm_2_0"
  | "acdc"
  | "other";

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
  provider: Provider;
  credentials: CredentialEntry[];
  lastUpdated?: string;
}

export interface EnrichedAttribute {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface NormalizedCredential extends CredentialEntry {
  provider: Provider;
  catalogUrl: string;
  source: "local";
  fetchedAt: string;
  updatedAt: string;
  firstSeenAt: string;
  attributes: EnrichedAttribute[];
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
  };
}
