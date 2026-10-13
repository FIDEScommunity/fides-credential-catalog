/**
 * Shared HTTP helpers for TS11 endpoints: CORS, caching, optional JWS body.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  isTs11SigningConfigured,
  resolveTs11JkuUrl,
  signTs11Payload,
  type Ts11Signable,
} from "./ts11Signing";

function firstHeader(value: string | string[] | undefined): string {
  if (!value) return "";
  return (Array.isArray(value) ? value[0] : value).split(",")[0]?.trim() ?? "";
}

export function publicBaseUrl(req: VercelRequest): string {
  const proto = firstHeader(req.headers["x-forwarded-proto"] as string | string[] | undefined) || "https";
  const host =
    firstHeader(req.headers["x-forwarded-host"] as string | string[] | undefined) ||
    firstHeader(req.headers.host as string | string[] | undefined) ||
    (process.env.VERCEL_URL ? process.env.VERCEL_URL.replace(/^https?:\/\//i, "") : "");
  if (!host) return "http://localhost:3000";
  return `${proto}://${host.replace(/^https?:\/\//i, "")}`;
}

export function setTs11CommonHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
}

/**
 * Send a TS11 success body. When signing is configured, the body is a compact
 * JWS (`application/jwt`) and `x-jku-url` points at the JWKS. Otherwise the
 * unsigned JSON is returned with `signed: false` for local/dev.
 */
export async function sendTs11Response(
  req: VercelRequest,
  res: VercelResponse,
  payload: Ts11Signable,
  status = 200
): Promise<void> {
  setTs11CommonHeaders(res);

  if (!isTs11SigningConfigured()) {
    res.status(status).json({ ...payload, signed: false });
    return;
  }

  const jws = await signTs11Payload(payload);
  res.setHeader("Content-Type", "application/jwt");
  res.setHeader("x-jku-url", resolveTs11JkuUrl(publicBaseUrl(req)));
  res.status(status).send(jws);
}
