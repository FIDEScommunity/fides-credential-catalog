import { strict as assert } from "node:assert";
import { test, before, after } from "node:test";
import { generateKeyPair, exportJWK } from "jose";
import {
  getTs11Jwks,
  isTs11SigningConfigured,
  signTs11Payload,
  verifyTs11Jws,
} from "./ts11Signing";

const saved: Record<string, string | undefined> = {};

before(async () => {
  for (const key of [
    "TS11_SIGNING_KEY",
    "TS11_SIGNING_KID",
    "TS11_SIGNING_ALG",
    "TS11_ISSUER",
    "TS11_SIGNING_JWKS",
  ]) {
    saved[key] = process.env[key];
  }

  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const priv = await exportJWK(privateKey);
  const pub = await exportJWK(publicKey);
  process.env.TS11_SIGNING_KEY = JSON.stringify({ ...priv, kid: "test-kid", alg: "ES256", use: "sig" });
  process.env.TS11_SIGNING_KID = "test-kid";
  process.env.TS11_SIGNING_ALG = "ES256";
  process.env.TS11_ISSUER = "https://credentials.test.fides.community";
  process.env.TS11_SIGNING_JWKS = JSON.stringify({
    keys: [{ ...pub, kid: "test-kid", alg: "ES256", use: "sig" }],
  });
});

after(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("signing is considered configured when TS11_SIGNING_KEY is set", () => {
  assert.equal(isTs11SigningConfigured(), true);
});

test("sign → verify round-trip against JWKS", async () => {
  const jws = await signTs11Payload({
    content: [{ id: "abc", attestationType: "cred:eu:pid" }],
    page: { size: 1, number: 0, totalElements: 1, totalPages: 1 },
  });
  assert.match(jws, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

  const payload = await verifyTs11Jws(jws);
  assert.equal(payload.iss, "https://credentials.test.fides.community");
  assert.equal(typeof payload.iat, "number");
  assert.deepEqual(payload.content, [{ id: "abc", attestationType: "cred:eu:pid" }]);
});

test("JWKS exposes only public material", async () => {
  const jwks = await getTs11Jwks();
  assert.equal(jwks.keys.length, 1);
  assert.equal(jwks.keys[0].kid, "test-kid");
  assert.equal(jwks.keys[0].kty, "EC");
  assert.equal((jwks.keys[0] as { d?: string }).d, undefined);
});
