/**
 * GET /api/public/credentialcategory
 * Returns category-level counts with optional issuer availability filtering.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "fs/promises";
import { join } from "path";
import type { AggregatedCatalog } from "../../lib/credentialTypeDto";
import {
  issuerCountForCredential,
  loadIssuerAvailabilityIndex,
  parseBooleanFlag,
  parseEnvironment,
} from "../../lib/issuerAvailability";

const CATEGORY_ORDER = [
  "identity",
  "business",
  "finance",
  "health",
  "travel",
  "professional",
  "compliance",
  "trade",
] as const;

type CredentialCategory = (typeof CATEGORY_ORDER)[number];

const CATEGORY_LABELS: Record<CredentialCategory, string> = {
  identity: "Identity",
  business: "Business",
  finance: "Finance",
  health: "Health",
  travel: "Travel",
  professional: "Professional",
  compliance: "Compliance",
  trade: "Trade",
};

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
    const credentials = Array.isArray(catalog.credentials) ? catalog.credentials : [];
    const issuerAvailabilityIndex = await loadIssuerAvailabilityIndex();
    const hasIssuers = parseBooleanFlag(req.query.hasIssuers);
    const environment = parseEnvironment(req.query.environment);

    const countsByCategory = new Map<CredentialCategory, { credentialCount: number; credentialCountWithIssuers: number }>();
    for (const category of CATEGORY_ORDER) {
      countsByCategory.set(category, {
        credentialCount: 0,
        credentialCountWithIssuers: 0,
      });
    }

    for (const credential of credentials) {
      const category = credential.category as CredentialCategory | undefined;
      if (!category || !countsByCategory.has(category)) continue;
      const issuerCount = issuerCountForCredential(issuerAvailabilityIndex, credential.id, environment);
      const withIssuers = issuerCount > 0;

      const bucket = countsByCategory.get(category)!;
      bucket.credentialCount += 1;
      if (withIssuers) {
        bucket.credentialCountWithIssuers += 1;
      }
    }

    const content = CATEGORY_ORDER
      .map((category) => {
        const counts = countsByCategory.get(category)!;
        return {
          category,
          label: CATEGORY_LABELS[category],
          credentialCount: counts.credentialCount,
          credentialCountWithIssuers: counts.credentialCountWithIssuers,
        };
      })
      .filter((row) => row.credentialCount > 0)
      .filter((row) => {
        if (typeof hasIssuers !== "boolean") return true;
        return hasIssuers ? row.credentialCountWithIssuers > 0 : row.credentialCountWithIssuers === 0;
      });

    res.status(200).json({ content });
  } catch (err) {
    console.error("credentialcategory API error:", err);
    res.status(500).json({
      message: "Failed to load credential catalog",
      timestamp: new Date().toISOString(),
    });
  }
}
