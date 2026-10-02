# Changelog

## 0.1.0

First release.

- **Key** — Create, Get, Get Many, Update, Delete, Block, Unblock
- **Team** — Create, Get, Get Many, Update, Delete, Add Member, Remove Member
- **User** — Create, Get, Get Many, Update, Delete
- **Model** — Get Many, Get Group Info, Get Health
- **Spend** — Get Logs, Get Report (LiteLLM Enterprise only), Get Tags

Model and team pickers load their options live from the proxy. `Return All` pages through
`/key/list` and `/user/list`. No runtime dependencies.

Verified against LiteLLM `main-latest` and n8n 2.8.4: 24 of the 25 operations succeed, the
exception being `Spend → Get Report`, which LiteLLM gates behind an Enterprise licence and
rejects with HTTP 400 on the OSS build regardless of parameters.
