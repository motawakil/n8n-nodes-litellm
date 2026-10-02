import type { INodeProperties } from 'n8n-workflow';
import { splitCommaSeparated } from '../../shared/utils';

const showOnlyForKeyDelete = {
	operation: ['delete'],
	resource: ['key'],
};

export const keyDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Delete By',
		name: 'deleteBy',
		type: 'options',
		default: 'keys',
		description: 'Whether to delete the keys by value or by alias',
		displayOptions: { show: showOnlyForKeyDelete },
		options: [
			{ name: 'Key', value: 'keys' },
			{ name: 'Key Alias', value: 'key_aliases' },
		],
	},
	{
		displayName: 'Keys',
		name: 'keys',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		placeholder: 'e.g. sk-...,sk-...',
		description: 'Comma-separated list of virtual keys to delete',
		displayOptions: { show: { ...showOnlyForKeyDelete, deleteBy: ['keys'] } },
		routing: {
			send: {
				type: 'body',
				property: 'keys',
				value: splitCommaSeparated,
			},
		},
	},
	{
		displayName: 'Key Aliases',
		name: 'key_aliases',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. kzm-production,kzm-staging',
		description: 'Comma-separated list of key aliases to delete',
		displayOptions: { show: { ...showOnlyForKeyDelete, deleteBy: ['key_aliases'] } },
		routing: {
			send: {
				type: 'body',
				property: 'key_aliases',
				value: splitCommaSeparated,
			},
		},
	},
];
