<?php
/**
 * Local WordPress smoke tests for credential catalog submissions.
 *
 * Run only after syncing the plugin:
 * php scripts/smoke-test-submissions.php
 */

declare(strict_types=1);

$wp_root = getenv('FIDES_WP_ROOT') ?: '/Users/victorvanderhulst/Local Sites/utrecht-demo/app/public';
$socket  = getenv('FIDES_WP_MYSQL_SOCKET') ?: '/Users/victorvanderhulst/Library/Application Support/Local/run/buO_mZaLl/mysql/mysqld.sock';
if (! is_readable($wp_root . '/wp-load.php')) {
    fwrite(STDERR, "WP root not found: {$wp_root}\n");
    exit(1);
}
if (! is_readable($socket)) {
    fwrite(STDERR, "MySQL socket not found (is Local running?): {$socket}\n");
    exit(1);
}

$_SERVER['HTTP_HOST']   = 'utrecht-demo.local';
$_SERVER['REQUEST_URI'] = '/';
if (! defined('DB_HOST')) {
    define('DB_HOST', 'localhost:' . $socket);
}
require $wp_root . '/wp-load.php';

$failures = 0;
$created_rows = array();

function credential_smoke_assert(bool $condition, string $message): void {
    if (! $condition) {
        throw new RuntimeException($message);
    }
}

function credential_smoke(string $name, callable $callback): void {
    global $failures;
    try {
        $detail = (string) $callback();
        echo "PASS  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    } catch (Throwable $error) {
        $failures++;
        echo "FAIL  {$name} — {$error->getMessage()}\n";
    }
}

function credential_smoke_data($response): array {
    if ($response instanceof WP_Error) {
        throw new RuntimeException($response->get_error_message());
    }
    $data = rest_get_server()->response_to_data($response, false);
    return is_array($data) ? $data : array();
}

function credential_smoke_lookup(string $type, string $query): array {
    $request = new WP_REST_Request('GET', "/fides-catalog/v1/lookups/{$type}");
    $request->set_url_params(array('type' => $type));
    $request->set_param('q', $query);
    $data = credential_smoke_data(Fides_Catalog_Submission_REST::handle_lookup($request));
    return isset($data['content']) && is_array($data['content']) ? $data['content'] : array();
}

function credential_smoke_post(string $action, string $item_id, array $payload): array {
    $route = $action === 'create'
        ? '/fides-catalog/v1/submissions/credential'
        : '/fides-catalog/v1/submissions/credential/' . rawurlencode($item_id);
    $request = new WP_REST_Request('POST', $route);
    $url_params = array('type' => 'credential');
    if ($action === 'update') {
        $url_params['item_id'] = $item_id;
    }
    $request->set_url_params($url_params);
    $request->set_header('Content-Type', 'application/json');
    $request->set_body(wp_json_encode($payload));
    $response = $action === 'create'
        ? Fides_Catalog_Submission_REST::handle_create($request)
        : Fides_Catalog_Submission_REST::handle_update($request);
    $data = credential_smoke_data($response);
    if (! empty($data['id'])) {
        $GLOBALS['created_rows'][] = (int) $data['id'];
    }
    return $data;
}

wp_set_current_user(1);
$suffix = strtolower(base_convert((string) time(), 10, 36));
$org_hits = credential_smoke_lookup('organization', 'fides');
$org_id = (string) ($org_hits[0]['id'] ?? '');
$credential_hits = credential_smoke_lookup('credential', 'credential');
$existing_id = (string) ($credential_hits[0]['id'] ?? '');

register_shutdown_function(static function (): void {
    foreach (array_unique($GLOBALS['created_rows'] ?? array()) as $row_id) {
        if ($row_id > 0 && class_exists('Fides_Catalog_Submissions')) {
            Fides_Catalog_Submissions::delete((int) $row_id);
            echo "CLEAN deleted smoke submission #{$row_id}\n";
        }
    }
});

credential_smoke('Registry and adapter', static function (): string {
    credential_smoke_assert(class_exists('Fides_Credential_Catalog_Submission_Adapter'), 'Adapter missing');
    credential_smoke_assert(Fides_Catalog_Submission_Registry::exists('credential'), 'Credential type not registered');
    return 'credential registered';
});

credential_smoke('Organization and credential lookups', static function () use ($org_hits, $credential_hits): string {
    credential_smoke_assert(count($org_hits) > 0, 'Organization lookup returned no results');
    credential_smoke_assert(count($credential_hits) > 0, 'Credential lookup returned no results');
    return count($credential_hits) . ' credential result(s)';
});

credential_smoke('Credential prefill', static function () use ($existing_id): string {
    credential_smoke_assert($existing_id !== '', 'No credential available for prefill');
    $request = new WP_REST_Request('GET', '/fides-catalog/v1/submissions/credential/item/' . rawurlencode($existing_id));
    $request->set_url_params(array('type' => 'credential', 'item_id' => $existing_id));
    $data = credential_smoke_data(Fides_Catalog_Submission_REST::handle_get_item_payload($request));
    credential_smoke_assert(($data['payload']['id'] ?? '') === $existing_id, 'Prefill id mismatch');
    return $existing_id;
});

credential_smoke('Create credential', static function () use ($org_id, $suffix): string {
    credential_smoke_assert($org_id !== '', 'Organization lookup unavailable');
    $id = "cred:smokeauthority:smoke-{$suffix}:sd-jwt-vc";
    $data = credential_smoke_post('create', '', array(
        'orgId' => $org_id,
        'id' => $id,
        'displayName' => "Smoke {$suffix}",
        'authority' => array('name' => 'Smoke Authority', 'url' => 'https://example.test'),
        'subjectType' => 'Person',
        'vcFormat' => 'sd_jwt_vc',
        'schemaUrl' => 'https://example.test/schema.json',
        'schemaType' => 'JSON Schema',
        'version' => '1',
        'sectors' => array('digital'),
        'ecosystems' => array('eudi_wallet'),
    ));
    credential_smoke_assert(($data['status'] ?? '') === 'received', 'Create was not received');
    return $id;
});

credential_smoke('Validation rejects invalid payloads', static function () use ($org_id, $suffix): string {
    $invalid = Fides_Credential_Catalog_Submission_Adapter::validate_payload(array(
        'orgId' => $org_id,
        'id' => "cred:smokeauthority:invalid-{$suffix}:sd-jwt-vc",
        'displayName' => 'Invalid credential',
        'subjectType' => 'Person',
        'vcFormat' => 'sd_jwt_vc',
        'version' => '1',
    ), array('action' => 'create'));
    credential_smoke_assert(is_wp_error($invalid), 'Invalid credential payload was accepted');
    return 'required schema fields enforced';
});

credential_smoke('Update existing credential', static function () use ($existing_id): string {
    credential_smoke_assert($existing_id !== '', 'No credential available for update');
    $item = Fides_Catalog_Submission_Lookups::find_item_by_id('credential', $existing_id);
    credential_smoke_assert(is_array($item), 'Existing credential not found');
    $payload = Fides_Credential_Catalog_Submission_Adapter::catalog_item_to_payload($item);
    $payload['shortDescription'] = 'Temporary automated smoke-test update.';
    $data = credential_smoke_post('update', $existing_id, $payload);
    credential_smoke_assert(($data['action'] ?? '') === 'update', 'Update action mismatch');
    return $existing_id;
});

credential_smoke('Adapter export roundtrip', static function () use ($org_id, $suffix): string {
    $payload = array(
        'orgId' => $org_id,
        'id' => "cred:smokeauthority:roundtrip-{$suffix}:sd-jwt-vc",
        'displayName' => "Roundtrip {$suffix}",
        'shortDescription' => 'Roundtrip description',
        'authority' => array('name' => 'Smoke Authority', 'url' => 'https://example.test'),
        'subjectType' => 'Organization',
        'vcFormat' => 'sd_jwt_vc',
        'nativeIdentifier' => 'urn:example:roundtrip:1',
        'nativeIdentifierType' => 'vct',
        'schemaUrl' => 'https://example.test/schema.json',
        'schemaType' => 'JSON Schema',
        'version' => '1',
        'tags' => array('smoke', 'roundtrip'),
        'sectors' => array('digital'),
        'ecosystems' => array('eudi_wallet'),
        'themes' => array('organizational_identity'),
        'category' => 'business',
    );
    $normalized = Fides_Credential_Catalog_Submission_Adapter::validate_payload($payload, array('action' => 'create'));
    credential_smoke_assert(! is_wp_error($normalized), is_wp_error($normalized) ? $normalized->get_error_message() : 'Validation failed');
    $export = Fides_Credential_Catalog_Submission_Adapter::payload_to_export($normalized);
    $roundtrip = Fides_Credential_Catalog_Submission_Adapter::catalog_item_to_payload(array_merge(
        array('orgId' => $export['orgId']),
        $export['credentials'][0]
    ));
    credential_smoke_assert($roundtrip['id'] === $payload['id'], 'Credential id did not roundtrip');
    $roundtrip_tags = $roundtrip['tags'];
    $payload_tags   = $payload['tags'];
    sort($roundtrip_tags);
    sort($payload_tags);
    credential_smoke_assert($roundtrip_tags === $payload_tags, 'Credential tags did not roundtrip');
    return 'all source fields preserved';
});

credential_smoke('Form assets and shortcodes', static function (): string {
    credential_smoke_assert(shortcode_exists('fides_credential_submit_form'), 'Create shortcode missing');
    credential_smoke_assert(shortcode_exists('fides_credential_update_form'), 'Update shortcode missing');
    $base = dirname(__DIR__) . '/wordpress-plugin/fides-credential-catalog/assets/';
    credential_smoke_assert(is_readable($base . 'credential-form.js'), 'Form JavaScript missing');
    credential_smoke_assert(is_readable($base . 'credential-form.css'), 'Form CSS missing');
    return 'assets and shortcodes available';
});

echo "\nSummary: {$failures} failed\n";
exit($failures > 0 ? 1 : 0);
