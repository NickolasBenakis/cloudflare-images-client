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
