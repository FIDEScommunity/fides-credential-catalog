<?php
/**
 * Plugin Name: FIDES Credential Catalog
 * Plugin URI: https://github.com/FIDEScommunity/fides-credential-catalog
 * Description: Display an interactive catalog of credentials with search and filters.
 * Version: 0.1.0
 * Author: FIDES Community
 * Author URI: https://fides.community
 * License: Apache-2.0
 * Text Domain: fides-credential-catalog
 */

if (!defined('ABSPATH')) {
    exit;
}

define('FIDES_CREDENTIAL_CATALOG_VERSION', '0.1.0');
define('FIDES_CREDENTIAL_CATALOG_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FIDES_CREDENTIAL_CATALOG_PLUGIN_URL', plugin_dir_url(__FILE__));

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

    wp_localize_script('fides-credential-catalog-script', 'fidesCredentialCatalog', array(
        'pluginUrl' => FIDES_CREDENTIAL_CATALOG_PLUGIN_URL,
        'githubDataUrl' => 'https://raw.githubusercontent.com/FIDEScommunity/fides-credential-catalog/main/data/aggregated.json',
        'rpAggregatedUrl' => get_option(
            'fides_credential_catalog_rp_data_url',
            'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/data/aggregated.json'
        ),
        'rpCatalogUrl' => get_option('fides_credential_catalog_rp_catalog_url', 'https://fides.community/community-tools/relying-party-catalog/')
    ));
}
add_action('wp_enqueue_scripts', 'fides_credential_catalog_enqueue_assets');

function fides_credential_catalog_shortcode($atts) {
    $atts = shortcode_atts(array(
        'show_filters' => 'true',
        'show_search' => 'true',
        'columns' => '3',
        'theme' => 'fides'
    ), $atts, 'fides_credential_catalog');

    $show_filters = $atts['show_filters'] === 'true' ? 'true' : 'false';
    $show_search = $atts['show_search'] === 'true' ? 'true' : 'false';
    $columns = in_array($atts['columns'], array('2', '3', '4')) ? $atts['columns'] : '3';
    $theme = in_array($atts['theme'], array('dark', 'light', 'fides')) ? $atts['theme'] : 'fides';

    $html = sprintf(
        '<div id="fides-credential-catalog-root" class="fides-credential-catalog" data-show-filters="%s" data-show-search="%s" data-columns="%s" data-theme="%s">',
        esc_attr($show_filters),
        esc_attr($show_search),
        esc_attr($columns),
        esc_attr($theme)
    );
    $html .= '<div class="fides-loading">Loading credentials...</div>';
    $html .= '</div>';

    return $html;
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
            </table>
            <?php submit_button(); ?>
        </form>

        <hr>
        <h2>Shortcode</h2>
        <code>[fides_credential_catalog]</code>
        <p>Optional attributes: <code>show_filters</code>, <code>show_search</code>, <code>columns</code>, <code>theme</code>.</p>
    </div>
    <?php
}
