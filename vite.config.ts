import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			// alias the client entry to the profiling build
			"react-dom/client": "react-dom/profiling",
			"scheduler/tracing": "scheduler/tracing-profiling",
		},
	},
});
