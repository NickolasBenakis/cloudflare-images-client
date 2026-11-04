// Verifies the built package loads through both module systems and that the
// bundle does not statically depend on Node.js built-ins (so it can run in
// Cloudflare Workers, Deno and browsers).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);

const esm = await import("cloudflare-images-client");
assert.equal(typeof esm.CloudflareImagesClient, "function", "ESM named export");
new esm.CloudflareImagesClient({ accountId: "a", apiToken: "t" });

const cjs = require("cloudflare-images-client");
assert.equal(typeof cjs.CloudflareImagesClient, "function", "CJS named export");
new cjs.CloudflareImagesClient({ accountId: "a", apiToken: "t" });

const builtin =
	/(?:from\s*["']|require\(\s*["']|import\(\s*["'])(?:node:)?(?:fs|path|os|crypto|stream|buffer)(?:\/[a-z]+)?["']/;
for (const file of ["dist/index.js", "dist/index.cjs"]) {
	const src = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
	assert.ok(
		!builtin.test(src),
		`${file} statically imports a Node.js built-in`,
	);
}

console.log("smoke: ESM + CJS load, no static Node built-in imports");
