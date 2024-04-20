// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		setupFiles: ["./setupVitest.js"],
		globals: true,
	},
});
