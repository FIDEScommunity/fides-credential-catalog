=== FIDES Credential Catalog ===
Contributors: fidescommunity
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.6.4
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

Interactive credential catalog with search, filters, and optional SSR/SEO via fides-community-tools-tiles.

== Changelog ==

= 1.6.4 =
* Rename Trust registries to Trusted Authorities (ARF TS11 wording).
* Merge Schema metadata and Other details into one accordion, separated by a divider.
* Keep the TS11 list/card badge fully visible (no longer clipped by the name ellipsis).

= 1.6.3 =
* Deep links use the listing spinner shell again (no visible SSR detail flash before the modal).
* Schema metadata: plain format chips with a separate “Schema” link per format (clearer than chip-as-link).
* List Format column uses compact short-label chips (e.g. mDoc, SD-JWT).

= 1.6.2 =
* Credential deep links (?credential=) open the interactive catalog modal again instead of retaining the standalone SSR shell (fixes broken layout on direct open).
* Schema metadata lists every per-format schema URI (e.g. both PID mdoc and SD-JWT JSON Schema files).
* List view Format column shows all formats from formats[], not only primary vcFormat.

= 1.6.1 =
* Align pagination structure and styling with the wallet catalog, including result range and Previous/Next links.

= 1.6.0 =
* Add crawlable detail links and stable 30-item pagination to the JavaScript catalog.
* Keep standalone SSR detail content visible after JavaScript loads (requires fides-community-tools-tiles ≥ 1.13.32 and respects the fides_catalog_ssr_enabled switch).

= 1.5.13 =
* Make the shared mobile filter drawer modal and keyboard-accessible (tiles ≥ 1.13.31).

= 1.5.0 =
* Add an “or Ask FIDES” button beside credential search when FIDES Assistant
  0.6.1 or newer is active.

= 1.4.1 =
* Preserve the published credential slug when submitting an update.

= 1.4.0 =
* ARF TS11 alignment: credential modal and SSR show resolved trust registries (trustedAuthorities[]), level of assurance and holder binding when known.
* Add Trust Scheme Catalog Base URL for ?scheme= deep links; on .local sites /trust-schemes/ is used.
* Add logged-in create and update forms for moderated credential catalog submissions.
* Data: aggregated.json schemaVersion 2.0.0 with attestationTypes[] projection.

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
