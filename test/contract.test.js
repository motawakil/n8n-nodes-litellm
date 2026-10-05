// Structural checks on the published contract. These are the things that break
// silently: a renamed file, a missing routing block, or a codex category that
// makes the node invisible in the editor.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const { LiteLlm } = require(path.join(root, 'dist/nodes/LiteLlm/LiteLlm.node.js'));
const { LiteLlmApi } = require(path.join(root, 'dist/credentials/LiteLlmApi.credentials.js'));

const description = new LiteLlm().description;
const operationProps = description.properties.filter((p) => p.name === 'operation');

test('package name carries the n8n-nodes- prefix', () => {
	const bare = pkg.name.includes('/') ? pkg.name.split('/')[1] : pkg.name;
	assert.ok(bare.startsWith('n8n-nodes-'), `bad package name: ${pkg.name}`);
});

test('package declares the community-node keyword', () => {
	assert.ok(pkg.keywords.includes('n8n-community-node-package'));
});

test('package has no runtime dependencies', () => {
	// Required for n8n verification; also keeps the install surface at zero.
	assert.deepEqual(pkg.dependencies ?? {}, {});
	assert.ok(pkg.peerDependencies['n8n-workflow']);
});

test('package declares an author name and email', () => {
	// n8n's own lint rejects a missing email.
	assert.ok(pkg.author?.name);
	assert.match(pkg.author?.email ?? '', /@/);
});

test('every file named in the n8n block exists', () => {
	for (const rel of [...pkg.n8n.nodes, ...pkg.n8n.credentials]) {
		assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
	}
});

test('icons referenced by the node and credential exist', () => {
	const icons = [description.icon.light, description.icon.dark, new LiteLlmApi().icon.light];
	for (const ref of icons) {
		const rel = ref.replace(/^file:/, '');
		const base = ref === new LiteLlmApi().icon.light ? 'dist/credentials' : 'dist/nodes/LiteLlm';
		assert.ok(fs.existsSync(path.resolve(root, base, rel)), `missing icon ${ref}`);
	}
});

test('codex categories are all from n8n\'s allowed list', () => {
	// n8n's verification scanner rejects anything outside this set; the local
	// lint does not catch it.
	const allowed = new Set([
		'Data & Storage', 'Finance & Accounting', 'Marketing & Content', 'Productivity',
		'Miscellaneous', 'Sales', 'Development', 'Analytics', 'Communication', 'Utility',
	]);
	const codex = require(path.join(root, 'dist/nodes/LiteLlm/LiteLlm.node.json'));
	for (const c of codex.categories ?? []) {
		assert.ok(allowed.has(c), `"${c}" is not an allowed community node category`);
	}
});

test('codex does not tag the node as AI without an AI subcategory', () => {
	// A node with the AI category but no subcategories.AI is filtered out of the
	// regular node panel AND absent from the AI panel - invisible everywhere.
	const codex = require(path.join(root, 'dist/nodes/LiteLlm/LiteLlm.node.json'));
	if ((codex.categories ?? []).includes('AI')) {
		assert.ok(codex.subcategories?.AI?.length, 'AI category requires subcategories.AI');
	}
});

test('every operation declares a request, an action and error handling', () => {
	let count = 0;
	for (const prop of operationProps) {
		for (const op of prop.options) {
			const id = `${prop.displayOptions.show.resource[0]}.${op.value}`;
			assert.ok(op.routing?.request?.method, `${id}: no method`);
			assert.ok(op.routing?.request?.url, `${id}: no url`);
			assert.ok(op.action, `${id}: no action label`);
			const post = op.routing?.output?.postReceive ?? [];
			assert.equal(post[0]?.name, 'raiseApiError', `${id}: raiseApiError must run first`);
			count++;
		}
	}
	assert.equal(count, 25, `expected 25 operations, found ${count}`);
});

test('failed responses reach postReceive', () => {
	// Without this, n8n throws before raiseApiError can read the body.
	assert.equal(description.requestDefaults.ignoreHttpStatusErrors, true);
});

test('pagination never references $pageCount', () => {
	// $pageCount does not exist in declarative nodes; it resolves to NaN.
	const serialised = JSON.stringify(description.properties);
	assert.ok(!serialised.includes('$pageCount'), 'found $pageCount in a routing expression');
});

test('resource and operation values are unique', () => {
	const resources = description.properties.find((p) => p.name === 'resource').options;
	const values = resources.map((r) => r.value);
	assert.equal(new Set(values).size, values.length);
	for (const prop of operationProps) {
		const ops = prop.options.map((o) => o.value);
		assert.equal(new Set(ops).size, ops.length);
	}
});

test('repository screenshots are kept out of the published tarball', () => {
	// n8n-node build copies **/*.{png,svg} into dist, so docs/images lands in
	// dist/docs/images and would add ~500kB to every install.
	assert.ok(pkg.files.includes('!dist/docs/**'), 'files must exclude dist/docs/**');
});

test('credential targets an authenticated endpoint and asks for JSON', () => {
	const cred = new LiteLlmApi();
	assert.equal(cred.name, 'liteLlmApi');
	assert.match(cred.test.request.url, /\/v1\/models/);
	// Without this header an SPA catch-all answers 200 with HTML and the test passes.
	assert.equal(cred.test.request.headers.Accept, 'application/json');
	assert.match(cred.authenticate.properties.headers.Authorization, /Bearer/);
});
