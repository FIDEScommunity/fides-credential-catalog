# API setup (serverless, Vercel)

This document describes how the Public API is set up in this repo so the same pattern can be used for the **Issuer Catalog** (or other FIDES catalogs).

## Overview

- **Hosting:** Vercel (serverless).
- **Routes:** `api/` folder → serverless functions; `public/` → static output (landing + Swagger UI).
- **Data:** Read at runtime from repo (e.g. `data/aggregated.json`). No separate backend; redeploy on data change.

## Repo layout

```
credential-catalog/
├── api/
│   └── public/
│       ├── credentialtype.ts   # GET /api/public/credentialtype — list/filter credentials
│       └── api-docs.ts         # GET /api/public/api-docs — OpenAPI JSON spec
├── public/
│   ├── index.html              # Landing page (links to API + Swagger)
│   └── swagger.html            # Swagger UI (loads spec from /api/public/api-docs)
├── data/
│   └── aggregated.json         # Source data (used by API at runtime)
├── vercel.json
├── package.json                # engines.node, @vercel/node devDep, npm ci
└── package-lock.json           # Must be in sync for npm ci
```

## 1. Vercel config (`vercel.json`)

- **buildCommand:** No frontend build; use a no-op so Vercel doesn’t run `tsc` for the whole repo:  
  `"buildCommand": "echo 'No build step; API only'"`.
- **installCommand:** `"npm ci"` (keep `package-lock.json` in sync with `package.json`).
- **outputDirectory:** `"public"` — Vercel expects an output dir; we serve static files from `public/` (landing + Swagger).
- **functions:** For `api/**/*.ts` set memory/duration if needed (e.g. 256 MB, 10 s).

Example:

```json
{
  "buildCommand": "echo 'No build step; API only'",
  "installCommand": "npm ci",
  "framework": null,
  "outputDirectory": "public",
  "functions": {
    "api/**/*.ts": { "memory": 256, "maxDuration": 10 }
  }
}
```

## 2. API handlers (`api/public/*.ts`)

- **Runtime:** Node.js (Vercel compiles `api/**/*.ts`).
- **Types:** Use `VercelRequest` and `VercelResponse` from `@vercel/node` (devDependency).
- **Data:** Read from repo, e.g. `readFile(join(process.cwd(), 'data', 'aggregated.json'), 'utf-8')`. No DB; redeploy when `data/` changes.
- **CORS:** Set `Access-Control-Allow-Origin: *` (or your domain) for browser clients.
- **Method:** Only handle `GET`; return 405 for other methods.

Pattern for a list endpoint:

1. Parse query params (e.g. `page`, `size`, filter arrays).
2. Load and parse `data/aggregated.json`.
3. Filter/sort/paginate in memory.
4. Map entities to the public DTO (omit internal/issuer-only fields).
5. Return JSON: `{ content: [...], page: { size, number, totalElements, totalPages } }`.

## 3. OpenAPI spec (`api/public/api-docs.ts`)

- **Route:** `GET /api/public/api-docs` returns the OpenAPI 3.x JSON.
- **Content:** Inline object (or load from file). Describe paths, parameters, and response schemas; note in the description that issuer-related fields are omitted and that the Issuer Catalog API is for issuance.
- **Response:** `res.setHeader('Content-Type', 'application/json'); res.status(200).json(OPENAPI_SPEC);`

## 4. Swagger UI (static)

- **File:** `public/swagger.html`.
- **Content:** Single HTML page that loads Swagger UI from a CDN (e.g. `unpkg.com/swagger-ui-dist@5`) and points it at the spec URL: `url: '/api/public/api-docs'`.
- **Link:** Add a link on `public/index.html` to `swagger.html` (“Swagger UI” or “Interactive API docs”).

## 5. Dependencies and lock file

- **package.json:**  
  - `"engines": { "node": "20.x" }` to pin Node on Vercel.  
  - `"devDependencies": { "@vercel/node": "^3.0.0", ... }` for handler types.
- **package-lock.json:** Must be committed and in sync with `package.json` so `npm ci` succeeds on Vercel. After any dependency change, run `npm install` and commit the updated lock file.

## 6. Deploy

- Connect the repo to Vercel (GitHub → Import Project).
- **Build & Development Settings:** Leave “Install Command” empty so `vercel.json` is used (or set explicitly to `npm ci`).
- Each push to `main` triggers a deploy. The API and `public/` (including Swagger) are served from the Vercel URL.

---

## Reusing for Issuer Catalog

1. **Copy structure:**  
   - `api/public/` with at least one handler (e.g. `issuertype.ts` or `issuer.ts`) and `api-docs.ts`.  
   - `public/index.html` and `public/swagger.html` (update the spec `url` in `swagger.html` if the path differs, e.g. `/api/public/api-docs`).

2. **Data source:** Read the issuer catalog’s aggregated data (e.g. `data/aggregated.json` in the issuer-catalog repo). Same pattern: `readFile(join(process.cwd(), 'data', 'aggregated.json'))`.

3. **Contract:** Define the issuer API contract (path, query params, response shape). Implement filter/sort/pagination and map to a public DTO; omit any internal-only fields. Document in OpenAPI in `api-docs.ts`.

4. **vercel.json:** Same pattern: no-op build, `npm ci`, `outputDirectory: "public"`, and `functions` for `api/**/*.ts`.

5. **package.json:** Add `engines.node` and `@vercel/node`; keep `package-lock.json` in sync.

6. **Swagger:** Point `public/swagger.html` at the issuer API’s spec URL (e.g. `/api/public/api-docs`). No code changes needed in Swagger UI itself beyond that URL.

This keeps the Credential and Issuer catalogs consistent and easy to replicate for other FIDES catalogs.
