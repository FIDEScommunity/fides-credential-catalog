import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { execFileSync } from "child_process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import yaml from "js-yaml";
import type {
  AggregatedCredentialCatalog,
  AttestationType,
  CredentialCatalogFile,
  CredentialEntry,
  CredentialFormat,
  EnrichedAttribute,
  NormalizedCredential,
  Provider,
  ResolvedTrustedAuthority,
  SchemaURI,
  SubjectType
} from "../types/credential.js";
import {
  extractAttributesFromOid4vciMetadata,
  extractAttributesFromSchema
} from "./schemaAttributes.js";
import { resolveSchemaReferences, type SchemaDocument } from "./schemaResolver.js";

const CONFIG = {
  schemaPath: path.join(process.cwd(), "schemas/credential-catalog.schema.json"),
  sourceDir: path.join(process.cwd(), "community-catalogs"),
  outputPath: path.join(process.cwd(), "data/aggregated.json"),
  issuerAvailabilityIndexPath: path.join(process.cwd(), "data/issuer-availability-index.json"),
  wpPluginDataPath: path.join(
    process.cwd(),
    "wordpress-plugin/fides-credential-catalog/data/aggregated.json"
  ),
  historyPath: path.join(process.cwd(), "data/credential-history-state.json")
};

const ORGANIZATION_CATALOG_URL =
  "https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json";
const ORGANIZATION_CATALOG_LOCAL_PATHS = [
  process.env.ORGANIZATION_CATALOG_AGGREGATED_PATH,
  path.join(process.cwd(), "..", "organization-catalog", "data", "aggregated.json")
].filter(Boolean) as string[];
const ISSUER_CATALOG_URL =
  "https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json";
const ISSUER_CATALOG_LOCAL_PATHS = [
  process.env.ISSUER_CATALOG_AGGREGATED_PATH,
  path.join(process.cwd(), "..", "issuer-catalog", "data", "aggregated.json")
].filter(Boolean) as string[];
const TRUST_SCHEME_CATALOG_URL =
  "https://raw.githubusercontent.com/FIDEScommunity/fides-trust-scheme-catalog/main/data/aggregated.json";
const TRUST_SCHEME_CATALOG_LOCAL_PATHS = [
  process.env.TRUST_SCHEME_CATALOG_AGGREGATED_PATH,
  path.join(process.cwd(), "..", "trust-scheme-catalog", "data", "aggregated.json")
].filter(Boolean) as string[];

interface OrgCatalogEntry {
  id: string;
  name: string;
  identifiers?: { did?: string };
  website?: string;
  logoUri?: string;
  contact?: { email?: string; support?: string };
  legalName?: string;
}

interface IssuerCredentialConfiguration {
  vct?: string;
  credentialCatalogRef?: { id?: string };
}

interface IssuerCatalogEntry {
  id: string;
  environment?: string;
  credentialConfigurations?: IssuerCredentialConfiguration[];
}

interface IssuerCatalogData {
  issuers?: IssuerCatalogEntry[];
}

interface IssuerAvailabilityCounts {
  total: number;
  production: number;
  test: number;
}

interface IssuerAvailabilityIndex {
  generatedAt: string;
  byCredentialId: Record<string, IssuerAvailabilityCounts>;
}

/** Sibling checkouts are only consulted outside CI, where they may exist. */
function isLocalDevHost(): boolean {
  return !process.env.CI && !process.env.GITHUB_ACTIONS;
}

/**
 * Opt-in preview of unpublished changes in a sibling catalog.
 *
 * Off by default on purpose: data/aggregated.json is committed, so a local crawl
 * must not quietly bake in a sibling checkout that is ahead of or behind main.
 * Set FIDES_PREFER_LOCAL_CATALOGS=1 when you are deliberately previewing.
 */
function preferLocalCatalogs(): boolean {
  return isLocalDevHost() && process.env.FIDES_PREFER_LOCAL_CATALOGS === "1";
}

function orgEntryToProvider(entry: OrgCatalogEntry): Provider {
  const p: Provider = { name: entry.name };
  if (entry.identifiers?.did) p.did = entry.identifiers.did;
  if (entry.website) p.website = entry.website;
  if (entry.logoUri) p.logo = entry.logoUri;
  if (entry.contact) p.contact = entry.contact;
  return p;
}

/** Published catalog plus, outside CI, the first readable sibling checkout. */
async function loadSiblingCatalog<T>(
  url: string,
  localPaths: string[],
  label: string
): Promise<{ remote: T | null; local: T | null }> {
  let remote: T | null = null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    remote = (await res.json()) as T;
  } catch (err) {
    console.warn(`Could not fetch ${label}:`, (err as Error).message);
  }

  let local: T | null = null;
  if (isLocalDevHost()) {
    for (const localPath of localPaths) {
      if (!localPath || !existsSync(localPath)) continue;
      try {
        local = JSON.parse(await fs.readFile(localPath, "utf-8")) as T;
        break;
      } catch (err) {
        console.warn(`Could not parse local ${label} (${localPath}):`, (err as Error).message);
      }
    }
  }

  return { remote, local };
}

/**
 * Union keyed by id of the published catalog and a local checkout.
 *
 * The published entry wins unless FIDES_PREFER_LOCAL_CATALOGS is set, so a sibling
 * checkout that is behind main can never silently replace live data, while an entry
 * that exists only locally still resolves during development.
 */
function mergeById<T extends { id?: string }>(
  remote: T[] | undefined,
  local: T[] | undefined,
  label: string
): T[] {
  const localWins = preferLocalCatalogs();
  const [winner, filler] = localWins ? [local, remote] : [remote, local];
  const winnerLabel = localWins ? "local checkout" : "published";
  const fillerLabel = localWins ? "published" : "local checkout";

  const byId = new Map<string, T>();
  for (const entry of winner || []) {
    if (entry?.id) byId.set(entry.id, entry);
  }
  const winnerCount = byId.size;
  let added = 0;
  for (const entry of filler || []) {
    if (!entry?.id || byId.has(entry.id)) continue;
    byId.set(entry.id, entry);
    added += 1;
  }
  console.log(
    `Using ${label}: ${winnerCount} from ${winnerLabel}` +
      (added > 0 ? `, ${added} added from ${fillerLabel}` : "")
  );
  return Array.from(byId.values());
}

async function loadOrganizationCatalogMap(): Promise<Map<string, OrgCatalogEntry>> {
  const { remote, local } = await loadSiblingCatalog<{ organizations?: OrgCatalogEntry[] }>(
    ORGANIZATION_CATALOG_URL,
    ORGANIZATION_CATALOG_LOCAL_PATHS,
    "organization catalog"
  );
  const organizations = mergeById(remote?.organizations, local?.organizations, "organization catalog");
  return new Map(organizations.map((org) => [org.id, org]));
}

async function loadIssuerCatalogData(): Promise<IssuerCatalogData> {
  const { remote, local } = await loadSiblingCatalog<IssuerCatalogData>(
    ISSUER_CATALOG_URL,
    ISSUER_CATALOG_LOCAL_PATHS,
    "issuer catalog"
  );
  return { issuers: mergeById(remote?.issuers, local?.issuers, "issuer catalog") };
}

interface TrustRegistryIndexEntry {
  registryId: string;
  registryName: string;
  registryUrl?: string;
  registryProfile?: string;
  machineReadable?: boolean;
  access?: string;
  schemeId: string;
  schemeName: string;
}

/**
 * Registry index from fides-trust-scheme-catalog, keyed by treg: id.
 *
 * Returns null when the catalog is unreachable, which is different from an empty
 * index: an unknown treg: id must fail the crawl, but a network hiccup must not.
 */
async function loadTrustRegistryIndex(): Promise<Map<string, TrustRegistryIndexEntry> | null> {
  interface TrustSchemeCatalog {
    trustSchemes?: Array<{
      id: string;
      name: string;
      trustRegistries?: Array<{
        id: string;
        name: string;
        registryUrl?: string;
        registryProfile?: string;
        machineReadable?: boolean;
        access?: string;
      }>;
    }>;
  }

  const { remote, local } = await loadSiblingCatalog<TrustSchemeCatalog>(
    TRUST_SCHEME_CATALOG_URL,
    TRUST_SCHEME_CATALOG_LOCAL_PATHS,
    "trust scheme catalog"
  );
  if (remote === null && local === null) return null;

  const schemes = mergeById(remote?.trustSchemes, local?.trustSchemes, "trust scheme catalog");
  const index = new Map<string, TrustRegistryIndexEntry>();
  for (const scheme of schemes) {
    for (const registry of scheme.trustRegistries || []) {
      if (!registry?.id) continue;
      index.set(registry.id, {
        registryId: registry.id,
        registryName: registry.name || registry.id,
        registryUrl: registry.registryUrl,
        registryProfile: registry.registryProfile,
        machineReadable: registry.machineReadable,
        access: registry.access,
        schemeId: scheme.id,
        schemeName: scheme.name || scheme.id
      });
    }
  }
  return index;
}

/**
 * TS11 formats[] for one entry.
 *
 * A v1 entry describes a single format in singular fields, so it collapses to a
 * one-element array that carries its own id as alias. A v2 entry declares formats[]
 * explicitly and the singular fields describe its primary format.
 */
function normalizeFormats(credential: CredentialEntry): CredentialFormat[] {
  if (Array.isArray(credential.formats) && credential.formats.length > 0) {
    return credential.formats.map((format) => ({
      ...format,
      credentialId: format.credentialId || (format.formatIdentifier === credential.vcFormat ? credential.id : undefined)
    }));
  }

  const schemaURIs: SchemaURI[] = credential.schemaUrl
    ? [
        {
          formatIdentifier: credential.vcFormat,
          uri: credential.schemaUrl,
          schemaType: credential.schemaType
        }
      ]
    : [];

  return [
    {
      formatIdentifier: credential.vcFormat,
      ...(credential.nativeIdentifier ? { nativeIdentifier: credential.nativeIdentifier } : {}),
      ...(credential.nativeIdentifierType ? { nativeIdentifierType: credential.nativeIdentifierType } : {}),
      ...(schemaURIs.length ? { schemaURIs } : {}),
      credentialId: credential.id
    }
  ];
}

/** cred:<authority>:<key>[:<format>] → cred:<authority>:<key>. */
function deriveAttestationTypeId(credential: CredentialEntry): string {
  if (credential.attestationTypeId) return credential.attestationTypeId;
  const parts = credential.id.split(":");
  return parts.length > 3 ? parts.slice(0, 3).join(":") : credential.id;
}

/** Legacy per-format ids for deeplinks (seed aliasIds + formats[].credentialId + old 4-segment id). */
function collectAliasIds(credential: CredentialEntry, attestationTypeId: string): string[] {
  const aliases = new Set<string>();
  for (const alias of credential.aliasIds || []) {
    if (alias && alias !== attestationTypeId) aliases.add(alias);
  }
  for (const format of credential.formats || []) {
    if (format.credentialId && format.credentialId !== attestationTypeId) {
      aliases.add(format.credentialId);
    }
  }
  if (credential.id !== attestationTypeId) aliases.add(credential.id);
  return [...aliases].sort();
}

function collectSchemaURIs(credential: NormalizedCredential): SchemaURI[] {
  const out: SchemaURI[] = [];
  const seen = new Set<string>();
  const push = (uri: SchemaURI | undefined) => {
    if (!uri?.uri) return;
    const key = `${uri.formatIdentifier}|${uri.uri}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(uri);
  };
  for (const uri of credential.schemaURIs || []) push(uri);
  for (const format of credential.formats) {
    for (const uri of format.schemaURIs || []) push(uri);
  }
  return out;
}

/**
 * Resolves declared trust registries against the trust scheme catalog.
 * An unknown treg: id is a hard error: a dangling trust anchor reference is worse
 * than no reference, because a verifier cannot tell the difference.
 */
function resolveTrustedAuthorities(
  credential: CredentialEntry,
  index: Map<string, TrustRegistryIndexEntry> | null,
  problems: string[]
): ResolvedTrustedAuthority[] {
  const declared = credential.trustedAuthorities || [];
  if (declared.length === 0) return [];
  if (index === null) {
    console.warn(
      `  Trust scheme catalog unavailable; leaving ${declared.length} trusted authority reference(s) on ${credential.id} unresolved.`
    );
    return [];
  }

  const resolved: ResolvedTrustedAuthority[] = [];
  for (const authority of declared) {
    const entry = index.get(authority.registryId);
    if (!entry) {
      problems.push(
        `Unknown registryId ${authority.registryId} on ${credential.id} — add the registry to fides-trust-scheme-catalog first.`
      );
      continue;
    }
    if (authority.schemeId && authority.schemeId !== entry.schemeId) {
      problems.push(
        `schemeId ${authority.schemeId} on ${credential.id} does not match ${entry.schemeId}, the scheme that publishes ${authority.registryId}.`
      );
      continue;
    }
    resolved.push({
      ...authority,
      schemeId: entry.schemeId,
      schemeName: entry.schemeName,
      registryName: entry.registryName,
      ...(entry.registryUrl ? { registryUrl: entry.registryUrl } : {}),
      ...(entry.registryProfile ? { registryProfile: entry.registryProfile } : {}),
      ...(entry.machineReadable !== undefined ? { machineReadable: entry.machineReadable } : {}),
      ...(entry.access ? { access: entry.access } : {}),
      // TS11 isLoTE is a property of the registry, so derive it instead of asking
      // every credential author to repeat it.
      ...(authority.frameworkType === "etsi_tl"
        ? { isLoTE: entry.registryProfile === "etsi_ts_119_602_lote" }
        : {})
    });
  }
  return resolved;
}

/**
 * FIDES vcFormat → TS11 formatIdentifier.
 *
 * aggregated.json stays in FIDES codes (see docs/TS11-ALIGNMENT.md); the TS11
 * projection maps them here. Formats without a TS11 counterpart are omitted from
 * the projection rather than mapped to something close.
 */
export const TS11_FORMAT_IDENTIFIERS: Record<string, string> = {
  sd_jwt_vc: "dc+sd-jwt",
  mdoc: "mso_mdoc",
  jwt_vc: "jwt_vc_json",
  vcdm_1_1: "ldp_vc",
  vcdm_2_0: "ldp_vc"
};

/** TS11 requires SemVer, while authored versions are often "1" or "1.0". */
function toSemVer(version: string): string | undefined {
  const match = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+].*)?$/.exec(version.trim());
  if (!match) return undefined;
  return `${match[1]}.${match[2] ?? "0"}.${match[3] ?? "0"}`;
}

// Trailing parentheticals that name a format, e.g. "PID (MSO Mdoc)".
const FORMAT_NAME_SUFFIX =
  /\s*\((?:sd-jwt(?:\s+vc)?|mso\s+mdoc|mdoc|jwt\s+vc(?:\s+json)?|ldp\s+vc|vcdm(?:\s+\d(?:\.\d)?)?)\)\s*$/i;

/** An attestation type spans formats, so its name must not claim one. */
function attestationTypeDisplayName(displayName: string): string {
  const stripped = displayName.replace(FORMAT_NAME_SUFFIX, "").trim();
  return stripped.length > 0 ? stripped : displayName;
}

/** One entry per attestation type, formats merged, per-format ids kept as aliases. */
function buildAttestationTypes(credentials: NormalizedCredential[]): AttestationType[] {
  const byId = new Map<string, AttestationType>();

  for (const credential of credentials) {
    const id = credential.attestationTypeId;
    const existing = byId.get(id);
    const schemaURIs = collectSchemaURIs(credential);

    if (!existing) {
      byId.set(id, {
        id,
        displayName: attestationTypeDisplayName(credential.displayName),
        shortDescription: credential.shortDescription,
        orgId: credential.orgId,
        provider: credential.provider,
        authority: credential.authority,
        subjectType: credential.subjectType,
        version: credential.version,
        semverVersion: toSemVer(credential.version),
        formats: [...credential.formats],
        schemaURIs,
        rulebookUrl: credential.rulebookUrl,
        rulebookIntegrity: credential.rulebookIntegrity,
        trustedAuthorities: [...(credential.resolvedTrustedAuthorities || [])],
        attestationLoS: credential.attestationLoS,
        bindingType: credential.bindingType,
        sectors: [...(credential.sectors || [])],
        ecosystems: [...(credential.ecosystems || [])],
        themes: credential.themes ? [...credential.themes] : undefined,
        category: credential.category,
        aliasIds: collectAliasIds(credential, id),
        updatedAt: credential.updatedAt
      });
      continue;
    }

    // Merge a sibling format entry into the attestation type it belongs to.
    for (const alias of collectAliasIds(credential, id)) {
      if (!existing.aliasIds.includes(alias)) existing.aliasIds.push(alias);
    }
    for (const format of credential.formats) {
      if (!existing.formats.some((f) => f.formatIdentifier === format.formatIdentifier)) {
        existing.formats.push(format);
      }
    }
    for (const uri of schemaURIs) {
      if (!existing.schemaURIs.some((u) => u.formatIdentifier === uri.formatIdentifier && u.uri === uri.uri)) {
        existing.schemaURIs.push(uri);
      }
    }
    for (const authority of credential.resolvedTrustedAuthorities || []) {
      if (
        !existing.trustedAuthorities.some(
          (a) => a.registryId === authority.registryId && a.frameworkType === authority.frameworkType
        )
      ) {
        existing.trustedAuthorities.push(authority);
      }
    }
    for (const sector of credential.sectors || []) {
      if (!existing.sectors.includes(sector)) existing.sectors.push(sector);
    }
    for (const ecosystem of credential.ecosystems || []) {
      if (!existing.ecosystems.includes(ecosystem)) existing.ecosystems.push(ecosystem);
    }
    if (credential.themes?.length) {
      existing.themes = existing.themes || [];
      for (const theme of credential.themes) {
        if (!existing.themes.includes(theme)) existing.themes.push(theme);
      }
    }
    if (!existing.rulebookUrl && credential.rulebookUrl) {
      existing.rulebookUrl = credential.rulebookUrl;
      existing.rulebookIntegrity = credential.rulebookIntegrity;
    }
    if (credential.updatedAt > existing.updatedAt) existing.updatedAt = credential.updatedAt;
  }

  const types = Array.from(byId.values());
  for (const type of types) {
    type.aliasIds.sort();
    type.formats.sort((a, b) => a.formatIdentifier.localeCompare(b.formatIdentifier));
  }
  types.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return types;
}

function normalizeIssuerEnvironment(value: string | undefined): "production" | "test" | "unknown" {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "production") return "production";
  if (normalized === "test") return "test";
  return "unknown";
}

interface CredentialHistoryEntry {
  firstSeenAt: string;
  lastSeenAt?: string;
}

type CredentialHistoryState = Record<string, CredentialHistoryEntry>;
const gitLastCommitDateCache = new Map<string, string | null>();

function toIsoString(value?: string): string | null {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function getGitLastCommitDateForPath(repoRelativePath: string): string | null {
  if (!repoRelativePath) return null;
  const normalizedPath = repoRelativePath.replace(/\\/g, "/");
  if (gitLastCommitDateCache.has(normalizedPath)) {
    return gitLastCommitDateCache.get(normalizedPath) ?? null;
  }

  try {
    const output = execFileSync("git", ["log", "-1", "--format=%aI", "--", normalizedPath], {
      cwd: process.cwd(),
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    const parsed = toIsoString(output || undefined);
    gitLastCommitDateCache.set(normalizedPath, parsed);
    return parsed;
  } catch {
    gitLastCommitDateCache.set(normalizedPath, null);
    return null;
  }
}

async function loadHistoryState(): Promise<CredentialHistoryState> {
  try {
    const raw = await fs.readFile(CONFIG.historyPath, "utf-8");
    const parsed = JSON.parse(raw) as CredentialHistoryState;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

async function saveHistoryState(state: CredentialHistoryState): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG.historyPath), { recursive: true });
  await fs.writeFile(CONFIG.historyPath, JSON.stringify(state, null, 2));
}

interface SchemaFetchResult {
  attributes: EnrichedAttribute[];
  description?: string;
}

const MAX_SCHEMA_DOCUMENT_BYTES = 5 * 1024 * 1024;
const SCHEMA_FETCH_TIMEOUT_MS = 15_000;

async function fetchSchemaDocument(schemaUrl: string): Promise<SchemaDocument> {
  const parsedUrl = new URL(schemaUrl);
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error(`Unsupported schema URL protocol: ${parsedUrl.protocol}`);
  }

  const isYaml = /\.(yaml|yml)(\?.*)?$/i.test(schemaUrl);
  const headers = isYaml
    ? { Accept: "text/yaml, application/yaml, application/json, text/plain" }
    : { Accept: "application/json, application/yaml, text/yaml, text/plain" };
  const response = await fetch(schemaUrl, {
    headers,
    signal: AbortSignal.timeout(SCHEMA_FETCH_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Schema request failed with HTTP ${response.status}`);

  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_SCHEMA_DOCUMENT_BYTES) {
    throw new Error(`Schema document exceeds ${MAX_SCHEMA_DOCUMENT_BYTES} bytes`);
  }

  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > MAX_SCHEMA_DOCUMENT_BYTES) {
    throw new Error(`Schema document exceeds ${MAX_SCHEMA_DOCUMENT_BYTES} bytes`);
  }
  const parsed = yaml.load(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Schema document must contain a JSON object");
  }
  return parsed as SchemaDocument;
}

async function fetchSchemaData(schemaUrl: string): Promise<SchemaFetchResult> {
  try {
    const data = await fetchSchemaDocument(schemaUrl);
    const resolvedData = await resolveSchemaReferences(data, schemaUrl, fetchSchemaDocument);

    const schemaAttributes = extractAttributesFromSchema(resolvedData);
    const attributes =
      schemaAttributes.length > 0
        ? schemaAttributes
        : extractAttributesFromOid4vciMetadata(data);

    return {
      attributes,
      description: typeof data.description === "string" ? data.description : undefined
    };
  } catch {
    return { attributes: [] };
  }
}

function calculateStats(
  credentials: NormalizedCredential[],
  attestationTypes: AttestationType[]
): AggregatedCredentialCatalog["stats"] {
  const byFormat: Record<string, number> = {};
  const bySubjectType: Record<SubjectType, number> = {
    Person: 0,
    Organization: 0,
    Product: 0,
    Dataset: 0,
    Software: 0,
    Document: 0
  };
  const bySector: Record<string, number> = {};
  const byEcosystem: Record<string, number> = {};
  const byTheme: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let withSchemaAttributes = 0;

  for (const credential of credentials) {
    byFormat[credential.vcFormat] = (byFormat[credential.vcFormat] || 0) + 1;
    bySubjectType[credential.subjectType] += 1;
    if (credential.attributes.length > 0) withSchemaAttributes += 1;
    for (const s of credential.sectors || []) {
      bySector[s] = (bySector[s] || 0) + 1;
    }
    for (const e of credential.ecosystems || []) {
      byEcosystem[e] = (byEcosystem[e] || 0) + 1;
    }
    for (const t of credential.themes || []) {
      byTheme[t] = (byTheme[t] || 0) + 1;
    }
    const category = credential.category;
    if (category) {
      byCategory[category] = (byCategory[category] || 0) + 1;
    }
  }

  return {
    totalCredentials: credentials.length,
    totalAttestationTypes: attestationTypes.length,
    withTrustedAuthorities: credentials.filter((c) => (c.resolvedTrustedAuthorities || []).length > 0).length,
    byFormat,
    bySubjectType,
    withSchemaAttributes,
    bySector,
    byEcosystem,
    byTheme,
    byCategory
  };
}

function buildCredentialResolvers(credentials: NormalizedCredential[]): {
  ids: Set<string>;
  aliasToId: Map<string, string>;
  nativeToId: Map<string, string>;
} {
  const ids = new Set<string>();
  const aliasToId = new Map<string, string>();
  const nativeToId = new Map<string, string>();
  const rememberNative = (credentialId: string, value: unknown) => {
    const key = String(value || "").trim();
    if (key && !nativeToId.has(key)) nativeToId.set(key, credentialId);
  };

  for (const credential of credentials) {
    ids.add(credential.id);
    for (const alias of credential.aliasIds || []) {
      if (alias && alias !== credential.id && !aliasToId.has(alias)) {
        aliasToId.set(alias, credential.id);
      }
    }
    rememberNative(credential.id, credential.nativeIdentifier);
    for (const format of credential.formats || []) {
      rememberNative(credential.id, format.nativeIdentifier);
    }
  }

  return { ids, aliasToId, nativeToId };
}

function resolveIssuerCredentialId(
  configuration: {
    credentialCatalogRef?: { id?: string };
    docType?: string;
    doctype?: string;
    vct?: string;
  },
  resolvers: ReturnType<typeof buildCredentialResolvers>
): string {
  const byRefId = String(configuration?.credentialCatalogRef?.id || "").trim();
  if (resolvers.ids.has(byRefId)) return byRefId;
  const aliased = byRefId ? resolvers.aliasToId.get(byRefId) : undefined;
  if (aliased) return aliased;

  const native = String(configuration?.docType || configuration?.doctype || configuration?.vct || "").trim();
  return native ? resolvers.nativeToId.get(native) || "" : "";
}

async function buildIssuerAvailabilityIndex(
  credentials: NormalizedCredential[],
  generatedAt: string
): Promise<IssuerAvailabilityIndex> {
  const data = await loadIssuerCatalogData();
  const issuers = Array.isArray(data.issuers) ? data.issuers : [];
  const resolvers = buildCredentialResolvers(credentials);
  const byCredentialIdSets = new Map<string, { total: Set<string>; production: Set<string>; test: Set<string> }>();

  const ensureBucket = (credentialId: string) => {
    if (!byCredentialIdSets.has(credentialId)) {
      byCredentialIdSets.set(credentialId, {
        total: new Set<string>(),
        production: new Set<string>(),
        test: new Set<string>(),
      });
    }
    return byCredentialIdSets.get(credentialId)!;
  };

  for (const issuer of issuers) {
    const issuerId = String(issuer?.id || "").trim();
    if (!issuerId) continue;
    const env = normalizeIssuerEnvironment(issuer.environment);
    const configs = Array.isArray(issuer.credentialConfigurations) ? issuer.credentialConfigurations : [];

    for (const configuration of configs) {
      const credentialId = resolveIssuerCredentialId(configuration, resolvers);
      if (!credentialId) continue;

      const bucket = ensureBucket(credentialId);
      bucket.total.add(issuerId);
      if (env === "production") bucket.production.add(issuerId);
      if (env === "test") bucket.test.add(issuerId);
    }
  }

  const byCredentialId: Record<string, IssuerAvailabilityCounts> = {};
  for (const [credentialId, sets] of byCredentialIdSets.entries()) {
    byCredentialId[credentialId] = {
      total: sets.total.size,
      production: sets.production.size,
      test: sets.test.size,
    };
  }

  return {
    generatedAt,
    byCredentialId,
  };
}

async function initValidator() {
  const schemaRaw = await fs.readFile(CONFIG.schemaPath, "utf-8");
  const schema = JSON.parse(schemaRaw) as Record<string, unknown>;
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

async function crawl(): Promise<void> {
  console.log("Starting credential catalog crawl...");
  const validateCatalog = await initValidator();
  const organizationById = await loadOrganizationCatalogMap();
  const trustRegistryIndex = await loadTrustRegistryIndex();
  const historyState = await loadHistoryState();
  const now = new Date().toISOString();
  const normalized: NormalizedCredential[] = [];
  const problems: string[] = [];

  const sourceDirs = await fs.readdir(CONFIG.sourceDir).catch(() => []);

  for (const sourceDirName of sourceDirs) {
    const catalogPath = path.join(CONFIG.sourceDir, sourceDirName, "credential-catalog.json");
    try {
      const raw = await fs.readFile(catalogPath, "utf-8");
      const catalog = JSON.parse(raw) as CredentialCatalogFile;
      if (!validateCatalog(catalog)) {
        console.error(`Invalid catalog in ${sourceDirName}`, validateCatalog.errors);
        continue;
      }

      const orgEntry = organizationById.get(catalog.orgId);
      if (!orgEntry) {
        console.error(
          `Unknown orgId ${catalog.orgId} in ${sourceDirName} — add this organization to fides-organization-catalog first.`
        );
        continue;
      }
      const provider = orgEntryToProvider(orgEntry);

      const repoRelativePath = path.relative(process.cwd(), catalogPath);
      const gitLastCommitAt = getGitLastCommitDateForPath(repoRelativePath);

      for (const credential of catalog.credentials) {
        const historyKey = `${catalog.orgId}:${credential.id}`;
        const updatedAt =
          toIsoString(catalog.lastUpdated) ??
          gitLastCommitAt ??
          now;
        const firstSeenAt = historyState[historyKey]?.firstSeenAt ?? updatedAt;
        const schemaData = await fetchSchemaData(credential.schemaUrl);

        historyState[historyKey] = {
          firstSeenAt,
          lastSeenAt: now
        };

        const resolvedTrustedAuthorities = resolveTrustedAuthorities(
          credential,
          trustRegistryIndex,
          problems
        );

        const attestationTypeId = deriveAttestationTypeId(credential);
        const aliasIds = collectAliasIds(credential, attestationTypeId);
        const formats = normalizeFormats(credential).map((format) => {
          const legacyId =
            format.credentialId ||
            (credential.id !== attestationTypeId && format.formatIdentifier === credential.vcFormat
              ? credential.id
              : undefined);
          return legacyId ? { ...format, credentialId: legacyId } : format;
        });

        normalized.push({
          ...credential,
          id: attestationTypeId,
          orgId: catalog.orgId,
          attestationTypeId,
          aliasIds: aliasIds.length ? aliasIds : undefined,
          formats,
          ...(resolvedTrustedAuthorities.length ? { resolvedTrustedAuthorities } : {}),
          provider,
          catalogUrl: catalogPath,
          source: "local",
          fetchedAt: now,
          updatedAt,
          firstSeenAt,
          attributes: schemaData.attributes,
          schemaDescription: schemaData.description
        });
      }
    } catch {
      continue;
    }
  }

  const dedupeMap = new Map<string, NormalizedCredential>();
  for (const credential of normalized) {
    if (!dedupeMap.has(credential.id)) {
      dedupeMap.set(credential.id, credential);
    }
  }
  const deduped = Array.from(dedupeMap.values());

  if (problems.length > 0) {
    for (const problem of problems) console.error(`  ERROR ${problem}`);
    console.error(`\nCrawl aborted: ${problems.length} trust anchor reference problem(s) must be fixed first.`);
    process.exit(1);
  }

  const attestationTypes = buildAttestationTypes(deduped);

  const aggregated: AggregatedCredentialCatalog = {
    schemaVersion: "2.0.0",
    catalogType: "credential",
    lastUpdated: now,
    credentials: deduped,
    attestationTypes,
    stats: calculateStats(deduped, attestationTypes)
  };

  await fs.mkdir(path.dirname(CONFIG.outputPath), { recursive: true });
  await fs.writeFile(CONFIG.outputPath, JSON.stringify(aggregated, null, 2));
  await saveHistoryState(historyState);

  const issuerAvailabilityIndex = await buildIssuerAvailabilityIndex(deduped, now);
  await fs.writeFile(CONFIG.issuerAvailabilityIndexPath, JSON.stringify(issuerAvailabilityIndex, null, 2));

  await fs.mkdir(path.dirname(CONFIG.wpPluginDataPath), { recursive: true });
  await fs.writeFile(CONFIG.wpPluginDataPath, JSON.stringify(aggregated, null, 2));

  console.log(
    `Credential aggregation complete. ${aggregated.stats.totalCredentials} credential(s), ` +
      `${aggregated.stats.totalAttestationTypes} attestation type(s), ` +
      `${aggregated.stats.withTrustedAuthorities} with a resolved trust registry reference.`
  );
}

crawl().catch((error) => {
  console.error(error);
  process.exit(1);
});
