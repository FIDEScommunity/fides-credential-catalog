# FIDES Credential Catalog

**Developed and maintained by FIDES Labs BV**

A community-driven catalog of verifiable credential schemas used in the FIDES ecosystem, including national identity credentials and sector-specific credentials.

## 🎯 Concept

The FIDES Credential Catalog provides a standardized, searchable database of verifiable credential definitions. Credential authorities contribute their schemas via GitHub Pull Requests, ensuring:

1. **Standardized format** — All credentials follow a unified JSON schema
2. **Community-maintained** — Authorities manage their own information via PR
3. **Automatic aggregation** — The crawler aggregates and enriches entries with attributes extracted from linked schemas
4. **Always up-to-date** — Changes are reflected in `data/aggregated.json` on every crawl run
5. **Cross-catalog linking** — Shows which relying parties accept each credential, sourced from the [FIDES RP Catalog](https://github.com/FIDEScommunity/fides-rp-catalog)
6. **Open source** — Apache-2.0 license, fully transparent

The catalog is available as:
- **Website** — Interactive catalog at [fides.community](https://fides.community)
- **WordPress plugin** — Embed the catalog on your own site
- **Machine-readable JSON** — `data/aggregated.json`
- **Public API** — Serverless query API (`GET /api/public/credentialtype`) for filter, search, and pagination; see [docs/API.md](docs/API.md)

## 📁 Project Structure

```
fides-credential-catalog/
├── schemas/
│   └── credential-catalog.schema.json   # JSON Schema for source catalog entries
├── community-catalogs/                   # Credential entries by authority (add yours here!)
│   └── fides/
│       └── credential-catalog.json       # FIDES Labs credentials
├── src/
│   ├── types/credential.ts               # TypeScript type definitions
│   └── crawler/
│       ├── index.ts                      # Crawler: aggregates, validates, and enriches data
│       └── schemaAttributes.ts           # Flattens nested JSON Schema properties into attributes
├── data/
│   ├── aggregated.json                   # Aggregated machine-readable output (used by UI/API)
│   └── credential-history-state.json     # Stable first-seen state across crawler runs
├── wordpress-plugin/
│   └── fides-credential-catalog/
│       ├── fides-credential-catalog.php  # WordPress plugin main file
│       └── assets/
│           ├── credential-catalog.js     # UI logic (search, filters, cards, modal)
│           └── style.css                 # Styling
├── package.json
├── tsconfig.json
└── .gitignore
```

## 🚀 Getting Started

### Installation

```bash
npm install
```

**Resolving `orgId`:** The crawler loads the organization catalog `data/aggregated.json` from GitHub raw, or falls back to `../organization-catalog/data/aggregated.json`. Set `ORGANIZATION_CATALOG_AGGREGATED_PATH` to point at a local file when needed.

### Run Crawler

Crawls all `community-catalogs/**/credential-catalog.json` files, enriches them with
attributes fetched from linked schemas (`schemaUrl`), and writes `data/aggregated.json`:

```bash
npm run crawl
```

**Schema attributes:** Nested `object.properties` from each `schemaUrl` are flattened into `attributes` rows in `aggregated.json`. Field paths use `/` (e.g. `eu.europa.ec.eudi.pid.1/given_name`) so dotted namespaces stay readable. Arrays of objects expose item fields under `…/item/…`. Limits: max depth and max 500 rows per credential (see `schemaAttributes.ts`). Optional `depth` on each row drives indentation in the WordPress UI. In the plugin modal, nested fields are labeled with a leading slash and without repeating the first segment (e.g. `/given_name`); hover shows the full path.

### Tests

```bash
npm test
```

### Validate Source Catalogs

Validates all source files against the JSON Schema:

```bash
npm run validate
```

## 🌍 Data Sources

### Community Contributions (Primary)

Credential authorities submit their own `credential-catalog.json` files via GitHub Pull Requests. The catalog currently includes:

- **FIDES Labs** — 16 credentials covering identity, access, mobility, logistics, and sustainability

### Cross-catalog: Relying Party Usage

The credential catalog reads the [FIDES RP Catalog](https://github.com/FIDEScommunity/fides-rp-catalog) to display which relying parties accept each credential. Relying party entries reference accepted credentials via `acceptedCredentialRefs`.

## ➕ Add Your Credentials to the Catalog

1. **Fork** this repository
2. **Ensure** your organization exists in the [FIDES Organization Catalog](https://github.com/FIDEScommunity/fides-organization-catalog) (canonical name, website, DID, logo, contact).
3. **Create** a folder in `community-catalogs/` (usually matching your org code, e.g. `fides`)
4. **Add** a `credential-catalog.json` with `orgId` pointing at your organization catalog entry
5. **Submit** a Pull Request

### Minimal Example

```json
{
  "$schema": "https://fides.community/schemas/credential-catalog/v1",
  "orgId": "org:yourorg",
  "credentials": [
    {
      "id": "cred:yourorg:my-credential:sd-jwt-vc",
      "displayName": "My Credential",
      "shortDescription": "A short description of this credential.",
      "authority": {
        "name": "Your Organization",
        "url": "https://yourdomain.com"
      },
      "subjectType": "Person",
      "vcFormat": "sd_jwt_vc",
      "nativeIdentifier": "urn:yourorg:my-credential:1",
      "nativeIdentifierType": "vct",
      "schemaUrl": "https://yourdomain.com/schemas/my-credential.json",
      "schemaType": "JSON Schema",
      "version": "1.0"
    }
  ]
}
```

### ID Naming Convention

Credential IDs follow the pattern: `cred:<authorityCode>:<credentialKey>:<formatCode>`

| Segment | Description | Example |
|---------|-------------|---------|
| `cred` | Fixed prefix | `cred` |
| `authorityCode` | Short code for the authority | `fides`, `eu`, `nl` |
| `credentialKey` | Stable kebab-case credential key | `lpid`, `ehic`, `green-lane` |
| `formatCode` | VC format abbreviation | `sd-jwt-vc`, `mdoc`, `vcdm-2-0` |

Example: `cred:fides:lpid:sd-jwt-vc`

### Validation

Your PR will be automatically validated against the JSON Schema. To validate locally:

```bash
npm run validate
```

### CI: validate and crawl

- **On every PR/push** that touches `community-catalogs/**/credential-catalog.json` or `schemas/**`, the **validate** workflow runs and checks all catalog files against the schema (including the ID pattern).
- **When a catalog file is merged to `main`**, the **crawl** workflow runs: it runs the crawler (enrichment from `schemaUrl`, git-based dates), updates `data/aggregated.json` and `data/credential-history-state.json`, and commits them. So the live catalog data is updated automatically after your PR is merged. The crawler also runs daily and can be triggered manually from the Actions tab.

## 🔍 Using the Catalog Data

### Direct JSON Access

The aggregated catalog is available at:
```
https://raw.githubusercontent.com/FIDEScommunity/fides-credential-catalog/main/data/aggregated.json
```

### `aggregated.json` Structure

Top-level fields:

| Field | Description |
|-------|-------------|
| `schemaVersion` | Schema version string |
| `catalogType` | Always `"credential-catalog"` |
| `lastUpdated` | ISO 8601 timestamp of last crawl |
| `credentials` | Array of enriched credential entries |
| `stats` | Summary counts |

Each credential entry in `credentials[]` includes all source fields plus:

| Enriched Field | Source |
|----------------|--------|
| `orgId` | Copied from source catalog (same as organization catalog id) |
| `provider` | Resolved by crawler from the organization catalog (`name`, `did`, `website`, `logo`, `contact`) |
| `attributes` | Extracted by crawler from `schemaUrl` |
| `firstSeenAt` | Persisted in `credential-history-state.json` (stable, not reset on re-crawl) |
| `updatedAt` | Git last-commit date of the source file, or `lastUpdated` from the catalog |

### Date Semantics

- `updatedAt` — used for "Last updated" sorting. Fallback order:
  1. Git last-commit date of the provider's `credential-catalog.json`
  2. Catalog-level `lastUpdated`
  3. Crawl timestamp
- `firstSeenAt` — stable first time this credential was seen; persisted in `data/credential-history-state.json`

## 📋 Credential Properties

Source entries support the following fields:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | ✅ | Stable ID: `cred:<authorityCode>:<credentialKey>:<formatCode>` |
| `displayName` | ✅ | Human-readable credential name |
| `authority` | ✅ | Issuing authority (name + optional URL) |
| `subjectType` | ✅ | `Person`, `Organization`, `Product`, `Dataset`, `Software`, or `Document` |
| `vcFormat` | ✅ | `sd_jwt_vc`, `mdoc`, `vcdm_1_1`, `vcdm_2_0`, `acdc`, or `other` |
| `version` | ✅ | Version string (e.g. `"1.0"`) |
| `schemaUrl` | ✅ | URL to the credential schema |
| `schemaType` | ✅ | `JSON Schema`, `JSON-LD Context`, `ISO Data Model`, `ACDC Schema`, or `Other` |
| `shortDescription` | — | One-line description shown on the catalog card |
| `nativeIdentifier` | — | Native credential type identifier (e.g. `urn:org:fides:lpid:1`) |
| `nativeIdentifierType` | — | `vct`, `docType`, `type`, `schema_said`, or `other` |
| `rulebookUrl` | — | URL to the credential rulebook or governance document |
| `extends` | — | References to base credential(s) this credential extends |
| `vocabularies` | — | Referenced vocabularies or data models |
| `tags` | — | Free-form tags |

See the full schema: [schemas/credential-catalog.schema.json](schemas/credential-catalog.schema.json)

## 🔌 WordPress Integration

A WordPress plugin is included in `wordpress-plugin/fides-credential-catalog/`.

### Installation

1. Copy the plugin folder to `wp-content/plugins/`
2. Activate the plugin in **WordPress Admin → Plugins**
3. (Optional) Configure data source URLs in **Settings → FIDES Credential Catalog**
4. Use the shortcode on any page:

```
[fides_credential_catalog]
```

### Shortcode Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `show_filters` | `true`, `false` | `true` | Show/hide the filter sidebar |
| `show_search` | `true`, `false` | `true` | Show/hide the search bar |
| `columns` | `2`, `3`, `4` | `3` | Number of card columns |
| `theme` | `fides`, `light`, `dark` | `fides` | Color theme |

Example:
```
[fides_credential_catalog show_filters="true" columns="3" theme="fides"]
```

### Plugin Settings

Configure in **Settings → FIDES Credential Catalog**:

| Setting | Default | Description |
|---------|---------|-------------|
| RP Aggregated Data URL | GitHub raw URL for RP catalog | URL to `aggregated.json` of the FIDES RP Catalog |
| RP Catalog Base URL | `https://fides.community/...` | Base URL for RP deep links in the credential modal |

### Plugin Data Fallback (Local Testing)

The plugin fetches the aggregated JSON at runtime. For local testing, copy the generated data into the plugin:

```bash
cp data/aggregated.json wordpress-plugin/fides-credential-catalog/data/aggregated.json
```

> Note: `wordpress-plugin/*/data/` is excluded from git via `.gitignore`.

## 🌐 Public API (v2)

A serverless query API is available for apps that need server-side filter, pagination, and a stable contract:

- **Endpoint:** `GET /api/public/credentialtype`
- **OpenAPI:** `GET /api/public/api-docs`

The API returns **credential definitions only** (schema URL, format, subject kind); issuer-related fields are omitted. For issuance URLs and issuer details, use the (future) Issuer Catalog API. Design choices, mapping, and deployment are documented in [docs/API.md](docs/API.md). Deploy the repo to Vercel to expose the API. If the build fails on install, ensure **Vercel → Project Settings → Build & Development Settings → Install Command** is empty (so `vercel.json` is used).  
To replicate this API setup for another catalog (e.g. Issuer Catalog), see **[API_SETUP.md](API_SETUP.md)**.

## 🔗 Related Catalogs

| Catalog | Repository | Description |
|---------|------------|-------------|
| Wallet Catalog | [fides-wallet-catalog](https://github.com/FIDEScommunity/fides-wallet-catalog) | Digital identity wallets |
| RP Catalog | [fides-rp-catalog](https://github.com/FIDEScommunity/fides-rp-catalog) | Relying parties and verifiers |
| Credential Catalog | this repository | Verifiable credential schemas |

## 📄 License

This project is licensed under the **Apache License 2.0**.

```
Copyright 2026 FIDES Labs BV

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## 🏢 About

**Developed and maintained by FIDES Labs BV**

- Website: [https://fides.community](https://fides.community)
- GitHub: [https://github.com/FIDEScommunity](https://github.com/FIDEScommunity)
- Contact: For questions or support, please open an issue in this repository

---

**© 2026 FIDES Labs BV** - All rights reserved
