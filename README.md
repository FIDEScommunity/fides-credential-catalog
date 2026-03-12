# FIDES Credential Catalog

Open catalog of credential definitions used in the FIDES ecosystem.

## Repository structure

- `community-catalogs/`: source credential entries contributed by providers
- `schemas/`: JSON Schema for source catalog validation
- `src/`: crawler and type definitions
- `data/`: aggregated machine-readable output
- `wordpress-plugin/`: WordPress plugin for search and filter UI

## Source schema highlights (v1)

- Source entries are intentionally lightweight.
- Attributes are not stored in source entries.
- The crawler resolves each `schemaUrl` and enriches `aggregated.json` with extracted attributes.
- Credential ID format:
  - `cred:<authorityCode>:<credentialKey>:<formatCode>`
  - Example: `cred:eu:lpid:vcdm-2-0`

## Development

Install dependencies:

```bash
npm install
```

Validate source catalogs:

```bash
npm run validate
```

Run crawler:

```bash
npm run crawl
```

## Machine-readable output

The crawler writes:

- `data/aggregated.json`
- `wordpress-plugin/fides-credential-catalog/data/aggregated.json`

Top-level output fields:

- `schemaVersion`
- `catalogType`
- `lastUpdated`
- `credentials`
- `stats`
