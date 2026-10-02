import type { IDataObject, IExecuteSingleFunctions, INodeExecutionData } from 'n8n-workflow';

/**
 * LiteLLM wraps most list responses in an envelope ({ keys: [...] }, { users: [...] },
 * { data: [...] }) but returns a bare array from a few endpoints. This turns either
 * shape into one n8n item per entry, and leaves anything unexpected untouched.
 */
export function splitList(property: string) {
	return async function (
		this: IExecuteSingleFunctions,
		items: INodeExecutionData[],
	): Promise<INodeExecutionData[]> {
		const result: INodeExecutionData[] = [];

		for (const item of items) {
			// A bare-array body arrives as one item whose json is the array itself, because
			// n8n hands postReceive the raw body before splitting it.
			const list = Array.isArray(item.json)
				? (item.json as unknown as IDataObject[])
				: (item.json as IDataObject | undefined)?.[property];

			if (Array.isArray(list)) {
				for (const entry of list) {
					result.push({
						json: (entry ?? {}) as IDataObject,
						pairedItem: item.pairedItem,
					});
				}
			} else {
				result.push(item);
			}
		}

		return result;
	};
}

/** Turns a comma-separated field into a trimmed array for request bodies. */
export const splitCommaSeparated =
	'={{ $value.split(",").map((part) => part.trim()).filter(Boolean) }}';
