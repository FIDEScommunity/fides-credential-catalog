import fs from "fs/promises";
import path from "path";
import { execFileSync } from "child_process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type {
  AggregatedCredentialCatalog,
  CredentialCatalogFile,
  EnrichedAttribute,
  NormalizedCredential,
  SubjectType
} from "../types/credential.js";

const CONFIG = {
  schemaPath: path.join(process.cwd(), "schemas/credential-catalog.schema.json"),
  sourceDir: path.join(process.cwd(), "community-catalogs"),
  outputPath: path.join(process.cwd(), "data/aggregated.json"),
  wpPluginDataPath: path.join(
    process.cwd(),
    "wordpress-plugin/fides-credential-catalog/data/aggregated.json"
  ),
  historyPath: path.join(process.cwd(), "data/credential-history-state.json")
};

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

function getTypeFromSchemaProperty(propertySchema: Record<string, unknown>): string {
  const type = propertySchema.type;
  if (typeof type === "string") return type;
  if (Array.isArray(type) && type.length > 0) return String(type[0]);
  if (propertySchema.$ref) return "ref";
  if (propertySchema.oneOf) return "oneOf";
  if (propertySchema.anyOf) return "anyOf";
  if (propertySchema.allOf) return "allOf";
  return "unknown";
}

function extractAttributesFromSchema(schemaData: Record<string, unknown>): EnrichedAttribute[] {
  const props = schemaData.properties;
  if (!props || typeof props !== "object" || Array.isArray(props)) return [];

  const requiredRaw = schemaData.required;
  const requiredSet = new Set<string>(
    Array.isArray(requiredRaw) ? requiredRaw.filter((v): v is string => typeof v === "string") : []
  );

  const attributes: EnrichedAttribute[] = [];
  for (const [name, value] of Object.entries(props)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const propertySchema = value as Record<string, unknown>;
    attributes.push({
      name,
      type: getTypeFromSchemaProperty(propertySchema),
      required: requiredSet.has(name),
      description: typeof propertySchema.description === "string" ? propertySchema.description : undefined
    });
  }

  return attributes;
}

async function fetchSchemaAttributes(schemaUrl: string): Promise<EnrichedAttribute[]> {
  try {
    const response = await fetch(schemaUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const data = (await response.json()) as Record<string, unknown>;
    return extractAttributesFromSchema(data);
  } catch {
    return [];
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
  let withSchemaAttributes = 0;

  for (const credential of credentials) {
    byFormat[credential.vcFormat] = (byFormat[credential.vcFormat] || 0) + 1;
    bySubjectType[credential.subjectType] += 1;
    if (credential.attributes.length > 0) withSchemaAttributes += 1;
  }

  return {
    totalCredentials: credentials.length,
    byFormat,
    bySubjectType,
    withSchemaAttributes
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

      const repoRelativePath = path.relative(process.cwd(), catalogPath);
      const gitLastCommitAt = getGitLastCommitDateForPath(repoRelativePath);

      for (const credential of catalog.credentials) {
        const historyKey = `${catalog.provider.name}:${credential.id}`;
        const updatedAt =
          toIsoString(catalog.lastUpdated) ??
          gitLastCommitAt ??
          now;
        const firstSeenAt = historyState[historyKey]?.firstSeenAt ?? updatedAt;
        const attributes = await fetchSchemaAttributes(credential.schemaUrl);

        historyState[historyKey] = {
          firstSeenAt,
          lastSeenAt: now
        };

        normalized.push({
          ...credential,
          provider: catalog.provider,
          catalogUrl: catalogPath,
          source: "local",
          fetchedAt: now,
          updatedAt,
          firstSeenAt,
          attributes
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
    schemaVersion: "1.0.0",
    catalogType: "credential",
    lastUpdated: now,
    credentials: deduped,
    stats: calculateStats(deduped)
  };

  await fs.mkdir(path.dirname(CONFIG.outputPath), { recursive: true });
  await fs.writeFile(CONFIG.outputPath, JSON.stringify(aggregated, null, 2));
  await saveHistoryState(historyState);

  await fs.mkdir(path.dirname(CONFIG.wpPluginDataPath), { recursive: true });
  await fs.writeFile(CONFIG.wpPluginDataPath, JSON.stringify(aggregated, null, 2));

  console.log(`Credential aggregation complete. Total credentials: ${aggregated.stats.totalCredentials}`);
}

crawl().catch((error) => {
  console.error(error);
  process.exit(1);
});
