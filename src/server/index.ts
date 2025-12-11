import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getFiltersFromQuery } from "./utils";

const ParseFiltersRequestSchema = z.object({
	query: z.string().min(1),
});

const app = new Hono()
	.get("/api/health", (c) => c.json({ status: "ok" }))
	.post(
		"/api/parse-filters",
		zValidator("json", ParseFiltersRequestSchema),
		async (c) => {
			const { query } = c.req.valid("json");

			const constructedFilters = await getFiltersFromQuery(query);

			return c.json(constructedFilters);
		},
	);

export type AppType = typeof app;
export default app;
