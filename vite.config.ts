/// <reference types="vitest/config" />

import build from "@hono/vite-build/node";
import devServer from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		devServer({
			entry: "src/server/index.ts",
			// Only handle /api/* routes, let Vite serve everything else
			exclude: [/^(?!\/api\/).*/],
		}),
		build({ entry: "src/server/index.ts" }),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/test/setup.ts",
		exclude: ["e2e/**", "node_modules/**"],
	},
});
