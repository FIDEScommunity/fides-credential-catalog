<?php
/**
 * Registers the credential catalog with the shared submission core.
 *
 * @package fides-credential-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Credential_Catalog_Submission_Adapter')) {
    class Fides_Credential_Catalog_Submission_Adapter {
        const TYPE = 'credential';
        const SCHEMA = 'https://fides.community/schemas/credential-catalog/v1';
        const ID_PATTERN = '/^cred:[a-z0-9]+:[a-z0-9-]+:[a-z0-9-]+$/';

        /** @var string[] */
        const SUBJECT_TYPES = array('Person', 'Organization', 'Product', 'Dataset', 'Software', 'Document');

        /** @var string[] */
        const VC_FORMATS = array(
            'sd_jwt_vc',
            'mdoc',
            'jwt_vc',
            'vcdm_1_1',
            'vcdm_2_0',
            'anoncreds',
            'idemix',
            'apple_wallet_pass',
            'google_wallet_pass',
            'acdc',
        );

        /** @var string[] */
        const NATIVE_IDENTIFIER_TYPES = array('vct', 'docType', 'type', 'schema_said', 'other');

        /** @var string[] */
        const SCHEMA_TYPES = array('JSON Schema', 'JSON-LD Context', 'ISO Data Model', 'ACDC Schema', 'Other');

        /** @var string[] */
        const SECTORS = array(
            'public_sector',
            'finance',
            'trade',
            'supply_chain',
            'manufacturing',
            'energy',
            'agriculture',
            'food',
            'retail',
            'healthcare',
            'education',
            'construction',
            'mobility',
            'digital',
        );

        /** @var string[] */
        const ECOSYSTEMS = array(
            'eudi_wallet',
            'uncefact',
            'gaia_x',
            'open_badges',
            'iso_mdl',
            'india_stack',
            'swiyu',
            'vlei',
            'verana',
        );

        /** @var string[] */
        const THEMES = array(
            'person_identity',
            'organizational_identity',
            'payments',
            'compliance_reporting',
            'trade_documents',
            'education',
            'digital_product_passports',
            'dataspaces',
            'agentic_ai',
        );

        /** @var string[] */
        const CATEGORIES = array('identity', 'business', 'finance', 'health', 'travel', 'professional', 'compliance', 'trade');

        /** @var string[] Source-schema credential keys; crawler-only fields are deliberately excluded. */
        const CREDENTIAL_KEYS = array(
            'id',
            'slug',
            'displayName',
            'shortDescription',
            'authority',
            'subjectType',
            'vcFormat',
            'nativeIdentifier',
            'nativeIdentifierType',
            'schemaUrl',
            'schemaType',
            'rulebookUrl',
            'version',
            'extends',
            'vocabularies',
            'tags',
            'sectors',
            'ecosystems',
            'themes',
            'category',
        );

        public static function bootstrap(): void {
            add_action('init', array(__CLASS__, 'register'), 6);
            add_filter('fides_catalog_submission_public_item_url', array(__CLASS__, 'filter_public_item_url'), 10, 4);
            add_filter('fides_catalog_github_sync_repos', array(__CLASS__, 'filter_github_repos'));
            add_filter('fides_catalog_github_commit_route_types', array(__CLASS__, 'filter_commit_route_types'), 10, 2);
        }

        public static function register(): void {
            if (! class_exists('Fides_Catalog_Submission_Registry')) {
                return;
            }
            Fides_Catalog_Submission_Registry::register(
                self::TYPE,
                array(
                    'label'                    => __('Credentials', 'fides-credential-catalog'),
                    'catalog_type'             => self::TYPE,
                    'id_pattern'               => self::ID_PATTERN,
                    'community_filename'       => 'credential-catalog.json',
                    'slug_from_item_id'        => array(__CLASS__, 'slug_from_item_id'),
                    'slug_from_payload'        => array(__CLASS__, 'slug_from_payload'),
                    'validate_payload'         => array(__CLASS__, 'validate_payload'),
                    'payload_to_export'        => array(__CLASS__, 'payload_to_export'),
                    'catalog_item_to_payload'  => array(__CLASS__, 'catalog_item_to_payload'),
                    'prepare_payload_for_diff' => array(__CLASS__, 'prepare_payload_for_diff'),
                    'diff_field_labels'        => array(
                        'orgId'                => 'Organization',
                        'id'                   => 'Credential id',
                        'slug'                 => 'Slug',
                        'displayName'          => 'Display name',
                        'shortDescription'     => 'Short description',
                        'authority'            => 'Authority',
                        'subjectType'          => 'Subject type',
                        'vcFormat'             => 'VC format',
                        'nativeIdentifier'     => 'Native identifier',
                        'nativeIdentifierType' => 'Native identifier type',
                        'schemaUrl'            => 'Schema URL',
                        'schemaType'           => 'Schema type',
                        'rulebookUrl'          => 'Rulebook URL',
                        'version'              => 'Version',
                        'extends'              => 'Extends',
                        'vocabularies'         => 'Vocabularies',
                        'tags'                 => 'Tags',
                        'sectors'              => 'Sectors',
                        'ecosystems'           => 'Ecosystems',
                        'themes'               => 'Themes',
                        'category'             => 'Category',
                    ),
                )
            );
        }

        /**
         * Add credential mapping when the installed submission core predates it.
         *
         * @param array<string, string> $repos Repository mappings.
         * @return array<string, string>
         */
        public static function filter_github_repos($repos) {
            $repos = is_array($repos) ? $repos : array();
            if (empty($repos[ self::TYPE ])) {
                $repos[ self::TYPE ] = 'FIDEScommunity/fides-credential-catalog';
            }
            return $repos;
        }

        /**
         * Use the committed export route consumed by this repository's push workflow.
         *
         * @param string[] $types Catalog types.
         * @param string   $catalog_type Current type.
         * @return string[]
         */
        public static function filter_commit_route_types($types, $catalog_type) {
            $types = is_array($types) ? $types : array();
            if ($catalog_type === self::TYPE && ! in_array(self::TYPE, $types, true)) {
                $types[] = self::TYPE;
            }
            return $types;
        }

        public static function slug_from_item_id($item_id) {
            $existing = self::find_catalog_item((string) $item_id);
            if (is_array($existing)) {
                return self::slug_from_payload(self::catalog_item_to_payload($existing), $item_id);
            }
            return '';
        }

        /**
         * @param array<string, mixed> $payload Submission payload.
         */
        public static function slug_from_payload(array $payload, $item_id) {
            unset($item_id);
            return sanitize_title(preg_replace('/^org:/', '', (string) ($payload['orgId'] ?? '')));
        }

        /**
         * @param array<string, mixed> $payload Raw payload.
         * @param array<string, mixed> $context Submission context.
         * @return array<string, mixed>|WP_Error
         */
        public static function validate_payload(array $payload, array $context) {
            $action = sanitize_key((string) ($context['action'] ?? 'create'));
            $org_id = sanitize_text_field((string) ($payload['orgId'] ?? ''));
            if (! preg_match('/^org:[a-z0-9]+(?:-[a-z0-9]+)*$/', $org_id)) {
                return self::error(__('Select a valid organization.', 'fides-credential-catalog'));
            }

            $display_name = sanitize_text_field((string) ($payload['displayName'] ?? ''));
            if ($display_name === '') {
                return self::error(__('Enter a display name.', 'fides-credential-catalog'));
            }
            $slug = sanitize_title($display_name);
            if ($slug === '') {
                return self::error(__('Display name must contain letters or numbers.', 'fides-credential-catalog'));
            }

            $authority = self::normalize_entity_reference($payload['authority'] ?? array());
            if ($authority === null) {
                return self::error(__('Enter a valid authority name and optional URL.', 'fides-credential-catalog'));
            }
            $authority_code = self::authority_code((string) $authority['name']);
            if ($authority_code === '') {
                return self::error(__('Authority name must contain ASCII letters or numbers.', 'fides-credential-catalog'));
            }

            $subject_type = sanitize_text_field((string) ($payload['subjectType'] ?? ''));
            if (! in_array($subject_type, self::SUBJECT_TYPES, true)) {
                return self::error(__('Select a valid subject type.', 'fides-credential-catalog'));
            }
            $vc_format = sanitize_key((string) ($payload['vcFormat'] ?? ''));
            if (! in_array($vc_format, self::VC_FORMATS, true)) {
                return self::error(__('Select a valid VC format.', 'fides-credential-catalog'));
            }

            $version = sanitize_text_field((string) ($payload['version'] ?? ''));
            if ($version === '') {
                return self::error(__('Enter a version.', 'fides-credential-catalog'));
            }
            $schema_url = self::required_url($payload, 'schemaUrl');
            if ($schema_url === '') {
                return self::error(__('Enter a valid schema URL.', 'fides-credential-catalog'));
            }
            $schema_type = sanitize_text_field((string) ($payload['schemaType'] ?? ''));
            if (! in_array($schema_type, self::SCHEMA_TYPES, true)) {
                return self::error(__('Select a valid schema type.', 'fides-credential-catalog'));
            }

            $sectors = self::normalize_enum_list($payload['sectors'] ?? array(), self::SECTORS);
            if (empty($sectors)) {
                return self::error(__('Select at least one sector.', 'fides-credential-catalog'));
            }
            $ecosystems = self::normalize_enum_list($payload['ecosystems'] ?? array(), self::ECOSYSTEMS);
            if (empty($ecosystems)) {
                return self::error(__('Select at least one ecosystem.', 'fides-credential-catalog'));
            }

            $item_id = $action === 'update'
                ? sanitize_text_field((string) ($context['item_id'] ?? ''))
                : sanitize_text_field((string) ($payload['id'] ?? ''));
            if (! preg_match(self::ID_PATTERN, $item_id)) {
                return self::error(__('Credential id must use cred:<authorityCode>:<credentialKey>:<formatCode>.', 'fides-credential-catalog'));
            }
            if ($action !== 'update') {
                $parts = explode(':', $item_id);
                if (($parts[1] ?? '') !== $authority_code || ($parts[3] ?? '') !== str_replace('_', '-', $vc_format)) {
                    return self::error(__('Credential id must match the authority, credential key, and VC format.', 'fides-credential-catalog'));
                }
            }

            $existing = self::find_catalog_item($item_id);
            if ($action === 'create' && is_array($existing)) {
                return self::error(__('This credential already exists in the catalog.', 'fides-credential-catalog'));
            }
            if ($action === 'update') {
                $payload_id = sanitize_text_field((string) ($payload['id'] ?? ''));
                if ($payload_id !== '' && $payload_id !== $item_id) {
                    return self::error(__('Credential id cannot be changed on update.', 'fides-credential-catalog'));
                }
                if (! is_array($existing)) {
                    return self::error(__('The credential to update was not found.', 'fides-credential-catalog'));
                }
                if ((string) ($existing['orgId'] ?? '') !== $org_id) {
                    return self::error(__('Organization cannot be changed on update.', 'fides-credential-catalog'));
                }
                $existing_slug = sanitize_title((string) ($existing['slug'] ?? ''));
                if ($existing_slug !== '') {
                    $slug = $existing_slug;
                }
            }

            if (! self::organization_exists($org_id)) {
                return self::error(__('The selected organization was not found in the organization catalog.', 'fides-credential-catalog'));
            }

            $native_identifier_type = sanitize_text_field((string) ($payload['nativeIdentifierType'] ?? ''));
            if ($native_identifier_type !== '' && ! in_array($native_identifier_type, self::NATIVE_IDENTIFIER_TYPES, true)) {
                return self::error(__('Select a valid native identifier type.', 'fides-credential-catalog'));
            }
            $category = sanitize_key((string) ($payload['category'] ?? ''));
            if ($category !== '' && ! in_array($category, self::CATEGORIES, true)) {
                return self::error(__('Select a valid category.', 'fides-credential-catalog'));
            }

            $normalized = array(
                'item_id'    => $item_id,
                'orgId'      => $org_id,
                'id'         => $item_id,
                'slug'       => $slug,
                'displayName' => $display_name,
                'authority'  => $authority,
                'subjectType' => $subject_type,
                'vcFormat'   => $vc_format,
                'version'    => $version,
                'schemaUrl'  => $schema_url,
                'schemaType' => $schema_type,
                'sectors'    => $sectors,
                'ecosystems' => $ecosystems,
            );
            foreach (array('shortDescription', 'nativeIdentifier') as $key) {
                $value = self::optional_text($payload, $key);
                $length = function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
                if ($key === 'shortDescription' && $length > 2000) {
                    return self::error(__('Short description cannot exceed 2,000 characters.', 'fides-credential-catalog'));
                }
                if ($value !== '') {
                    $normalized[ $key ] = $value;
                }
            }
            if ($native_identifier_type !== '') {
                $normalized['nativeIdentifierType'] = $native_identifier_type;
            }
            $rulebook_url = self::optional_url($payload, 'rulebookUrl');
            if ($rulebook_url !== '') {
                $normalized['rulebookUrl'] = $rulebook_url;
            }

            $extends = self::normalize_credential_refs($payload['extends'] ?? array());
            if (! empty($extends)) {
                $normalized['extends'] = $extends;
            }
            $vocabularies = self::normalize_vocabularies($payload['vocabularies'] ?? array());
            if (! empty($vocabularies)) {
                $normalized['vocabularies'] = $vocabularies;
            }
            $tags = self::normalize_text_list($payload['tags'] ?? array());
            if (! empty($tags)) {
                $normalized['tags'] = $tags;
            }
            $themes = self::normalize_enum_list($payload['themes'] ?? array(), self::THEMES);
            if (! empty($themes)) {
                $normalized['themes'] = $themes;
            }
            if ($category !== '') {
                $normalized['category'] = $category;
            }
            return $normalized;
        }

        /**
         * @param array<string, mixed> $payload Normalized payload.
         * @return array<string, mixed>
         */
        public static function payload_to_export(array $payload) {
            $credential = array();
            foreach (self::CREDENTIAL_KEYS as $key) {
                if (array_key_exists($key, $payload) && $payload[ $key ] !== '' && $payload[ $key ] !== array()) {
                    $credential[ $key ] = $payload[ $key ];
                }
            }
            return array(
                '$schema'     => self::SCHEMA,
                'orgId'       => sanitize_text_field((string) ($payload['orgId'] ?? '')),
                'credentials' => array($credential),
                'lastUpdated' => gmdate(DATE_ATOM),
            );
        }

        /**
         * @param array<string, mixed> $item Aggregated or source credential.
         * @return array<string, mixed>
         */
        public static function catalog_item_to_payload(array $item) {
            $payload = array('orgId' => (string) ($item['orgId'] ?? ''));
            foreach (self::CREDENTIAL_KEYS as $key) {
                if (array_key_exists($key, $item) && $item[ $key ] !== '' && $item[ $key ] !== array()) {
                    $payload[ $key ] = $item[ $key ];
                }
            }
            return self::prepare_payload_for_diff($payload);
        }

        /**
         * @param array<string, mixed> $payload Payload.
         * @return array<string, mixed>
         */
        public static function prepare_payload_for_diff(array $payload) {
            foreach (array('tags', 'sectors', 'ecosystems', 'themes') as $key) {
                if (isset($payload[ $key ]) && is_array($payload[ $key ])) {
                    $payload[ $key ] = self::normalize_text_list($payload[ $key ]);
                    sort($payload[ $key ], SORT_STRING);
                }
            }
            if (isset($payload['extends'])) {
                $payload['extends'] = self::normalize_credential_refs($payload['extends']);
                usort($payload['extends'], static fn ($a, $b) => strcmp((string) $a['id'], (string) $b['id']));
            }
            if (isset($payload['vocabularies'])) {
                $payload['vocabularies'] = self::normalize_vocabularies($payload['vocabularies']);
                usort($payload['vocabularies'], static fn ($a, $b) => strcmp((string) $a['name'], (string) $b['name']));
            }
            return $payload;
        }

        /**
         * @param string $url Current URL.
         */
        public static function filter_public_item_url($url, $catalog_type, $item_id, $payload) {
            unset($payload);
            if ($catalog_type !== self::TYPE || ! preg_match(self::ID_PATTERN, (string) $item_id)) {
                return $url;
            }
            $option = class_exists('Fides_Credential_Catalog_SSR')
                ? Fides_Credential_Catalog_SSR::OPTION_CATALOG_URL
                : 'fides_credential_catalog_page_url';
            $default = class_exists('Fides_Credential_Catalog_SSR')
                ? Fides_Credential_Catalog_SSR::DEFAULT_CATALOG_PATH
                : '/ecosystem-explorer/credential-catalog/';
            $path = get_option($option, $default);
            return add_query_arg('credential', rawurlencode((string) $item_id), home_url((string) $path));
        }

        /**
         * Convert an authority name to its identifier component.
         */
        private static function authority_code($name) {
            $ascii = function_exists('remove_accents') ? remove_accents((string) $name) : (string) $name;
            return preg_replace('/[^a-z0-9]/', '', strtolower($ascii));
        }

        /**
         * @param mixed $raw Entity reference.
         * @return array<string, string>|null
         */
        private static function normalize_entity_reference($raw) {
            if (! is_array($raw)) {
                return null;
            }
            $name = sanitize_text_field((string) ($raw['name'] ?? ''));
            if ($name === '') {
                return null;
            }
            $out = array('name' => $name);
            if (isset($raw['url']) && trim((string) $raw['url']) !== '') {
                $url = esc_url_raw(trim((string) $raw['url']));
                if ($url === '') {
                    return null;
                }
                $out['url'] = $url;
            }
            return $out;
        }

        /**
         * @param mixed    $raw Raw values.
         * @param string[] $allowed Allowed values.
         * @return string[]
         */
        private static function normalize_enum_list($raw, array $allowed) {
            $values = self::normalize_text_list($raw);
            return array_values(array_filter($values, static fn ($value) => in_array($value, $allowed, true)));
        }

        /**
         * @param mixed $raw Raw values.
         * @return string[]
         */
        private static function normalize_text_list($raw) {
            if (! is_array($raw)) {
                return array();
            }
            $out = array();
            foreach ($raw as $value) {
                $value = sanitize_text_field((string) $value);
                if ($value !== '') {
                    $out[ $value ] = $value;
                }
            }
            return array_values($out);
        }

        /**
         * @param mixed $raw Credential references.
         * @return array<int, array<string, string>>
         */
        private static function normalize_credential_refs($raw) {
            if (! is_array($raw)) {
                return array();
            }
            $out = array();
            foreach ($raw as $ref) {
                if (! is_array($ref)) {
                    continue;
                }
                $id = sanitize_text_field((string) ($ref['id'] ?? ''));
                if (! preg_match(self::ID_PATTERN, $id)) {
                    continue;
                }
                $entry = array('id' => $id);
                $name = sanitize_text_field((string) ($ref['displayName'] ?? ''));
                if ($name !== '') {
                    $entry['displayName'] = $name;
                }
                $out[ $id ] = $entry;
            }
            return array_values($out);
        }

        /**
         * @param mixed $raw Vocabulary references.
         * @return array<int, array<string, mixed>>
         */
        private static function normalize_vocabularies($raw) {
            if (! is_array($raw)) {
                return array();
            }
            $out = array();
            foreach ($raw as $vocabulary) {
                if (! is_array($vocabulary)) {
                    continue;
                }
                $name = sanitize_text_field((string) ($vocabulary['name'] ?? ''));
                if ($name === '') {
                    continue;
                }
                $entry = array('name' => $name);
                if (isset($vocabulary['authority'])) {
                    $authority = self::normalize_entity_reference($vocabulary['authority']);
                    if ($authority !== null) {
                        $entry['authority'] = $authority;
                    }
                }
                $url = self::optional_url($vocabulary, 'url');
                if ($url !== '') {
                    $entry['url'] = $url;
                }
                $out[ $name ] = $entry;
            }
            return array_values($out);
        }

        private static function required_url(array $payload, $key) {
            return self::optional_url($payload, $key);
        }

        private static function optional_url(array $payload, $key) {
            return isset($payload[ $key ]) ? esc_url_raw(trim((string) $payload[ $key ])) : '';
        }

        private static function optional_text(array $payload, $key) {
            return isset($payload[ $key ]) ? sanitize_textarea_field((string) $payload[ $key ]) : '';
        }

        private static function error($message) {
            return new WP_Error('fides_credential_invalid', $message);
        }

        private static function find_catalog_item($item_id) {
            if (class_exists('Fides_Catalog_Submission_Lookups')) {
                $item = Fides_Catalog_Submission_Lookups::find_item_by_id(self::TYPE, $item_id);
                return is_array($item) ? $item : null;
            }
            return null;
        }

        private static function organization_exists($org_id) {
            if (! class_exists('Fides_Catalog_Source') || ! class_exists('Fides_Catalog_Registry')
                || ! Fides_Catalog_Registry::exists('organization')) {
                return true;
            }
            $source = Fides_Catalog_Source::for('organization');
            return ! $source || is_array($source->find_by_id($org_id));
        }
    }
}
