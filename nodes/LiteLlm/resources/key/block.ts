import type { INodeProperties } from 'n8n-workflow';

const showOnlyForKeyBlocking = {
	operation: ['block', 'unblock'],
	resource: ['key'],
};

export const keyBlockDescription: INodeProperties[] = [
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		placeholder: 'e.g. sk-...',
		description: 'The virtual key to block or unblock',
		displayOptions: { show: showOnlyForKeyBlocking },
		routing: { send: { type: 'body', property: 'key' } },
	},
];
