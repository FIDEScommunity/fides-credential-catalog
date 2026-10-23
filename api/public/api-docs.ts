/**
 * GET /api/public/api-docs
 * OpenAPI 3.1 spec for the Credential Catalog API.
 * This API returns credential definitions and issuer-availability metadata.
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
      "API to search credential definitions in the FIDES Credential Catalog. Returns credential types (schema, format, kind) with issuer-availability metadata (`hasIssuers`, `issuerCount`). Issuer integration details (issuance URL, configuration ID, etc.) remain in the Issuer Catalog API.",
    contact: {
      name: "Fides Credential Catalog",
      email: "catalog@fides.community",
    },
    version: "2.5",
  },
  tags: [
    { name: "Search API", description: "Search in the catalog" },
    {
      name: "TS11",
      description:
        "EUDI ARF TS11 catalogue of attestations, projected from the same data. When TS11_SIGNING_KEY is configured, successful responses are compact JWS (application/jwt) with an x-jku-url header; otherwise unsigned JSON with signed:false. See the conformance field per record.",
    },
  ],
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
          {
            name: "environment",
            in: "query",
            required: false,
            description:
              "Issuer environment scope for issuer availability counters. Defaults to both environments when omitted.",
            schema: { type: "string", enum: ["production", "test"] },
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
                enum: ["eudi_wallet", "uncefact", "gaia_x", "open_badges", "iso_mdl", "india_stack", "swiyu", "yivi"],
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
            name: "hasIssuers",
            in: "query",
            required: false,
            description:
              "Filter credentials by issuer availability. `true` keeps credentials with one or more issuers; `false` keeps credentials without known issuers.",
            schema: { type: "boolean" },
          },
          {
            name: "environment",
            in: "query",
            required: false,
            description:
              "Issuer environment scope used by `hasIssuers` and `issuerCount`. Defaults to both environments when omitted.",
            schema: { type: "string", enum: ["production", "test"] },
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
    "/api/public/credentialcategory": {
      get: {
        tags: ["Search API"],
        summary: "List credential categories with issuer-availability counts",
        operationId: "listCategories",
        parameters: [
          {
            name: "hasIssuers",
            in: "query",
            required: false,
            description:
              "Filter categories by issuer availability. `true` returns categories with at least one credential that has issuers in scope; `false` returns categories with zero issuer-backed credentials in scope.",
            schema: { type: "boolean" },
          },
          {
            name: "environment",
            in: "query",
            required: false,
            description:
              "Issuer environment scope used for `credentialCountWithIssuers`. Defaults to both environments when omitted.",
            schema: { type: "string", enum: ["production", "test"] },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CredentialCategoryListDto" },
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
    "/api/public/schemas": {
      get: {
        tags: ["TS11"],
        summary: "ARF TS11 catalogue of attestations",
        description:
          "One record per attestation type, in the TS11 SchemaMeta shape. Every record carries a `conformance` object naming the TS11 fields that are not populated. Query parameter names follow TS11 (lowercase). With signing configured the body is application/jwt (compact JWS); otherwise application/json with signed:false.",
        operationId: "findSchemas",
        parameters: [
          { name: "id", in: "query", required: false, schema: { type: "string" } },
          {
            name: "supportedformat",
            in: "query",
            required: false,
            description: "TS11 format identifier, e.g. dc+sd-jwt or mso_mdoc.",
            schema: { type: "string" },
          },
          {
            name: "attestationlos",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: [
                "iso_18045_basic",
                "iso_18045_enhanced-basic",
                "iso_18045_moderate",
                "iso_18045_high",
              ],
            },
          },
          {
            name: "bindingtype",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["claim", "key", "biometric", "none"] },
          },
          {
            name: "trustedauthoritiesframeworktype",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["aki", "etsi_tl", "openid_federation"] },
          },
          {
            name: "trustedauthoritiesvalue",
            in: "query",
            required: false,
            description: "Matches the TS11 value (registry URL) or the FIDES treg: identifier.",
            schema: { type: "string" },
          },
          { name: "schemauri", in: "query", required: false, schema: { type: "string" } },
          { name: "rulebookuri", in: "query", required: false, schema: { type: "string" } },
          {
            name: "conformance",
            in: "query",
            required: false,
            description:
              "full = every TS11 field populated; partial = some fields missing; compatible = no format with a TS11 counterpart.",
            schema: { type: "string", enum: ["full", "partial", "compatible"] },
          },
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 0 } },
          { name: "size", in: "query", required: false, schema: { type: "integer", default: 200 } },
        ],
        responses: {
          "200": {
            description:
              "OK. Signed deployments return application/jwt (compact JWS). Unsigned local/dev returns application/json.",
            headers: {
              "x-jku-url": {
                description: "Absolute JWKS URL used to verify the JWS (present when signed).",
                schema: { type: "string", format: "uri" },
              },
            },
            content: {
              "application/jwt": {
                schema: {
                  type: "string",
                  description: "Compact JWS whose payload is the paginated SchemaMeta list plus iss/iat.",
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    content: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Ts11SchemaMeta" },
                    },
                    page: { $ref: "#/components/schemas/PageMetadata" },
                    signed: {
                      type: "boolean",
                      description: "false when TS11_SIGNING_KEY is not configured.",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorMessage" } },
            },
          },
        },
      },
    },
    "/api/public/schemas/{id}": {
      get: {
        tags: ["TS11"],
        summary: "One ARF TS11 SchemaMeta record",
        operationId: "getSchemaById",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description:
              "TS11 UUID, a cred: attestation type id, or a legacy per-format cred: id (URL-encoded).",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description:
              "OK. Signed deployments return application/jwt; unsigned local/dev returns application/json.",
            headers: {
              "x-jku-url": {
                description: "Absolute JWKS URL used to verify the JWS (present when signed).",
                schema: { type: "string", format: "uri" },
              },
            },
            content: {
              "application/jwt": {
                schema: {
                  type: "string",
                  description: "Compact JWS whose payload is the SchemaMeta plus iss/iat.",
                },
              },
              "application/json": { schema: { $ref: "#/components/schemas/Ts11SchemaMeta" } },
            },
          },
          "404": {
            description: "Not found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorMessage" } },
            },
          },
          "500": {
            description: "Internal Server Error",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorMessage" } },
            },
          },
        },
      },
    },
    "/api/jwks": {
      get: {
        tags: ["TS11"],
        summary: "JWKS for verifying signed TS11 /schemas responses",
        description:
          "Canonical JWKS endpoint. `/api/.well-known/jwks.json` and `/.well-known/jwks.json` rewrite here.",
        operationId: "getTs11Jwks",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    keys: {
                      type: "array",
                      items: { type: "object", additionalProperties: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/.well-known/jwks.json": {
      get: {
        tags: ["TS11"],
        summary: "JWKS (rewrite to /api/jwks)",
        operationId: "getTs11JwksWellKnown",
        responses: {
          "200": {
            description: "OK — same body as /api/jwks",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    keys: {
                      type: "array",
                      items: { type: "object", additionalProperties: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Ts11SchemaMeta: {
        type: "object",
        description:
          "ARF TS11 SchemaMeta projected from the credential catalog. Deviation from TS11: each trusted authority also carries the FIDES `registryId` (treg:…) that resolves in the FIDES Trust Scheme Catalog, and FIDES-specific fields live under `fides`.",
        properties: {
          id: { type: "string", format: "uuid", description: "Stable UUID v5 over the attestation type id" },
          attestationType: { type: "string", description: "FIDES attestation type id (cred:authority:key)" },
          title: { type: "string" },
          description: { type: "string" },
          version: { type: "string", description: "SemVer" },
          supportedFormats: {
            type: "array",
            items: { type: "string" },
            description: "TS11 format identifiers; formats without a TS11 counterpart are omitted",
          },
          schemaURIs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                formatIdentifier: { type: "string" },
                uri: { type: "string" },
                integrity: { type: "string" },
              },
            },
          },
          rulebookURI: { type: "string" },
          rulebookIntegrity: { type: "string" },
          attestationLoS: { type: "string" },
          bindingType: { type: "string" },
          trustedAuthorities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                frameworkType: { type: "string", enum: ["aki", "etsi_tl", "openid_federation"] },
                value: { type: "string", description: "Registry URL, per TS11" },
                isLoTE: { type: "boolean", description: "Derived from the registry profile" },
                registryId: { type: "string", description: "FIDES treg: identifier" },
                schemeId: { type: "string", description: "FIDES scheme: identifier" },
              },
            },
          },
          conformance: {
            type: "object",
            properties: {
              level: { type: "string", enum: ["full", "partial", "compatible"] },
              missing: { type: "array", items: { type: "string" } },
            },
          },
          fides: {
            type: "object",
            description: "FIDES extensions, namespaced so a strict TS11 consumer can ignore them.",
            properties: {
              attestationTypeId: { type: "string" },
              aliasIds: { type: "array", items: { type: "string" } },
              sectors: { type: "array", items: { type: "string" } },
              ecosystems: { type: "array", items: { type: "string" } },
              themes: { type: "array", items: { type: "string" } },
              category: { type: "string" },
              updatedAt: { type: "string", format: "date-time" },
            },
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
      CredentialTypeDto: {
        type: "object",
        description:
          "Credential definition with issuer-availability metadata. Issuer integration fields (issuanceUrl, credentialConfigurationId, etc.) are omitted; use the Issuer Catalog API for those.",
        properties: {
          id: { type: "string", description: "Catalog credential ID (e.g. cred:authority:key:format)" },
          displayName: {
            type: "string",
            description: "Human-readable credential name (e.g. 'LPID Attestation')",
          },
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
              enum: ["eudi_wallet", "uncefact", "gaia_x", "open_badges", "iso_mdl", "india_stack", "swiyu", "yivi"],
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
          hasIssuers: {
            type: "boolean",
            description:
              "True when at least one issuer is known for this credential in the selected environment scope.",
          },
          issuerCount: {
            type: "integer",
            minimum: 0,
            description:
              "Number of unique issuers known for this credential in the selected environment scope.",
          },
        },
      },
      CredentialCategoryDto: {
        type: "object",
        properties: {
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
          },
          label: { type: "string" },
          credentialCount: {
            type: "integer",
            minimum: 0,
            description: "Total number of credentials in this category.",
          },
          credentialCountWithIssuers: {
            type: "integer",
            minimum: 0,
            description:
              "Number of credentials in this category that have one or more issuers in the selected environment scope.",
          },
        },
      },
      CredentialCategoryListDto: {
        type: "object",
        properties: {
          content: {
            type: "array",
            items: { $ref: "#/components/schemas/CredentialCategoryDto" },
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
