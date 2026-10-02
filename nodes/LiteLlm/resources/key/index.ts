import type { INodeProperties } from 'n8n-workflow';
import { splitList } from '../../shared/utils';
import { keyBlockDescription } from './block';
import { keyCreateDescription } from './create';
import { keyDeleteDescription } from './remove';
import { keyGetDescription } from './get';
import { keyGetManyDescription } from './getAll';
import { keyUpdateDescription } from './update';

const showOnlyForKeys = {
	resource: ['key'],
};

export const keyDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForKeys },
		options: [
			{
				name: 'Block',
				value: 'block',
				action: 'Block a key',
				description: 'Stop a virtual key from being used, without deleting it',
				routing: { request: { method: 'POST', url: '/key/block' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a key',
				description: 'Issue a new virtual key',
				routing: { request: { method: 'POST', url: '/key/generate' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a key',
				description: 'Permanently delete one or more virtual keys',
				routing: { request: { method: 'POST', url: '/key/delete' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a key',
				description: 'Get the settings and spend of a virtual key',
				routing: { request: { method: 'GET', url: '/key/info' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many keys',
				description: 'List the virtual keys on the proxy',
				routing: {
					request: { method: 'GET', url: '/key/list' },
					output: { postReceive: [splitList('keys')] },
				},
			},
			{
				name: 'Unblock',
				value: 'unblock',
				action: 'Unblock a key',
				description: 'Allow a blocked virtual key to be used again',
				routing: { request: { method: 'POST', url: '/key/unblock' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a key',
				description: 'Change the settings of an existing virtual key',
				routing: { request: { method: 'POST', url: '/key/update' } },
			},
		],
		default: 'create',
	},
	...keyCreateDescription,
	...keyGetDescription,
	...keyGetManyDescription,
	...keyUpdateDescription,
	...keyDeleteDescription,
	...keyBlockDescription,
];
