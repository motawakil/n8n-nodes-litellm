import type { INodeProperties } from 'n8n-workflow';
import { keySettingFields } from './fields';

const showOnlyForKeyCreate = {
	operation: ['create'],
	resource: ['key'],
};

export const keyCreateDescription: INodeProperties[] = [
	{
		displayName: 'Key Alias',
		name: 'key_alias',
		type: 'string',
		default: '',
		placeholder: 'e.g. kzm-production',
		description: 'Human readable name for the key, unique across the proxy',
		displayOptions: { show: showOnlyForKeyCreate },
		routing: { send: { type: 'body', property: 'key_alias' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showOnlyForKeyCreate },
		options: keySettingFields,
	},
];
