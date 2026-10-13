/**
 * GET /api/public/schemas/:id
 *
 * One ARF TS11 SchemaMeta record. Accepts the TS11 UUID, the `cred:` attestation
 * type id, or a legacy per-format `cred:` id so older deep links keep working.
 * Signed when TS11_SIGNING_KEY is set (see docs/TS11-COMPLIANCE-PLAN.md §7).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "fs/promises";
import { join } from "path";
import { sendTs11Response, setTs11CommonHeaders } from "../../../lib/ts11Http";
import {
  findAttestationType,
  toTs11SchemaMeta,
  type AggregatedAttestationType,
} from "../../../lib/ts11SchemaMeta";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  setTs11CommonHeaders(res);

  const idRaw = req.query.id;
  const idParam = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  if (typeof idParam !== "string" || !idParam.length) {
    res.status(400).json({ message: "Missing schema id", timestamp: new Date().toISOString() });
    return;
  }

  let id: string;
  try {
    id = decodeURIComponent(idParam);
  } catch {
    res.status(400).json({ message: "Invalid schema id encoding", timestamp: new Date().toISOString() });
    return;
  }

  try {
    const raw = await readFile(join(process.cwd(), "data", "aggregated.json"), "utf-8");
    const catalog = JSON.parse(raw) as { attestationTypes?: AggregatedAttestationType[] };
    const match = findAttestationType(catalog.attestationTypes || [], id);
    if (!match) {
      res.status(404).json({ message: "Schema not found", timestamp: new Date().toISOString() });
      return;
    }
    await sendTs11Response(req, res, toTs11SchemaMeta(match) as unknown as Record<string, unknown>);
  } catch (err) {
    console.error("TS11 schema detail API error:", err);
    res.status(500).json({
      message: "Failed to load credential catalog",
      timestamp: new Date().toISOString(),
    });
  }
}
