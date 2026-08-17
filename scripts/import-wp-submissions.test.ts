import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildImportPlan,
  emptyState,
  mergeCredentialIntoCatalog,
  type WpExportEntry,
} from './import-wp-submissions.ts';

const credential = (id: string, displayName: string): WpExportEntry => ({
  itemId: id,
  slug: 'acme',
  filename: 'credential-catalog.json',
  source: 'wordpress',
  document: {
    orgId: 'org:acme',
    credentials: [{
      id,
      displayName,
      authority: { name: 'Acme' },
      subjectType: 'Person',
      vcFormat: 'sd_jwt_vc',
      schemaUrl: 'https://example.test/schema.json',
      schemaType: 'JSON Schema',
      version: '1',
      sectors: ['digital'],
      ecosystems: ['eudi_wallet'],
    }],
  },
});

test('merge appends and updates one credential while preserving siblings', () => {
  const first = credential('cred:acme:first:sd-jwt-vc', 'First');
  const second = credential('cred:acme:second:sd-jwt-vc', 'Second');
  let doc = mergeCredentialIntoCatalog(null, first);
  doc = mergeCredentialIntoCatalog(doc, second);
  doc = mergeCredentialIntoCatalog(
    doc,
    credential('cred:acme:first:sd-jwt-vc', 'First updated'),
  );
  assert.equal(doc.credentials?.length, 2);
  assert.equal(
    doc.credentials?.find((item) => item.id === first.itemId)?.displayName,
    'First updated',
  );
  assert.equal(
    doc.credentials?.find((item) => item.id === second.itemId)?.displayName,
    'Second',
  );
});

test('merge preserves non-WordPress fields on an existing credential', () => {
  const entry = credential('cred:acme:first:sd-jwt-vc', 'Updated');
  const doc = mergeCredentialIntoCatalog({
    orgId: 'org:acme',
    credentials: [{
      id: entry.itemId,
      displayName: 'Original',
      maintainedByGitHub: true,
    }],
  }, entry);
  const merged = doc.credentials?.[0];
  assert.equal(merged?.displayName, 'Updated');
  assert.equal(merged?.maintainedByGitHub, true);
});

test('merge preserves the exported lastUpdated value', () => {
  const entry = credential('cred:acme:dated:sd-jwt-vc', 'Dated');
  entry.document.lastUpdated = '2026-08-11T12:00:00+00:00';
  assert.equal(mergeCredentialIntoCatalog(null, entry).lastUpdated, entry.document.lastUpdated);
});

test('merge rejects a credential for a different organization catalog', () => {
  const entry = credential('cred:acme:first:sd-jwt-vc', 'First');
  assert.throws(
    () => mergeCredentialIntoCatalog({
      orgId: 'org:other',
      credentials: [],
    }, entry),
    /orgId does not match/,
  );
});

test('buildImportPlan groups entries and prunes missing managed credentials', () => {
  const state = emptyState();
  state.managedCredentials = [{
    slug: 'oldco',
    credentialId: 'cred:oldco:legacy:sd-jwt-vc',
  }];
  const plan = buildImportPlan(
    [credential('cred:acme:first:sd-jwt-vc', 'First')],
    state,
  );
  assert.equal(plan.groups.length, 1);
  assert.equal(plan.groups[0]?.entries.length, 1);
  assert.deepEqual(plan.prune, state.managedCredentials);
  assert.equal(plan.skipped.length, 0);
});

test('buildImportPlan rejects unsafe metadata and invalid credential ids', () => {
  const bad = credential('not-a-credential', 'Bad');
  bad.slug = '../escape';
  const plan = buildImportPlan([bad], emptyState());
  assert.equal(plan.groups.length, 0);
  assert.equal(plan.skipped.length, 1);
});
