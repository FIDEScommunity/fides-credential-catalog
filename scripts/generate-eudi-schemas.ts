/**
 * Generates JSON Schema files from EUDI issuer OID4VCI metadata
 * and writes them to community-catalogs/eu/schemas/.
 * Run: npx tsx scripts/generate-eudi-schemas.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ISSUER_METADATA_URL = 'https://issuer.eudiw.dev/.well-known/openid-credential-issuer';
const SD_JWT_FORMATS = ['dc+sd-jwt', 'vc+sd-jwt'];
const MDOC_FORMAT = 'mso_mdoc';
const EU_CATALOG_DIR = path.join(process.cwd(), 'community-catalogs', 'eu');
const OUT_DIR = path.join(EU_CATALOG_DIR, 'schemas');
const CREDENTIAL_CATALOG_PATH = path.join(EU_CATALOG_DIR, 'credential-catalog.json');
/** Base URL for schemaUrl (must be absolute for catalog schema validation). */
const SCHEMA_BASE_URL =
  process.env.CREDENTIAL_CATALOG_SCHEMA_BASE_URL ??
  'https://raw.githubusercontent.com/FIDEScommunity/fides-credential-catalog/main/community-catalogs/eu/schemas';

interface Oid4vciClaim {
  path: string[];
  value_type?: string;
  mandatory?: boolean;
  display?: Array<{ name?: string; locale?: string }>;
}

interface CredentialMetadata {
  claims?: Oid4vciClaim[];
  display?: Array<{ name?: string; locale?: string }>;
}

interface CredentialConfig {
  format: string;
  vct?: string;
  doctype?: string;
  credential_metadata?: CredentialMetadata;
  display?: Array<{ name?: string }>;
}

interface IssuerMetadata {
  credential_configurations_supported?: Record<string, CredentialConfig>;
}

function valueTypeToJsonSchema(valueType: string | undefined): Record<string, unknown> {
  switch (valueType) {
    case 'string':
      return { type: 'string' };
    case 'full-date':
      return { type: 'string', format: 'date' };
    case 'uint':
      return { type: 'integer', minimum: 0 };
    case 'bool':
    case 'boolean':
      return { type: 'boolean' };
    case 'list':
      return { type: 'array', items: { type: 'string' } };
    case 'jpeg':
      return {
        type: 'string',
        contentEncoding: 'base64',
        contentMediaType: 'image/jpeg',
      };
    case 'test':
      return { type: 'string' };
    default:
      if (valueType?.endsWith('_attributes') || valueType === 'places' || valueType === 'nationalities') {
        return { type: 'object' };
      }
      return { type: valueType === undefined ? 'string' : 'object' };
  }
}

function setNested(
  obj: Record<string, unknown>,
  pathSegments: string[],
  value: Record<string, unknown>
): void {
  if (pathSegments.length === 1) {
    obj[pathSegments[0]] = value;
    return;
  }
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const key = pathSegments[i];
    if (!current[key] || typeof (current[key] as Record<string, unknown>)?.properties !== 'object') {
      current[key] = { type: 'object', properties: {} };
    }
    current = (current[key] as Record<string, unknown>).properties as Record<string, unknown>;
  }
  const leafKey = pathSegments[pathSegments.length - 1];
  if (!current.properties) current.properties = {};
  (current.properties as Record<string, unknown>)[leafKey] = value;
}

function addRequiredNested(
  requiredMap: Map<string, Set<string>>,
  pathSegments: string[],
  mandatory: boolean
): void {
  if (!mandatory) return;
  const parentPath = pathSegments.slice(0, -1).join('.');
  const leaf = pathSegments[pathSegments.length - 1];
  if (!requiredMap.has(parentPath)) requiredMap.set(parentPath, new Set());
  requiredMap.get(parentPath)!.add(leaf);
}

function applyRequiredToSchema(
  schema: Record<string, unknown>,
  requiredMap: Map<string, Set<string>>
): void {
  for (const [parentPath, set] of requiredMap) {
    if (!set.size) continue;
    if (parentPath === '') {
      schema.required = Array.from(set);
      continue;
    }
    const segments = parentPath.split('.');
    let target: unknown = schema.properties;
    for (const seg of segments) {
      if (target == null || typeof target !== 'object') break;
      target = (target as Record<string, unknown>)[seg];
    }
    if (target && typeof target === 'object') {
      (target as Record<string, unknown>).required = Array.from(set);
    }
  }
}

function buildSchemaFromClaims(claims: Oid4vciClaim[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const requiredMap = new Map<string, Set<string>>();

  for (const claim of claims) {
    const pathArr = claim.path;
    if (!pathArr || pathArr.length === 0) continue;
    const value = valueTypeToJsonSchema(claim.value_type);
    if (claim.display?.[0]?.name) {
      (value as Record<string, unknown>).description = claim.display[0].name;
    }
    setNested(properties, pathArr, value);
    addRequiredNested(requiredMap, pathArr, claim.mandatory === true);
  }

  const schema: Record<string, unknown> = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties,
    additionalProperties: true,
  };
  applyRequiredToSchema(schema, requiredMap);
  return schema;
}

function configIdToSlug(configId: string, vct?: string, format?: string): string {
  const lower = configId.replace(/^eu\.europa\.ec\.eudi\./, '').replace(/^org\.iso\.\d+\.\d+\./, '').replace(/_/g, '-').toLowerCase();
  if (format === MDOC_FORMAT) {
    const lastPart = configId.split('.').pop() ?? configId;
    const base = lastPart.replace(/_mdoc$/, '').replace(/_/g, '-');
    return `${base}-mdoc`;
  }
  if (lower.endsWith('-sd-jwt-vc') || lower.endsWith('-vc-sd-jwt')) return lower;
  if (lower.endsWith('-mdoc')) return lower;
  if (vct) {
    const m = vct.match(/urn:(?:eudi|eu\.europa\.ec\.eudi):([^:]+)(?::(\d+))?(?::(\d+))?/);
    if (m) return `${m[1]}${m[2] ? `-v${m[2]}` : ''}-sd-jwt-vc`.replace(/\./g, '-');
  }
  return lower;
}

function getDisplayName(config: CredentialConfig, configId: string): string {
  const meta = config.credential_metadata ?? config;
  const display = meta.display?.[0]?.name ?? config.display?.[0]?.name;
  if (display) return display;
  const short = configId.replace(/^eu\.europa\.ec\.eudi\./, '').replace(/_/g, ' ');
  return short.charAt(0).toUpperCase() + short.slice(1);
}

async function main(): Promise<void> {
  console.log('Fetching EUDI issuer metadata...');
  const res = await fetch(ISSUER_METADATA_URL);
  if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`);
  const metadata = (await res.json()) as IssuerMetadata;
  const configs = metadata.credential_configurations_supported ?? {};

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  type GeneratedEntry =
    | { configId: string; slug: string; vct: string; displayName: string; format: 'sd_jwt_vc' }
    | { configId: string; slug: string; doctype: string; displayName: string; format: 'mdoc' };
  const generated: GeneratedEntry[] = [];

  for (const [configId, config] of Object.entries(configs)) {
    if (!SD_JWT_FORMATS.includes(config.format)) continue;
    if (!config.credential_metadata?.claims?.length) continue;

    const slug = configIdToSlug(configId, config.vct);
    const schema = buildSchemaFromClaims(config.credential_metadata.claims);
    schema.$id = `https://eudi.example.org/schemas/${slug}.schema.json`;
    schema.title = getDisplayName(config, configId);
    if (config.vct) (schema as Record<string, unknown>).vct = config.vct;

    const outPath = path.join(OUT_DIR, `${slug}.schema.json`);
    fs.writeFileSync(outPath, JSON.stringify(schema, null, 2), 'utf-8');
    console.log(`  Wrote ${slug}.schema.json (SD-JWT VC)`);
    generated.push({
      configId,
      slug,
      vct: config.vct ?? '',
      displayName: getDisplayName(config, configId),
      format: 'sd_jwt_vc',
    });
  }

  for (const [configId, config] of Object.entries(configs)) {
    if (config.format !== MDOC_FORMAT) continue;
    if (!config.credential_metadata?.claims?.length || !config.doctype) continue;

    const slug = configIdToSlug(configId, undefined, MDOC_FORMAT);
    const schema = buildSchemaFromClaims(config.credential_metadata.claims);
    schema.$id = `https://eudi.example.org/schemas/${slug}.schema.json`;
    schema.title = getDisplayName(config, configId);
    (schema as Record<string, unknown>).docType = config.doctype;

    const outPath = path.join(OUT_DIR, `${slug}.schema.json`);
    fs.writeFileSync(outPath, JSON.stringify(schema, null, 2), 'utf-8');
    console.log(`  Wrote ${slug}.schema.json (mDoc)`);
    generated.push({
      configId,
      slug,
      doctype: config.doctype,
      displayName: getDisplayName(config, configId),
      format: 'mdoc',
    });
  }

  const catalog = {
    $schema: 'https://fides.community/schemas/credential-catalog/v1',
    provider: {
      name: 'European Commission',
      website: 'https://digital-strategy.ec.europa.eu/en/policies/eudi-wallet',
    },
    credentials: generated.map((g) =>
      g.format === 'sd_jwt_vc'
        ? {
            id: `cred:eu:${g.slug}:sd-jwt-vc`,
            slug: `eu-${g.slug}`,
            displayName: g.displayName,
            shortDescription: `EUDI Wallet credential: ${g.displayName}. Schema generated from issuer metadata.`,
            authority: { name: 'European Commission', url: 'https://digital-strategy.ec.europa.eu/en/policies/eudi-wallet' },
            subjectType: 'Person' as const,
            vcFormat: 'sd_jwt_vc' as const,
            nativeIdentifier: g.vct,
            nativeIdentifierType: 'vct' as const,
            schemaUrl: `${SCHEMA_BASE_URL}/${g.slug}.schema.json`,
            schemaType: 'JSON Schema' as const,
            version: '1',
            tags: ['eu', 'eudi', g.slug.split('-')[0]],
          }
        : {
            id: `cred:eu:${g.slug}:mdoc`,
            slug: `eu-${g.slug}`,
            displayName: g.displayName,
            shortDescription: `EUDI Wallet credential: ${g.displayName}. Schema generated from issuer metadata.`,
            authority: { name: 'European Commission', url: 'https://digital-strategy.ec.europa.eu/en/policies/eudi-wallet' },
            subjectType: 'Person' as const,
            vcFormat: 'mdoc' as const,
            nativeIdentifier: g.doctype,
            nativeIdentifierType: 'docType' as const,
            schemaUrl: `${SCHEMA_BASE_URL}/${g.slug}.schema.json`,
            schemaType: 'JSON Schema' as const,
            version: '1',
            tags: ['eu', 'eudi', 'mdoc', g.slug.replace(/-mdoc$/, '')],
          }
    ),
  };

  fs.writeFileSync(CREDENTIAL_CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`\nGenerated ${generated.length} schema(s) in community-catalogs/eu/schemas/`);
  console.log(`Wrote ${CREDENTIAL_CATALOG_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
