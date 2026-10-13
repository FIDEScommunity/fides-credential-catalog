#!/usr/bin/env node
/**
 * Rewrite RP / use-case / issuer seed refs from legacy format-era credential ids
 * (cred:org:key:format) to attestation type ids (cred:org:key), using aliasIds
 * from the local credential catalog aggregated.json.
 *
 * Also dedupes sibling format pairs in RP acceptedCredentialRefs and use-case
 * credential link lists. Issuer credentialRefs are rewritten but not deduped
 * (one OID4VCI config / manual ref per row can remain).
 *
 * Usage:
 *   node scripts/rewrite-cross-catalog-credential-refs.mjs           # apply
 *   node scripts/rewrite-cross-catalog-credential-refs.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROJECTS = path.resolve(ROOT, '..');
const DRY = process.argv.includes('--dry-run');

const CREDENTIAL_AGG = path.join(ROOT, 'data/aggregated.json');
const TARGETS = [
  {
    name: 'rp-catalog',
    dir: path.join(PROJECTS, 'rp-catalog/community-catalogs'),
    kind: 'rp',
  },
  {
    name: 'use-case-catalog',
    dir: path.join(PROJECTS, 'use-case-catalog/community-catalogs'),
    kind: 'usecase',
  },
  {
    // WP export is the use-case crawler source of truth and overwrites community seeds.
    name: 'use-case-catalog-wp-export',
    dir: path.join(PROJECTS, 'use-case-catalog/data/wp-export'),
    kind: 'usecase-export',
    files: [path.join(PROJECTS, 'use-case-catalog/data/wp-export/use-case.json')],
  },
  {
    name: 'issuer-catalog',
    dir: path.join(PROJECTS, 'issuer-catalog/community-catalogs'),
    kind: 'issuer',
  },
  {
    // Post-process crawler output so OID4VCI matches that still used GitHub
    // format-era credential ids are rewritten locally before plugin sync.
    name: 'issuer-catalog-aggregated',
    dir: path.join(PROJECTS, 'issuer-catalog/data'),
    kind: 'issuer-aggregated',
    files: [
      path.join(PROJECTS, 'issuer-catalog/data/aggregated.json'),
      path.join(
        PROJECTS,
        'issuer-catalog/wordpress-plugin/fides-issuer-catalog/data/aggregated.json'
      ),
    ],
  },
];

function walkJson(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJson(full, acc);
    else if (entry.name.endsWith('.json') && !entry.name.startsWith('.')) acc.push(full);
  }
  return acc;
}

function loadAliasMaps() {
  const data = JSON.parse(fs.readFileSync(CREDENTIAL_AGG, 'utf8'));
  const credentials = Array.isArray(data.credentials) ? data.credentials : [];
  const aliasToCanon = Object.create(null);
  const displayById = Object.create(null);
  for (const credential of credentials) {
    if (!credential || typeof credential.id !== 'string') continue;
    displayById[credential.id] = (credential.displayName || '').trim() || credential.id;
    aliasToCanon[credential.id] = credential.id;
    for (const alias of credential.aliasIds || []) {
      if (alias) aliasToCanon[String(alias)] = credential.id;
    }
    for (const format of credential.formats || []) {
      if (format && format.credentialId) {
        aliasToCanon[String(format.credentialId)] = credential.id;
      }
    }
  }
  return { aliasToCanon, displayById };
}

function resolveId(id, aliasToCanon) {
  if (!id || typeof id !== 'string' || !id.startsWith('cred:')) return null;
  return aliasToCanon[id] || id;
}

function rewriteRpCatalog(doc, aliasToCanon, displayById, stats) {
  const parties = Array.isArray(doc.relyingParties) ? doc.relyingParties : [];
  for (const rp of parties) {
    const labels = Array.isArray(rp.acceptedCredentials) ? rp.acceptedCredentials : [];
    const refs = Array.isArray(rp.acceptedCredentialRefs) ? rp.acceptedCredentialRefs : [];
    if (!refs.length && !labels.length) continue;

    const n = Math.max(labels.length, refs.length);
    const seen = new Set();
    const nextLabels = [];
    const nextRefs = [];

    for (let i = 0; i < n; i++) {
      const ref = refs[i] && typeof refs[i] === 'object' ? refs[i] : null;
      const rawId = ref && typeof ref.credentialCatalogId === 'string' ? ref.credentialCatalogId : null;
      const label = typeof labels[i] === 'string' ? labels[i].trim() : '';

      if (!rawId) {
        // Label-only accepted credentials (no catalog id) — keep the label,
        // never invent an empty acceptedCredentialRefs item (schema requires id).
        if (label) nextLabels.push(label);
        continue;
      }

      const canonical = resolveId(rawId, aliasToCanon);
      if (!canonical) continue;
      if (canonical !== rawId) stats.rewritten += 1;
      else stats.unchanged += 1;
      if (!aliasToCanon[rawId] && rawId.split(':').length >= 4) stats.unknown += 1;

      if (seen.has(canonical)) {
        stats.deduped += 1;
        continue;
      }
      seen.add(canonical);
      nextRefs.push({ ...ref, credentialCatalogId: canonical });
      nextLabels.push(displayById[canonical] || label || canonical);
    }

    rp.acceptedCredentials = nextLabels;
    rp.acceptedCredentialRefs = nextRefs;
  }
  return doc;
}

function rewriteUseCaseCatalog(doc, aliasToCanon, displayById, stats) {
  const useCases = Array.isArray(doc.useCases) ? doc.useCases : [];
  for (const useCase of useCases) {
    const links = useCase && useCase.links && typeof useCase.links === 'object' ? useCase.links : null;
    if (!links || !Array.isArray(links.credentials)) continue;

    const seen = new Set();
    const next = [];
    for (const link of links.credentials) {
      if (!link || typeof link !== 'object') continue;
      const rawId = typeof link.refId === 'string' ? link.refId : '';
      if (!rawId.startsWith('cred:')) {
        next.push(link);
        continue;
      }
      const canonical = resolveId(rawId, aliasToCanon);
      if (!canonical) continue;
      if (canonical !== rawId) stats.rewritten += 1;
      else stats.unchanged += 1;
      if (!aliasToCanon[rawId] && rawId.split(':').length >= 4) stats.unknown += 1;
      if (seen.has(canonical)) {
        stats.deduped += 1;
        continue;
      }
      seen.add(canonical);
      const labelRaw =
        displayById[canonical] ||
        (typeof link.labelRaw === 'string' ? link.labelRaw : '') ||
        canonical;
      next.push({ ...link, refId: canonical, labelRaw });
    }
    links.credentials = next;
  }
  return doc;
}

function rewriteIssuerCatalog(doc, aliasToCanon, displayById, stats) {
  const issuers = Array.isArray(doc.issuers) ? doc.issuers : [];
  for (const issuer of issuers) {
    const refs = Array.isArray(issuer.credentialRefs) ? issuer.credentialRefs : [];
    for (const ref of refs) {
      if (!ref || typeof ref.id !== 'string' || !ref.id.startsWith('cred:')) continue;
      const canonical = resolveId(ref.id, aliasToCanon);
      if (!canonical) continue;
      if (canonical !== ref.id) stats.rewritten += 1;
      else stats.unchanged += 1;
      if (!aliasToCanon[ref.id] && ref.id.split(':').length >= 4) stats.unknown += 1;
      ref.id = canonical;
      if (!ref.displayName && displayById[canonical]) {
        ref.displayName = displayById[canonical];
      }
    }
  }
  return doc;
}

function rewriteIssuerAggregated(doc, aliasToCanon, displayById, stats) {
  const issuers = Array.isArray(doc.issuers) ? doc.issuers : [];
  for (const issuer of issuers) {
    const configs = Array.isArray(issuer.credentialConfigurations)
      ? issuer.credentialConfigurations
      : [];
    for (const config of configs) {
      const ref = config && config.credentialCatalogRef;
      if (!ref || typeof ref.id !== 'string' || !ref.id.startsWith('cred:')) continue;
      const canonical = resolveId(ref.id, aliasToCanon);
      if (!canonical) continue;
      if (canonical !== ref.id) stats.rewritten += 1;
      else stats.unchanged += 1;
      if (!aliasToCanon[ref.id] && ref.id.split(':').length >= 4) stats.unknown += 1;
      ref.id = canonical;
      if (displayById[canonical]) ref.displayName = displayById[canonical];
    }
  }
  return doc;
}

function rewriteUseCaseExport(doc, aliasToCanon, displayById, stats) {
  // WP export shape: { organizations: [{ useCases: [...] }] }
  if (Array.isArray(doc?.organizations)) {
    for (const org of doc.organizations) {
      if (!org || !Array.isArray(org.useCases)) continue;
      rewriteUseCaseCatalog({ useCases: org.useCases }, aliasToCanon, displayById, stats);
    }
    return doc;
  }
  if (Array.isArray(doc)) {
    return rewriteUseCaseCatalog({ useCases: doc }, aliasToCanon, displayById, stats).useCases;
  }
  if (Array.isArray(doc.useCases)) {
    return rewriteUseCaseCatalog(doc, aliasToCanon, displayById, stats);
  }
  if (Array.isArray(doc.items)) {
    doc.items = rewriteUseCaseCatalog({ useCases: doc.items }, aliasToCanon, displayById, stats).useCases;
    return doc;
  }
  return doc;
}

function main() {
  const { aliasToCanon, displayById } = loadAliasMaps();
  const summary = [];

  for (const target of TARGETS) {
    const stats = { rewritten: 0, unchanged: 0, deduped: 0, unknown: 0, filesChanged: 0 };
    const files = Array.isArray(target.files) ? target.files : walkJson(target.dir);
    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      const before = fs.readFileSync(file, 'utf8');
      let doc;
      try {
        doc = JSON.parse(before);
      } catch {
        continue;
      }
      if (target.kind === 'rp') rewriteRpCatalog(doc, aliasToCanon, displayById, stats);
      else if (target.kind === 'usecase') rewriteUseCaseCatalog(doc, aliasToCanon, displayById, stats);
      else if (target.kind === 'usecase-export') doc = rewriteUseCaseExport(doc, aliasToCanon, displayById, stats);
      else if (target.kind === 'issuer-aggregated') rewriteIssuerAggregated(doc, aliasToCanon, displayById, stats);
      else rewriteIssuerCatalog(doc, aliasToCanon, displayById, stats);

      const after = `${JSON.stringify(doc, null, 2)}\n`;
      if (after !== before) {
        stats.filesChanged += 1;
        if (!DRY) fs.writeFileSync(file, after);
      }
    }
    summary.push({ target: target.name, ...stats, dryRun: DRY });
  }

  console.log(JSON.stringify(summary, null, 2));
  if (DRY) console.log('(dry-run — no files written)');
}

main();
