import type { INodeProperties } from 'n8n-workflow';
import { raiseApiError } from '../../shared/errors';
import { splitCommaSeparated, splitList } from '../../shared/utils';
import { teamMemberFields, teamSettingFields } from './fields';

const showOnlyForTeams = {
	resource: ['team'],
};

const teamIdSelect: INodeProperties = {
	displayName: 'Team Name or ID',
	name: 'team_id',
	type: 'options',
	typeOptions: { loadOptionsMethod: 'getTeams' },
	default: '',
	required: true,
	description:
		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
};

export const teamDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForTeams },
		options: [
			{
				name: 'Add Member',
				value: 'addMember',
				action: 'Add a member to a team',
				description: 'Add a user to a team',
				routing: { request: { method: 'POST', url: '/team/member_add' }, output: { postReceive: [raiseApiError] } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a team',
				description: 'Create a new team with its own budget and model access',
				routing: { request: { method: 'POST', url: '/team/new' }, output: { postReceive: [raiseApiError] } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a team',
				description: 'Permanently delete a team and its keys',
				routing: { request: { method: 'POST', url: '/team/delete' }, output: { postReceive: [raiseApiError] } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a team',
				description: 'Get the settings, members and spend of a team',
				routing: { request: { method: 'GET', url: '/team/info' }, output: { postReceive: [raiseApiError] } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many teams',
				description: 'List the teams on the proxy',
				routing: {
					request: { method: 'GET', url: '/team/list' },
					output: { postReceive: [raiseApiError, splitList('teams')] },
				},
			},
			{
				name: 'Remove Member',
				value: 'removeMember',
				action: 'Remove a member from a team',
				description: 'Remove a user from a team',
				routing: { request: { method: 'POST', url: '/team/member_delete' }, output: { postReceive: [raiseApiError] } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a team',
				description: 'Change the settings of an existing team',
				routing: { request: { method: 'POST', url: '/team/update' }, output: { postReceive: [raiseApiError] } },
			},
		],
		default: 'create',
	},

	// Create
	{
		displayName: 'Team Alias',
		name: 'team_alias',
		type: 'string',
		default: '',
		placeholder: 'e.g. data-platform',
		description: 'Human readable name for the team',
		displayOptions: { show: { ...showOnlyForTeams, operation: ['create'] } },
		routing: { send: { type: 'body', property: 'team_alias' } },
	},
	{
		displayName: 'Members',
		name: 'members_with_roles',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Member',
		default: {},
		displayOptions: { show: { ...showOnlyForTeams, operation: ['create'] } },
		options: [
			{
				displayName: 'Member',
				name: 'member',
				values: teamMemberFields,
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'members_with_roles',
				value:
					'={{ ($value.member ?? []).map((member) => Object.fromEntries(Object.entries(member).filter(([, entry]) => entry !== ""))) }}',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { ...showOnlyForTeams, operation: ['create'] } },
		options: [
			{
				displayName: 'Team ID',
				name: 'team_id',
				type: 'string',
				default: '',
				description: 'Set a fixed team ID instead of letting the proxy generate one',
				routing: { send: { type: 'body', property: 'team_id' } },
			},
			...teamSettingFields,
		],
	},

	// Get
	{
		...teamIdSelect,
		displayOptions: { show: { ...showOnlyForTeams, operation: ['get'] } },
		routing: { send: { type: 'query', property: 'team_id' } },
	},

	// Get Many
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...showOnlyForTeams, operation: ['getAll'] } },
		options: [
			{
				displayName: 'Organization ID',
				name: 'organization_id',
				type: 'string',
				default: '',
				description: 'Return only teams of this organization',
				routing: { send: { type: 'query', property: 'organization_id' } },
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'Return only teams this internal user belongs to',
				routing: { send: { type: 'query', property: 'user_id' } },
			},
		],
	},

	// Update
	{
		...teamIdSelect,
		displayOptions: { show: { ...showOnlyForTeams, operation: ['update'] } },
		routing: { send: { type: 'body', property: 'team_id' } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { ...showOnlyForTeams, operation: ['update'] } },
		options: [
			{
				displayName: 'Team Alias',
				name: 'team_alias',
				type: 'string',
				default: '',
				description: 'Human readable name for the team',
				routing: { send: { type: 'body', property: 'team_alias' } },
			},
			...teamSettingFields,
		],
	},

	// Delete
	{
		displayName: 'Team IDs',
		name: 'team_ids',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. team-abc,team-def',
		description: 'Comma-separated list of team IDs to delete',
		displayOptions: { show: { ...showOnlyForTeams, operation: ['delete'] } },
		routing: {
			send: {
				type: 'body',
				property: 'team_ids',
				value: splitCommaSeparated,
			},
		},
	},

	// Add member / remove member
	{
		...teamIdSelect,
		displayOptions: { show: { ...showOnlyForTeams, operation: ['addMember', 'removeMember'] } },
		routing: { send: { type: 'body', property: 'team_id' } },
	},
	{
		displayName: 'Member',
		name: 'member',
		type: 'fixedCollection',
		placeholder: 'Add Member',
		default: {},
		displayOptions: { show: { ...showOnlyForTeams, operation: ['addMember'] } },
		options: [
			{
				displayName: 'Member',
				name: 'member',
				values: teamMemberFields,
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'member',
				value:
					'={{ Object.fromEntries(Object.entries($value.member ?? {}).filter(([, entry]) => entry !== "")) }}',
			},
		},
	},
	{
		displayName: 'Identify Member By',
		name: 'identifyMemberBy',
		type: 'options',
		default: 'user_id',
		description: 'Whether to remove the member by internal user ID or by email',
		displayOptions: { show: { ...showOnlyForTeams, operation: ['removeMember'] } },
		options: [
			{ name: 'User Email', value: 'user_email' },
			{ name: 'User ID', value: 'user_id' },
		],
	},
	{
		displayName: 'User ID',
		name: 'user_id',
		type: 'string',
		default: '',
		required: true,
		description: 'Internal user ID of the member to remove',
		displayOptions: {
			show: { ...showOnlyForTeams, operation: ['removeMember'], identifyMemberBy: ['user_id'] },
		},
		routing: { send: { type: 'body', property: 'user_id' } },
	},
	{
		displayName: 'User Email',
		name: 'user_email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		required: true,
		description: 'Email of the member to remove',
		displayOptions: {
			show: { ...showOnlyForTeams, operation: ['removeMember'], identifyMemberBy: ['user_email'] },
		},
		routing: { send: { type: 'body', property: 'user_email' } },
	},
];
