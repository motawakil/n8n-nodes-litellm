import type { INodeProperties } from 'n8n-workflow';
import { splitCommaSeparated } from '../../shared/utils';

/**
 * Settings accepted by both POST /key/generate and POST /key/update, shared so the
 * two operations cannot drift apart.
 */
export const keySettingFields: INodeProperties[] = [
	{
		displayName: 'Budget Duration',
		name: 'budget_duration',
		type: 'string',
		default: '',
		placeholder: 'e.g. 30d',
		description: 'How often the spend of the key resets, such as 30s, 30m, 30h or 30d',
		routing: { send: { type: 'body', property: 'budget_duration' } },
	},
	{
		displayName: 'Duration',
		name: 'duration',
		type: 'string',
		default: '',
		placeholder: 'e.g. 30d',
		description:
			'How long the key stays valid, such as 30s, 30m, 30h or 30d. Never expires when empty.',
		routing: { send: { type: 'body', property: 'duration' } },
	},
	{
		displayName: 'Guardrails',
		name: 'guardrails',
		type: 'string',
		default: '',
		placeholder: 'e.g. prompt-injection,pii-masking',
		description: 'Comma-separated guardrails to run for requests made with this key',
		routing: {
			send: {
				type: 'body',
				property: 'guardrails',
				value: splitCommaSeparated,
			},
		},
	},
	{
		displayName: 'Max Budget',
		name: 'max_budget',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 4 },
		description: 'Maximum spend for this key in USD',
		routing: { send: { type: 'body', property: 'max_budget' } },
	},
	{
		displayName: 'Max Parallel Requests',
		name: 'max_parallel_requests',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Maximum number of requests this key may run at the same time',
		routing: { send: { type: 'body', property: 'max_parallel_requests' } },
	},
	{
		displayName: 'Metadata',
		name: 'metadata',
		type: 'json',
		default: '{}',
		description: 'Arbitrary JSON stored alongside the key',
		routing: { send: { type: 'body', property: 'metadata', value: '={{ JSON.parse($value) }}' } },
	},
	{
		displayName: 'Model Names or IDs',
		name: 'models',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getModels' },
		default: [],
		description:
			'Models this key may call, or every model its team allows when left empty. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'models' } },
	},
	{
		displayName: 'RPM Limit',
		name: 'rpm_limit',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Requests per minute allowed for this key',
		routing: { send: { type: 'body', property: 'rpm_limit' } },
	},
	{
		displayName: 'Soft Budget',
		name: 'soft_budget',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 4 },
		description: 'Spend in USD at which an alert fires, without blocking the key',
		routing: { send: { type: 'body', property: 'soft_budget' } },
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		placeholder: 'e.g. production,billing',
		description: 'Comma-separated tags attached to spend logs for this key',
		routing: {
			send: {
				type: 'body',
				property: 'tags',
				value: splitCommaSeparated,
			},
		},
	},
	{
		displayName: 'Team Name or ID',
		name: 'team_id',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTeams' },
		default: '',
		description:
			'Team the key belongs to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'team_id' } },
	},
	{
		displayName: 'TPM Limit',
		name: 'tpm_limit',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Tokens per minute allowed for this key',
		routing: { send: { type: 'body', property: 'tpm_limit' } },
	},
	{
		displayName: 'User ID',
		name: 'user_id',
		type: 'string',
		default: '',
		description: 'Internal user the key is assigned to',
		routing: { send: { type: 'body', property: 'user_id' } },
	},
];
