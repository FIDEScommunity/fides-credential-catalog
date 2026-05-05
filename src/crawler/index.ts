import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { hostname } from "os";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import yaml from "js-yaml";
import type {
  AggregatedCredentialCatalog,
  CredentialCatalogFile,
  EnrichedAttribute,
  NormalizedCredential,
  Provider,
  SubjectType
} from "../types/credential.js";
import { extractAttributesFromSchema } from "./schemaAttributes.js";

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

function isLocalDevHost(): boolean {
  const host = hostname();
  return host !== "" && (host.endsWith(".local") || host === "localhost");
}

function orgEntryToProvider(entry: OrgCatalogEntry): Provider {
  const p: Provider = { name: entry.name };
  if (entry.identifiers?.did) p.did = entry.identifiers.did;
  if (entry.website) p.website = entry.website;
  if (entry.logoUri) p.logo = entry.logoUri;
  if (entry.contact) p.contact = entry.contact;
  return p;
}

async function loadOrganizationCatalogMap(): Promise<Map<string, OrgCatalogEntry>> {
  const tryParse = (raw: string): Map<string, OrgCatalogEntry> => {
    const data = JSON.parse(raw) as { organizations?: OrgCatalogEntry[] };
    const map = new Map<string, OrgCatalogEntry>();
    for (const o of data.organizations || []) {
      if (o?.id) map.set(o.id, o);
    }
    return map;
  };

  if (isLocalDevHost()) {
    for (const localPath of ORGANIZATION_CATALOG_LOCAL_PATHS) {
      if (localPath && existsSync(localPath)) {
        try {
          const raw = await fs.readFile(localPath, "utf-8");
          const map = tryParse(raw);
          console.log(`Using local organization catalog (${localPath}), ${map.size} org(s)`);
          return map;
        } catch (e) {
          console.warn("Could not parse local organization catalog:", (e as Error).message);
        }
      }
    }
  }

  try {
    const res = await fetch(ORGANIZATION_CATALOG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { organizations?: OrgCatalogEntry[] };
    const map = new Map<string, OrgCatalogEntry>();
    for (const o of data.organizations || []) {
      if (o?.id) map.set(o.id, o);
    }
    console.log(`Using organization catalog from GitHub, ${map.size} org(s)`);
    return map;
  } catch (err) {
    console.warn("Could not fetch organization catalog:", (err as Error).message);
    for (const localPath of ORGANIZATION_CATALOG_LOCAL_PATHS) {
      if (localPath && existsSync(localPath)) {
        try {
          const raw = await fs.readFile(localPath, "utf-8");
          const map = tryParse(raw);
          console.log(`Fallback local organization catalog (${localPath})`);
          return map;
        } catch (e) {
          console.warn("Could not parse local organization catalog:", (e as Error).message);
        }
      }
    }
    return new Map();
  }
}

async function loadIssuerCatalogData(): Promise<IssuerCatalogData> {
  const tryParse = (raw: string): IssuerCatalogData => JSON.parse(raw) as IssuerCatalogData;

  if (isLocalDevHost()) {
    for (const localPath of ISSUER_CATALOG_LOCAL_PATHS) {
      if (localPath && existsSync(localPath)) {
        try {
          const raw = await fs.readFile(localPath, "utf-8");
          const parsed = tryParse(raw);
          const count = Array.isArray(parsed.issuers) ? parsed.issuers.length : 0;
          console.log(`Using local issuer catalog (${localPath}), ${count} issuer(s)`);
          return parsed;
        } catch (e) {
          console.warn("Could not parse local issuer catalog:", (e as Error).message);
        }
      }
    }
  }

  try {
    const res = await fetch(ISSUER_CATALOG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = (await res.json()) as IssuerCatalogData;
    const count = Array.isArray(parsed.issuers) ? parsed.issuers.length : 0;
    console.log(`Using issuer catalog from GitHub, ${count} issuer(s)`);
    return parsed;
  } catch (err) {
    console.warn("Could not fetch issuer catalog:", (err as Error).message);
    for (const localPath of ISSUER_CATALOG_LOCAL_PATHS) {
      if (localPath && existsSync(localPath)) {
        try {
          const raw = await fs.readFile(localPath, "utf-8");
          const parsed = tryParse(raw);
          console.log(`Fallback local issuer catalog (${localPath})`);
          return parsed;
        } catch (e) {
          console.warn("Could not parse fallback local issuer catalog:", (e as Error).message);
        }
      }
    }
    return { issuers: [] };
  }
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

async function fetchSchemaData(schemaUrl: string): Promise<SchemaFetchResult> {
  try {
    const isYaml = /\.(yaml|yml)(\?.*)?$/i.test(schemaUrl);
    const headers = isYaml
      ? { Accept: "text/yaml, application/yaml, text/plain" }
      : { Accept: "application/json" };

    const response = await fetch(schemaUrl, { headers });
    if (!response.ok) return { attributes: [] };

    let data: Record<string, unknown>;
    if (isYaml) {
      const text = await response.text();
      data = yaml.load(text) as Record<string, unknown>;
    } else {
      data = (await response.json()) as Record<string, unknown>;
    }

    if (!data || typeof data !== "object") return { attributes: [] };

    return {
      attributes: extractAttributesFromSchema(data),
      description: typeof data.description === "string" ? data.description : undefined
    };
  } catch {
    return { attributes: [] };
  }
}

function calculateStats(credentials: NormalizedCredential[]): AggregatedCredentialCatalog["stats"] {
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
    byFormat,
    bySubjectType,
    withSchemaAttributes,
    bySector,
    byEcosystem,
    byTheme,
    byCategory
  };
}

function buildNativeIdentifierMap(credentials: NormalizedCredential[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const credential of credentials) {
    if (!credential.nativeIdentifier) continue;
    const key = String(credential.nativeIdentifier).trim();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, credential.id);
    }
  }
  return map;
}

async function buildIssuerAvailabilityIndex(
  credentials: NormalizedCredential[],
  generatedAt: string
): Promise<IssuerAvailabilityIndex> {
  const data = await loadIssuerCatalogData();
  const issuers = Array.isArray(data.issuers) ? data.issuers : [];
  const nativeIdentifierToCredentialId = buildNativeIdentifierMap(credentials);
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
      const byRefId = String(configuration?.credentialCatalogRef?.id || "").trim();
      const byVctId = String(configuration?.vct || "").trim();
      const credentialId = byRefId || (byVctId ? nativeIdentifierToCredentialId.get(byVctId) || "" : "");
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
  const historyState = await loadHistoryState();
  const now = new Date().toISOString();
  const normalized: NormalizedCredential[] = [];

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

        normalized.push({
          ...credential,
          orgId: catalog.orgId,
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

  const aggregated: AggregatedCredentialCatalog = {
    schemaVersion: "1.4.0",
    catalogType: "credential",
    lastUpdated: now,
    credentials: deduped,
    stats: calculateStats(deduped)
  };

  await fs.mkdir(path.dirname(CONFIG.outputPath), { recursive: true });
  await fs.writeFile(CONFIG.outputPath, JSON.stringify(aggregated, null, 2));
  await saveHistoryState(historyState);

  const issuerAvailabilityIndex = await buildIssuerAvailabilityIndex(deduped, now);
  await fs.writeFile(CONFIG.issuerAvailabilityIndexPath, JSON.stringify(issuerAvailabilityIndex, null, 2));

  await fs.mkdir(path.dirname(CONFIG.wpPluginDataPath), { recursive: true });
  await fs.writeFile(CONFIG.wpPluginDataPath, JSON.stringify(aggregated, null, 2));

  console.log(`Credential aggregation complete. Total credentials: ${aggregated.stats.totalCredentials}`);
}

crawl().catch((error) => {
  console.error(error);
  process.exit(1);
});
