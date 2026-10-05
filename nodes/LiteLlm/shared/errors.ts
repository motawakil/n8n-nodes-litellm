import {
	NodeApiError,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type JsonObject,
} from 'n8n-workflow';

/** One FastAPI validation entry, as LiteLLM returns them for a 422. */
type ValidationItem = { loc?: unknown[]; msg?: string; input?: unknown };

function formatValidation(entries: ValidationItem[]): string {
	return entries
		.map((entry) => {
			// loc is like ["query", "page"]; the last element is the field name
			const field = Array.isArray(entry.loc) ? entry.loc[entry.loc.length - 1] : undefined;
			const got = entry.input === undefined ? '' : ` (received ${JSON.stringify(entry.input)})`;
			return `${field ? `${String(field)}: ` : ''}${entry.msg ?? 'invalid value'}${got}`;
		})
		.join('; ');
}

/**
 * LiteLLM reports failures in several shapes depending on the endpoint:
 *   { detail: { error: "..." } }        most management endpoints
 *   { detail: "..." }                   simple rejections
 *   { detail: [ {loc, msg, input} ] }   FastAPI request validation (422)
 *   { error: { message: "..." } }       OpenAI-compatible routes
 * Pull the most specific text out of whichever one we got.
 */
export function extractErrorMessage(body: unknown): string | undefined {
	if (typeof body === 'string') return body.trim() || undefined;
	if (!body || typeof body !== 'object') return undefined;

	const data = body as IDataObject;
	const detail = data.detail;

	if (typeof detail === 'string') return detail;
	if (Array.isArray(detail)) {
		const formatted = formatValidation(detail as ValidationItem[]);
		if (formatted) return formatted;
	}
	if (detail && typeof detail === 'object') {
		const inner = detail as IDataObject;
		if (typeof inner.error === 'string') return inner.error;
		if (inner.error && typeof inner.error === 'object') {
			const msg = (inner.error as IDataObject).message;
			if (typeof msg === 'string') return msg;
		}
		if (typeof inner.message === 'string') return inner.message;
	}

	if (typeof data.error === 'string') return data.error;
	if (data.error && typeof data.error === 'object') {
		const msg = (data.error as IDataObject).message;
		if (typeof msg === 'string') return msg;
	}
	if (typeof data.message === 'string') return data.message;

	return undefined;
}

/**
 * Raise LiteLLM's own error text instead of n8n's generic status-code wording.
 *
 * The node sets `ignoreHttpStatusErrors` so failed responses reach postReceive
 * intact; without this every 4xx would surface as "Bad request - please check
 * your parameters", which is the same string for a duplicate key alias, a bad
 * budget and a malformed date.
 */
export async function raiseApiError(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const status = Number(response.statusCode);
	if (!status || status < 400) return items;

	const message = extractErrorMessage(response.body);

	throw new NodeApiError(this.getNode(), (response.body ?? {}) as JsonObject, {
		httpCode: String(status),
		...(message ? { message } : {}),
		description: `LiteLLM returned HTTP ${status}`,
	});
}
