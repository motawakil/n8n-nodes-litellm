import type { INodeProperties } from 'n8n-workflow';
import { raiseApiError } from '../../shared/errors';

const showOnlyForSpend = {
	resource: ['spend'],
};

const dateDescription = 'Date in YYYY-MM-DD format, or a timestamp as YYYY-MM-DD HH:MM:SS';

export const spendDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForSpend },
		options: [
			{
				name: 'Get Logs',
				value: 'getLogs',
				action: 'Get spend logs',
				description: 'Get the individual request logs with their cost',
				routing: { request: { method: 'GET', url: '/spend/logs' }, output: { postReceive: [raiseApiError] } },
			},
			{
				name: 'Get Report',
				value: 'getReport',
				action: 'Get a spend report',
				description:
					'Get spend grouped by team, customer or key over a date range. Requires a LiteLLM Enterprise license.',
				routing: { request: { method: 'GET', url: '/global/spend/report' }, output: { postReceive: [raiseApiError] } },
			},
			{
				name: 'Get Tags',
				value: 'getTags',
				action: 'Get spend by tag',
				description: 'Get spend grouped by the tags attached to requests',
				routing: { request: { method: 'GET', url: '/spend/tags' }, output: { postReceive: [raiseApiError] } },
			},
		],
		default: 'getLogs',
	},

	// Get Logs
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...showOnlyForSpend, operation: ['getLogs'] } },
		options: [
			{
				displayName: 'API Key',
				name: 'api_key',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Return only logs of this virtual key, or of its hash',
				routing: { send: { type: 'query', property: 'api_key' } },
			},
			{
				displayName: 'End Date',
				name: 'end_date',
				type: 'string',
				default: '',
				placeholder: 'e.g. 2026-01-31',
				description: dateDescription,
				routing: { send: { type: 'query', property: 'end_date' } },
			},
			{
				displayName: 'Request ID',
				name: 'request_id',
				type: 'string',
				default: '',
				description: 'Return only the log of this single request',
				routing: { send: { type: 'query', property: 'request_id' } },
			},
			{
				displayName: 'Start Date',
				name: 'start_date',
				type: 'string',
				default: '',
				placeholder: 'e.g. 2026-01-01',
				description: dateDescription,
				routing: { send: { type: 'query', property: 'start_date' } },
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'Return only logs of this internal user',
				routing: { send: { type: 'query', property: 'user_id' } },
			},
		],
	},

	// Get Report
	{
		displayName: 'Start Date',
		name: 'start_date',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 2026-01-01',
		description: dateDescription,
		displayOptions: { show: { ...showOnlyForSpend, operation: ['getReport'] } },
		routing: { send: { type: 'query', property: 'start_date' } },
	},
	{
		displayName: 'End Date',
		name: 'end_date',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 2026-01-31',
		description: dateDescription,
		displayOptions: { show: { ...showOnlyForSpend, operation: ['getReport'] } },
		routing: { send: { type: 'query', property: 'end_date' } },
	},
	{
		displayName: 'Group By',
		name: 'group_by',
		type: 'options',
		default: 'team',
		description: 'How to aggregate the spend over the date range',
		displayOptions: { show: { ...showOnlyForSpend, operation: ['getReport'] } },
		options: [
			{ name: 'API Key', value: 'api_key' },
			{ name: 'Customer', value: 'customer' },
			{ name: 'Team', value: 'team' },
		],
		routing: { send: { type: 'query', property: 'group_by' } },
	},
];
