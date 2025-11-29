// scripts/profile.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type ModelConfiguration, Stagehand } from "@browserbasehq/stagehand";
import { chromium } from "playwright-core";
import { env } from "../src/env";

type CDPTraceEvent = {
	[key: string]: string;
};

async function main() {
	const targetUrl = env.VITE_BASE_URL;
	const stagehandEnv = env.STAGEHAND_ENV;
	const outDir = "profiling-artifacts";
	const model: ModelConfiguration = "openai/gpt-5"; // weirdly, 4o-mini does really poorly even for this simple task

	const stagehand = new Stagehand({
		env: stagehandEnv,
		model: model,
		verbose: 0,
	});

	console.log(`[profile] Starting Stagehand in env=${stagehandEnv}`);
	await stagehand.init();

	// Connect Playwright to Stagehand's browser via CDP
	// NOTE: this is partially deprecated in favor of `browserType.connect()`,
	// but using `connectOverCDP` is required for performance profiling.
	const browser = await chromium.connectOverCDP({
		wsEndpoint: stagehand.connectURL(),
	});

	const context = browser.contexts()[0];
	const page = context.pages()[0] ?? (await context.newPage());

	// Open a raw CDP session on this page
	const cdp = await page.context().newCDPSession(page);

	// Collect Chrome trace events in memory
	const traceEvents: CDPTraceEvent[] = [];

	cdp.on("Tracing.dataCollected", (event) => {
		if (event?.value) {
			traceEvents.push(...event.value);
		}
	});

	cdp.on("Tracing.tracingComplete", () => {
		mkdirSync(outDir, { recursive: true });
		const filepath = join(outDir, `trace-${Date.now()}.json`);
		writeFileSync(filepath, JSON.stringify({ traceEvents }, null, 2));
		console.log(`[profile] Trace written to ${filepath}`);
	});

	// Enable performance metrics + tracing
	await cdp.send("Performance.enable");
	await cdp.send("Tracing.start", {
		// Common categories for DevTools-style timeline + JS profiling
		categories: [
			"devtools.timeline",
			"v8",
			"blink",
			"blink.user_timing",
			"loading",
			"disabled-by-default-devtools.timeline",
			"disabled-by-default-devtools.timeline.frame",
		].join(","), // CDP requires a comma-separated string
		options: "sampling-frequency=10000", // 10000 Hz (1ms) sampling for CPU
		transferMode: "ReportEvents", // stream trace via Tracing.dataCollected
	});

	console.log(`[profile] Navigating to ${targetUrl}`);
	await page.goto(targetUrl, { waitUntil: "networkidle" });

	// Use Stagehand to drive user flows on this Playwright page
	console.log("[profile] Running Stagehand flow...");
	await stagehand.act("Click the 'Filters' button", { page });
	await stagehand.act("Click on the 'Status' option", { page });
	await stagehand.act("Check the box for 'Not Started'", { page });
	await stagehand.act("Check the box for 'In Progress'", { page });
	await stagehand.act("Check the box for 'Completed'", { page });
	await stagehand.act("Press the `escape` key", {
		page,
	});

	// Optional: wait for things to settle after the last interaction
	await page.waitForTimeout(5000);

	// Grab one snapshot of Performance metrics before stopping tracing
	const perfMetrics = await cdp.send("Performance.getMetrics");
	console.log("[profile] Raw Performance.getMetrics():");
	console.log(JSON.stringify(perfMetrics, null, 2));

	// Stop tracing; Tracing.tracingComplete will write the file
	await cdp.send("Tracing.end");

	await browser.close();
	await stagehand.close();
	console.log("[profile] Done.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
