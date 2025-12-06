import { openai } from "@ai-sdk/openai";
import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { generateObject } from "ai";
import { Hono } from "hono";
import { z } from "zod";
import {
	type FilterColumnConfig,
	formatFilterConfigForPrompt,
	getFilterConfig,
} from "./db/filter-config";
import {
	type AISearchTerms,
	AISearchTermsSchema,
} from "./schemas/ai-search-schema";

const ParseFiltersRequestSchema = z.object({
	query: z.string().min(1),
});

/**
 * Response format for the parse-filters endpoint.
 * Contains resolved filters ready for the frontend to apply.
 */
export interface ParsedFilter {
	columnName: string;
	columnType: "radio" | "checkboxes" | "text";
	values: string[];
	isNegation: boolean;
}

export interface ParseFiltersResponse {
	filters: ParsedFilter[];
	matchType: "all" | "any";
}

/**
 * Builds the system prompt for the AI to parse natural language into search terms.
 */
function buildPrompt(
	query: string,
	config: Record<string, FilterColumnConfig>,
): string {
	const configDescription = formatFilterConfigForPrompt(config);

	return `You are a filter parsing assistant. Convert natural language queries into structured search terms.

Available filter columns and their values:
${configDescription}

Instructions:
1. For each filter intent in the query, generate search terms that could match column names and values
2. Include synonyms and related terms to improve matching
3. Set isNegation=true for exclusions (e.g., "not completed", "exclude bugs", "without high priority")
4. Infer matchType from context: "all" for AND logic (default), "any" for OR logic

Examples:
- "show completed high priority tasks" → two filters: status=Completed AND priority=High
- "bugs or features" → one filter with tags containing Bug OR Feature, matchType=any
- "tasks not assigned to John" → one negated filter on assignee

User query: "${query}"

Parse this into search terms:`;
}

/**
 * Fuzzy matches search terms against available column names.
 * Returns the best matching column name or null if no match found.
 */
function findMatchingColumn(
	searchTerms: string[],
	config: Record<string, FilterColumnConfig>,
): string | null {
	const columnNames = Object.keys(config);

	for (const term of searchTerms) {
		const lowerTerm = term.toLowerCase();

		// Exact match
		const exactMatch = columnNames.find(
			(col) => col.toLowerCase() === lowerTerm,
		);
		if (exactMatch) return exactMatch;

		// Partial match (column contains term or term contains column)
		const partialMatch = columnNames.find(
			(col) =>
				col.toLowerCase().includes(lowerTerm) ||
				lowerTerm.includes(col.toLowerCase()),
		);
		if (partialMatch) return partialMatch;
	}

	return null;
}

/**
 * Fuzzy matches search terms against available values for a column.
 * Returns all matching values.
 */
function findMatchingValues(
	searchTerms: string[],
	columnConfig: FilterColumnConfig,
): string[] {
	if (columnConfig.type === "text") {
		// For text columns, return the search terms as-is for text search
		return searchTerms.filter((term) => term.trim().length > 0);
	}

	const matches: string[] = [];

	for (const term of searchTerms) {
		const lowerTerm = term.toLowerCase();

		for (const option of columnConfig.options) {
			const lowerOption = option.toLowerCase();

			// Exact match
			if (lowerOption === lowerTerm) {
				if (!matches.includes(option)) matches.push(option);
				continue;
			}

			// Partial match
			if (lowerOption.includes(lowerTerm) || lowerTerm.includes(lowerOption)) {
				if (!matches.includes(option)) matches.push(option);
			}
		}
	}

	return matches;
}

/**
 * Resolves AI search terms into concrete filters using the filter config.
 */
function resolveFilters(
	aiResult: AISearchTerms,
	config: Record<string, FilterColumnConfig>,
): ParseFiltersResponse {
	const filters: ParsedFilter[] = [];

	for (const filter of aiResult.filters) {
		// Find matching column
		const columnName = findMatchingColumn(filter.columnSearchTerms, config);
		if (!columnName) continue;

		const columnConfig = config[columnName];

		// Find matching values
		const values = findMatchingValues(filter.valueSearchTerms, columnConfig);
		if (values.length === 0) continue;

		filters.push({
			columnName,
			columnType: columnConfig.type,
			values,
			isNegation: filter.isNegation ?? false,
		});
	}

	return {
		filters,
		matchType: aiResult.matchType ?? "all",
	};
}

const app = new Hono()
	.get("/api/health", (c) => c.json({ status: "ok" }))
	.post(
		"/api/parse-filters",
		zValidator("json", ParseFiltersRequestSchema),
		async (c) => {
			const { query } = c.req.valid("json");

			// Read filter config from "database"
			const filterConfig = await getFilterConfig();

			// Generate structured search terms from natural language
			const { object: aiResult } = await generateObject({
				model: openai("gpt-4o-mini"),
				schema: AISearchTermsSchema,
				prompt: buildPrompt(query, filterConfig),
			});

			// Resolve search terms to concrete filters
			const response = resolveFilters(aiResult, filterConfig);

			return c.json(response);
		},
	);

// Only start standalone server in production
if (import.meta.env.PROD) {
	serve({ fetch: app.fetch, port: 3000 });
}

export type AppType = typeof app;
export default app;
