// Live smoke tests against the real Cloudflare API: `npm run smoke:live`.
// No MSW here, and they're excluded from `npm test`.
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/live/**/*.live.ts"],
		testTimeout: 60_000,
		hookTimeout: 60_000,
		fileParallelism: false,
		sequence: { concurrent: false },
	},
});
