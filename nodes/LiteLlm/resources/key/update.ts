import type { INodeProperties } from 'n8n-workflow';
import { keySettingFields } from './fields';

const showOnlyForKeyUpdate = {
	operation: ['update'],
	resource: ['key'],
};

export const keyUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		placeholder: 'e.g. sk-...',
		description: 'The virtual key to update',
		displayOptions: { show: showOnlyForKeyUpdate },
		routing: { send: { type: 'body', property: 'key' } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showOnlyForKeyUpdate },
		options: [
			{
				displayName: 'Key Alias',
				name: 'key_alias',
				type: 'string',
				default: '',
				description: 'Human readable name for the key, unique across the proxy',
				routing: { send: { type: 'body', property: 'key_alias' } },
			},
			...keySettingFields,
		],
	},
];
