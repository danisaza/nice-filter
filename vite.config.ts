/// <reference types="vitest/config" />

import devServer from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		// Dev server proxies /api/* to the Hono server during development
		devServer({
			entry: "src/server/index.ts",
			// Only handle /api/* routes, let Vite serve everything else
			exclude: [/^(?!\/api\/).*/],
		}),
		// Note: @hono/vite-build/node removed - it's for standalone Node.js servers.
		// For Vercel, we build the frontend as static files and deploy the API as a serverless function.
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
