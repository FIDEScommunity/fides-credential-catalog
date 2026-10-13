#!/usr/bin/env node
/**
 * Generate an ES256 (P-256) JWK pair for TS11 /schemas signing on Vercel.
 *
 * Usage:
 *   node scripts/generate-ts11-signing-key.mjs
 *
 * Prints env values to set in Vercel (Production + Preview). Does not write the
 * private key to disk unless --write-dir=<path> is passed.
 */

import { generateKeyPair, exportJWK } from "jose";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

const kid = process.env.TS11_SIGNING_KID?.trim() || "fides-cat-2026-v1";
const issuer =
  process.env.TS11_ISSUER?.trim() || "https://fides-credential-catalog.vercel.app";
const writeDirArg = process.argv.find((a) => a.startsWith("--write-dir="));
const writeDir = writeDirArg ? writeDirArg.slice("--write-dir=".length) : "";

const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
const priv = await exportJWK(privateKey);
const pub = await exportJWK(publicKey);

const privateJwk = { ...priv, kid, alg: "ES256", use: "sig" };
const publicJwk = { ...pub, kid, alg: "ES256", use: "sig" };
const jwks = { keys: [publicJwk] };

const privateJson = JSON.stringify(privateJwk);
const jwksJson = JSON.stringify(jwks);

console.log(`# TS11 signing env (kid=${kid})`);
console.log(`# Add these in Vercel → Project → Settings → Environment Variables`);
console.log(`# (Production + Preview). Redeploy after saving.\n`);
console.log(`TS11_SIGNING_KEY='${privateJson}'`);
console.log(`TS11_SIGNING_KID=${kid}`);
console.log(`TS11_SIGNING_ALG=ES256`);
console.log(`TS11_ISSUER=${issuer}`);
console.log(`TS11_SIGNING_JWKS='${jwksJson}'`);
console.log(`\n# Optional explicit JKU (defaults to \${host}/api/jwks):`);
console.log(`# TS11_JKU_URL=${issuer}/api/jwks`);

if (writeDir) {
  const dir = resolve(writeDir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "ts11-signing-private.jwk.json"), `${privateJson}\n`, {
    mode: 0o600,
  });
  writeFileSync(resolve(dir, "ts11-signing-jwks.json"), `${jwksJson}\n`, { mode: 0o600 });
  console.log(`\nWrote private JWK + JWKS under ${dir} (keep private key out of git).`);
}
