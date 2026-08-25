=== FIDES Credential Catalog ===
Contributors: fidescommunity
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.5.10
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

Interactive credential catalog with search, filters, and optional SSR/SEO via fides-community-tools-tiles.

== Changelog ==

= 1.5.10 =
* Sync shared modal UI: Use cases accordion scroll arrows overlay cards on narrow screens (tiles ≥ 1.13.18).

= 1.5.9 =
* Sync shared modal UI: Use cases accordion scrolls horizontally when more than two cases are linked (tiles ≥ 1.13.17).

= 1.5.8 =
* Sync shared modal UI: Use cases accordion uses a two-column layout on narrow screens; a single linked case spans the full row (tiles ≥ 1.13.15).

= 1.5.7 =
* Move Use cases accordion above the Ecosystem Model; enable Matomo tracking.

= 1.5.6 =
* Credential modal: Use cases accordion with shared card layout (closed by
  default), reverse-linked from use-case catalog credentials refs.

= 1.5.5 =
* Official listing badge requires explicit catalogTier Pro; curated Community
  can keep full fields via catalogListingDepth (tiles ≥ 1.10.0).

= 1.5.4 =
* After sign-in, Back from the logged-in page reloads a stale guest catalog
  snapshot so the like star sees the session (needs tiles ≥ 1.9.23).

= 1.5.3 =
* After magic-link sign-in, Back reloads a cached logged-out catalog page so
  the like star sees the new session.

= 1.5.2 =
* After GitHub fails, use a 12-hour browser cache and the WP last-known-good aggregated feed before the bundled plugin snapshot.

= 1.5.1 =
* Show a dismissible notice when GitHub catalog data is unreachable and the plugin snapshot is used.

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
