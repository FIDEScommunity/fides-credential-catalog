<?php
/**
 * Plugin Name: FIDES Credential Catalog
 * Plugin URI: https://github.com/FIDEScommunity/fides-credential-catalog
 * Description: Display an interactive catalog of credentials with search and filters. When the master fides_catalog_ssr_enabled flag (provided by FIDES Community Tools Tiles ≥ 1.6.3) is enabled, the plugin also emits a server-rendered listing fallback, per-deeplink SEO meta tags and a DigitalDocument JSON-LD payload so credential detail URLs become indexable by search engines.
 * Version: 1.3.6
 * Author: FIDES Community
 * Author URI: https://fides.community
 * License: Apache-2.0
 * Text Domain: fides-credential-catalog
 */

if (!defined('ABSPATH')) {
    exit;
}

define('FIDES_CREDENTIAL_CATALOG_VERSION', '1.3.6');
define('FIDES_CREDENTIAL_CATALOG_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FIDES_CREDENTIAL_CATALOG_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once FIDES_CREDENTIAL_CATALOG_PLUGIN_DIR . 'includes/class-fides-credential-catalog-ssr.php';
Fides_Credential_Catalog_SSR::bootstrap();

/**
 * Detect if the site is running on a .local or localhost URL (local dev).
 * When true, the plugin uses bundled data/aggregated.json and data/issuer-aggregated.json.
 */
function fides_credential_catalog_is_local_site() {
    $host = '';
    if (function_exists('get_site_url')) {
        $url = get_site_url();
        if (is_string($url)) {
            $parsed = parse_url($url);
            $host = isset($parsed['host']) ? $parsed['host'] : '';
        }
    }
    if ($host === '' && !empty($_SERVER['HTTP_HOST'])) {
        $host = (string) $_SERVER['HTTP_HOST'];
    }
    $host = strtolower(trim($host));
    return ($host !== '' && (preg_match('/\.local$/i', $host) || $host === 'localhost'));
}

function fides_credential_catalog_enqueue_assets() {
    $style_path = FIDES_CREDENTIAL_CATALOG_PLUGIN_DIR . 'assets/style.css';
    $script_path = FIDES_CREDENTIAL_CATALOG_PLUGIN_DIR . 'assets/credential-catalog.js';
    $style_version = file_exists($style_path) ? filemtime($style_path) : FIDES_CREDENTIAL_CATALOG_VERSION;
    $script_version = file_exists($script_path) ? filemtime($script_path) : FIDES_CREDENTIAL_CATALOG_VERSION;

    wp_enqueue_style(
        'fides-credential-catalog-style',
        FIDES_CREDENTIAL_CATALOG_PLUGIN_URL . 'assets/style.css',
        array(),
        $style_version
    );

    wp_enqueue_script(
        'fides-credential-catalog-script',
        FIDES_CREDENTIAL_CATALOG_PLUGIN_URL . 'assets/credential-catalog.js',
        array(),
        $script_version,
        true
    );

    $plugin_url = FIDES_CREDENTIAL_CATALOG_PLUGIN_URL;
    $use_local = fides_credential_catalog_is_local_site();

    $credential_data_url = $use_local
        ? $plugin_url . 'data/aggregated.json'
        : 'https://raw.githubusercontent.com/FIDEScommunity/fides-credential-catalog/main/data/aggregated.json';
    $issuer_data_url = $use_local
        ? $plugin_url . 'data/issuer-aggregated.json'
        : get_option(
            'fides_credential_catalog_issuer_data_url',
            'https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json'
        );
    $rp_data_url = $use_local
        ? $plugin_url . 'data/rp-aggregated.json'
        : get_option(
            'fides_credential_catalog_rp_data_url',
            'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/data/aggregated.json'
        );
    $wallet_catalog_url = $use_local
        ? rtrim(get_site_url(), '/') . '/community-tools/personal-wallets/'
        : get_option('fides_credential_catalog_wallet_catalog_url', 'https://fides.community/community-tools/personal-wallets/');

    wp_localize_script('fides-credential-catalog-script', 'fidesCredentialCatalog', array(
        'pluginUrl' => $plugin_url,
        'githubDataUrl' => $credential_data_url,
        'rpAggregatedUrl' => $rp_data_url,
        'rpCatalogUrl' => get_option('fides_credential_catalog_rp_catalog_url', 'https://fides.community/community-tools/relying-party-catalog/'),
        'issuerAggregatedUrl' => $issuer_data_url,
        'issuerCatalogUrl' => get_option(
            'fides_credential_catalog_issuer_catalog_url',
            'https://fides.community/ecosystem-explorer/issuer-catalog/'
        ),
        'walletCatalogUrl' => $wallet_catalog_url,
        'organizationCatalogUrl' => $use_local
            ? rtrim(get_site_url(), '/') . '/organizations/'
            : get_option(
                'fides_credential_catalog_organization_catalog_url',
                'https://fides.community/ecosystem-explorer/organization-catalog/'
            ),
        'vocabularyUrl' => 'https://raw.githubusercontent.com/FIDEScommunity/fides-interop-profiles/main/data/vocabulary.json',
        'vocabularyFallbackUrl' => $plugin_url . 'assets/vocabulary.json',
    ));
}
add_action('wp_enqueue_scripts', 'fides_credential_catalog_enqueue_assets');

/**
 * Register catalog deep-link query vars (helps SEO plugins and canonical URL handling).
 *
 * @param string[] $vars Public query variables.
 * @return string[]
 */
function fides_credential_catalog_query_vars($vars) {
    foreach (array('theme', 'sector', 'credential', 'credentials') as $q) {
        $vars[] = $q;
    }
    return $vars;
}
add_filter('query_vars', 'fides_credential_catalog_query_vars');

/**
 * Avoid redirect_canonical dropping FIDES catalog deep-link parameters (empty search in JS).
 *
 * @param string|false $redirect_url Computed canonical URL, or false.
 * @return string|false
 */
function fides_credential_catalog_preserve_redirect_canonical($redirect_url) {
    $keys = array('theme', 'credential', 'credentials');
    foreach ($keys as $key) {
        if (isset($_GET[$key]) && (string) $_GET[$key] !== '') {
            return false;
        }
    }
    return $redirect_url;
}
add_filter('redirect_canonical', 'fides_credential_catalog_preserve_redirect_canonical', 10, 1);

function fides_credential_catalog_shortcode($atts) {
    $atts = shortcode_atts(array(
        'show_filters' => 'true',
        'show_search' => 'true',
        'columns' => '3',
        'theme' => 'fides',
        'sector' => '',
        'taxonomy_theme' => '',
    ), $atts, 'fides_credential_catalog');

    $show_filters = $atts['show_filters'] === 'true' ? 'true' : 'false';
    $show_search = $atts['show_search'] === 'true' ? 'true' : 'false';
    $columns = in_array($atts['columns'], array('2', '3', '4')) ? $atts['columns'] : '3';
    $theme = in_array($atts['theme'], array('dark', 'light', 'fides')) ? $atts['theme'] : 'fides';
    $sector = sanitize_text_field((string) $atts['sector']);
    $taxonomy_theme = sanitize_text_field((string) $atts['taxonomy_theme']);

    $initial_html = '';
    if (class_exists('Fides_Credential_Catalog_SSR')) {
        $initial_html = Fides_Credential_Catalog_SSR::build_initial_html(array(
            'show_filters'   => $show_filters,
            'show_search'    => $show_search,
            'columns'        => $columns,
            'theme'          => $theme,
            'sector'         => $sector,
            'taxonomy_theme' => $taxonomy_theme,
        ));
    }
    if ($initial_html === '') {
        $initial_html = '<div class="fides-loading">Loading credentials...</div>';
    }

    return sprintf(
        '<div id="fides-credential-catalog-root" class="fides-credential-catalog" data-show-filters="%s" data-show-search="%s" data-columns="%s" data-theme="%s" data-sector="%s" data-taxonomy-theme="%s">%s</div>',
        esc_attr($show_filters),
        esc_attr($show_search),
        esc_attr($columns),
        esc_attr($theme),
        esc_attr($sector),
        esc_attr($taxonomy_theme),
        $initial_html
    );
}
add_shortcode('fides_credential_catalog', 'fides_credential_catalog_shortcode');

function fides_credential_catalog_admin_menu() {
    add_options_page(
        'FIDES Credential Catalog',
        'FIDES Credential Catalog',
        'manage_options',
        'fides-credential-catalog',
        'fides_credential_catalog_settings_page'
    );
}
add_action('admin_menu', 'fides_credential_catalog_admin_menu');

function fides_credential_catalog_register_settings() {
    register_setting('fides_credential_catalog_settings', 'fides_credential_catalog_rp_data_url', array(
        'type' => 'string',
        'default' => 'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/data/aggregated.json',
        'sanitize_callback' => 'esc_url_raw'
    ));

    register_setting('fides_credential_catalog_settings', 'fides_credential_catalog_rp_catalog_url', array(
        'type' => 'string',
        'default' => 'https://fides.community/community-tools/relying-party-catalog/',
        'sanitize_callback' => 'esc_url_raw'
    ));

    register_setting('fides_credential_catalog_settings', 'fides_credential_catalog_issuer_catalog_url', array(
        'type' => 'string',
        'default' => 'https://fides.community/ecosystem-explorer/issuer-catalog/',
        'sanitize_callback' => 'esc_url_raw'
    ));

    register_setting('fides_credential_catalog_settings', 'fides_credential_catalog_wallet_catalog_url', array(
        'type' => 'string',
        'default' => 'https://wallets.fides.community',
        'sanitize_callback' => 'esc_url_raw'
    ));

    register_setting('fides_credential_catalog_settings', 'fides_credential_catalog_organization_catalog_url', array(
        'type' => 'string',
        'default' => 'https://fides.community/ecosystem-explorer/organization-catalog/',
        'sanitize_callback' => 'esc_url_raw'
    ));
}
add_action('admin_init', 'fides_credential_catalog_register_settings');

function fides_credential_catalog_settings_page() {
    ?>
    <div class="wrap">
        <h1>FIDES Credential Catalog</h1>

        <form method="post" action="options.php">
            <?php settings_fields('fides_credential_catalog_settings'); ?>
            <h2>Settings</h2>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="fides_credential_catalog_rp_data_url">RP Aggregated Data URL</label></th>
                    <td>
                        <input type="url" id="fides_credential_catalog_rp_data_url" name="fides_credential_catalog_rp_data_url"
                               value="<?php echo esc_attr(get_option('fides_credential_catalog_rp_data_url', 'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/data/aggregated.json')); ?>"
                               class="regular-text">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_credential_catalog_rp_catalog_url">RP Catalog Base URL</label></th>
                    <td>
                        <input type="url" id="fides_credential_catalog_rp_catalog_url" name="fides_credential_catalog_rp_catalog_url"
                               value="<?php echo esc_attr(get_option('fides_credential_catalog_rp_catalog_url', 'https://fides.community/community-tools/relying-party-catalog/')); ?>"
                               class="regular-text">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_credential_catalog_issuer_catalog_url">Issuer Catalog Base URL</label></th>
                    <td>
                        <input type="url" id="fides_credential_catalog_issuer_catalog_url" name="fides_credential_catalog_issuer_catalog_url"
                               value="<?php echo esc_attr(get_option('fides_credential_catalog_issuer_catalog_url', 'https://fides.community/ecosystem-explorer/issuer-catalog/')); ?>"
                               class="regular-text">
                        <p class="description">Base URL for issuer catalog deep links in the credential modal (e.g. issuer names and “Open in catalog”).</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_credential_catalog_wallet_catalog_url">Wallet Catalog Base URL</label></th>
                    <td>
                        <input type="url" id="fides_credential_catalog_wallet_catalog_url" name="fides_credential_catalog_wallet_catalog_url"
                               value="<?php echo esc_attr(get_option('fides_credential_catalog_wallet_catalog_url', 'https://fides.community/community-tools/personal-wallets/')); ?>"
                               class="regular-text">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_credential_catalog_organization_catalog_url">Organization Catalog Base URL</label></th>
                    <td>
                        <input type="url" id="fides_credential_catalog_organization_catalog_url" name="fides_credential_catalog_organization_catalog_url"
                               value="<?php echo esc_attr(get_option('fides_credential_catalog_organization_catalog_url', 'https://fides.community/ecosystem-explorer/organization-catalog/')); ?>"
                               class="regular-text">
                        <p class="description">Base URL for organization deep links in the credential modal (query <code>?org=</code> is appended). On local <code>.local</code> / <code>localhost</code> sites this setting is ignored; the plugin uses <code>/organizations/</code> on the same site instead.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>

        <hr>
        <h2>Shortcode</h2>
        <code>[fides_credential_catalog]</code>
        <p>Optional attributes: <code>show_filters</code>, <code>show_search</code>, <code>columns</code>, <code>theme</code> (UI color), <code>sector</code>, <code>taxonomy_theme</code> (preset taxonomy filter; URL uses <code>?theme=</code>).</p>
    </div>
    <?php
}
