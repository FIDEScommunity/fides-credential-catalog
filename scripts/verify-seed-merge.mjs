#!/usr/bin/env node
/** Post-crawl checks for TS11 seed-merge (§5.3). */
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(data.credentials.length === 121, `expected 121 credentials, got ${data.credentials.length}`);
assert(data.attestationTypes.length === 121, `expected 121 attestationTypes`);
const wpPid = wp.credentials.find((c) => c.id === "cred:eu:pid");
assert(
  wpPid?.rulebookUrl ===
    "https://github.com/eu-digital-identity-wallet/eudi-doc-attestation-rulebooks-catalog/blob/main/rulebooks/pid/pid-rulebook.md",
  "WP PID missing EUDI rulebook"
);
assert(wpPid?.attestationLoS === "iso_18045_high" && wpPid?.bindingType === "key", "WP PID missing TS11 LoS or binding");
assert(
  !wp.credentials.find((c) => c.id === "cred:eu:pid-mdoc-deferred"),
  "WP still lists deferred PID"
);

for (const credential of data.credentials) {
  assert(credential.id.split(":").length === 3, `bad id ${credential.id}`);
  assert(credential.attestationTypeId === credential.id, `attestationTypeId mismatch ${credential.id}`);
  for (const ref of credential.extends || []) {
    assert(ref.id.split(":").length === 3, `extends still format-id ${ref.id} on ${credential.id}`);
  }
}

const pid = data.credentials.find((c) => c.id === "cred:eu:pid");
assert(pid, "missing cred:eu:pid");
assert(pid.displayName === "PID", `PID name ${pid.displayName}`);
assert(
  new Set(pid.formats.map((f) => f.formatIdentifier)).size === 2,
  "PID should have 2 formats"
);
assert((pid.aliasIds || []).includes("cred:eu:pid-mdoc:mdoc"), "PID missing mdoc alias");
assert((pid.aliasIds || []).includes("cred:eu:pid-vc-sd-jwt:sd-jwt-vc"), "PID missing sd-jwt alias");
assert(
  pid.rulebookUrl ===
    "https://github.com/eu-digital-identity-wallet/eudi-doc-attestation-rulebooks-catalog/blob/main/rulebooks/pid/pid-rulebook.md",
  "PID missing EUDI rulebook"
);
assert(pid.attestationLoS === "iso_18045_high", `PID LoS ${pid.attestationLoS}`);
assert(pid.bindingType === "key", `PID binding ${pid.bindingType}`);
const mdl = data.credentials.find((c) => c.id === "cred:iso:mdl");
assert(
  mdl?.rulebookUrl ===
    "https://github.com/eu-digital-identity-wallet/eudi-doc-attestation-rulebooks-catalog/blob/main/rulebooks/mdl/mdl-rulebook.md",
  "mDL missing EUDI rulebook"
);
assert(
  !data.credentials.find((c) => c.id === "cred:eu:pid-mdoc-deferred"),
  "deferred PID should be removed"
);

const edu = data.credentials.find((c) => c.id === "cred:eduwallet:academic-base");
assert(edu, "missing eduwallet academic-base");
assert((edu.aliasIds || []).includes("cred:eduwallet:academic-base:sd-jwt-vc"), "edu alias");

const webuildLos = data.credentials.filter(
  (c) => c.id.startsWith("cred:webuild:") && c.attestationLoS
).length;
assert(webuildLos === 19, `webuild LoS count ${webuildLos}`);

const multi = data.attestationTypes.filter((t) => (t.formats || []).length > 1);
assert(multi.length === 9, `multi-format types ${multi.length}`);

const viaAlias = findAttestationType(data.attestationTypes, "cred:eu:pid-mdoc:mdoc");
assert(viaAlias?.id === "cred:eu:pid", "findAttestationType alias");
const meta = toTs11SchemaMeta(viaAlias);
assert(
  [...meta.supportedFormats].sort().join(",") === "dc+sd-jwt,mso_mdoc",
  `supportedFormats ${meta.supportedFormats}`
);
assert(
  findAttestationType(data.attestationTypes, deterministicSchemaId("cred:eu:pid")),
  "uuid lookup"
);

console.log("verify-seed-merge: OK");
