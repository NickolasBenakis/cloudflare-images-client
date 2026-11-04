# Contributing

Thanks for helping out. This guide covers local setup, the checks CI runs, and how releases work.

## Setup

You need Node.js 22.12 or newer for development. The published package itself supports Node.js 18+.

```bash
git clone https://github.com/NickolasBenakis/cloudflare-images-client.git
cd cloudflare-images-client
npm install
```

The tests use [MSW](https://mswjs.io/) to mock the Cloudflare API, so you don't need a Cloudflare account or a `.env` file.

## Scripts

| Command                 | What it does                                                                     |
| ----------------------- | -------------------------------------------------------------------------------- |
| `npm test`              | Unit and contract tests                                                          |
| `npm run lint`          | Lint and format check (Biome)                                                    |
| `npm run format`        | Fix formatting and lint issues                                                   |
| `npm run typecheck`     | TypeScript check                                                                 |
| `npm run build`         | Build ESM and CJS bundles into `dist/`                                           |
| `npm run check:package` | Load the build via `import` and `require`, then run publint and arethetypeswrong |
| `npm run check:workers` | Bundle the build for Cloudflare Workers to catch Node.js-only imports            |

CI runs all of these on every pull request.

## API contract tests

The tests in [`tests/contract.test.ts`](tests/contract.test.ts) check every request the client sends, and every response the mocks return, against Cloudflare's published [OpenAPI spec](https://github.com/cloudflare/api-schemas). The operations the client uses are pinned in [`openapi/cloudflare-images.json`](openapi/cloudflare-images.json).

- `npm run openapi:update` refreshes the pinned spec from Cloudflare.
- `npm run test:contract` runs only the contract tests.
- A weekly workflow ([`api-drift.yml`](.github/workflows/api-drift.yml)) refreshes the spec. If Cloudflare changed anything the client uses, it opens an `api-drift` issue with the diff and whether the contract tests still pass.

When adding a client method, add its endpoint to `OPERATIONS` in [`scripts/openapi-update.mjs`](scripts/openapi-update.mjs), run `npm run openapi:update`, and add a contract test.

## Releasing

Releases are automated by [`.github/workflows/release.yml`](.github/workflows/release.yml):

1. Bump the version in a PR: `npm version minor --no-git-tag-version` (or `patch` / `major`, or a prerelease such as `1.3.0-beta.1`).
2. Merge the PR into `main`.
3. The workflow sees a version that isn't on npm yet, runs the full CI suite, publishes to npm with provenance, and creates the `X.Y.Z` tag and GitHub Release with generated notes. Prereleases are published under the `next` dist-tag.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (GitHub OIDC), so there is no npm token stored in the repo.
