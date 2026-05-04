/**
 * GET /api/public/api-docs
 * OpenAPI 3.1 spec for the Credential Catalog API.
 * This API returns credential definitions only; issuer-related fields are omitted. For issuance, use the Issuer Catalog API.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Base URL for this deployment (Vercel preview/production or local). Avoids a hardcoded host while community DNS may still point at legacy infra. */
function getPublicBaseUrl(req: VercelRequest): string {
  const first = (v: string | string[] | undefined): string => {
    if (!v) return "";
    const s = Array.isArray(v) ? v[0] : v;
    return String(s).split(",")[0]?.trim() ?? "";
  };
  const proto = first(req.headers["x-forwarded-proto"] as string | string[] | undefined) || "https";
  const host =
    first(req.headers["x-forwarded-host"] as string | string[] | undefined) ||
    first(req.headers.host as string | string[] | undefined) ||
    (process.env.VERCEL_URL ? process.env.VERCEL_URL.replace(/^https?:\/\//i, "") : "");
  if (!host) return "http://localhost:3000";
  return `${proto}://${host.replace(/^https?:\/\//i, "")}`;
}

const OPENAPI_SPEC_BASE = {
  openapi: "3.1.0",
  info: {
    title: "Credential Catalog API",
    description:
      "API to search credential definitions in the FIDES Credential Catalog. Returns credential types (schema, format, kind) only. Issuer-related fields (issuance URL, configuration ID, etc.) are omitted; for issuance and issuer details, use the Issuer Catalog API.",
    contact: {
      name: "Fides Credential Catalog",
      email: "catalog@fides.community",
    },
    version: "2.4",
  },
  tags: [{ name: "Search API", description: "Search in the catalog" }],
  paths: {
    "/api/public/credentialtype/{id}": {
      get: {
        tags: ["Search API"],
        summary: "Get one credential type by catalog id",
        operationId: "getById",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description:
              "Catalog credential id (URL-encoded when it contains reserved characters, e.g. cred:…)",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CredentialTypeDto" },
              },
            },
          },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorMessage" },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorMessage" },
              },
            },
          },
        },
      },
    },
    "/api/public/credentialtype": {
      get: {
        tags: ["Search API"],
        summary: "Find all credential types based on the query parameters",
        operationId: "find",
        parameters: [
          {
            name: "credentialKind",
            in: "query",
            required: false,
            schema: {
              type: "array",
              items: { type: "string", enum: ["PERSONAL", "ORGANIZATIONAL", "PRODUCT", "UNKNOWN"] },
            },
          },
          {
            name: "vcFormat",
            in: "query",
            required: false,
            schema: { type: "array", items: { type: "string" } },
          },
          {
            name: "sector",
            in: "query",
            required: false,
            description:
              "Filter by sector code (same taxonomy as the organization catalog). Repeat for OR semantics: credential matches if it has any selected sector.",
            schema: {
              type: "array",
              items: {
                type: "string",
                enum: [
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
                ],
              },
            },
          },
          {
            name: "ecosystem",
            in: "query",
            required: false,
            description: "Filter by ecosystem code. Repeat for OR semantics.",
            schema: {
              type: "array",
              items: {
                type: "string",
                enum: ["eudi_wallet", "uncefact", "gaia_x", "open_badges", "iso_mdl", "india_stack", "swiyu"],
              },
            },
          },
          {
            name: "theme",
            in: "query",
            required: false,
            description:
              "Filter by use-case theme code. Repeat for OR semantics: credential matches if it has any selected theme.",
            schema: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "person_identity",
                  "organizational_identity",
                  "payments",
                  "compliance_reporting",
                  "trade_documents",
                  "education",
                  "digital_product_passports",
                  "dataspaces",
                  "agentic_ai",
                ],
              },
            },
          },
          {
            name: "category",
            in: "query",
            required: false,
            description:
              "Filter by top-level credential category for wallet-initiated flows. Repeat for OR semantics.",
            schema: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "identity",
                  "business",
                  "finance",
                  "health",
                  "travel",
                  "professional",
                  "compliance",
                  "trade",
                ],
              },
            },
          },
          {
            name: "tags",
            in: "query",
            required: false,
            description: "Free text filter over credential tags (case-insensitive, partial match).",
            schema: { type: "string" },
          },
          {
            name: "authority",
            in: "query",
            required: false,
            description: "Free text filter over credential authority name (case-insensitive, partial match).",
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            description: "Zero-based page index (0..N)",
            required: false,
            schema: { type: "integer", default: 0, minimum: 0 },
          },
          {
            name: "size",
            in: "query",
            description: "The size of the page to be returned",
            required: false,
            schema: { type: "integer", default: 200, minimum: 1 },
          },
          {
            name: "sort",
            in: "query",
            description: "Sorting criteria in the format: property,(asc|desc). Multiple sort criteria are supported.",
            required: false,
            schema: { type: "array", items: { type: "string" } },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PagedModelCredentialTypeDto" },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorMessage" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CredentialTypeDto: {
        type: "object",
        description:
          "Credential definition only. Issuer-related fields (issuanceUrl, credentialConfigurationId, deploymentEnvironment, etc.) are omitted; use the Issuer Catalog API for those.",
        properties: {
          id: { type: "string", description: "Catalog credential ID (e.g. cred:authority:key:format)" },
          credentialKind: {
            type: "string",
            enum: ["PERSONAL", "ORGANIZATIONAL", "PRODUCT", "UNKNOWN"],
            description: "Mapped from subjectType",
          },
          authority: {
            type: "string",
            description: "Credential authority name",
          },
          vcFormat: {
            type: "string",
            description:
              "VC format code: sd_jwt_vc, mdoc, jwt_vc, vcdm_1_1, vcdm_2_0, anoncreds, idemix, apple_wallet_pass, google_wallet_pass, acdc",
          },
          schemaUrl: { type: "string", format: "uri" },
          schemaInfo: { type: "string", description: "Short description" },
          trustFrameworkUrl: { type: "string", format: "uri", description: "Rulebook URL when present" },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Free-form credential tags (empty array when not set in catalog)",
          },
          sectors: {
            type: "array",
            items: {
              type: "string",
              enum: [
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
              ],
            },
            description: "Sector codes (aligned with FIDES organization catalog)",
          },
          ecosystems: {
            type: "array",
            items: {
              type: "string",
              enum: ["eudi_wallet", "uncefact", "gaia_x", "open_badges", "iso_mdl", "india_stack", "swiyu"],
            },
          },
          themes: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "person_identity",
                "organizational_identity",
                "payments",
                "compliance_reporting",
                "trade_documents",
                "education",
                "digital_product_passports",
                "dataspaces",
                "agentic_ai",
              ],
            },
            description: "Optional use-case themes (empty array when not set in catalog)",
          },
          category: {
            type: "string",
            enum: [
              "identity",
              "business",
              "finance",
              "health",
              "travel",
              "professional",
              "compliance",
              "trade",
            ],
            description: "Optional top-level category used for wallet-initiated flow discovery",
          },
        },
      },
      PageMetadata: {
        type: "object",
        properties: {
          size: { type: "integer" },
          number: { type: "integer" },
          totalElements: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      PagedModelCredentialTypeDto: {
        type: "object",
        properties: {
          content: {
            type: "array",
            items: { $ref: "#/components/schemas/CredentialTypeDto" },
          },
          page: { $ref: "#/components/schemas/PageMetadata" },
        },
      },
      ErrorMessage: {
        type: "object",
        properties: {
          message: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end();
    return;
  }
  const baseUrl = getPublicBaseUrl(req);
  const spec = {
    ...OPENAPI_SPEC_BASE,
    info: {
      ...OPENAPI_SPEC_BASE.info,
      contact: { ...OPENAPI_SPEC_BASE.info.contact, url: baseUrl },
    },
    servers: [{ url: baseUrl, description: "This deployment" }],
  };
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(spec);
}
