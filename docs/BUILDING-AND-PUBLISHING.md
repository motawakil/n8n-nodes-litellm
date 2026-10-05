# Building and publishing an n8n community node

A walkthrough of how this package was built, tested, released and published, written so
each moving part makes sense on its own. It uses this repository as the worked example.

---

## Part 1 — What an n8n node actually is

n8n is a workflow engine. A workflow is a graph of **nodes**; each node receives items,
does something, and passes items on. A node that talks to an external service is an
*integration* — "Slack", "Postgres", "HTTP Request".

There are three kinds:

| Kind | Where it lives | Who can install it |
| --- | --- | --- |
| **Built-in** | inside the `n8n-nodes-base` package | everyone, shipped with n8n |
| **Community** | a separate npm package | self-hosted users; Cloud only once *verified* |
| **Custom / local** | a folder on your machine | only you |

A community node is **just an npm package**. There is no plugin registry, no SDK download,
no approval needed to make one. n8n discovers it by reading your `package.json`.

Four things make a package an n8n node:

1. The name starts with `n8n-nodes-` or `@scope/n8n-nodes-`.
2. `keywords` contains `n8n-community-node-package`.
3. An `n8n` block points at the **compiled JavaScript**:

```json
"n8n": {
  "n8nNodesApiVersion": 1,
  "credentials": ["dist/credentials/LiteLlmApi.credentials.js"],
  "nodes": ["dist/nodes/LiteLlm/LiteLlm.node.js"]
}
```

4. `n8n-workflow` is a **peerDependency**, never a regular dependency.

That last one matters: n8n already has `n8n-workflow` loaded. If your package bundled its
own copy you would have two different versions of the same classes in memory, and
`instanceof` checks would start failing. A peer dependency means "I need this, but the
host provides it".

### Declarative vs programmatic nodes

Two ways to write a node:

- **Programmatic** — you write an `execute()` method and make HTTP calls yourself. Full
  control. Needed for streaming, binary data, or complex multi-step logic.
- **Declarative** — you *describe* the request in the parameter definitions and n8n builds
  and sends it. Less code, less that can go wrong, and n8n's own tooling understands it.

LiteLLM's management API is plain REST, so this package is declarative. The trade-off we
hit: error messages. n8n constructs the error from the HTTP status, so LiteLLM's actual
message (`{"detail":{"error":"..."}}`) gets flattened into a generic
"Bad request - please check your parameters". That is the main cost of the declarative
style here.

---

## Part 2 — How this node is put together

```
credentials/LiteLlmApi.credentials.ts   how to authenticate
icons/litellm.svg                       the icon (light + dark)
nodes/LiteLlm/
  LiteLlm.node.ts                       the node: resources + defaults
  LiteLlm.node.json                     "codex": categories and doc links
  resources/key/…                       one folder per resource
  shared/transport.ts                   manual HTTP, used only by loadOptions
  shared/utils.ts                       response reshaping
  listSearch/getModels.ts               dropdown contents, fetched live
```

### The credential class

Implements `ICredentialType`. Three jobs:

- **`properties`** — the fields the user fills in (Base URL, API Key).
- **`authenticate`** — how those get attached to every request:

```ts
authenticate = {
  type: 'generic',
  properties: { headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } },
};
```

The leading `=` marks the string as an **expression**. Everything in `{{ }}` is evaluated
at runtime.

- **`test`** — a cheap request n8n fires when you click "Test". Choose it carefully: it
  must *fail* for a bad credential. Our first version hit an endpoint without an
  `Accept: application/json` header, and n8n's own web UI answered with `200` and an HTML
  page — so the test passed while pointing at completely the wrong server.

### Resources and operations

The two standard dropdowns. **Resource** = the kind of thing (Key, Team, User).
**Operation** = what to do with it (Create, Get, Delete). Every operation declares its
HTTP call inline:

```ts
{
  name: 'Create',
  value: 'create',
  action: 'Create a key',
  routing: { request: { method: 'POST', url: '/key/generate' } },
}
```

### routing — how a field becomes part of a request

Each input field says where its value goes:

```ts
{
  displayName: 'Key Alias',
  name: 'key_alias',
  type: 'string',
  default: '',
  routing: { send: { type: 'body', property: 'key_alias' } },
}
```

`type: 'body'` puts it in the JSON body; `type: 'query'` puts it in the query string. You
can transform on the way with `value`:

```ts
routing: {
  send: {
    type: 'body',
    property: 'keys',
    value: '={{ $value.split(",").map((p) => p.trim()) }}',
  },
}
```

`displayOptions.show` controls when a field is visible — that is how the form changes as
you switch operation.

### loadOptions — dropdowns filled from the live API

Declarative routing cannot populate a dropdown, because that happens in the editor before
any execution. So those use a method:

```ts
methods = { loadOptions: { getModels, getTeams } };
```

`getModels` calls the proxy with `this.helpers.httpRequestWithAuthentication`. This is the
*only* reason `shared/transport.ts` exists.

### postReceive — reshaping the response

LiteLLM is inconsistent: `/key/list` returns `{keys: [...]}`, `/team/list` returns a bare
array. `splitList()` normalises both into one n8n item per entry, and passes anything
unexpected through untouched, so a future API change degrades instead of crashing.

One subtlety that cost us a bug: **when a `postReceive` function is attached, n8n hands it
the raw body before splitting it.** A bare-array response therefore arrives as a single
item whose `json` *is* the array.

### Gotchas we hit (all documented in the README)

| Symptom | Cause |
| --- | --- |
| Node loads but never appears in the panel | `"AI"` in codex `categories` without an AI subcategory — the editor filters it out of every non-AI view |
| `page=NaN`, HTTP 422 | `$pageCount` does not exist in declarative nodes; only `$request`, `$response`, `$version` |
| Page 2 loses all filters | the pagination request is merged with a **shallow** spread, replacing the whole `qs` |
| `ECONNREFUSED ::1:4000` | n8n resolves `localhost` to IPv6 and does not fall back; Docker/Colima publish IPv4 only — use `127.0.0.1` |
| Credential test green against the wrong server | no `Accept: application/json`, so an SPA's catch-all answered `200` with HTML |

---

## Part 3 — Running it locally

### The build

TypeScript compiles `credentials/` and `nodes/` into `dist/`, and the icons are copied
alongside. n8n only ever loads `dist/`. `dist/` is **gitignored** — it is a build output,
regenerated from source everywhere it is needed.

```bash
npm run build       # n8n-node build: tsc + copy static files
npm run lint        # eslint with n8n's community-node rules
```

The lint step is not cosmetic: it enforces the conventions n8n's reviewers check
(description wording, Title Case display names, required `author.email`, and so on).

### Loading it into your own n8n

n8n scans `~/.n8n/custom` for `*.node.js` at startup. The standard dev loop:

```bash
npm run build && npm link                  # register this package globally
cd ~/.n8n/custom && npm link @scope/pkg    # symlink it into the scan path
```

`npm link` creates a **symlink**, so the folder n8n reads *is* your `dist/`. Rebuild,
restart n8n, and your changes are live. Restarting is required — nodes are read once at
boot.

### Testing without clicking through the UI

The editor hides error details. Running a workflow from the CLI prints the full
`NodeApiError` including the real URL and response body:

```bash
n8n import:workflow --input=workflow.json
n8n execute --id <workflow-id>
```

We used this to build a 27-step workflow exercising every operation against a real
LiteLLM proxy, which is how three genuine bugs were found. Two notes:

- Set `executeOnce: true` on each node. Otherwise a node runs **once per input item**, so
  a step returning 3 items makes everything downstream run 3 times — and non-idempotent
  operations like Delete fail on the second run.
- `n8n execute` needs a free task-broker port if another n8n is running:
  `N8N_RUNNERS_BROKER_PORT=5699`.

---

## Part 4 — npm

### What npm is

**npm** is two things: the `npm` command-line tool, and the **registry** at
`registry.npmjs.org` — a public database of JavaScript packages. "Publishing" means
uploading a compressed tarball plus metadata so that `npm install <name>` works for
anyone.

### package.json

The manifest. The fields that matter when publishing:

| Field | Meaning |
| --- | --- |
| `name` | unique id on the registry |
| `version` | semver; **immutable once published** |
| `files` | allowlist of what goes in the tarball |
| `dependencies` | installed automatically with your package |
| `peerDependencies` | required, but supplied by the host |
| `publishConfig.access` | scoped packages are private by default — `"public"` overrides |
| `repository` / `homepage` / `bugs` | links npm shows on the package page |
| `license` | the legal terms |

Check what will actually ship *before* publishing:

```bash
npm pack --dry-run
```

This caught a real problem here: `dist/tsconfig.tsbuildinfo`, a TypeScript build cache,
was 212 KB of a 323 KB package — and it contained the string `child_process`, exactly what
a verification reviewer greps for. Removing it took the package to 72 KB.

### Scopes

`@motaouakel/n8n-nodes-litellm` is **scoped**. The scope is a namespace tied to your npm
username or org, so nobody else can publish into it. Two reasons we used one here:

1. The unscoped name `n8n-nodes-litellm` had been published and unpublished by someone
   else in 2025. **npm never releases unpublished names for reuse**, so it is gone forever.
2. A scope gives you a stable namespace for anything else you publish.

Scoped packages default to **private**, which requires a paid plan — hence
`publishConfig.access: "public"`.

### Versions are immutable

Once `0.1.2` exists, its contents can never change. You can only publish `0.1.3`. This is
why we fixed the licence attribution *before* the first successful publish: a version with
the wrong copyright would have been permanent.

**Semver** — `MAJOR.MINOR.PATCH`:

- **patch** (0.1.1 → 0.1.2) — bug fixes, nothing breaks
- **minor** (0.1.2 → 0.2.0) — new features, still backwards compatible
- **major** (0.2.0 → 1.0.0) — breaking changes

### Why "no runtime dependencies" matters

For n8n **verified** status the package must have zero `dependencies`. Every dependency is
code n8n would be shipping to Cloud customers on your behalf. It shapes how you write:
use `this.helpers.httpRequest`, never `axios`; no `fs`, no `child_process`, no env access.
Writing to that bar from the start is far cheaper than retrofitting it.

---

## Part 5 — Git and GitHub

**Git** is the version-control tool on your machine. **GitHub** is a website that hosts
git repositories and adds issues, pull requests and CI. They are separate things; git
works fine with no GitHub at all.

### Authenticating a push

GitHub stopped accepting account passwords over HTTPS years ago. You push with a **token**
in place of the password. Two kinds:

| | Classic token | Fine-grained token |
| --- | --- | --- |
| Granularity | coarse *scopes* (`repo`, `workflow`) | per-repository *permissions* |
| Reach | **all** your repositories | only the repos you select |
| Recommended | legacy | yes |

We hit both of the classic traps:

1. **403 "Permission denied to \<yourself\>"** — the fine-grained token had no *Contents:
   Read and write* permission. The permissions block only becomes editable after you pick
   *Only select repositories*.
2. **"refusing to allow a Personal Access Token to create or update workflow ... without
   `workflow` scope"** — pushing files under `.github/workflows/` is gated separately,
   because a workflow file is the power to run arbitrary code on GitHub's runners. On a
   fine-grained token the equivalent permission is called **Workflows**.

Once a push succeeds, macOS stores the token in the keychain (`credential.helper =
osxkeychain`) and you are not asked again. To clear a bad one:

```bash
printf 'protocol=https\nhost=github.com\n' | git credential-osxkeychain erase
```

### Repository secrets

A **secret** is an encrypted value stored on the repo that workflows can read and logs
automatically mask. Settings → Secrets and variables → Actions. We stored the npm token as
`NPM_TOKEN`, which is the exact name the workflow expects.

Secrets are not available to workflows triggered by pull requests from forks — otherwise
anyone could open a PR that prints your token.

---

## Part 6 — CI/CD and the publishing pipeline

**GitHub Actions** runs a workflow file on an event. Our repo has two:

| Workflow | Trigger | Does |
| --- | --- | --- |
| `ci.yml` | every push / PR to `main` | `npm ci`, lint, build |
| `publish.yml` | pushing a tag like `0.1.2` | build and publish to npm |

`npm ci` ("clean install") installs **exactly** what `package-lock.json` says, deleting
`node_modules` first. Unlike `npm install` it never updates the lockfile — which is what
you want in CI: reproducible, and it fails loudly if the lockfile is inconsistent.

### The release flow, end to end

```
npm run release                 (your machine)
  ├─ lint + build               fail here = nothing happens
  ├─ ask for the new version    patch / minor / major
  ├─ npx auto-changelog -p      rewrite CHANGELOG.md
  ├─ git commit                 "Release 0.1.2"
  ├─ git tag 0.1.2
  └─ git push (commit + tag)
          │
          ▼  tag push triggers the workflow
GitHub Actions  (publish.yml)
  ├─ checkout, setup node, npm ci
  └─ npm run release  →  detects CI  →  npm publish --provenance
          │
          ▼
    registry.npmjs.org
```

The important design point: **`npm run release` behaves differently on your machine and in
CI.** It checks `process.env.GITHUB_ACTIONS`. Locally it only versions, tags and pushes.
Only inside Actions does it actually publish. You therefore cannot accidentally publish a
build from your laptop — which matters because of provenance.

### Provenance

A **provenance statement** is a signed, public record saying *this exact tarball was built
by this workflow, from this repository, at this commit*. It is signed using GitHub's OIDC
identity and recorded in a public transparency log (sigstore). Anyone can verify that the
code on npm matches the code on GitHub.

**n8n requires it.** Since 1 May 2026, nodes submitted for verification must be published
via GitHub Actions with provenance. This is the single biggest reason the whole pipeline
exists rather than just typing `npm publish`.

```yaml
permissions:
  id-token: write    # lets the job mint an OIDC token to sign with
  contents: read
```

### Two ways to authenticate the publish

| | Token (`NPM_TOKEN`) | Trusted publishing (OIDC) |
| --- | --- | --- |
| How | a long-lived secret in the repo | GitHub proves its identity to npm directly |
| Secret stored | yes | **none** |
| Works with 2FA on publish | only with "bypass 2FA" tokens | yes |
| Future | direct publish removed **January 2027** | the recommended path |

Chicken-and-egg: trusted publishing is configured on a package's settings page, so it
cannot be set up for a package that does not exist yet. The first publish needs a token;
after that, switch to OIDC and delete the token.

### 2FA

If your npm account's 2FA mode covers **writes**, publishing needs a one-time code — which
CI cannot provide. That produced:

```
403 Forbidden — Two-factor authentication or granular access token
with bypass 2fa enabled is required to publish packages.
```

Two fixes: a token with *Bypass two-factor authentication* ticked (what we did), or
switching the account's 2FA mode to "Authorization only". Trusted publishing makes the
question disappear entirely, because there is no token to authenticate.

---

## Part 7 — The changelog

### The principle

A changelog is a human-readable record of what changed in each version, written for the
people *using* your package. The widely used convention is
[Keep a Changelog](https://keepachangelog.com): newest first, grouped under version
headings, describing changes in terms of their effect on users — not a dump of git log.

It matters more for a published package than for an app: a user deciding whether to
upgrade from 0.1.2 to 0.2.0 has nothing else to go on.

### auto-changelog

[`CookPete/auto-changelog`](https://github.com/CookPete/auto-changelog) generates
`CHANGELOG.md` automatically from your **git history**. It walks the tags, groups the
commits between them, and writes a Markdown file with links back to each commit and a
compare link between versions.

Used here through two calls:

```bash
npx auto-changelog --stdout --unreleased --commit-limit false -u --hide-credit
npx auto-changelog -p
```

- the first prints the *pending* changes so release-it can show them before you confirm
- the second (`-p` = `--package`) rewrites `CHANGELOG.md`, taking the version from
  `package.json`

**The trade-off:** it is only as good as your commit messages, and it *overwrites* the
file. The hand-written changelog in this repo was replaced on the first release. If you
want curated release notes, either write them in the GitHub Release instead, or drop
auto-changelog and maintain `CHANGELOG.md` by hand.

This is also why commit messages are worth writing properly — they become your public
release notes.

### release-it

[`release-it`](https://github.com/release-it/release-it) is the tool that orchestrates all
of it. `@n8n/node-cli` calls it with these guards:

```
--git.requireBranch main          refuse to release from a side branch
--git.requireCleanWorkingDir      refuse with uncommitted changes
--git.requireUpstream             refuse without a remote
--git.requireCommits              refuse if nothing changed
--hooks.before:init  "lint && build"
--hooks.after:bump   "npx auto-changelog -p"
```

Those guards are why the first attempt failed with *"Identité d'auteur inconnue"* — git
had no `user.name` / `user.email` configured, so it could not create the release commit.

---

## Part 8 — Licensing

A repository with no licence is **not** open source: without one, default copyright
applies and nobody has permission to use it.

**MIT** is the usual choice for n8n community nodes: do anything you like, keep the
copyright notice, no warranty. It is two paragraphs and imposes nothing on users.

The licence file carries a copyright line naming the holder:

```
Copyright 2026 Motaouakel
```

That is a factual claim about who owns the work, which is why it mattered to change it
from a company name to yours. It appears in three places that should agree: `LICENSE.md`,
`package.json` `"license": "MIT"`, and the `author` field.

---

## Part 9 — Command cheat sheet

```bash
# develop
npm run build                 # compile to dist/
npm run lint                  # n8n's community-node rules
npm run lint -- --fix         # autofix what it can

# use it in your own n8n
npm link
cd ~/.n8n/custom && npm link @motaouakel/n8n-nodes-litellm
# restart n8n

# inspect before publishing
npm pack --dry-run            # what would ship
npm view @motaouakel/n8n-nodes-litellm

# release (tags locally, CI publishes)
npm run release

# git
git remote -v
git status -sb
git log --oneline -5
```

---

## Part 10 — Where this package stands

Published as `@motaouakel/n8n-nodes-litellm`, MIT, zero runtime dependencies, with a
provenance attestation. 25 operations across Key, Team, User, Model and Spend, verified
against a live LiteLLM proxy.

Still open:

1. Switch to trusted publishing (OIDC), then revoke the npm token.
2. Improve error messages — LiteLLM's real error text is currently swallowed.
3. Add automated tests so an API shape change fails loudly.
4. Verify the Models/Teams dropdowns and the Tool variant in the editor.
5. Add screenshots to the README.
6. Submit at [creators.n8n.io/nodes](https://creators.n8n.io/nodes) for verification,
   which is what makes it installable on n8n Cloud.
