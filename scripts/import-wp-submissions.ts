#!/usr/bin/env tsx
/**
 * Import published WordPress credential submissions into community-catalogs/.
 *
 * One credential is merged per export entry; sibling credentials and
 * non-WordPress fields remain untouched.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.cwd());
const COMMUNITY_DIR = path.join(ROOT, 'community-catalogs');
const STATE_PATH = path.join(ROOT, 'data/wp-submission-state.json');
const EXPORT_PATH = process.env.FIDES_WP_EXPORT_FILE
  ? path.resolve(ROOT, process.env.FIDES_WP_EXPORT_FILE)
  : path.join(ROOT, 'data/wp-export/credential.json');
const FILENAME = 'credential-catalog.json';
const MARKER = '.wordpress-source';
const SCHEMA = 'https://fides.community/schemas/credential-catalog/v1';

export type WpExportEntry = {
  itemId: string;
  slug: string;
  filename: string;
  source: string;
  document: Record<string, unknown>;
  publishedAt?: string | null;
};

export type WpExportPayload = {
  schemaVersion: string;
  catalogType: string;
  generatedAt: string;
  entries: WpExportEntry[];
};

export type ManagedCredential = { slug: string; credentialId: string };
export type WpSubmissionState = {
  schemaVersion: '1.0.0';
  catalogType: string;
  lastImportAt: string | null;
  managedCredentials: ManagedCredential[];
};

type CredentialRecord = Record<string, unknown> & { id?: string };
type CredentialCatalogDoc = {
  $schema?: string;
  orgId?: string;
  credentials?: CredentialRecord[];
  lastUpdated?: string;
};
type ImportPlan = {
  groups: Array<{ slug: string; entries: WpExportEntry[] }>;
  prune: ManagedCredential[];
  skipped: Array<{ slug: string; reason: string }>;
};

export function emptyState(catalogType = 'credential'): WpSubmissionState {
  return {
    schemaVersion: '1.0.0',
    catalogType,
    lastImportAt: null,
    managedCredentials: [],
  };
}

export function credentialFromEntry(entry: WpExportEntry): CredentialRecord | null {
  const credentials = entry.document.credentials;
  if (!Array.isArray(credentials) || !credentials[0] || typeof credentials[0] !== 'object') {
    return null;
  }
  const credential = credentials[0] as CredentialRecord;
  const id = String(credential.id || entry.itemId || '').trim();
  return id ? { ...credential, id } : null;
}

export function mergeCredentialIntoCatalog(
  base: CredentialCatalogDoc | null,
  entry: WpExportEntry,
): CredentialCatalogDoc {
  const credential = credentialFromEntry(entry);
  if (!credential) throw new Error(`Export entry ${entry.itemId} has no credential object.`);
  const orgId = String(entry.document.orgId || '').trim();
  if (base?.orgId && orgId && base.orgId !== orgId) {
    throw new Error(`Export entry ${entry.itemId} orgId does not match catalog ${entry.slug}.`);
  }
  const credentials = Array.isArray(base?.credentials) ? [...base.credentials] : [];
  const index = credentials.findIndex((item) => String(item.id || '') === credential.id);
  if (index >= 0) credentials[index] = { ...credentials[index], ...credential };
  else credentials.push(credential);
  const modified = typeof entry.document.lastUpdated === 'string'
    ? entry.document.lastUpdated.trim()
    : '';
  return {
    $schema: SCHEMA,
    orgId: orgId || base?.orgId,
    credentials,
    lastUpdated: modified || base?.lastUpdated || new Date().toISOString(),
  };
}

export function buildImportPlan(entries: WpExportEntry[], previous: WpSubmissionState): ImportPlan {
  const groups = new Map<string, WpExportEntry[]>();
  const current = new Set<string>();
  const skipped: ImportPlan['skipped'] = [];
  for (const entry of entries) {
    const slug = String(entry.slug || '').trim();
    const credentialId = String(entry.itemId || '').trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      || !/^cred:[a-z0-9]+:[a-z0-9-]+:[a-z0-9-]+$/.test(credentialId)
      || entry.filename !== FILENAME
      || !credentialFromEntry(entry)) {
      skipped.push({ slug: slug || '(missing)', reason: 'invalid entry metadata or credential document' });
      continue;
    }
    const list = groups.get(slug) ?? [];
    list.push(entry);
    groups.set(slug, list);
    current.add(`${slug}:${credentialId}`);
  }
  return {
    groups: [...groups].map(([slug, groupedEntries]) => ({ slug, entries: groupedEntries })),
    prune: previous.managedCredentials.filter(
      (item) => !current.has(`${item.slug}:${item.credentialId}`),
    ),
    skipped,
  };
}

export async function loadCommittedExportPayload(
  filePath = EXPORT_PATH,
): Promise<WpExportPayload | null> {
  try {
    const payload = JSON.parse(await fs.readFile(filePath, 'utf8')) as WpExportPayload;
    if (!Array.isArray(payload?.entries)) throw new Error('entries array is missing');
    return payload;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new Error(`Invalid committed export ${path.relative(ROOT, filePath)}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function inlineExport(): WpExportPayload | null {
  const json = process.env.FIDES_WP_EXPORT_JSON?.trim();
  if (!json) return null;
  const payload = JSON.parse(json) as WpExportPayload;
  if (!Array.isArray(payload?.entries)) throw new Error('Inline export entries array is missing.');
  return payload;
}

async function fetchExport(url: string, secret: string): Promise<WpExportPayload> {
  if (!secret) throw new Error('Missing FIDES_CATALOG_SECRET or WP_INVALIDATE_SECRET.');
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-FIDES-Catalog-Secret': secret,
      'User-Agent': 'FIDES-Catalog-Automation/1.0',
    },
    signal: AbortSignal.timeout(60_000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`WP export failed (HTTP ${response.status}): ${body.slice(0, 300)}`);
  const payload = JSON.parse(body) as WpExportPayload;
  if (!Array.isArray(payload?.entries)) throw new Error('WP export entries array is missing.');
  return payload;
}

async function loadExport(url: string, secret: string): Promise<WpExportPayload> {
  const inline = inlineExport();
  if (inline) return inline;
  const committed = await loadCommittedExportPayload();
  if (committed) return committed;
  if (process.env.GITHUB_EVENT_NAME === 'repository_dispatch') {
    throw new Error('repository_dispatch did not include FIDES_WP_EXPORT_JSON.');
  }
  return fetchExport(url, secret);
}

async function readState(): Promise<WpSubmissionState> {
  try {
    const state = JSON.parse(await fs.readFile(STATE_PATH, 'utf8')) as WpSubmissionState;
    return Array.isArray(state?.managedCredentials) ? state : emptyState();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyState();
    throw error;
  }
}

async function readCatalog(slug: string): Promise<CredentialCatalogDoc | null> {
  try {
    return JSON.parse(
      await fs.readFile(path.join(COMMUNITY_DIR, slug, FILENAME), 'utf8'),
    ) as CredentialCatalogDoc;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function readMarker(
  slug: string,
): Promise<{ credentials?: Record<string, unknown> } | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(COMMUNITY_DIR, slug, MARKER), 'utf8'));
  } catch {
    return null;
  }
}

async function applyPlan(plan: ImportPlan, apply: boolean): Promise<WpSubmissionState> {
  const managed: ManagedCredential[] = [];
  for (const group of plan.groups) {
    let doc = await readCatalog(group.slug);
    for (const entry of group.entries) {
      doc = mergeCredentialIntoCatalog(doc, entry);
      managed.push({ slug: group.slug, credentialId: entry.itemId });
    }
    if (apply) {
      const dir = path.join(COMMUNITY_DIR, group.slug);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, FILENAME), `${JSON.stringify(doc, null, 2)}\n`);
      const oldMarker = await readMarker(group.slug);
      const markerCredentials = { ...(oldMarker?.credentials ?? {}) };
      for (const entry of group.entries) {
        markerCredentials[entry.itemId] = {
          itemId: entry.itemId,
          publishedAt: entry.publishedAt ?? null,
        };
      }
      await fs.writeFile(path.join(dir, MARKER), `${JSON.stringify({
        source: 'wordpress',
        slug: group.slug,
        credentials: markerCredentials,
        importedAt: new Date().toISOString(),
      }, null, 2)}\n`);
    }
    console.log(`${apply ? 'WRITE' : 'DRY '} ${group.slug} (${group.entries.length} credential(s))`);
  }

  for (const stale of plan.prune) {
    const marker = await readMarker(stale.slug);
    if (!marker?.credentials || !(stale.credentialId in marker.credentials)) {
      console.log(`SKIP  prune ${stale.slug}/${stale.credentialId} — not WP-managed`);
      continue;
    }
    const doc = await readCatalog(stale.slug);
    if (!doc) continue;
    const next = {
      ...doc,
      credentials: (doc.credentials ?? []).filter((item) => item.id !== stale.credentialId),
      lastUpdated: new Date().toISOString(),
    };
    if (apply) {
      const dir = path.join(COMMUNITY_DIR, stale.slug);
      if (!next.credentials.length) {
        // Credential catalog directories may also contain schema files. Remove
        // only the WordPress-managed catalog artifacts, never the whole folder.
        await fs.rm(path.join(dir, FILENAME), { force: true });
        await fs.rm(path.join(dir, MARKER), { force: true });
      } else {
        delete marker.credentials[stale.credentialId];
        await fs.writeFile(path.join(dir, FILENAME), `${JSON.stringify(next, null, 2)}\n`);
        await fs.writeFile(path.join(dir, MARKER), `${JSON.stringify(marker, null, 2)}\n`);
      }
    }
    console.log(`${apply ? 'PRUNE' : 'DRY  prune'} ${stale.slug}/${stale.credentialId}`);
  }

  for (const skipped of plan.skipped) console.log(`SKIP  ${skipped.slug} — ${skipped.reason}`);
  const unique = new Map(
    managed.map((item) => [`${item.slug}:${item.credentialId}`, item]),
  );
  return {
    schemaVersion: '1.0.0',
    catalogType: 'credential',
    lastImportAt: apply ? new Date().toISOString() : null,
    managedCredentials: [...unique.values()].sort(
      (a, b) => `${a.slug}:${a.credentialId}`.localeCompare(`${b.slug}:${b.credentialId}`),
    ),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const urlIndex = args.indexOf('--wp-url');
  const url = urlIndex >= 0 && args[urlIndex + 1]
    ? args[urlIndex + 1]!
    : process.env.FIDES_WP_EXPORT_URL ?? 'http://utrecht-demo.local/wp-json/fides-catalog/v1/export/credential';
  const secret = process.env.FIDES_CATALOG_SECRET ?? process.env.WP_INVALIDATE_SECRET ?? '';
  const previous = await readState();
  const payload = await loadExport(url, secret);
  const plan = buildImportPlan(payload.entries, previous);
  console.log(`Mode: ${apply ? 'apply' : 'dry-run'}; entries: ${payload.entries.length}; groups: ${plan.groups.length}; prune: ${plan.prune.length}`);
  const next = await applyPlan(plan, apply);
  if (apply) {
    await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
    await fs.writeFile(STATE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  }
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
