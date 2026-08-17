<?php
/**
 * Public credential create and update forms.
 *
 * @package fides-credential-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Credential_Catalog_Submission_Forms')) {
    class Fides_Credential_Catalog_Submission_Forms {
        const VERSION = '1.4.0';

        public static function bootstrap(): void {
            add_action('wp_enqueue_scripts', array(__CLASS__, 'register_assets'));
            add_shortcode('fides_credential_submit_form', array(__CLASS__, 'render_submit_shortcode'));
            add_shortcode('fides_credential_update_form', array(__CLASS__, 'render_update_shortcode'));
        }

        public static function register_assets(): void {
            $base = plugin_dir_path(dirname(__FILE__));
            $url  = plugin_dir_url(dirname(__FILE__));
            $css  = $base . 'assets/credential-form.css';
            $js   = $base . 'assets/credential-form.js';
            wp_register_style('fides-credential-form', $url . 'assets/credential-form.css', array(), file_exists($css) ? (string) filemtime($css) : self::VERSION);
            wp_register_script('fides-credential-form', $url . 'assets/credential-form.js', array(), file_exists($js) ? (string) filemtime($js) : self::VERSION, true);
        }

        public static function render_submit_shortcode($atts = array()): string {
            unset($atts);
            return self::render_form('create');
        }

        public static function render_update_shortcode($atts = array()): string {
            $atts = shortcode_atts(array('credential' => ''), $atts, 'fides_credential_update_form');
            $credential = self::normalize_credential_id((string) $atts['credential']);
            if ($credential === '' && isset($_GET['credential'])) {
                // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $credential = self::normalize_credential_id((string) wp_unslash($_GET['credential']));
            }
            return self::render_form('update', array('preselectCredentialId' => $credential));
        }

        /**
         * @param string               $mode create|update.
         * @param array<string, mixed> $extra Additional client config.
         */
        private static function render_form($mode, array $extra = array()): string {
            if (! class_exists('Fides_Catalog_Submission_Registry')
                || ! Fides_Catalog_Submission_Registry::exists('credential')) {
                return '<div class="fides-use-case-card"><p>' . esc_html__(
                    'Credential submissions are unavailable (missing submission core or adapter).',
                    'fides-credential-catalog'
                ) . '</p></div>';
            }
            if (! is_user_logged_in()) {
                wp_enqueue_style('fides-credential-form');
                return sprintf(
                    '<div class="fides-use-case-card"><p>%s</p><p><a class="fides-credential-form-login-link" href="%s">%s</a></p></div>',
                    esc_html__('You must be signed in to submit credential catalog changes.', 'fides-credential-catalog'),
                    esc_url(self::form_login_url()),
                    esc_html__('Sign in to continue', 'fides-credential-catalog')
                );
            }
            $preselect = (string) ($extra['preselectCredentialId'] ?? '');
            if ($mode === 'update' && $preselect !== '' && class_exists('Fides_Catalog_Org_Tier')) {
                $item = class_exists('Fides_Catalog_Submission_Lookups')
                    ? Fides_Catalog_Submission_Lookups::find_item_by_id('credential', $preselect)
                    : null;
                if (! Fides_Catalog_Org_Tier::user_can_edit_item(
                    'credential',
                    $preselect,
                    get_current_user_id(),
                    is_array($item) ? $item : null
                )) {
                    wp_enqueue_style('fides-credential-form');
                    return '<div class="fides-use-case-card"><p>' . esc_html__(
                        'This credential can only be updated by a linked organization owner.',
                        'fides-credential-catalog'
                    ) . '</p></div>';
                }
            }

            wp_enqueue_style('fides-credential-form');
            wp_enqueue_script('fides-credential-form');
            $user = wp_get_current_user();
            $config = array_merge(
                array(
                    'mode'                      => $mode === 'update' ? 'update' : 'create',
                    'apiBase'                   => esc_url_raw(rest_url('fides-catalog/v1')),
                    'restNonce'                 => wp_create_nonce('wp_rest'),
                    'contactEmail'              => sanitize_email((string) $user->user_email),
                    'preselectCredentialId'     => '',
                    'subjectTypes'              => Fides_Credential_Catalog_Submission_Adapter::SUBJECT_TYPES,
                    'vcFormats'                 => Fides_Credential_Catalog_Submission_Adapter::VC_FORMATS,
                    'nativeIdentifierTypes'     => Fides_Credential_Catalog_Submission_Adapter::NATIVE_IDENTIFIER_TYPES,
                    'schemaTypes'               => Fides_Credential_Catalog_Submission_Adapter::SCHEMA_TYPES,
                    'sectors'                   => Fides_Credential_Catalog_Submission_Adapter::SECTORS,
                    'ecosystems'                => Fides_Credential_Catalog_Submission_Adapter::ECOSYSTEMS,
                    'themes'                    => Fides_Credential_Catalog_Submission_Adapter::THEMES,
                    'categories'                => Fides_Credential_Catalog_Submission_Adapter::CATEGORIES,
                ),
                $extra
            );
            wp_add_inline_script(
                'fides-credential-form',
                'window.FIDES_CREDENTIAL_FORM_CONFIG = ' . wp_json_encode($config) . ';',
                'before'
            );
            $id = $mode === 'update' ? 'fides-credential-update-form-root' : 'fides-credential-submit-form-root';
            return '<div id="' . esc_attr($id) . '" class="fides-credential-submission-root"></div>';
        }

        public static function form_login_url(): string {
            $uri  = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
            $host = isset($_SERVER['HTTP_HOST']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_HOST'])) : '';
            $current = $host !== '' ? ((is_ssl() ? 'https://' : 'http://') . $host . $uri) : home_url('/');
            $options = get_option('universal_openid4vp_options', array());
            if (is_array($options) && ! empty($options['loginUrl'])) {
                return esc_url_raw(add_query_arg('return_to', $current, (string) $options['loginUrl']));
            }
            return wp_login_url($current);
        }

        private static function normalize_credential_id($raw): string {
            $id = sanitize_text_field(trim((string) $raw));
            return $id !== '' && preg_match(Fides_Credential_Catalog_Submission_Adapter::ID_PATTERN, $id) ? $id : '';
        }
    }
}
