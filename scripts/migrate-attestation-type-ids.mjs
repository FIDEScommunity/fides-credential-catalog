#!/usr/bin/env node
/**
 * One-off migration to the TS11 attestation-type model.
 *
 * TS11 describes one attestation type that may be published in several formats,
 * while this catalog historically had one entry per format with the format name
 * baked into the credential key (pid-vc-sd-jwt, pid-mdoc). This script writes an
 * explicit `attestationTypeId` with the format suffix stripped, so the crawler
 * can group sibling entries into a single attestation type and keep the old
 * `cred:` ids as aliases for existing deeplinks.
 *
 * Idempotent: run it again after adding entries and it only fills in what is
 * missing. Entries whose stripped key would collide with a sibling in the same
 * format are left untouched, because that would merge two distinct attestations.
 *
 * Usage: node scripts/migrate-attestation-type-ids.mjs [--dry-run]
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CATALOG_DIR = path.join(ROOT, "community-catalogs");
const V2_SCHEMA = "https://fides.community/schemas/credential-catalog/v2";
const DRY_RUN = process.argv.includes("--dry-run");

// Longest first: pid-vc-sd-jwt must not be stripped to pid-vc.
const FORMAT_SUFFIXES = [
  "-mso-mdoc",
  "-sd-jwt-vc",
  "-vc-sd-jwt",
  "-jwt-vc-json",
  "-ldp-vc",
  "-jwt-vc",
  "-sd-jwt",
  "-mdoc"
];

function stripFormatSuffix(key) {
  for (const suffix of FORMAT_SUFFIXES) {
    if (key.endsWith(suffix) && key.length > suffix.length) {
      return key.slice(0, -suffix.length);
    }
  }
  return key;
}

/** cred:<authority>:<key>:<format> → { authority, key, format }. */
function parseId(id) {
  const parts = id.split(":");
  if (parts.length !== 4 || parts[0] !== "cred") return null;
  return { authority: parts[1], key: parts[2], format: parts[3] };
}

async function main() {
  const dirs = (await fs.readdir(CATALOG_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const files = [];
  for (const dir of dirs) {
    const file = path.join(CATALOG_DIR, dir, "credential-catalog.json");
    try {
      files.push({ file, data: JSON.parse(await fs.readFile(file, "utf-8")) });
    } catch {
      // Directory without a catalog file, e.g. a schemas-only folder.
    }
  }

  // Proposed attestation type per credential, plus collision detection.
  const proposed = new Map(); // credential id → attestationTypeId
  const byAttestationType = new Map(); // attestationTypeId → [{ id, format }]

  for (const { data } of files) {
    for (const credential of data.credentials || []) {
      const parsed = parseId(credential.id);
      if (!parsed) continue;
      const attestationTypeId = `cred:${parsed.authority}:${stripFormatSuffix(parsed.key)}`;
      proposed.set(credential.id, attestationTypeId);
      const siblings = byAttestationType.get(attestationTypeId) || [];
      siblings.push({ id: credential.id, format: credential.vcFormat });
      byAttestationType.set(attestationTypeId, siblings);
    }
  }

  const blocked = new Set();
  for (const [attestationTypeId, siblings] of byAttestationType) {
    const formats = siblings.map((s) => s.format);
    if (new Set(formats).size === formats.length) continue;
    console.warn(
      `Skipping ${attestationTypeId}: ${siblings.length} entries share a format (${siblings
        .map((s) => `${s.id} → ${s.format}`)
        .join(", ")}). These are distinct attestation types, not sibling formats.`
    );
    for (const sibling of siblings) blocked.add(sibling.id);
  }

  let changedFiles = 0;
  let changedEntries = 0;
  const merges = new Map();

  for (const { file, data } of files) {
    let dirty = false;

    for (const credential of data.credentials || []) {
      const attestationTypeId = proposed.get(credential.id);
      if (!attestationTypeId || blocked.has(credential.id)) continue;
      if (credential.attestationTypeId === attestationTypeId) continue;

      // Rebuild the entry so attestationTypeId lands right after the id.
      const rebuilt = {};
      for (const [key, value] of Object.entries(credential)) {
        rebuilt[key] = value;
        if (key === "id") rebuilt.attestationTypeId = attestationTypeId;
      }
      if (!("attestationTypeId" in rebuilt)) rebuilt.attestationTypeId = attestationTypeId;
      for (const key of Object.keys(credential)) delete credential[key];
      Object.assign(credential, rebuilt);

      dirty = true;
      changedEntries += 1;
      const siblings = byAttestationType.get(attestationTypeId) || [];
      if (siblings.length > 1) merges.set(attestationTypeId, siblings.map((s) => s.format));
    }

    if (data.$schema !== V2_SCHEMA) {
      data.$schema = V2_SCHEMA;
      dirty = true;
    }

    if (!dirty) continue;
    changedFiles += 1;
    if (!DRY_RUN) await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  }

  console.log(
    `${DRY_RUN ? "[dry run] " : ""}${changedEntries} entry/entries updated in ${changedFiles} file(s).`
  );
  console.log(`${merges.size} attestation type(s) now group more than one format:`);
  for (const [attestationTypeId, formats] of [...merges].sort()) {
    console.log(`  ${attestationTypeId}: ${formats.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
