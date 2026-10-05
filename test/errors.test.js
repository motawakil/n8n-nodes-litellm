// extractErrorMessage is the difference between "Bad request - please check your
// parameters" and the reason the request was actually rejected.
const test = require('node:test');
const assert = require('node:assert/strict');
const { extractErrorMessage } = require('../dist/nodes/LiteLlm/shared/errors.js');

test('reads { detail: { error } } - most management endpoints', () => {
	assert.equal(
		extractErrorMessage({ detail: { error: 'Key alias already exists' } }),
		'Key alias already exists',
	);
});

test('reads a plain string detail', () => {
	assert.equal(extractErrorMessage({ detail: 'Not Found' }), 'Not Found');
});

test('formats FastAPI validation errors with field and value', () => {
	const body = {
		detail: [
			{ type: 'int_parsing', loc: ['query', 'page'], msg: 'Input should be a valid integer', input: 'NaN' },
		],
	};
	assert.equal(
		extractErrorMessage(body),
		'page: Input should be a valid integer (received "NaN")',
	);
});

test('joins multiple validation errors', () => {
	const body = {
		detail: [
			{ loc: ['query', 'page'], msg: 'bad page' },
			{ loc: ['body', 'max_budget'], msg: 'bad budget' },
		],
	};
	assert.equal(extractErrorMessage(body), 'page: bad page; max_budget: bad budget');
});

test('reads OpenAI-compatible { error: { message } }', () => {
	assert.equal(extractErrorMessage({ error: { message: 'Invalid API key' } }), 'Invalid API key');
});

test('reads a bare string body', () => {
	assert.equal(extractErrorMessage('Internal Server Error'), 'Internal Server Error');
});

test('returns undefined when there is nothing useful', () => {
	assert.equal(extractErrorMessage({}), undefined);
	assert.equal(extractErrorMessage(undefined), undefined);
	assert.equal(extractErrorMessage(''), undefined);
});
