import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LiteLlmApi implements ICredentialType {
	name = 'liteLlmApi';

	displayName = 'LiteLLM API';

	icon: Icon = { light: 'file:../icons/litellm.svg', dark: 'file:../icons/litellm.dark.svg' };

	documentationUrl = 'https://docs.litellm.ai/docs/proxy/virtual_keys';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'e.g. https://litellm.example.com',
			description: 'Base URL of the LiteLLM proxy, without a trailing path',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Master key or a virtual key with admin rights. Management operations such as issuing keys require the master key or an admin key.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl.replace(/\\/+$/, "") }}',
			url: '/v1/models',
			method: 'GET',
			// Without this header a base URL pointing at any single-page app answers the
			// catch-all route with 200 and an HTML page, and the test passes against it.
			headers: { Accept: 'application/json' },
		},
	};
}
