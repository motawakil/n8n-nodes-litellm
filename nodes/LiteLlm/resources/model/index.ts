import type { INodeProperties } from 'n8n-workflow';
import { raiseApiError } from '../../shared/errors';
import { splitList } from '../../shared/utils';

const showOnlyForModels = {
	resource: ['model'],
};

export const modelDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForModels },
		options: [
			{
				name: 'Get Group Info',
				value: 'getGroupInfo',
				action: 'Get model group info',
				description: 'Get the merged limits and providers behind one model group',
				routing: {
					request: { method: 'GET', url: '/model_group/info' },
					output: { postReceive: [raiseApiError, splitList('data')] },
				},
			},
			{
				name: 'Get Health',
				value: 'getHealth',
				action: 'Get model health',
				description: 'Run a health check against every configured model. Can be slow.',
				routing: { request: { method: 'GET', url: '/health' }, output: { postReceive: [raiseApiError] } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many models',
				description: 'List the models configured on the proxy, with their LiteLLM parameters',
				routing: {
					request: { method: 'GET', url: '/model/info' },
					output: { postReceive: [raiseApiError, splitList('data')] },
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Model Name or ID',
		name: 'model_group',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getModels' },
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: { show: { ...showOnlyForModels, operation: ['getGroupInfo'] } },
		routing: { send: { type: 'query', property: 'model_group' } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...showOnlyForModels, operation: ['getAll'] } },
		options: [
			{
				displayName: 'LiteLLM Model ID',
				name: 'litellm_model_id',
				type: 'string',
				default: '',
				description: 'Return only the deployment with this internal model ID',
				routing: { send: { type: 'query', property: 'litellm_model_id' } },
			},
		],
	},
];
