/**
 * ARF TS11 response signing (ES256 / P-256).
 *
 * Configuration via env (see docs/TS11-COMPLIANCE-PLAN.md §7):
 * - TS11_SIGNING_KEY — private JWK JSON (EC P-256)
 * - TS11_SIGNING_KID — key id placed in the JWS protected header
 * - TS11_SIGNING_ALG — defaults to ES256
 * - TS11_ISSUER — stable iss claim (e.g. https://credentials.fides.community)
 * - TS11_SIGNING_JWKS — optional public JWKS JSON array override for rotation
 *
 * When TS11_SIGNING_KEY is unset, endpoints stay unsigned (local/dev fallback).
 *
 * `jose` is loaded via dynamic import() so Vercel CJS serverless functions do not
 * crash with ERR_REQUIRE_ESM on the ESM-only jose@6 package.
 */

import type { JWK, JWTPayload } from "jose";

const DEFAULT_ALG = "ES256";

export type Ts11Signable = Record<string, unknown>;

type JoseModule = typeof import("jose");

let joseModulePromise: Promise<JoseModule> | undefined;

function loadJose(): Promise<JoseModule> {
  if (!joseModulePromise) {
    joseModulePromise = import("jose");
  }
  return joseModulePromise;
}

function parseJsonEnv(name: string): unknown | undefined {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return undefined;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`${name} is not valid JSON: ${(err as Error).message}`);
  }
}

export function isTs11SigningConfigured(): boolean {
  return Boolean(process.env.TS11_SIGNING_KEY?.trim());
}

export function getTs11Issuer(): string {
  return (process.env.TS11_ISSUER || "https://credentials.fides.community").replace(/\/$/, "");
}

export function getTs11SigningKid(): string {
  return process.env.TS11_SIGNING_KID?.trim() || "fides-cat-2026-v1";
}

export function getTs11SigningAlg(): string {
  return process.env.TS11_SIGNING_ALG?.trim() || DEFAULT_ALG;
}

function privateJwk(): JWK {
  const parsed = parseJsonEnv("TS11_SIGNING_KEY");
  if (!parsed || typeof parsed !== "object") {
    throw new Error("TS11_SIGNING_KEY is required for signing");
  }
  const jwk = parsed as JWK;
  if (!jwk.kty) throw new Error("TS11_SIGNING_KEY must be a JWK with kty");
  return {
    ...jwk,
    alg: jwk.alg || getTs11SigningAlg(),
    kid: jwk.kid || getTs11SigningKid(),
    use: jwk.use || "sig",
  };
}

/** Public JWKS for GET /.well-known/jwks.json (and x-jku-url). */
export async function getTs11Jwks(): Promise<{ keys: JWK[] }> {
  const override = parseJsonEnv("TS11_SIGNING_JWKS");
  if (Array.isArray(override)) {
    return { keys: override as JWK[] };
  }
  if (override && typeof override === "object" && Array.isArray((override as { keys?: unknown }).keys)) {
    return { keys: (override as { keys: JWK[] }).keys };
  }
  if (!isTs11SigningConfigured()) {
    return { keys: [] };
  }
  const { exportJWK, importJWK } = await loadJose();
  const priv = privateJwk();
  const key = await importJWK(priv, getTs11SigningAlg());
  const pub = await exportJWK(key);
  // Drop private material if export somehow kept it
  const { d: _d, p: _p, q: _q, dp: _dp, dq: _dq, qi: _qi, ...safe } = pub as JWK & Record<string, unknown>;
  return {
    keys: [
      {
        ...safe,
        kty: safe.kty || priv.kty,
        crv: safe.crv || priv.crv,
        x: safe.x || priv.x,
        y: safe.y || priv.y,
        alg: getTs11SigningAlg(),
        kid: getTs11SigningKid(),
        use: "sig",
      },
    ],
  };
}

/**
 * Sign a TS11 response payload as compact JWS (application/jwt).
 * Claims: iss, iat, plus the data fields (content/page or SchemaMeta fields).
 */
export async function signTs11Payload(payload: Ts11Signable): Promise<string> {
  const { importJWK, SignJWT } = await loadJose();
  const alg = getTs11SigningAlg();
  const kid = getTs11SigningKid();
  const iss = getTs11Issuer();
  const key = await importJWK(privateJwk(), alg);
  const iat = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg, kid, typ: "JWT" })
    .setIssuer(iss)
    .setIssuedAt(iat)
    .sign(key);
}

/** Verify a compact JWS against the configured JWKS (tests / CI). */
export async function verifyTs11Jws(jws: string): Promise<JWTPayload> {
  const { importJWK, jwtVerify } = await loadJose();
  const { keys } = await getTs11Jwks();
  if (!keys.length) throw new Error("No JWKS keys configured");
  const alg = getTs11SigningAlg();
  let lastErr: unknown;
  for (const jwk of keys) {
    try {
      const key = await importJWK(jwk, alg);
      const { payload } = await jwtVerify(jws, key, {
        issuer: getTs11Issuer(),
        algorithms: [alg],
      });
      return payload;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("JWS verification failed");
}

/** Absolute JWKS URL for the x-jku-url response header. */
export function resolveTs11JkuUrl(baseUrl: string): string {
  const configured = process.env.TS11_JKU_URL?.trim();
  if (configured) return configured;
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/api/.well-known/jwks.json`;
}
