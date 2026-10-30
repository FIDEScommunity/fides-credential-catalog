#!/usr/bin/env node
/**
 * Broader seed-merge audit beyond verify-seed-merge.mjs:
 * aliases, schemas, TS11 projection, intentional non-merges, WP/local sync.
 */
import { readFileSync } from "node:fs";
import {
  deterministicSchemaId,
  findAttestationType,
  toTs11SchemaMeta,
} from "../lib/ts11SchemaMeta.ts";

const data = JSON.parse(readFileSync(new URL("../data/aggregated.json", import.meta.url), "utf8"));
const wp = JSON.parse(
  readFileSync(new URL("../wordpress-plugin/fides-credential-catalog/data/aggregated.json", import.meta.url), "utf8")
);
let localWp = null;
try {
  localWp = JSON.parse(
    readFileSync(
      "/Users/victorvanderhulst/Local Sites/utrecht-demo/app/public/wp-content/plugins/fides-credential-catalog/data/aggregated.json",
      "utf8"
    )
  );
} catch {
  /* optional */
}

const fails = [];
const pass = (name, cond, detail = "") => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else console.log("OK ", name, detail);
};

const PID_RULEBOOK =
  "https://github.com/eu-digital-identity-wallet/eudi-doc-attestation-rulebooks-catalog/blob/main/rulebooks/pid/pid-rulebook.md";
const pidLinked = (catalog) => {
  const pid = catalog.credentials.find((c) => c.id === "cred:eu:pid");
  return (
    pid?.rulebookUrl === PID_RULEBOOK &&
    !catalog.credentials.find((c) => c.id === "cred:eu:pid-mdoc-deferred")
  );
};

pass("count 121", data.credentials.length === 121, String(data.credentials.length));
pass("wp pid rulebook", pidLinked(wp));
pass("local wp pid rulebook", !localWp || pidLinked(localWp), localWp ? "checked" : "skip");

const multi = data.credentials.filter((c) => (c.formats || []).length > 1);
pass("9 multi-format", multi.length === 9, String(multi.length));

const expected = [
  "cred:eu:pid",
  "cred:eu:ehic",
  "cred:eu:iban",
  "cred:eu:hiid",
  "cred:eu:msisdn",
  "cred:eu:pda1",
  "cred:eu:por",
  "cred:eu:tax",
  "cred:ewc:pid-eudi",
];
for (const id of expected) {
  pass(`expected ${id}`, !!data.credentials.find((c) => c.id === id));
}

for (const c of multi) {
  const fmtIds = c.formats.map((f) => f.formatIdentifier);
  pass(`${c.id} mdoc+sd_jwt`, fmtIds.includes("mdoc") && fmtIds.includes("sd_jwt_vc"), fmtIds.join(","));
  pass(`${c.id} aliases>=2`, (c.aliasIds || []).length >= 2, JSON.stringify(c.aliasIds));
  const schemas = c.formats.flatMap((f) => (f.schemaURIs || []).map((s) => s.uri).filter(Boolean));
  pass(`${c.id} 2 schemas`, new Set(schemas).size >= 2, schemas.map((u) => u.split("/").pop()).join(", "));
  for (const a of c.aliasIds || []) {
    const found = findAttestationType(data.attestationTypes, a);
    pass(`${c.id} alias→self ${a}`, found?.id === c.id);
  }
  const meta = toTs11SchemaMeta(c);
  const sf = [...(meta.supportedFormats || [])].sort();
  pass(`${c.id} TS11 formats`, sf.join(",") === "dc+sd-jwt,mso_mdoc", sf.join(","));
  pass(`${c.id} uuid lookup`, !!findAttestationType(data.attestationTypes, deterministicSchemaId(c.id)));
}

const legacyPrimary = data.credentials.filter(
  (c) => c.id.split(":").length > 3
);
pass("no 4+ segment primary ids", legacyPrimary.length === 0, legacyPrimary.map((c) => c.id).join(", "));

const seen = new Map();
for (const c of data.credentials) {
  for (const a of [c.id, ...(c.aliasIds || [])]) {
    if (seen.has(a) && seen.get(a) !== c.id) fails.push(`alias collision ${a}`);
    seen.set(a, c.id);
  }
}

for (const id of ["cred:webuild:pid", "cred:ewc:pid", "cred:fides:pid"]) {
  pass(`kept separate ${id}`, !!data.credentials.find((c) => c.id === id));
}
pass(
  "deferred pid removed",
  !data.credentials.find((c) => c.id === "cred:eu:pid-mdoc-deferred")
);
pass("pid rulebook", pidLinked(data));

pass("singles = 112", data.credentials.filter((c) => (c.formats || []).length <= 1).length === 112);

if (fails.length) {
  console.error("\nFAILS:");
  for (const f of fails) console.error(" -", f);
  process.exit(1);
}
console.log("\naudit-seed-merge-ui-contract: ALL PASS");
