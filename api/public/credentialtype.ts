/**
 * GET /api/public/credentialtype
 * Returns credential definitions (schema, format, kind) only. Issuer-related fields are omitted.
 * See docs/API.md for design choices.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  subjectTypeToCredentialKind,
  toCredentialTypeDto,
  type AggregatedCatalog,
} from "../../lib/credentialTypeDto";

const CREDENTIAL_KIND = ["PERSONAL", "ORGANIZATIONAL", "PRODUCT", "UNKNOWN"] as const;
type CredentialKind = (typeof CREDENTIAL_KIND)[number];

const SECTOR_CODES = [
  "public_sector",
  "finance",
  "trade",
  "supply_chain",
  "manufacturing",
  "energy",
  "agriculture",
  "food",
  "retail",
  "healthcare",
  "education",
  "construction",
  "mobility",
  "digital",
] as const;

const ECOSYSTEM_CODES = [
  "eudi_wallet",
  "uncefact",
  "gaia_x",
  "open_badges",
  "iso_mdl",
  "india_stack",
  "swiyu",
] as const;

const THEME_CODES = [
  "person_identity",
  "organizational_identity",
  "payments",
  "compliance_reporting",
  "trade_documents",
  "education",
  "digital_product_passports",
  "dataspaces",
  "agentic_ai",
] as const;

function arraysOverlap(selected: string[], values: string[] | undefined): boolean {
  if (selected.length === 0) return true;
  const set = new Set(values ?? []);
  return selected.some((x) => set.has(x));
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
    const vcFormat = parseQueryArray(req.query.vcFormat);
    const sectorFilter = parseQueryArray(req.query.sector).filter((s) =>
      SECTOR_CODES.includes(s as (typeof SECTOR_CODES)[number])
    );
    const ecosystemFilter = parseQueryArray(req.query.ecosystem).filter((e) =>
      ECOSYSTEM_CODES.includes(e as (typeof ECOSYSTEM_CODES)[number])
    );
    const themeFilter = parseQueryArray(req.query.theme).filter((t) =>
      THEME_CODES.includes(t as (typeof THEME_CODES)[number])
    );

    if (credentialKind.length > 0) {
      const kindSet = new Set(credentialKind);
      list = list.filter((c) => kindSet.has(subjectTypeToCredentialKind(c.subjectType || "")));
    }
    if (vcFormat.length > 0) {
      const formatSet = new Set(vcFormat);
      list = list.filter((c) => c.vcFormat && formatSet.has(c.vcFormat));
    }
    if (sectorFilter.length > 0) {
      list = list.filter((c) => arraysOverlap(sectorFilter, c.sectors));
    }
    if (ecosystemFilter.length > 0) {
      list = list.filter((c) => arraysOverlap(ecosystemFilter, c.ecosystems));
    }
    if (themeFilter.length > 0) {
      list = list.filter((c) => arraysOverlap(themeFilter, c.themes));
    }

    const sortParam = req.query.sort;
    const sortStr = Array.isArray(sortParam) ? sortParam[0] : sortParam;
    if (typeof sortStr === "string" && sortStr.includes(",")) {
      const [field, dir] = sortStr.split(",").map((s) => s.trim());
      const asc = (dir || "asc").toLowerCase() !== "desc";
      const key =
        field === "vcFormat" || field === "credentialFormat"
          ? "vcFormat"
          : field === "credentialKind"
            ? "subjectType"
            : field === "id"
              ? "id"
              : field;
      list.sort((a, b) => {
        const ra = a as Record<string, unknown>;
        const rb = b as Record<string, unknown>;
        let va: string;
        let vb: string;
        if (key === "subjectType") {
          va = subjectTypeToCredentialKind(String(ra.subjectType || ""));
          vb = subjectTypeToCredentialKind(String(rb.subjectType || ""));
        } else if (key === "sectors" || key === "ecosystems" || key === "themes") {
          const aa = Array.isArray(ra[key]) ? (ra[key] as string[]).slice().sort().join(",") : "";
          const bb = Array.isArray(rb[key]) ? (rb[key] as string[]).slice().sort().join(",") : "";
          va = aa;
          vb = bb;
        } else {
          va = String(ra[key] ?? "");
          vb = String(rb[key] ?? "");
        }
        const cmp = va.localeCompare(vb, undefined, { sensitivity: "base" });
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
