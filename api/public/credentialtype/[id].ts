/**
 * GET /api/public/credentialtype/:id
 * Returns one credential type (same shape as list items). Issuer fields omitted.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  toCredentialTypeDto,
  type AggregatedCatalog,
} from "../../../lib/credentialTypeDto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  const idRaw = req.query.id;
  const idParam = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  if (typeof idParam !== "string" || !idParam.length) {
    res.status(400).json({
      message: "Missing credential id",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  let id: string;
  try {
    id = decodeURIComponent(idParam);
  } catch {
    res.status(400).json({
      message: "Invalid credential id encoding",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const dataPath = join(process.cwd(), "data", "aggregated.json");
    const raw = await readFile(dataPath, "utf-8");
    const catalog = JSON.parse(raw) as AggregatedCatalog;
    const list = Array.isArray(catalog.credentials) ? catalog.credentials : [];
    const c = list.find((row) => row.id === id);

    if (!c) {
      res.status(404).json({
        message: "Credential type not found",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json(toCredentialTypeDto(c));
  } catch (err) {
    console.error("credentialtype detail API error:", err);
    res.status(500).json({
      message: "Failed to load credential catalog",
      timestamp: new Date().toISOString(),
    });
  }
}
