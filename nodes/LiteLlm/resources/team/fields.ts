import type { INodeProperties } from 'n8n-workflow';
import { splitCommaSeparated } from '../../shared/utils';

/** Settings accepted by both POST /team/new and POST /team/update. */
export const teamSettingFields: INodeProperties[] = [
	{
		displayName: 'Blocked',
		name: 'blocked',
		type: 'boolean',
		default: false,
		description: 'Whether all keys of the team are rejected',
		routing: { send: { type: 'body', property: 'blocked' } },
	},
	{
		displayName: 'Budget Duration',
		name: 'budget_duration',
		type: 'string',
		default: '',
		placeholder: 'e.g. 30d',
		description: 'How often the spend of the team resets, such as 30s, 30m, 30h or 30d',
		routing: { send: { type: 'body', property: 'budget_duration' } },
	},
	{
		displayName: 'Max Budget',
		name: 'max_budget',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 4 },
		description: 'Maximum spend for the whole team in USD',
		routing: { send: { type: 'body', property: 'max_budget' } },
	},
	{
		displayName: 'Metadata',
		name: 'metadata',
		type: 'json',
		default: '{}',
		description: 'Arbitrary JSON stored alongside the team',
		routing: { send: { type: 'body', property: 'metadata', value: '={{ JSON.parse($value) }}' } },
	},
	{
		displayName: 'Model Names or IDs',
		name: 'models',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getModels' },
		default: [],
		description:
			'Models the team may call, or every model on the proxy when left empty. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'models' } },
	},
	{
		displayName: 'RPM Limit',
		name: 'rpm_limit',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Requests per minute allowed across the team',
		routing: { send: { type: 'body', property: 'rpm_limit' } },
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		placeholder: 'e.g. production,billing',
		description: 'Comma-separated tags attached to spend logs for this team',
		routing: {
			send: {
				type: 'body',
				property: 'tags',
				value: splitCommaSeparated,
			},
		},
	},
	{
		displayName: 'TPM Limit',
		name: 'tpm_limit',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Tokens per minute allowed across the team',
		routing: { send: { type: 'body', property: 'tpm_limit' } },
	},
];

/** Reusable member picker, used by create and by the member operations. */
export const teamMemberFields: INodeProperties[] = [
	{
		displayName: 'Role',
		name: 'role',
		type: 'options',
		default: 'user',
		description: 'Role of the member inside the team',
		options: [
			{ name: 'Admin', value: 'admin' },
			{ name: 'User', value: 'user' },
		],
	},
	{
		displayName: 'User ID',
		name: 'user_id',
		type: 'string',
		default: '',
		description: 'Internal user ID of the member. Set this or the email.',
	},
	{
		displayName: 'User Email',
		name: 'user_email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		description: 'Email of the member. Set this or the user ID.',
	},
];
