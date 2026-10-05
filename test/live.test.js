// Opt-in integration tests. They exercise the loadOptions methods against a real
// LiteLLM proxy, which is the one path the declarative routing cannot cover and
// the editor-only path that is otherwise untested.
//
//   LITELLM_BASE_URL=http://127.0.0.1:4000 LITELLM_API_KEY=sk-... npm test
//
// Skipped entirely when those variables are absent, so CI stays green.
const test = require('node:test');
const assert = require('node:assert/strict');
const { getModels } = require('../dist/nodes/LiteLlm/listSearch/getModels.js');
const { getTeams } = require('../dist/nodes/LiteLlm/listSearch/getTeams.js');

const baseUrl = process.env.LITELLM_BASE_URL;
const apiKey = process.env.LITELLM_API_KEY;
const live = Boolean(baseUrl && apiKey);

// Minimal stand-in for ILoadOptionsFunctions: just the two things our code uses.
const context = {
	async getCredentials() {
		return { baseUrl, apiKey };
	},
	helpers: {
		async httpRequestWithAuthentication(_credentialType, options) {
			const url = new URL(options.url);
			for (const [k, v] of Object.entries(options.qs ?? {})) {
				if (v !== undefined) url.searchParams.set(k, String(v));
			}
			const res = await fetch(url, {
				method: options.method,
				headers: { Accept: 'application/json', Authorization: `Bearer ${apiKey}` },
				body: options.body ? JSON.stringify(options.body) : undefined,
			});
			if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
			return await res.json();
		},
	},
};
context.helpers.httpRequestWithAuthentication =
	context.helpers.httpRequestWithAuthentication.bind(context);

test('getModels returns the proxy wildcards plus real model groups', { skip: !live }, async () => {
	const options = await getModels.call(context);
	assert.ok(Array.isArray(options));
	assert.equal(options[0].value, 'all-proxy-models');
	assert.equal(options[1].value, 'all-team-models');
	for (const o of options) {
		assert.ok(typeof o.name === 'string' && o.name.length);
		assert.ok(typeof o.value === 'string' && o.value.length);
	}
	const real = options.slice(2).map((o) => o.value);
	assert.deepEqual(real, [...real].sort((a, b) => a.localeCompare(b)), 'models must be sorted');
	assert.equal(new Set(real).size, real.length, 'models must be de-duplicated');
});

test('getTeams returns selectable teams', { skip: !live }, async () => {
	const options = await getTeams.call(context);
	assert.ok(Array.isArray(options));
	for (const o of options) {
		assert.ok(o.value, 'every team needs an id');
		assert.ok(o.name, 'every team needs a label');
	}
	const ids = options.map((o) => o.value);
	assert.equal(new Set(ids).size, ids.length, 'team ids must be unique');
});
