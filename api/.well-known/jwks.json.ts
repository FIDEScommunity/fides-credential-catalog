/**
 * GET /api/.well-known/jwks.json
 *
 * Public keys that verify JWS-signed TS11 /schemas responses.
 * During key rotation, set TS11_SIGNING_JWKS to an array that includes both
 * the current and previous public keys.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTs11Jwks } from "../../lib/ts11Signing";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    const jwks = await getTs11Jwks();
    res.status(200).json(jwks);
  } catch (err) {
    console.error("TS11 JWKS error:", err);
    res.status(500).json({
      message: "Failed to load JWKS",
      timestamp: new Date().toISOString(),
    });
  }
}
