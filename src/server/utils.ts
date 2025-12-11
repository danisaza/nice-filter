import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import {
	type FilterColumnConfig,
	formatFilterConfigForPrompt,
	getFilterConfig,
} from "./db/filter-columns-and-values.mock";
import {
	type AISearchTerms,
	AISearchTermsSchema,
} from "./schemas/ai-search-schema";

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
 *
 * NOTE: There are plenty of possible improvements here, including guardrails, prompt injection defense, etc.
 *
 * For example, there are TONS of great prompt optimization tips from Lilian Weng that are worth implementing:
 * https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/
 */
export function buildPrompt(
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
5. IMPORTANT: Group related filters together where possible (e.g. "high and medium priority tasks" should result in a single filter on "priority" with values ["High", "Medium"], rather than two filters on "priority" with values ["High"] and ["Medium"]). This applies to negations too.

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
export function resolveFilters(
	aiResult: AISearchTerms,
	options: {
		filterConfig: Record<string, FilterColumnConfig>;
	},
): ParseFiltersResponse {
	const filters: ParsedFilter[] = [];

	for (const filter of aiResult.filters) {
		// Find matching column
		const columnName = findMatchingColumn(
			filter.columnSearchTerms,
			options.filterConfig,
		);
		if (!columnName) continue;

		const columnConfig = options.filterConfig[columnName];

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

type PromptBuilder = (
	query: string,
	config: Record<string, FilterColumnConfig>,
) => string;

export async function getStructuredSearchTerms(
	query: string,
	options: {
		filterConfig: Record<string, FilterColumnConfig>;
		promptBuilder: PromptBuilder;
	},
) {
	// Generate structured search terms from natural language
	const generatedResult = await generateObject({
		model: openai("gpt-5.1"),
		schema: AISearchTermsSchema,
		prompt: options.promptBuilder(query, options.filterConfig),
	});
	return generatedResult.object;
}

export async function getFiltersFromQuery(
	query: string,
	promptBuilder: PromptBuilder = buildPrompt,
) {
	const filterConfig = await getFilterConfig(); // this is where we'd fetch data from the db
	const structuredSearchTerms = await getStructuredSearchTerms(query, {
		filterConfig,
		promptBuilder,
	});
	return resolveFilters(structuredSearchTerms, { filterConfig });
}
