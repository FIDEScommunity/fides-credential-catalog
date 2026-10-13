<?php
/**
 * Credential Catalog SSR — credential-specific subclass of the shared
 * Fides_Catalog_SSR_Renderer base class shipped by fides-community-tools-tiles.
 *
 * Catalog-specific responsibilities living here:
 *   - Register the 'credential' catalog type in Fides_Catalog_Registry, with
 *     the field-name overrides for the credential aggregated.json shape
 *     (`displayName`, no logo field — credentials don't have one).
 *   - Build a synthetic description (combining schema + format + version)
 *     because the upstream JSON has no top-level `description` field.
 *   - Override the listing page URL so CollectionPage JSON-LD points to the
 *     correct canonical URL.
 *   - Build dl meta rows + chip sections for the SSR detail block (authority,
 *     subject type, vc format, version, sectors, ecosystems, themes, tags).
 *   - Enrich the DigitalDocument JSON-LD with credential specifics.
 *
 * Backwards compat: when the shared base class isn't loaded (e.g. tiles
 * plugin disabled), this class is a no-op shim.
 *
 * @package fides-credential-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Credential_Catalog_SSR')) {

    if (! class_exists('Fides_Catalog_SSR_Renderer')) {

        class Fides_Credential_Catalog_SSR {
            const TYPE                 = 'credential';
            const DEFAULT_CATALOG_PATH = '/ecosystem-explorer/credential-catalog/';
            const OPTION_CATALOG_URL   = 'fides_credential_catalog_page_url';
            const MAX_LISTING_ITEMS    = 30;
            public static function bootstrap() { /* no-op without base */ }
            public static function build_initial_html(array $atts) { return ''; }
        }

    } else {

        class Fides_Credential_Catalog_SSR extends Fides_Catalog_SSR_Renderer {

            const TYPE                 = 'credential';
            const DEFAULT_CATALOG_PATH = '/ecosystem-explorer/credential-catalog/';
            const OPTION_CATALOG_URL   = 'fides_credential_catalog_page_url';
            const MAX_LISTING_ITEMS    = 30;

            /** Shared with the front-end script config, see the main plugin file. */
            const OPTION_TRUST_SCHEME_URL  = 'fides_credential_catalog_trust_scheme_catalog_url';
            const DEFAULT_TRUST_SCHEME_URL = 'https://fides.community/ecosystem-explorer/trust-scheme-catalog/';

            /** @var self|null */
            private static $instance = null;

            public static function bootstrap(): void {
                if (self::$instance === null) {
                    self::$instance = new self();
                    self::$instance->bootstrap_renderer();
                    add_action('admin_init', array(__CLASS__, 'register_settings'));
                }
            }

            public static function build_initial_html(array $atts): string {
                self::bootstrap();
                return self::$instance->render_initial_html($atts);
            }

            /* --------------------------------------------------------------
             * Required overrides
             * -------------------------------------------------------------- */

            protected function type(): string             { return self::TYPE; }
            protected function text_domain(): string      { return 'fides-credential-catalog'; }
            protected function shortcode_root_id(): string { return 'fides-credential-catalog-root'; }
            protected function loading_label(): string    { return __('Loading credential catalog…', 'fides-credential-catalog'); }
            protected function max_listing_items(): int   { return self::MAX_LISTING_ITEMS; }
            /**
             * Keep the listing shell (hidden SSR + spinner) on ?credential= deep links.
             * Visible standalone detail flashed before JS mounts the modal; SEO still
             * gets detail HTML in the hidden SSR block + noscript reveal.
             */
            protected function supports_standalone_detail_page(): bool { return false; }

            public function register_with_core(): void {
                if (! class_exists('Fides_Catalog_Registry')) {
                    return;
                }
                Fides_Catalog_Registry::register(self::TYPE, array(
                    'label'             => __('Credentials', 'fides-credential-catalog'),
                    'json_url'          => 'https://raw.githubusercontent.com/FIDEScommunity/fides-credential-catalog/main/data/aggregated.json',
                    'local_json_path'   => dirname(__DIR__) . '/data/aggregated.json',
                    'collection_key'    => 'credentials',
                    'id_field'          => 'id',
                    'name_field'        => 'displayName',
                    'description_field' => 'shortDescription',
                    'logo_field'        => null,
                    'detail_param'      => 'credential',
                    'pages'             => array(
                        'main' => self::catalog_path(),
                    ),
                    'jsonld_type'       => 'DigitalDocument',
                ));
            }

            /**
             * Prefer authored shortDescription; fall back to schemaDescription
             * from the primary schema file (legacy EUDI generated copy).
             */
            protected function item_description(array $item): string {
                foreach (array('shortDescription', 'schemaDescription', 'description') as $field) {
                    if (! empty($item[$field]) && is_string($item[$field])) {
                        return (string) $item[$field];
                    }
                }
                return '';
            }

            /* --------------------------------------------------------------
             * Settings (admin path for the credential landing page)
             * -------------------------------------------------------------- */

            public static function register_settings(): void {
                register_setting('fides_credential_catalog_settings', self::OPTION_CATALOG_URL, array(
                    'type'              => 'string',
                    'default'           => self::DEFAULT_CATALOG_PATH,
                    'sanitize_callback' => array(__CLASS__, 'sanitize_path'),
                ));
            }

            public static function sanitize_path($value): string {
                $value = is_string($value) ? trim($value) : '';
                if ($value === '') {
                    return '';
                }
                $path = wp_parse_url($value, PHP_URL_PATH);
                if (! is_string($path) || $path === '') {
                    return '';
                }
                if ($path[0] !== '/') {
                    $path = '/' . $path;
                }
                return user_trailingslashit($path);
            }

            /* --------------------------------------------------------------
             * Listing page name + URL for CollectionPage JSON-LD
             * -------------------------------------------------------------- */

            protected function listing_page_name(string $page_slug): string {
                return __('Credential Catalog', 'fides-credential-catalog');
            }

            protected function listing_page_url(string $page_slug): string {
                return home_url(self::catalog_path());
            }

            /* --------------------------------------------------------------
             * JSON-LD enrichment for the DigitalDocument payload
             * -------------------------------------------------------------- */

            protected function enrich_jsonld(array $jsonld, array $item): array {
                $authority = (isset($item['authority']) && is_array($item['authority'])) ? $item['authority'] : array();
                if (! empty($authority['name'])) {
                    $publisher = array('@type' => 'Organization', 'name' => (string) $authority['name']);
                    if (! empty($authority['url'])) {
                        $publisher['url'] = (string) $authority['url'];
                    }
                    $jsonld['publisher'] = $publisher;
                }

                if (! empty($item['vcFormat'])) {
                    $jsonld['encodingFormat'] = (string) $item['vcFormat'];
                }
                if (! empty($item['subjectType'])) {
                    $jsonld['about'] = (string) $item['subjectType'];
                }
                if (! empty($item['version'])) {
                    $jsonld['version'] = (string) $item['version'];
                }
                if (! empty($item['nativeIdentifier'])) {
                    $jsonld['identifier'] = (string) $item['nativeIdentifier'];
                }
                if (! empty($item['schemaUrl'])) {
                    $jsonld['url'] = (string) $item['schemaUrl'];
                    $jsonld['sameAs'] = isset($jsonld['sameAs']) ? (array) $jsonld['sameAs'] : array();
                    $jsonld['sameAs'][] = (string) $item['schemaUrl'];
                    $jsonld['sameAs']   = array_values(array_unique($jsonld['sameAs']));
                }

                $keywords = array_unique(array_merge(
                    $this->list_field($item, 'tags'),
                    $this->list_field($item, 'sectors'),
                    $this->list_field($item, 'ecosystems'),
                    $this->list_field($item, 'themes')
                ));
                if (! empty($keywords)) {
                    $jsonld['keywords'] = implode(', ', $keywords);
                }

                if (! empty($item['updatedAt']) && is_string($item['updatedAt'])) {
                    $ts = strtotime($item['updatedAt']);
                    if ($ts) {
                        $jsonld['dateModified'] = gmdate('Y-m-d', $ts);
                    }
                }

                return $jsonld;
            }

            /* --------------------------------------------------------------
             * Detail block content (meta rows + chip sections)
             * -------------------------------------------------------------- */

            protected function detail_meta_rows(array $item): array {
                $rows      = array();
                $authority = (isset($item['authority']) && is_array($item['authority'])) ? $item['authority'] : array();
                $td        = 'fides-credential-catalog';

                if (! empty($authority['name'])) {
                    $rows[] = array(
                        'label' => __('Authority', $td),
                        'html'  => esc_html((string) $authority['name']),
                    );
                }
                if (! empty($item['subjectType'])) {
                    $rows[] = array(
                        'label' => __('Subject type', $td),
                        'html'  => esc_html((string) $item['subjectType']),
                    );
                }
                if (! empty($item['vcFormat'])) {
                    $rows[] = array(
                        'label' => __('VC format', $td),
                        'html'  => '<code>' . esc_html((string) $item['vcFormat']) . '</code>',
                    );
                }
                if (! empty($item['version'])) {
                    $rows[] = array(
                        'label' => __('Version', $td),
                        'html'  => esc_html((string) $item['version']),
                    );
                }
                if (! empty($item['nativeIdentifier'])) {
                    $rows[] = array(
                        'label' => __('Native identifier', $td),
                        'html'  => '<code>' . esc_html((string) $item['nativeIdentifier']) . '</code>',
                    );
                }
                if (! empty($item['schemaUrl'])) {
                    $rows[] = array(
                        'label' => __('Schema URL', $td),
                        'html'  => sprintf(
                            '<a href="%1$s" rel="nofollow noopener" target="_blank">%2$s</a>',
                            esc_url((string) $item['schemaUrl']),
                            esc_html((string) $item['schemaUrl'])
                        ),
                    );
                }
                if (! empty($item['attestationLoS'])) {
                    $rows[] = array(
                        'label' => __('Attestation LoS', $td),
                        'html'  => '<code>' . esc_html((string) $item['attestationLoS']) . '</code>',
                    );
                }
                if (! empty($item['bindingType'])) {
                    $rows[] = array(
                        'label' => __('Holder binding', $td),
                        'html'  => '<code>' . esc_html((string) $item['bindingType']) . '</code>',
                    );
                }
                if (! empty($item['rulebookUrl'])) {
                    $rows[] = array(
                        'label' => __('Rulebook', $td),
                        'html'  => sprintf(
                            '<a href="%1$s" rel="nofollow noopener" target="_blank">%2$s</a>',
                            esc_url((string) $item['rulebookUrl']),
                            esc_html__('View rulebook', $td)
                        ),
                    );
                }
                $has_ts11_format = ! empty($item['vcFormat']) || ( ! empty($item['formats']) && is_array($item['formats']) );
                $has_ts11_schema = ! empty($item['schemaUrl'])
                    || ( ! empty($item['schemaURIs']) && is_array($item['schemaURIs']) );
                if (
                    ! empty($item['attestationLoS'])
                    && ! empty($item['bindingType'])
                    && ! empty($item['rulebookUrl'])
                    && $has_ts11_format
                    && $has_ts11_schema
                ) {
                    $rows[] = array(
                        'label' => __('Catalogue conformance', $td),
                        'html'  => '<span class="fides-tag fides-tag-ts11" title="' . esc_attr__('Has the required ARF TS11 SchemaMeta fields for a catalogue-of-attestations entry.', $td) . '">TS11</span>',
                    );
                }
                if (! empty($item['updatedAt']) && is_string($item['updatedAt'])) {
                    $ts = strtotime($item['updatedAt']);
                    if ($ts) {
                        $rows[] = array(
                            'label' => __('Last updated', $td),
                            'html'  => sprintf(
                                '<time datetime="%1$s">%1$s</time>',
                                esc_attr(gmdate('Y-m-d', $ts))
                            ),
                        );
                    }
                }
                return $rows;
            }

            protected function detail_extra_sections(array $item): string {
                $td = 'fides-credential-catalog';
                ob_start();
                echo $this->render_chip_section($this->list_field($item, 'tags'),       __('Tags', $td));
                echo $this->render_chip_section($this->list_field($item, 'sectors'),    __('Sectors', $td));
                echo $this->render_chip_section($this->list_field($item, 'themes'),     __('Themes', $td));
                echo $this->render_chip_section($this->list_field($item, 'ecosystems'), __('Ecosystems', $td));
                echo $this->render_trust_registry_section($item);
                echo $this->render_attribute_section($item);
                return (string) ob_get_clean();
            }

            /**
             * Trust registries a verifier can use to establish that an issuer of
             * this credential is authorised (ARF TS11 trustedAuthorities). Resolved
             * by the crawler against fides-trust-scheme-catalog, so name, scheme and
             * access level are already present in the aggregated data.
             */
            protected function render_trust_registry_section(array $item): string {
                if (empty($item['resolvedTrustedAuthorities']) || ! is_array($item['resolvedTrustedAuthorities'])) {
                    return '';
                }
                $td            = 'fides-credential-catalog';
                $scheme_base   = rtrim((string) get_option(self::OPTION_TRUST_SCHEME_URL, self::DEFAULT_TRUST_SCHEME_URL), '/');
                ob_start();
                ?>
                <section class="fides-ssr-detail__section">
                    <h2 class="fides-ssr-detail__section-title"><?php esc_html_e('Trust registries', $td); ?></h2>
                    <ul class="fides-ssr-detail__registries">
                        <?php foreach ($item['resolvedTrustedAuthorities'] as $authority) :
                            if (! is_array($authority)) {
                                continue;
                            }
                            $registry_name = isset($authority['registryName']) ? (string) $authority['registryName'] : '';
                            $registry_id   = isset($authority['registryId']) ? (string) $authority['registryId'] : '';
                            $label         = $registry_name !== '' ? $registry_name : $registry_id;
                            if ($label === '') {
                                continue;
                            }
                            $registry_url = isset($authority['registryUrl']) ? (string) $authority['registryUrl'] : '';
                            $scheme_id    = isset($authority['schemeId']) ? (string) $authority['schemeId'] : '';
                            $scheme_name  = isset($authority['schemeName']) ? (string) $authority['schemeName'] : $scheme_id;
                            $scheme_url   = ($scheme_base !== '' && $scheme_id !== '')
                                ? $scheme_base . '/?scheme=' . rawurlencode($scheme_id)
                                : '';
                            $access       = isset($authority['access']) ? (string) $authority['access'] : '';
                            ?>
                            <li>
                                <?php if ($registry_url !== '') : ?>
                                    <a href="<?php echo esc_url($registry_url); ?>" rel="nofollow noopener" target="_blank"><?php echo esc_html($label); ?></a>
                                <?php else : ?>
                                    <strong><?php echo esc_html($label); ?></strong>
                                <?php endif; ?>
                                <?php if ($scheme_name !== '') : ?>
                                    —
                                    <?php if ($scheme_url !== '') : ?>
                                        <a href="<?php echo esc_url($scheme_url); ?>"><?php echo esc_html($scheme_name); ?></a>
                                    <?php else : ?>
                                        <?php echo esc_html($scheme_name); ?>
                                    <?php endif; ?>
                                <?php endif; ?>
                                <?php if (! empty($authority['machineReadable'])) : ?>
                                    <em>(<?php esc_html_e('machine-readable', $td); ?>)</em>
                                <?php endif; ?>
                                <?php if ($access !== '' && $access !== 'public') : ?>
                                    <em>(<?php echo esc_html(str_replace('_', ' ', $access)); ?>)</em>
                                <?php endif; ?>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </section>
                <?php
                return (string) ob_get_clean();
            }

            /**
             * Render the credential's `attributes` definition list (name, type,
             * required flag, optional description). Crawl-friendly because every
             * field appears as plain text in the rendered HTML.
             */
            protected function render_attribute_section(array $item): string {
                if (empty($item['attributes']) || ! is_array($item['attributes'])) {
                    return '';
                }
                $td = 'fides-credential-catalog';
                ob_start();
                ?>
                <section class="fides-ssr-detail__section">
                    <h2 class="fides-ssr-detail__section-title"><?php esc_html_e('Attributes', $td); ?></h2>
                    <ul class="fides-ssr-detail__attributes">
                        <?php foreach ($item['attributes'] as $attr) :
                            if (! is_array($attr) || empty($attr['name'])) {
                                continue;
                            }
                            $attr_name        = (string) $attr['name'];
                            $attr_type        = isset($attr['type']) ? (string) $attr['type'] : '';
                            $attr_description = isset($attr['description']) ? (string) $attr['description'] : '';
                            $attr_required    = ! empty($attr['required']);
                            ?>
                            <li>
                                <strong><?php echo esc_html($attr_name); ?></strong>
                                <?php if ($attr_type !== '') : ?>
                                    <code><?php echo esc_html($attr_type); ?></code>
                                <?php endif; ?>
                                <?php if ($attr_required) : ?>
                                    <em>(<?php esc_html_e('required', $td); ?>)</em>
                                <?php endif; ?>
                                <?php if ($attr_description !== '') : ?>
                                    — <?php echo esc_html($attr_description); ?>
                                <?php endif; ?>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </section>
                <?php
                return (string) ob_get_clean();
            }

            /* --------------------------------------------------------------
             * Helpers
             * -------------------------------------------------------------- */

            private static function catalog_path(): string {
                $opt = (string) get_option(self::OPTION_CATALOG_URL, '');
                return $opt !== '' ? $opt : self::DEFAULT_CATALOG_PATH;
            }
        }
    }
}
