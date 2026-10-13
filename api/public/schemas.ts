/**
 * GET /api/public/schemas
 *
 * ARF TS11 catalogue of attestations, read-only. Filters follow TS11 §5.3.1
 * (lowercase parameter names). When TS11_SIGNING_KEY is set, the body is a
 * compact JWS (`application/jwt`) with `x-jku-url`; otherwise unsigned JSON.
 * See docs/TS11-COMPLIANCE-PLAN.md §7.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "fs/promises";
import { join } from "path";
import { sendTs11Response, setTs11CommonHeaders } from "../../lib/ts11Http";
import {
  toTs11SchemaMeta,
  type AggregatedAttestationType,
  type Ts11SchemaMeta,
} from "../../lib/ts11SchemaMeta";

function queryText(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") return undefined;
  const text = first.trim();
  return text.length ? text : undefined;
}

function queryNumber(value: unknown, fallback: number): number {
  const first = Array.isArray(value) ? value[0] : value;
  const parsed = Number(first);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  setTs11CommonHeaders(res);

  try {
    const raw = await readFile(join(process.cwd(), "data", "aggregated.json"), "utf-8");
    const catalog = JSON.parse(raw) as { attestationTypes?: AggregatedAttestationType[] };
    let records: Ts11SchemaMeta[] = (catalog.attestationTypes || []).map(toTs11SchemaMeta);

    const id = queryText(req.query.id);
    if (id) {
      records = records.filter(
        (record) => record.id === id || record.attestationType === id || record.fides.aliasIds.includes(id)
      );
    }
    const supportedFormat = queryText(req.query.supportedformat);
    if (supportedFormat) {
      records = records.filter((record) => record.supportedFormats.includes(supportedFormat));
    }
    const attestationLoS = queryText(req.query.attestationlos);
    if (attestationLoS) {
      records = records.filter((record) => record.attestationLoS === attestationLoS);
    }
    const bindingType = queryText(req.query.bindingtype);
    if (bindingType) {
      records = records.filter((record) => record.bindingType === bindingType);
    }
    const frameworkType = queryText(req.query.trustedauthoritiesframeworktype);
    if (frameworkType) {
      records = records.filter((record) =>
        record.trustedAuthorities.some((authority) => authority.frameworkType === frameworkType)
      );
    }
    const authorityValue = queryText(req.query.trustedauthoritiesvalue);
    if (authorityValue) {
      records = records.filter((record) =>
        record.trustedAuthorities.some(
          (authority) => authority.value === authorityValue || authority.registryId === authorityValue
        )
      );
    }
    const schemaUri = queryText(req.query.schemauri);
    if (schemaUri) {
      records = records.filter((record) => record.schemaURIs.some((uri) => uri.uri === schemaUri));
    }
    const rulebookUri = queryText(req.query.rulebookuri);
    if (rulebookUri) {
      records = records.filter((record) => record.rulebookURI === rulebookUri);
    }
    const conformance = queryText(req.query.conformance);
    if (conformance) {
      records = records.filter((record) => record.conformance.level === conformance);
    }

    records.sort((a, b) => a.attestationType.localeCompare(b.attestationType));

    const page = queryNumber(req.query.page, 0);
    const size = Math.min(200, Math.max(1, queryNumber(req.query.size, 200)));
    const totalElements = records.length;
    const start = page * size;

    await sendTs11Response(req, res, {
      content: records.slice(start, start + size),
      page: {
        size,
        number: page,
        totalElements,
        totalPages: Math.max(1, Math.ceil(totalElements / size)),
      },
    });
  } catch (err) {
    console.error("TS11 schemas API error:", err);
    res.status(500).json({
      message: "Failed to load credential catalog",
      timestamp: new Date().toISOString(),
    });
  }
}
