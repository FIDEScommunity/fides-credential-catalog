=== FIDES Credential Catalog ===
Contributors: fidescommunity
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.5.0
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

Interactive credential catalog with search, filters, and optional SSR/SEO via fides-community-tools-tiles.

== Changelog ==

= 1.5.0 =
* Add an “or Ask FIDES” button beside credential search when FIDES Assistant
  0.6.1 or newer is active.
* Reuse the headless assistant modal, prefill the current search without
  submitting it, and show a credential-specific chat placeholder.

= 1.4.1 =
* Preserve the published credential slug when submitting an update.

= 1.4.0 =
* Add logged-in create and update forms for moderated credential catalog submissions.
* Add source-schema validation, organization and credential lookups, GitHub publication mapping, and automatic credential IDs and slugs.
* Add a configurable credential update form URL and ownership-aware modal edit link; all source fields are available without plan-tier restrictions.

= 1.3.13 =
* Enqueue assets only when the credential catalog shortcode is present (wallet/trust-scheme pattern), so other catalog pages are not affected by the shared FidesCatalogUI singleton.

= 1.3.12 =
* Mobile filters: keep the drawer open when expanding groups or selecting options; keep body scroll lock in sync. Bundle and enqueue shared fides-catalog-ui (tiles ≥ 1.8.28).

= 1.3.11 =
* Credential detail modal: restore subtle Last updated footer; dates use the browser locale.

= 1.3.10 =
* Ecosystem model modal section: add Explain link to the FIDES Ecosystem Explorer (same as RP catalog).

= 1.3.9 =
* Mobile detail modal and filter overlay aligned with the shared FIDES catalog mobile pattern (inline CSS; no bundled fides-catalog-ui library).
