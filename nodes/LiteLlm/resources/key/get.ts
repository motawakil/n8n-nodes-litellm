import type { INodeProperties } from 'n8n-workflow';

const showOnlyForKeyGet = {
	operation: ['get'],
	resource: ['key'],
};

export const keyGetDescription: INodeProperties[] = [
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		placeholder: 'e.g. sk-...',
		description: 'The virtual key to look up',
		displayOptions: { show: showOnlyForKeyGet },
		routing: { send: { type: 'query', property: 'key' } },
	},
];
