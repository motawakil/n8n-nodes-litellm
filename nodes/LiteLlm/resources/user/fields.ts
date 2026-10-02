import type { INodeProperties } from 'n8n-workflow';

/** Settings accepted by both POST /user/new and POST /user/update. */
export const userSettingFields: INodeProperties[] = [
	{
		displayName: 'Budget Duration',
		name: 'budget_duration',
		type: 'string',
		default: '',
		placeholder: 'e.g. 30d',
		description: 'How often the spend of the user resets, such as 30s, 30m, 30h or 30d',
		routing: { send: { type: 'body', property: 'budget_duration' } },
	},
	{
		displayName: 'Max Budget',
		name: 'max_budget',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 4 },
		description: 'Maximum spend for this user in USD',
		routing: { send: { type: 'body', property: 'max_budget' } },
	},
	{
		displayName: 'Metadata',
		name: 'metadata',
		type: 'json',
		default: '{}',
		description: 'Arbitrary JSON stored alongside the user',
		routing: { send: { type: 'body', property: 'metadata', value: '={{ JSON.parse($value) }}' } },
	},
	{
		displayName: 'Model Names or IDs',
		name: 'models',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getModels' },
		default: [],
		description:
			'Models this user may call. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'models' } },
	},
	{
		displayName: 'RPM Limit',
		name: 'rpm_limit',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Requests per minute allowed for this user',
		routing: { send: { type: 'body', property: 'rpm_limit' } },
	},
	{
		displayName: 'Team Names or IDs',
		name: 'teams',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getTeams' },
		default: [],
		description:
			'Teams the user belongs to. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'teams' } },
	},
	{
		displayName: 'TPM Limit',
		name: 'tpm_limit',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Tokens per minute allowed for this user',
		routing: { send: { type: 'body', property: 'tpm_limit' } },
	},
	{
		displayName: 'User Email',
		name: 'user_email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		description: 'Email of the user, used for invites and budget alerts',
		routing: { send: { type: 'body', property: 'user_email' } },
	},
	{
		displayName: 'User Role',
		name: 'user_role',
		type: 'options',
		default: 'internal_user',
		description: 'What the user may do on the proxy',
		options: [
			{
				name: 'Internal User',
				value: 'internal_user',
				description: 'Can create keys and spend within their own budget',
			},
			{
				name: 'Internal User Viewer',
				value: 'internal_user_viewer',
				description: 'Can only view their own keys and spend',
			},
			{
				name: 'Proxy Admin',
				value: 'proxy_admin',
				description: 'Full admin rights over the whole proxy',
			},
			{
				name: 'Proxy Admin Viewer',
				value: 'proxy_admin_viewer',
				description: 'Can view everything on the proxy but change nothing',
			},
		],
		routing: { send: { type: 'body', property: 'user_role' } },
	},
];
