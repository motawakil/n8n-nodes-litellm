# @motaouakel/n8n-nodes-litellm

An [n8n](https://n8n.io) community node for the **LiteLLM proxy management API** — issuing virtual
keys, managing teams and internal users, inspecting models, and pulling spend reports.

This node deliberately does **not** wrap `/chat/completions`. n8n's built-in OpenAI node and OpenAI
Chat Model sub-node already accept a custom base URL, so they talk to a LiteLLM proxy today. The gap
this package fills is everything around the inference call: who gets a key, what it may spend, and
what it actually spent.

## Resources and operations

| Resource | Operations | Endpoints |
| --- | --- | --- |
| **Key** | Create, Get, Get Many, Update, Delete, Block, Unblock | `/key/generate`, `/key/info`, `/key/list`, `/key/update`, `/key/delete`, `/key/block`, `/key/unblock` |
| **Team** | Create, Get, Get Many, Update, Delete, Add Member, Remove Member | `/team/new`, `/team/info`, `/team/list`, `/team/update`, `/team/delete`, `/team/member_add`, `/team/member_delete` |
| **User** | Create, Get, Get Many, Update, Delete | `/user/new`, `/user/info`, `/user/list`, `/user/update`, `/user/delete` |
| **Model** | Get Many, Get Group Info, Get Health | `/model/info`, `/model_group/info`, `/health` |
| **Spend** | Get Logs, Get Report¹, Get Tags | `/spend/logs`, `/global/spend/report`, `/spend/tags` |

¹ `Get Report` calls `/global/spend/report`, which LiteLLM gates behind an Enterprise licence; on
the OSS build it returns 400 regardless of parameters. Every other operation works on OSS.

Model and team pickers load their options live from the proxy, so a key's allowed models and a
user's teams are chosen from a dropdown rather than typed.

## Credentials

Create a **LiteLLM API** credential with:

- **Base URL** — the proxy root, for example `https://litellm.example.com`. A trailing slash is
  stripped automatically.
- **API Key** — the master key (`LITELLM_MASTER_KEY`) or a virtual key with admin rights. Most
  management endpoints reject non-admin keys.

The credential test calls `GET /v1/models`, which is authenticated, so a wrong key fails the test
rather than passing against an unauthenticated health endpoint.

## Install

### On a self-hosted n8n

Settings → Community Nodes → Install → `@motaouakel/n8n-nodes-litellm`.

### Local development

```bash
npm install
npm run build
npm link
```

Then register the link in your n8n custom folder:

```bash
mkdir -p ~/.n8n/custom && cd ~/.n8n/custom && npm init -y && npm link @motaouakel/n8n-nodes-litellm
```

Restart n8n and the node appears in the panel. `npm run dev` runs the n8n node CLI dev loop instead,
which rebuilds and reloads for you.

For a Docker-based instance, mount a host directory at `/home/node/.n8n/custom` and put the built
package there, then restart the container.

## Design constraints

The package has **no runtime dependencies**, which is what n8n requires for verified status and for
installability on n8n Cloud:

- all HTTP goes through declarative `routing` or `this.helpers.httpRequestWithAuthentication`
- no `axios`, `node-fetch`, `fs`, `child_process`, or environment access
- `n8n-workflow` is a `peerDependency`

Everything except option loading is declarative; `nodes/LiteLlm/shared/transport.ts` exists only
because `loadOptions` methods cannot use the routing layer.

## Declarative pagination

`$pageCount` does not exist in a declarative node. The routing node builds pagination expressions
with only `$request`, `$response` and `$version` (`routing-node.ts`), so `$pageCount` silently
evaluates to `undefined` and the page number goes out as `NaN`. Derive the next page from
`$response.body` instead. The pagination request is also merged into the base request with a
*shallow* spread, so returning `{ qs: { page: n } }` replaces the entire query string and drops the
page size and every filter from page two onward — rebuild the whole `qs` from `$request.qs`.

## Base URL and IPv6

Use an explicit IP rather than `localhost` when the proxy is a container published on a loopback
port. n8n's request helper resolves `localhost` to `::1` and does not fall back to IPv4, while
Colima and Docker Desktop publish `127.0.0.1:<port>` as IPv4 only — the node then fails with
`connect ECONNREFUSED ::1:4000` even though curl, node and axios all reach the same URL, because
those do fall back. `http://127.0.0.1:4000` works; `http://localhost:4000` does not.

## Codex categories

`LiteLlm.node.json` must **not** list `AI` in `categories`. The editor's node panel runs
`filterOutAiNodes` on every non-AI view, including search: a node tagged `AI` is dropped unless its
codex also declares `subcategories.AI` containing `Root Nodes`. A node with the `AI` category and no
AI subcategory is therefore invisible in both the regular panel and the AI panel — it loads fine
server-side and simply never appears. The `usableAsTool` flag already gives us a generated
`liteLlmTool` variant that n8n tags `AI` / `Tools` itself, which is the correct home for it.

## Response shapes

LiteLLM returns list endpoints in two different shapes depending on the endpoint and version — a
bare array, or an envelope such as `{ keys: [...] }`. `shared/utils.ts` normalises both into one n8n
item per entry, and passes anything unexpected through untouched, so a LiteLLM upgrade that changes
an envelope degrades to "one item containing the raw body" rather than an error.

## Not in scope (yet)

- **Chat completions.** Use the OpenAI node with a custom base URL.
- **A LiteLLM chat-model sub-node** feeding AI Agent nodes. That needs `supplyData` against the
  `@n8n/n8n-nodes-langchain` patterns and is a separate build. The OpenAI Chat Model sub-node with a
  custom base URL covers most of it today.
- **Deployment management** (`/model/new`, `/model/delete`) and organizations.

## License

[MIT](LICENSE.md)
