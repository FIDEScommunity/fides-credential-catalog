import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/**
 * WE BUILD rulebook commits of 19 November 2026 renamed several
 * classification labels to S-EAA and revised IBAN-OV / SCA-IBAN prose.
 * The JSON Schemas, claim token `attestation_legal_category`, and FIDES
 * VCTs were not part of those commits. This test locks that boundary.
 */

const IBAN_DESCRIPTION =
  "IBAN-OV attestation that a legal entity or natural person (including a sole trader) owns a given IBAN.";

type RecordExpect = {
  id: string;
  nativeIdentifier: string;
  schemaUrl: string;
  rulebookUrl: string;
  legalClaim?: string;
};

const RECORDS: readonly RecordExpect[] = [
  {
    id: "cred:webuild:authorised-signatories",
    nativeIdentifier: "eu.we-build:authorisedsignatories:1",
    schemaUrl:
      "https://raw.githubusercontent.com/webuild-consortium/webuild-attestation-rulebooks-catalog/main/data-schemas/sd-jwt/authorised-signatories-sd-jwt.json",
    rulebookUrl: "https://registry.siros.org/webuild-consortium/authorised-signatories/rulebook.html",
    legalClaim: "SHALL be 'EAA'"
  },
  {
    id: "cred:webuild:company-info",
    nativeIdentifier: "eu.we-build:companyinfo:1",
    schemaUrl:
      "https://raw.githubusercontent.com/webuild-consortium/webuild-attestation-rulebooks-catalog/main/data-schemas/sd-jwt/company-info-sd-jwt.json",
    rulebookUrl: "https://registry.siros.org/webuild-consortium/company-info/rulebook.html",
    legalClaim: "SHALL be 'EAA' or 'QEAA'"
  },
  {
    id: "cred:webuild:contact-person",
    nativeIdentifier: "eu.we-build:contactperson:1",
    schemaUrl:
      "https://raw.githubusercontent.com/webuild-consortium/webuild-attestation-rulebooks-catalog/main/data-schemas/sd-jwt/contact-person-sd-jwt.json",
    rulebookUrl: "https://registry.siros.org/webuild-consortium/contact-person/rulebook.html",
    legalClaim: "SHALL be 'EAA'"
  },
  {
    id: "cred:webuild:ownership",
    nativeIdentifier: "eu.we-build:ownership:1",
    schemaUrl:
      "https://raw.githubusercontent.com/webuild-consortium/webuild-attestation-rulebooks-catalog/main/data-schemas/sd-jwt/ownership-sd-jwt.json",
    rulebookUrl: "https://registry.siros.org/webuild-consortium/ownership/rulebook.html"
  },
  {
    id: "cred:webuild:duns",
    nativeIdentifier: "eu.we-build:duns:1",
    schemaUrl:
      "https://raw.githubusercontent.com/webuild-consortium/webuild-attestation-rulebooks-catalog/main/data-schemas/sd-jwt/duns-sd-jwt.json",
    rulebookUrl: "https://registry.siros.org/webuild-consortium/duns/rulebook.html",
    legalClaim: "'EAA' or 'QEAA'"
  },
  {
    id: "cred:webuild:payment-terms",
    nativeIdentifier: "eu.we-build:paymentterms:1",
    schemaUrl:
      "https://raw.githubusercontent.com/webuild-consortium/webuild-attestation-rulebooks-catalog/main/data-schemas/sd-jwt/payment-terms-sd-jwt.json",
    rulebookUrl: "https://registry.siros.org/webuild-consortium/payment-terms/rulebook.html"
  },
  {
    id: "cred:webuild:site",
    nativeIdentifier: "eu.we-build:site:1",
    schemaUrl:
      "https://raw.githubusercontent.com/webuild-consortium/webuild-attestation-rulebooks-catalog/main/data-schemas/sd-jwt/site-sd-jwt.json",
    rulebookUrl: "https://registry.siros.org/webuild-consortium/site/rulebook.html"
  },
  {
    id: "cred:webuild:iban-ov",
    nativeIdentifier: "eu.we-build.iban-ov.1",
    schemaUrl:
      "https://raw.githubusercontent.com/webuild-consortium/webuild-attestation-rulebooks-catalog/main/data-schemas/sd-jwt/iban-ov-sd-jwt.json",
    rulebookUrl: "https://registry.siros.org/webuild-consortium/iban-ov/rulebook.html",
    legalClaim: "this is 'EAA'"
  }
];

function readJson(relativePath: string): any {
  return JSON.parse(readFileSync(join(process.cwd(), relativePath), "utf8"));
}

function byId(credentials: { id: string }[], id: string) {
  const matches = credentials.filter((credential) => credential.id === id);
  assert.equal(matches.length, 1, id);
  return matches[0] as any;
}

function attribute(credential: { attributes?: { name: string; required?: boolean; description?: string }[] }, name: string) {
  return credential.attributes?.find((row) => row.name === name);
}

test("November 2026 rulebook labels do not rewrite FIDES identity fields", () => {
  const catalog = readJson("community-catalogs/webuild/credential-catalog.json");
  const ids = catalog.credentials.map((credential: { id: string }) => credential.id);
  assert.equal(new Set(ids).size, ids.length);

  const vcts = catalog.credentials
    .map((credential: { nativeIdentifier?: string }) => credential.nativeIdentifier)
    .filter(Boolean);
  assert.equal(new Set(vcts).size, vcts.length);

  for (const expected of RECORDS) {
    const credential = byId(catalog.credentials, expected.id);
    assert.equal(credential.nativeIdentifier, expected.nativeIdentifier);
    assert.equal(credential.formats[0].nativeIdentifier, expected.nativeIdentifier);
    assert.equal(credential.version, "0.1.0");
    assert.equal(credential.schemaUrl, expected.schemaUrl);
    assert.equal(credential.formats[0].schemaURIs[0].uri, expected.schemaUrl);
    assert.equal(credential.rulebookUrl, expected.rulebookUrl);
    assert.equal(credential.trustedAuthorities, undefined);
    assert.equal(JSON.stringify(credential).includes("S-EAA"), false);
  }

  const iban = byId(catalog.credentials, "cred:webuild:iban-ov");
  assert.equal(iban.shortDescription, IBAN_DESCRIPTION);
  assert.equal(iban.subjectType, "Organization");
  assert.equal(iban.bindingType, "key");
  assert.equal(
    catalog.credentials.some((credential: { id: string; nativeIdentifier?: string }) =>
      credential.id.includes("sca-iban") ||
      credential.nativeIdentifier === "https://webuildconsortium.eu/sca/sca-iban/1.0" ||
      credential.nativeIdentifier === "eu.we-build:iban-ov:1"
    ),
    false
  );
});

test("crawled claim set keeps EAA tokens and IBAN owner_type, without an aud claim", () => {
  const data = readJson("data/aggregated.json");

  for (const expected of RECORDS) {
    const credential = byId(data.credentials, expected.id);
    const type = byId(data.attestationTypes, expected.id);
    assert.equal(credential.nativeIdentifier, expected.nativeIdentifier);
    assert.equal(credential.version, "0.1.0");
    assert.equal(type.formats[0].nativeIdentifier, expected.nativeIdentifier);
    const legal = attribute(credential, "attestation_legal_category");
    assert.ok(legal);
    assert.equal(legal.required, true);
    assert.equal((legal.description ?? "").includes("S-EAA"), false);
    if (expected.legalClaim) {
      assert.equal(legal.description?.includes(expected.legalClaim), true);
    }
    assert.equal(attribute(credential, "aud"), undefined);
    assert.equal(
      credential.attributes.some((row: { name: string }) => row.name === "aud" || row.name.endsWith("/aud")),
      false
    );
  }

  const iban = byId(data.credentials, "cred:webuild:iban-ov");
  const ibanType = byId(data.attestationTypes, "cred:webuild:iban-ov");
  assert.equal(iban.shortDescription, IBAN_DESCRIPTION);
  assert.equal(ibanType.shortDescription, IBAN_DESCRIPTION);
  assert.equal(attribute(iban, "account_ownership/owner_type")?.required, true);
  assert.match(attribute(iban, "account_ownership")?.description ?? "", /natural person/);
  assert.match(attribute(iban, "account_ownership/given_name")?.description ?? "", /owner_type = 'person'/);
  assert.match(attribute(iban, "account_ownership/surname")?.description ?? "", /owner_type = 'person'/);
  assert.match(attribute(iban, "iss")?.description ?? "", /ASPSP/);
  assert.equal(attribute(iban, "vct")?.description?.includes("eu.we-build.iban-ov.1"), true);
});
