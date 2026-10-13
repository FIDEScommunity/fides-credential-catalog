#!/usr/bin/env node
/**
 * Seed-merge to attestation-type ids (TS11-COMPLIANCE-PLAN §5.3).
 *
 * - Canonical id becomes cred:<org>:<key> (no format segment).
 * - Sibling format entries collapse into one row with formats[].
 * - Former per-format ids are kept in aliasIds and formats[].credentialId.
 *
 * Idempotent for already-merged files (3-segment ids with formats[]).
 *
 * Usage: node scripts/migrate-seed-merge-attestation-types.mjs [--dry-run]
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CATALOG_DIR = path.join(ROOT, "community-catalogs");
const V2_SCHEMA = "https://fides.community/schemas/credential-catalog/v2";
const DRY_RUN = process.argv.includes("--dry-run");

const FORMAT_KEY_SUFFIXES = [
  "-mso-mdoc",
  "-sd-jwt-vc",
  "-vc-sd-jwt",
  "-jwt-vc-json",
  "-ldp-vc",
  "-jwt-vc",
  "-sd-jwt",
  "-mdoc",
];

const FORMAT_NAME_SUFFIX =
  /\s*\((?:sd-jwt(?:\s+vc)?|mso\s+mdoc|mdoc|jwt\s+vc(?:\s+json)?|ldp\s+vc|vcdm(?:\s+\d(?:\.\d)?)?)\)\s*$/i;

const PRIMARY_FORMAT_ORDER = [
  "sd_jwt_vc",
  "mdoc",
  "jwt_vc",
  "vcdm_2_0",
  "vcdm_1_1",
  "anoncreds",
  "acdc",
  "idemix",
  "apple_wallet_pass",
  "google_wallet_pass",
];

function stripFormatKeySuffix(key) {
  for (const suffix of FORMAT_KEY_SUFFIXES) {
    if (key.endsWith(suffix) && key.length > suffix.length) {
      return key.slice(0, -suffix.length);
    }
  }
  return key;
}

function stripFormatDisplayName(name) {
  const stripped = String(name || "").replace(FORMAT_NAME_SUFFIX, "").trim();
  return stripped.length > 0 ? stripped : String(name || "");
}

function parseId(id) {
  const parts = String(id || "").split(":");
  if (parts[0] !== "cred") return null;
  if (parts.length === 4) {
    return { authority: parts[1], key: parts[2], format: parts[3], segments: 4 };
  }
  if (parts.length === 3) {
    return { authority: parts[1], key: parts[2], format: null, segments: 3 };
  }
  return null;
}

function attestationTypeIdFor(credential) {
  if (credential.attestationTypeId) return credential.attestationTypeId;
  const parsed = parseId(credential.id);
  if (!parsed) return null;
  if (parsed.segments === 3) return credential.id;
  return `cred:${parsed.authority}:${stripFormatKeySuffix(parsed.key)}`;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), "en", { sensitivity: "base" })
  );
}

function preferString(...candidates) {
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function formatEntryFromCredential(credential) {
  const formatIdentifier = credential.vcFormat;
  const schemaURIs = [];
  if (credential.schemaUrl) {
    schemaURIs.push({
      formatIdentifier,
      uri: credential.schemaUrl,
      ...(credential.schemaType ? { schemaType: credential.schemaType } : {}),
    });
  }
  for (const uri of credential.schemaURIs || []) {
    if (!uri?.uri) continue;
    if (schemaURIs.some((existing) => existing.uri === uri.uri && existing.formatIdentifier === uri.formatIdentifier)) {
      continue;
    }
    schemaURIs.push(uri);
  }
  return {
    formatIdentifier,
    ...(credential.nativeIdentifier ? { nativeIdentifier: credential.nativeIdentifier } : {}),
    ...(credential.nativeIdentifierType
      ? { nativeIdentifierType: credential.nativeIdentifierType }
      : {}),
    ...(schemaURIs.length ? { schemaURIs } : {}),
    ...(parseId(credential.id)?.segments === 4 ? { credentialId: credential.id } : {}),
  };
}

function pickPrimary(entries) {
  const ranked = [...entries].sort((a, b) => {
    const ai = PRIMARY_FORMAT_ORDER.indexOf(a.vcFormat);
    const bi = PRIMARY_FORMAT_ORDER.indexOf(b.vcFormat);
    const ar = ai === -1 ? 999 : ai;
    const br = bi === -1 ? 999 : bi;
    if (ar !== br) return ar - br;
    return a.id.localeCompare(b.id);
  });
  return ranked[0];
}

function mergeGroup(typeId, entries) {
  const primary = pickPrimary(entries);
  const formats = [];
  const seenFormats = new Set();
  for (const entry of [...entries].sort((a, b) => a.id.localeCompare(b.id))) {
    const format = formatEntryFromCredential(entry);
    if (seenFormats.has(format.formatIdentifier)) continue;
    seenFormats.add(format.formatIdentifier);
    formats.push(format);
  }
  formats.sort((a, b) => a.formatIdentifier.localeCompare(b.formatIdentifier));

  const aliasIds = uniqueSorted(
    entries.flatMap((entry) => {
      const ids = [];
      if (entry.id !== typeId) ids.push(entry.id);
      for (const alias of entry.aliasIds || []) ids.push(alias);
      for (const format of entry.formats || []) {
        if (format.credentialId && format.credentialId !== typeId) ids.push(format.credentialId);
      }
      return ids;
    })
  );

  const slugBase = typeId.replace(/^cred:/, "").replace(/:/g, "-");

  const merged = {
    id: typeId,
    ...(aliasIds.length ? { aliasIds } : {}),
    slug: preferString(primary.slug?.replace(/-(sd-jwt-vc|mdoc|mso-mdoc|jwt-vc|vcdm-1-1|vcdm-2-0|acdc|anoncreds)$/i, ""), slugBase),
    displayName: stripFormatDisplayName(primary.displayName),
    ...(preferString(...entries.map((e) => e.shortDescription))
      ? { shortDescription: preferString(...entries.map((e) => e.shortDescription)) }
      : {}),
    authority: primary.authority,
    subjectType: primary.subjectType,
    vcFormat: primary.vcFormat,
    ...(primary.nativeIdentifier ? { nativeIdentifier: primary.nativeIdentifier } : {}),
    ...(primary.nativeIdentifierType
      ? { nativeIdentifierType: primary.nativeIdentifierType }
      : {}),
    schemaUrl: primary.schemaUrl,
    schemaType: primary.schemaType,
    ...(preferString(...entries.map((e) => e.rulebookUrl))
      ? { rulebookUrl: preferString(...entries.map((e) => e.rulebookUrl)) }
      : {}),
    ...(preferString(...entries.map((e) => e.rulebookIntegrity))
      ? { rulebookIntegrity: preferString(...entries.map((e) => e.rulebookIntegrity)) }
      : {}),
    version: preferString(...entries.map((e) => e.version)) || primary.version,
    attestationTypeId: typeId,
    formats,
    ...(preferString(...entries.map((e) => e.attestationLoS))
      ? { attestationLoS: preferString(...entries.map((e) => e.attestationLoS)) }
      : {}),
    ...(preferString(...entries.map((e) => e.bindingType))
      ? { bindingType: preferString(...entries.map((e) => e.bindingType)) }
      : {}),
  };

  const trusted = [];
  const seenTa = new Set();
  for (const entry of entries) {
    for (const authority of entry.trustedAuthorities || []) {
      const key = `${authority.frameworkType}|${authority.registryId}`;
      if (seenTa.has(key)) continue;
      seenTa.add(key);
      trusted.push(authority);
    }
  }
  if (trusted.length) merged.trustedAuthorities = trusted;

  const extendsRefs = [];
  const seenExt = new Set();
  for (const entry of entries) {
    for (const ref of entry.extends || []) {
      if (!ref?.id || seenExt.has(ref.id)) continue;
      seenExt.add(ref.id);
      extendsRefs.push(ref);
    }
  }
  if (extendsRefs.length) merged.extends = extendsRefs;

  const vocabularies = [];
  const seenVocab = new Set();
  for (const entry of entries) {
    for (const vocab of entry.vocabularies || []) {
      const key = vocab?.name || JSON.stringify(vocab);
      if (seenVocab.has(key)) continue;
      seenVocab.add(key);
      vocabularies.push(vocab);
    }
  }
  if (vocabularies.length) merged.vocabularies = vocabularies;

  const tags = uniqueSorted(entries.flatMap((e) => e.tags || []));
  if (tags.length) merged.tags = tags;
  merged.sectors = uniqueSorted(entries.flatMap((e) => e.sectors || []));
  merged.ecosystems = uniqueSorted(entries.flatMap((e) => e.ecosystems || []));
  const themes = uniqueSorted(entries.flatMap((e) => e.themes || []));
  if (themes.length) merged.themes = themes;
  const category = preferString(...entries.map((e) => e.category));
  if (category) merged.category = category;

  return merged;
}

function buildAliasToTypeMap(allCredentials) {
  const aliasToType = new Map();
  for (const credential of allCredentials) {
    aliasToType.set(credential.id, credential.id);
    for (const alias of credential.aliasIds || []) aliasToType.set(alias, credential.id);
    for (const format of credential.formats || []) {
      if (format.credentialId) aliasToType.set(format.credentialId, credential.id);
    }
  }
  return aliasToType;
}

function rewriteExtends(credentials, aliasToType) {
  for (const credential of credentials) {
    if (!Array.isArray(credential.extends)) continue;
    credential.extends = credential.extends.map((ref) => {
      const nextId = aliasToType.get(ref.id) || ref.id;
      if (nextId === ref.id) return ref;
      const next = { ...ref, id: nextId };
      if (typeof next.displayName === "string" && /\((?:SD-JWT|MSO|mdoc)/i.test(next.displayName)) {
        next.displayName = next.displayName.replace(FORMAT_NAME_SUFFIX, "").trim() || next.displayName;
      }
      return next;
    });
  }
}

async function main() {
  const dirs = (await fs.readdir(CATALOG_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  let filesChanged = 0;
  let groupsMerged = 0;
  let entriesIn = 0;
  let entriesOut = 0;
  const pendingWrites = [];

  for (const dir of dirs) {
    const file = path.join(CATALOG_DIR, dir, "credential-catalog.json");
    let data;
    try {
      data = JSON.parse(await fs.readFile(file, "utf-8"));
    } catch {
      continue;
    }

    const credentials = Array.isArray(data.credentials) ? data.credentials : [];
    entriesIn += credentials.length;

    const byType = new Map();
    for (const credential of credentials) {
      const typeId = attestationTypeIdFor(credential);
      if (!typeId) {
        console.warn(`Skipping unparseable id ${credential.id} in ${dir}`);
        continue;
      }
      const list = byType.get(typeId) || [];
      list.push(credential);
      byType.set(typeId, list);
    }

    const blocked = new Set();
    for (const [typeId, siblings] of byType) {
      const formats = siblings.map((s) => s.vcFormat);
      if (new Set(formats).size === formats.length) continue;
      console.warn(
        `Skipping merge for ${typeId}: duplicate vcFormat among ${siblings.map((s) => s.id).join(", ")}`
      );
      for (const sibling of siblings) blocked.add(sibling.id);
    }

    const mergedCredentials = [];
    for (const [typeId, siblings] of [...byType.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const usable = siblings.filter((s) => !blocked.has(s.id));
      if (usable.length === 0) continue;
      if (usable.length > 1) groupsMerged += 1;
      // Already type-level single entry: still normalize aliasIds/formats/displayName.
      mergedCredentials.push(mergeGroup(typeId, usable));
    }

    // Keep blocked distinct entries as-is (should be rare).
    for (const credential of credentials) {
      if (blocked.has(credential.id)) mergedCredentials.push(credential);
    }

    entriesOut += mergedCredentials.length;
    pendingWrites.push({
      dir,
      file,
      beforeCount: credentials.length,
      data,
      mergedCredentials,
    });
  }

  const aliasToType = buildAliasToTypeMap(pendingWrites.flatMap((item) => item.mergedCredentials));
  for (const item of pendingWrites) {
    rewriteExtends(item.mergedCredentials, aliasToType);
    const next = {
      ...item.data,
      $schema: V2_SCHEMA,
      credentials: item.mergedCredentials,
    };
    const before = JSON.stringify(item.data);
    const after = JSON.stringify(next);
    if (before === after) continue;
    filesChanged += 1;
    console.log(
      `${DRY_RUN ? "[dry-run] " : ""}${item.dir}: ${item.beforeCount} → ${item.mergedCredentials.length} entr${
        item.mergedCredentials.length === 1 ? "y" : "ies"
      }`
    );
    if (!DRY_RUN) {
      await fs.writeFile(item.file, JSON.stringify(next, null, 2) + "\n");
    }
  }

  console.log(
    `${DRY_RUN ? "[dry-run] " : ""}Done. filesChanged=${filesChanged} multiFormatMerges=${groupsMerged} entries ${entriesIn} → ${entriesOut}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
