/**
 * GET /api/public/credentialtype
 * Returns credential definitions (schema, format, kind) only. Issuer-related fields are omitted.
 * See docs/API.md for design choices.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "fs/promises";
import { join } from "path";

const CREDENTIAL_KIND = ["PERSONAL", "ORGANIZATIONAL", "PRODUCT", "UNKNOWN"] as const;
type CredentialKind = (typeof CREDENTIAL_KIND)[number];

function subjectTypeToCredentialKind(subjectType: string): CredentialKind {
  const s = String(subjectType || "").trim();
  if (s === "Person") return "PERSONAL";
  if (s === "Organization") return "ORGANIZATIONAL";
  if (s === "Product") return "PRODUCT";
  return "UNKNOWN";
}

interface AggregatedCatalog {
  credentials: Array<{
    id: string;
    displayName?: string;
    shortDescription?: string;
    subjectType?: string;
    vcFormat?: string;
    schemaUrl?: string;
    rulebookUrl?: string;
    updatedAt?: string;
  }>;
}

/** CredentialTypeDto: only fields we have; issuer fields omitted. */
function toCredentialTypeDto(c: AggregatedCatalog["credentials"][0]): Record<string, string> {
  const dto: Record<string, string> = {};
  dto.id = c.id;
  dto.credentialKind = subjectTypeToCredentialKind(c.subjectType || "");
  if (c.vcFormat) dto.credentialFormat = c.vcFormat;
  if (c.schemaUrl) dto.schemaUrl = c.schemaUrl;
  if (c.shortDescription) dto.schemaInfo = c.shortDescription;
  if (c.rulebookUrl) dto.trustFrameworkUrl = c.rulebookUrl;
  return dto;
}

function parseQueryArray(q: unknown): string[] {
  if (q == null) return [];
  if (Array.isArray(q)) return q.filter((x) => typeof x === "string");
  return [String(q)].filter(Boolean);
}

function parseQueryNumber(q: unknown, defaultVal: number): number {
  if (q == null) return defaultVal;
  const n = Number(q);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : defaultVal;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  try {
    const dataPath = join(process.cwd(), "data", "aggregated.json");
    const raw = await readFile(dataPath, "utf-8");
    const catalog = JSON.parse(raw) as AggregatedCatalog;
    let list = Array.isArray(catalog.credentials) ? [...catalog.credentials] : [];

    const credentialKind = parseQueryArray(req.query.credentialKind).filter((k) =>
      CREDENTIAL_KIND.includes(k as CredentialKind)
    );
    const credentialFormat = parseQueryArray(req.query.credentialFormat);

    if (credentialKind.length > 0) {
      const kindSet = new Set(credentialKind);
      list = list.filter((c) => kindSet.has(subjectTypeToCredentialKind(c.subjectType || "")));
    }
    if (credentialFormat.length > 0) {
      const formatSet = new Set(credentialFormat);
      list = list.filter((c) => c.vcFormat && formatSet.has(c.vcFormat));
    }

    const sortParam = req.query.sort;
    const sortStr = Array.isArray(sortParam) ? sortParam[0] : sortParam;
    if (typeof sortStr === "string" && sortStr.includes(",")) {
      const [field, dir] = sortStr.split(",").map((s) => s.trim());
      const asc = (dir || "asc").toLowerCase() !== "desc";
      const key = field === "credentialFormat" ? "vcFormat" : field === "credentialKind" ? "subjectType" : field;
      list.sort((a, b) => {
        const va = key === "subjectType" ? subjectTypeToCredentialKind((a as Record<string, string>)[key] || "") : (a as Record<string, string>)[key] ?? "";
        const vb = key === "subjectType" ? subjectTypeToCredentialKind((b as Record<string, string>)[key] || "") : (b as Record<string, string>)[key] ?? "";
        const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
        return asc ? cmp : -cmp;
      });
    }

    const page = parseQueryNumber(req.query.page, 0);
    const size = Math.min(200, Math.max(1, parseQueryNumber(req.query.size, 200)));
    const totalElements = list.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const slice = list.slice(start, start + size);

    const content = slice.map(toCredentialTypeDto);

    res.status(200).json({
      content,
      page: {
        size,
        number: page,
        totalElements,
        totalPages,
      },
    });
  } catch (err) {
    console.error("credentialtype API error:", err);
    res.status(500).json({
      message: "Failed to load credential catalog",
      timestamp: new Date().toISOString(),
    });
  }
}
