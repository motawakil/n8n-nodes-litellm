import type { IDataObject, INodeProperties } from 'n8n-workflow';

const showOnlyForKeyGetMany = {
	operation: ['getAll'],
	resource: ['key'],
};

export const keyGetManyDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: showOnlyForKeyGetMany },
		routing: {
			send: {
				paginate: '={{ $value }}',
				type: 'query',
				property: 'size',
				value: '100',
			},
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						// Only $request/$response/$version exist here: the declarative routing node
						// does not provide $pageCount. The whole qs is rebuilt because the pagination
						// request is merged with a shallow spread, which would drop size and filters.
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
		displayOptions: { show: { ...showOnlyForKeyGetMany, returnAll: [false] } },
		routing: {
			send: { type: 'query', property: 'size' },
			output: { maxResults: '={{ $value }}' },
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showOnlyForKeyGetMany },
		options: [
			{
				displayName: 'Include Team Keys',
				name: 'include_team_keys',
				type: 'boolean',
				default: false,
				description: 'Whether to include keys that belong to the teams of the user',
				routing: { send: { type: 'query', property: 'include_team_keys' } },
			},
			{
				displayName: 'Key Alias',
				name: 'key_alias',
				type: 'string',
				default: '',
				description: 'Return only the key with this alias',
				routing: { send: { type: 'query', property: 'key_alias' } },
			},
			{
				displayName: 'Return Full Object',
				name: 'return_full_object',
				type: 'boolean',
				default: true,
				description: 'Whether to return the full key object instead of only the key hash',
				routing: { send: { type: 'query', property: 'return_full_object' } },
			},
			{
				displayName: 'Team Name or ID',
				name: 'team_id',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getTeams' },
				default: '',
				description:
					'Return only keys of this team. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				routing: { send: { type: 'query', property: 'team_id' } },
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'Return only keys of this internal user',
				routing: { send: { type: 'query', property: 'user_id' } },
			},
		],
	},
];
