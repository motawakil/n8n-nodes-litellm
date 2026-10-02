import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { liteLlmApiRequest } from '../shared/transport';

type ModelInfoResponse = {
	data?: Array<{ model_name?: string }>;
};

/** Model groups configured on the proxy, as shown by GET /model/info. */
export async function getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = (await liteLlmApiRequest.call(this, 'GET', '/model/info')) as ModelInfoResponse;

	const names = new Set<string>();
	for (const model of response?.data ?? []) {
		if (model?.model_name) names.add(model.model_name);
	}

	const options: INodePropertyOptions[] = [...names]
		.sort((a, b) => a.localeCompare(b))
		.map((name) => ({ name, value: name }));

	return [
		{ name: 'All Proxy Models', value: 'all-proxy-models' },
		{ name: 'All Team Models', value: 'all-team-models' },
		...options,
	];
}
