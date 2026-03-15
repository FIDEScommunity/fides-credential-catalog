/**
 * GET /api/public/api-docs
 * OpenAPI 3.1 spec for the Credential Catalog API.
 * This API returns credential definitions only; issuer-related fields are omitted. For issuance, use the Issuer Catalog API.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Credential Catalog API",
    description:
      "API to search credential definitions in the FIDES Credential Catalog. Returns credential types (schema, format, kind) only. Issuer-related fields (issuance URL, configuration ID, etc.) are omitted; for issuance and issuer details, use the Issuer Catalog API.",
    contact: {
      name: "Fides Credential Catalog",
      url: "https://credential-catalog.fides.community",
      email: "catalog@fides.community",
    },
    version: "2.0",
  },
  servers: [{ url: "https://credential-catalog.fides.community", description: "Credential Catalog API" }],
  tags: [{ name: "Search API", description: "Search in the catalog" }],
  paths: {
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
            name: "credentialFormat",
            in: "query",
            required: false,
            schema: { type: "array", items: { type: "string" } },
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
          credentialFormat: { type: "string", description: "VC format (e.g. sd_jwt_vc)" },
          schemaUrl: { type: "string", format: "uri" },
          schemaInfo: { type: "string", description: "Short description" },
          trustFrameworkUrl: { type: "string", format: "uri", description: "Rulebook URL when present" },
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(OPENAPI_SPEC);
}
