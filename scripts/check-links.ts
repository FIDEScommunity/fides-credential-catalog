/**
 * Linkcheck script for credential catalog.
 * Reads data/aggregated.json, collects all URLs from credentials,
 * checks each unique URL with HEAD, and writes data/linkcheck-report.json + linkcheck-summary.md.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const AGGREGATED_PATH = join(process.cwd(), 'data/aggregated.json');
const REPORT_JSON_PATH = join(process.cwd(), 'data/linkcheck-report.json');
const REPORT_MD_PATH = join(process.cwd(), 'data/linkcheck-summary.md');
const REQUEST_TIMEOUT_MS = 10_000;
const DELAY_BETWEEN_REQUESTS_MS = 300;

function isHttpUrl(s: string): boolean {
  return typeof s === 'string' && (s.startsWith('http://') || s.startsWith('https://'));
}

interface LinkContext {
  itemId: string;
  field: string;
  providerName: string;
}

function addUrl(
  map: Map<string, { contexts: LinkContext[] }>,
  url: string,
  context: LinkContext
) {
  const normalized = url.trim();
  if (!isHttpUrl(normalized)) return;
  const existing = map.get(normalized);
  if (existing) {
    if (!existing.contexts.some(c => c.itemId === context.itemId && c.field === context.field)) {
      existing.contexts.push(context);
    }
  } else {
    map.set(normalized, { contexts: [context] });
  }
}

interface CredentialItem {
  id: string;
  displayName?: string;
  authority?: { name?: string; url?: string };
  schemaUrl?: string;
  provider?: { name?: string; website?: string };
}

interface AggregatedData {
  credentials: CredentialItem[];
}

function collectCredentialUrls(
  credentials: CredentialItem[],
  urlToContexts: Map<string, { contexts: LinkContext[] }>
) {
  for (const c of credentials) {
    const providerName = c.authority?.name ?? c.provider?.name ?? 'Unknown';
    const ctx = (field: string): LinkContext => ({ itemId: c.id, field, providerName });

    if (c.authority?.url) addUrl(urlToContexts, c.authority.url, ctx('authority.url'));
    if (c.provider?.website) addUrl(urlToContexts, c.provider.website, ctx('provider.website'));
    if (c.schemaUrl) addUrl(urlToContexts, c.schemaUrl, ctx('schemaUrl'));
  }
}

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': 'FIDES-Credential-Catalog-Linkcheck/1.0' },
    });
    const ok = res.status >= 200 && res.status < 400;
    return ok ? { ok: true, status: res.status } : { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface BrokenEntry {
  url: string;
  status?: number;
  error: string;
  contexts: LinkContext[];
}

interface ByProviderEntry {
  brokenUrls: Array<{ url: string; error: string; status?: number }>;
}

interface LinkcheckReport {
  runAt: string;
  totalUrls: number;
  brokenCount: number;
  broken: BrokenEntry[];
  byProvider: Record<string, ByProviderEntry>;
}

async function main() {
  const raw = readFileSync(AGGREGATED_PATH, 'utf-8');
  const data: AggregatedData = JSON.parse(raw);
  const credentials = data.credentials ?? [];

  const urlToContexts = new Map<string, { contexts: LinkContext[] }>();
  collectCredentialUrls(credentials, urlToContexts);

  const uniqueUrls = [...urlToContexts.keys()];
  const totalUrls = uniqueUrls.length;
  console.log(`Checking ${totalUrls} unique URL(s)...`);

  const broken: BrokenEntry[] = [];
  let checked = 0;
  for (const url of uniqueUrls) {
    const result = await checkUrl(url);
    if (!result.ok) {
      const entry = urlToContexts.get(url)!;
      broken.push({
        url,
        status: result.status,
        error: result.error ?? 'Unknown error',
        contexts: entry.contexts,
      });
    }
    checked++;
    if (checked % 50 === 0) console.log(`  ${checked}/${totalUrls}`);
    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  const byProvider: Record<string, ByProviderEntry> = {};
  for (const b of broken) {
    for (const ctx of b.contexts) {
      const name = ctx.providerName;
      if (!byProvider[name]) byProvider[name] = { brokenUrls: [] };
      const exists = byProvider[name].brokenUrls.some((u) => u.url === b.url);
      if (!exists) {
        byProvider[name].brokenUrls.push({ url: b.url, error: b.error, status: b.status });
      }
    }
  }

  const report: LinkcheckReport = {
    runAt: new Date().toISOString(),
    totalUrls,
    brokenCount: broken.length,
    broken,
    byProvider,
  };

  writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Report written to ${REPORT_JSON_PATH}`);

  let md = `# Credential catalog linkcheck – ${report.runAt.slice(0, 10)}\n\n`;
  md += `- **Total URLs checked:** ${totalUrls}\n`;
  md += `- **Broken:** ${broken.length}\n\n`;
  if (broken.length > 0) {
    md += `## Broken links by provider\n\n`;
    for (const [providerName, entry] of Object.entries(byProvider)) {
      md += `### ${providerName}\n`;
      for (const u of entry.brokenUrls) {
        md += `- ${u.url} — ${u.error}\n`;
      }
      md += `\n`;
    }
  }
  writeFileSync(REPORT_MD_PATH, md, 'utf-8');
  console.log(`Summary written to ${REPORT_MD_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
