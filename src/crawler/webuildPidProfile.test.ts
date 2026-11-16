import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const SCHEMA_URL =
  "https://raw.githubusercontent.com/webuild-consortium/webuild-attestation-rulebooks-catalog/main/data-schemas/sd-jwt/ds002-pid-sd-jwt.json";
const RULEBOOK_URL = "https://registry.siros.org/webuild-consortium/pid/rulebook.html";
const SHORT_DESCRIPTION =
  "WE BUILD PID 2.0 profile (ds002) of Person Identification Data, same VCT as the EUDI PID. personal_administrative_number and nonce are mandatory in this profile; a portrait is not issued.";

function readJson(relativePath: string): any {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

function attribute(credential: { attributes?: { name: string; required: boolean }[] }, name: string) {
  return credential.attributes?.find((row) => row.name === name);
}

test("WE BUILD PID seed tracks profile 2.0 without changing identity or EU PID", () => {
  const catalog = readJson("../../community-catalogs/webuild/credential-catalog.json");
  const pid = catalog.credentials.find((credential: { id: string }) => credential.id === "cred:webuild:pid");
  assert.ok(pid);
  assert.equal(pid.version, "2.0.0");
  assert.equal(pid.shortDescription, SHORT_DESCRIPTION);
  assert.equal(pid.schemaUrl, SCHEMA_URL);
  assert.equal(pid.rulebookUrl, RULEBOOK_URL);
  assert.equal(pid.nativeIdentifier, "urn:eudi:pid:1");
  assert.deepEqual(
    pid.formats.map((format: { formatIdentifier: string }) => format.formatIdentifier),
    ["sd_jwt_vc"]
  );
  assert.equal(pid.formats[0].schemaURIs[0].uri, SCHEMA_URL);
  assert.deepEqual(pid.extends, [{ id: "cred:eu:pid", displayName: "PID" }]);
  assert.deepEqual(pid.aliasIds, ["cred:webuild:pid:sd-jwt-vc"]);

  const euSchema = readJson("../../community-catalogs/eu/schemas/pid-vc-sd-jwt.schema.json");
  assert.equal(euSchema.required.includes("personal_administrative_number"), false);
  assert.equal(euSchema.required.includes("nonce"), false);
});

test("aggregated WE BUILD PID claims follow the 2.0 schema", () => {
  const data = readJson("../../data/aggregated.json");
  const pid = data.credentials.find((credential: { id: string }) => credential.id === "cred:webuild:pid");
  const type = data.attestationTypes.find((entry: { id: string }) => entry.id === "cred:webuild:pid");
  assert.ok(pid);
  assert.ok(type);
  assert.equal(pid.version, "2.0.0");
  assert.equal(pid.shortDescription, SHORT_DESCRIPTION);
  assert.equal(pid.schemaUrl, SCHEMA_URL);
  assert.equal(pid.rulebookUrl, RULEBOOK_URL);
  assert.equal(type.version, "2.0.0");
  assert.equal(type.semverVersion, "2.0.0");
  assert.equal(type.shortDescription, SHORT_DESCRIPTION);
  assert.equal(attribute(pid, "personal_administrative_number")?.required, true);
  assert.equal(attribute(pid, "nonce")?.required, true);
  assert.equal(attribute(pid, "picture")?.required, false);
  assert.deepEqual(pid.extends, [{ id: "cred:eu:pid", displayName: "PID" }]);

  const eu = data.credentials.find((credential: { id: string }) => credential.id === "cred:eu:pid");
  assert.equal(attribute(eu, "nonce"), undefined);
  assert.equal(attribute(eu, "personal_administrative_number")?.required, false);
});
