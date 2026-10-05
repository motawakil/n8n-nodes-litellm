import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { getModels } from './listSearch/getModels';
import { getTeams } from './listSearch/getTeams';
import { keyDescription } from './resources/key';
import { modelDescription } from './resources/model';
import { spendDescription } from './resources/spend';
import { teamDescription } from './resources/team';
import { userDescription } from './resources/user';

export class LiteLlm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LiteLLM',
		name: 'liteLlm',
		icon: { light: 'file:../../icons/litellm.svg', dark: 'file:../../icons/litellm.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage virtual keys, teams, users and spend on a LiteLLM proxy',
		defaults: {
			name: 'LiteLLM',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'liteLlmApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{ $credentials.baseUrl.replace(/\\/+$/, "") }}',
			// Failed responses are handled by raiseApiError in postReceive so that
			// LiteLLM's own message survives instead of n8n's generic status wording.
			ignoreHttpStatusErrors: true,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Key',
						value: 'key',
					},
					{
						name: 'Model',
						value: 'model',
					},
					{
						name: 'Spend',
						value: 'spend',
					},
					{
						name: 'Team',
						value: 'team',
					},
					{
						name: 'User',
						value: 'user',
					},
				],
				default: 'key',
			},
			...keyDescription,
			...modelDescription,
			...spendDescription,
			...teamDescription,
			...userDescription,
		],
	};

	methods = {
		loadOptions: {
			getModels,
			getTeams,
		},
	};
}
