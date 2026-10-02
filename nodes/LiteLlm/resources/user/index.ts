import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { splitCommaSeparated, splitList } from '../../shared/utils';
import { userSettingFields } from './fields';

const showOnlyForUsers = {
	resource: ['user'],
};

export const userDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForUsers },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a user',
				description: 'Create a new internal user',
				routing: { request: { method: 'POST', url: '/user/new' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a user',
				description: 'Permanently delete one or more internal users',
				routing: { request: { method: 'POST', url: '/user/delete' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a user',
				description: 'Get the settings, keys and spend of an internal user',
				routing: { request: { method: 'GET', url: '/user/info' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many users',
				description: 'List the internal users on the proxy',
				routing: {
					request: { method: 'GET', url: '/user/list' },
					output: { postReceive: [splitList('users')] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a user',
				description: 'Change the settings of an existing internal user',
				routing: { request: { method: 'POST', url: '/user/update' } },
			},
		],
		default: 'create',
	},

	// Create
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { ...showOnlyForUsers, operation: ['create'] } },
		options: [
			{
				displayName: 'Auto Create Key',
				name: 'auto_create_key',
				type: 'boolean',
				default: true,
				description: 'Whether to issue a virtual key for the user straight away',
				routing: { send: { type: 'body', property: 'auto_create_key' } },
			},
			{
				displayName: 'Send Invite Email',
				name: 'send_invite_email',
				type: 'boolean',
				default: false,
				description: 'Whether the proxy emails an invite link to the user',
				routing: { send: { type: 'body', property: 'send_invite_email' } },
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'Set a fixed user ID instead of letting the proxy generate one',
				routing: { send: { type: 'body', property: 'user_id' } },
			},
			...userSettingFields,
		],
	},

	// Get
	{
		displayName: 'User ID',
		name: 'user_id',
		type: 'string',
		default: '',
		required: true,
		description: 'Internal user to look up',
		displayOptions: { show: { ...showOnlyForUsers, operation: ['get'] } },
		routing: { send: { type: 'query', property: 'user_id' } },
	},

	// Get Many
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { ...showOnlyForUsers, operation: ['getAll'] } },
		routing: {
			send: {
				paginate: '={{ $value }}',
				type: 'query',
				property: 'page_size',
				value: '100',
			},
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						// See the note in resources/key/getAll.ts: no $pageCount, shallow qs merge.
						continue: '={{ !!($response.body) && ((($response.body.current_page || $response.body.page || 0) < ($response.body.total_pages || 0))) }}',
						request: {
							qs: '={{ Object.assign({}, $request.qs, { page: ((($response.body || {}).current_page || ($response.body || {}).page || 0) + 1) }) }}' as unknown as IDataObject,
						},
					},
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		description: 'Max number of results to return',
		displayOptions: {
			show: { ...showOnlyForUsers, operation: ['getAll'], returnAll: [false] },
		},
		routing: {
			send: { type: 'query', property: 'page_size' },
			output: { maxResults: '={{ $value }}' },
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...showOnlyForUsers, operation: ['getAll'] } },
		options: [
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				default: 'internal_user',
				description: 'Return only users with this role',
				options: [
					{ name: 'Internal User', value: 'internal_user' },
					{ name: 'Internal User Viewer', value: 'internal_user_viewer' },
					{ name: 'Proxy Admin', value: 'proxy_admin' },
					{ name: 'Proxy Admin Viewer', value: 'proxy_admin_viewer' },
				],
				routing: { send: { type: 'query', property: 'role' } },
			},
			{
				displayName: 'User IDs',
				name: 'user_ids',
				type: 'string',
				default: '',
				placeholder: 'e.g. user-a,user-b',
				description: 'Comma-separated list of user IDs to return',
				routing: { send: { type: 'query', property: 'user_ids' } },
			},
		],
	},

	// Update
	{
		displayName: 'User ID',
		name: 'user_id',
		type: 'string',
		default: '',
		required: true,
		description: 'Internal user to update',
		displayOptions: { show: { ...showOnlyForUsers, operation: ['update'] } },
		routing: { send: { type: 'body', property: 'user_id' } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { ...showOnlyForUsers, operation: ['update'] } },
		options: userSettingFields,
	},

	// Delete
	{
		displayName: 'User IDs',
		name: 'user_ids',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. user-a,user-b',
		description: 'Comma-separated list of internal user IDs to delete',
		displayOptions: { show: { ...showOnlyForUsers, operation: ['delete'] } },
		routing: {
			send: {
				type: 'body',
				property: 'user_ids',
				value: splitCommaSeparated,
			},
		},
	},
];
