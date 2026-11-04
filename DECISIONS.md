# Decisions — 1.2.0 maintenance release

- **Version 1.2.0, not 2.0.0.** Everything is backward compatible: `filePath` still
  works, `require()`/`import` resolve to the same files as before for Node users,
  and only named exports existed before and still do.
- **Fixed `main`/`module` swap + added `exports` map.** `main` → CJS, `module` → ESM,
  conditional `exports` with separate `.d.ts`/`.d.cts` types. Verified with
  `publint` and `@arethetypeswrong/cli` (all green, incl. node10/node16/bundler).
- **Workers/edge support via `file` option.** `uploadImageFromFile` now accepts
  `file: Blob | ArrayBuffer | Uint8Array`. `filePath` is kept for Node and loads
  `node:fs/promises` lazily through a non-literal `import()` so bundlers like
  wrangler/esbuild don't try to resolve `fs`. Verified: esbuild `--platform=browser`
  bundle succeeds for 1.2.0 and fails ("Could not resolve fs") for 1.1.5.
- **TypeScript pinned to ^6, not 7.** TS 7 ships no compiler API and tsup's dts
  build (rollup-plugin-dts) fails with it. Revisit when tsup supports TS 7.
- **Dev deps bumped to latest majors:** vitest 5, @vitest/coverage-v8 5, msw 3,
  tsup 9, biome 2, @types/node 26, dotenv 18. These require Node 22.12+ for
  development only; CI runs on Node 22 and 24. Runtime `engines` stays `>=18`.
- **Tests run without a `.env`.** They use MSW mocks, but failed when
  `CLOUDFLARE_ACCOUNT_ID` was unset (empty segment didn't match the handler route).
  Added fallback dummy IDs and `onUnhandledRequest: "error"` so tests never hit
  the real API. CI now actually runs `npm test` (it was commented out).
- **Replaced the `publish` script with `prepublishOnly`.** A script named `publish`
  is an npm lifecycle hook that runs _after_ `npm publish`, so `npm run publish`
  calling `npm publish` was a footgun. `prepublishOnly` now builds, tests and
  checks the package before every publish.
- **Fixed README usage** — `require('cloudflare-images-client')` returns the module
  object, so `new` on it threw. Now shows the named export.
- **Not done (out of scope):** new API endpoints (direct creator upload, variants,
  signing keys, custom IDs). Not published to npm — that's for the maintainer.

# Decisions — CI/CD hardening + automated releases

- **Release trigger = version bump on `main`.** No changesets/release-please and no
  commit-message conventions. If `package.json`'s version isn't on npm, the release
  workflow runs the full CI suite (reused via `workflow_call`), publishes, then
  creates the `X.Y.Z` tag (no `v`, matching the existing 1.1.x tags) + GitHub Release with generated notes. Merging a PR
  without a version bump publishes nothing. Prereleases (`x.y.z-beta.n`) go to
  the `next` dist-tag.
- **npm trusted publishing (OIDC), no `NPM_TOKEN`.** Nothing to leak or rotate, and
  provenance is generated automatically. Needs a one-time setup on npmjs.com.
- **Publish job runs in an `npm` environment** so you can add a required reviewer
  later for a manual approval gate without editing the workflow.
- **CI split into jobs:** lint (Biome + typecheck), test on Node 22/24/26, and a
  runtime job that installs the packed tarball into an empty project on Node
  18/20/22/24 and loads it via ESM and CJS. That checks the `engines: >=18`
  promise against what actually gets published, not the source tree.
- **Workers check:** `npm run check:workers` bundles `dist` with esbuild for a
  browser/workerd target. It fails on 1.1.5 ("Could not resolve fs") and passes now.
- **Least privilege + concurrency:** workflows default to `contents: read`. Only the
  publish job gets `contents: write` and `id-token: write`. Superseded PR runs are
  cancelled. Release runs are serialized and never cancelled mid-publish.
- **Dependabot:** weekly; dev-dependency minor/patch updates grouped into one PR;
  Actions updates grouped. TypeScript majors are ignored (TS 7 breaks the tsup dts build).
- **Biome config added** with the recommended preset. The whole repo was reformatted
  once in a separate commit so the CI lint job starts green. `biome migrate` set
  `preset: "none"`, which silently disabled all rules; set back to `recommended` and
  verified the rules fire.
- **Not done:** pinning actions to commit SHAs (Dependabot plus first-party actions
  is a reasonable trade-off for a small library); CodeQL; coverage upload.

# Decisions — OpenAPI contract tests + API drift detection

- **Source of truth is Cloudflare's own spec** (`cloudflare/api-schemas`, OpenAPI 3.0).
  We pin only the 7 operations the client calls plus the 29 schemas they reference
  (~29 KB, key-sorted so diffs show real changes only), not the 27 MB full spec.
- **Contract tests validate both directions:** requests the client sends (path,
  method, query params, JSON/multipart body fields) and responses the MSW mocks
  return (status, content type, JSON schema). They run inside `npm test`, so CI
  covers them on every PR. Validation uses Ajv with OpenAPI's `nullable`/`discriminator`.
- **Found and fixed on first run:**
  - Client bug: `uploadImageFromFile` without `metadata` sent the literal string
    `"undefined"` as the metadata field. It's now omitted when not given.
  - Mocks used fake values (`uploaded: "uploaded"`, `variants: ["variant"]`) and
    returned errors as HTTP 200. Now they use realistic fixtures and 4XX statuses
    like the real API (`src/mocks/fixtures.ts`).
- **Verified the tests catch regressions:** an injected form-field typo and an
  out-of-range `per_page` both fail with precise messages. Known limit: a renamed
  path that still matches a templated route (`/v1/statistics` looks like
  `/v1/{image_id}`) passes the contract check; the unit tests catch that case.
- **Drift = an issue, not an auto-PR.** PRs created with `GITHUB_TOKEN` don't
  trigger CI, and auto-PRs need an extra repo setting. A single `api-drift` issue
  with the diff and the contract-test verdict is the lower-attention signal. A
  hash marker stops repeat comments for the same spec version.
- **Removed operations don't crash the extractor.** They're recorded under
  `x-missing-operations`, show up in the diff, and fail the coverage snapshot test.
- **Drift workflow dry-run:** simulated locally with a mutated upstream spec and a
  stubbed `gh`. It produced the expected issue, skipped a repeat run, and commented
  for a new spec version. The real scheduled run can only happen after merge.
- **Also included:** the release tag format fix (no `v` prefix, matching `1.1.x`),
  which missed PR #7.
- **Version bumped to 1.2.1** so merging ships the metadata fix through the automated release.
