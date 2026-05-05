import { readFile } from "fs/promises";
import { join } from "path";

export type IssuerEnvironment = "production" | "test";

export interface IssuerAvailabilityCounts {
  total: number;
  production: number;
  test: number;
}

export interface IssuerAvailabilityIndex {
  generatedAt: string;
  byCredentialId: Record<string, IssuerAvailabilityCounts>;
}

const EMPTY_COUNTS: IssuerAvailabilityCounts = {
  total: 0,
  production: 0,
  test: 0,
};

export function parseEnvironment(value: unknown): IssuerEnvironment | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return undefined;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "production" || normalized === "test") {
    return normalized;
  }
  return undefined;
}

export function parseBooleanFlag(value: unknown): boolean | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return undefined;
}

export async function loadIssuerAvailabilityIndex(): Promise<IssuerAvailabilityIndex> {
  try {
    const path = join(process.cwd(), "data", "issuer-availability-index.json");
    const raw = await readFile(path, "utf-8");
    const parsed = JSON.parse(raw) as IssuerAvailabilityIndex;
    if (!parsed || typeof parsed !== "object" || typeof parsed.byCredentialId !== "object") {
      return { generatedAt: "", byCredentialId: {} };
    }
    return parsed;
  } catch {
    return { generatedAt: "", byCredentialId: {} };
  }
}

export function issuerCountForCredential(
  index: IssuerAvailabilityIndex,
  credentialId: string,
  environment?: IssuerEnvironment,
): number {
  const counts = index.byCredentialId[credentialId] || EMPTY_COUNTS;
  if (environment === "production") return counts.production;
  if (environment === "test") return counts.test;
  return counts.total;
}
