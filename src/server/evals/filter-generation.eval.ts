import { dequal } from "dequal";
import { createScorer, evalite } from "evalite";
import { getFiltersFromQuery } from "../utils";

/**
 * Normalizes filter results for comparison by sorting arrays
 * so that order doesn't affect equality checks.
 */
function normalizeFilters(result: unknown) {
	if (result == null || typeof result !== "object") return result;

	const obj = result as {
		filters?: Array<{ columnName: string; values?: string[] }>;
		matchType?: string;
	};

	return {
		...obj,
		filters: obj.filters
			?.map((filter) => ({
				...filter,
				values: filter.values?.slice().sort(),
			}))
			.sort((a, b) => a.columnName.localeCompare(b.columnName)),
	};
}

const filtersEqual = createScorer({
	name: "filters match",
	description: "checks whether the filters match the expected output",
	scorer: ({ output, expected }) => {
		// normalize arrays before comparison so order doesn't matter
		return dequal(normalizeFilters(output), normalizeFilters(expected)) ? 1 : 0;
	},
});

evalite("My Eval", {
	// An array of test data
	// - TODO: Replace with your test data
	data: [
		{
			input: "show me completed high priority tasks",
			expected: {
				filters: [
					{
						columnName: "status",
						columnType: "radio",
						values: ["Completed"],
						isNegation: false,
					},
					{
						columnName: "priority",
						columnType: "radio",
						values: ["High"],
						isNegation: false,
					},
				],
				matchType: "all",
			},
		},
		{
			input:
				"show me high priority tasks that are either completed or in progress",
			expected: {
				filters: [
					{
						columnName: "status",
						columnType: "radio",
						values: ["Completed", "In Progress"],
						isNegation: false,
					},
					{
						columnName: "priority",
						columnType: "radio",
						values: ["High"],
						isNegation: false,
					},
				],
				matchType: "all",
			},
		},
		{
			input:
				"show me high priority tasks that are neither completed nor cancelled",
			expected: {
				filters: [
					{
						columnName: "status",
						columnType: "radio",
						values: ["Completed", "Cancelled"],
						isNegation: true,
					},
					{
						columnName: "priority",
						columnType: "radio",
						values: ["High"],
						isNegation: false,
					},
				],
				matchType: "all",
			},
		},
		{
			input: "show me all of the bugs and high priority tasks",
			expected: {
				filters: [
					{
						columnName: "tags",
						columnType: "checkboxes",
						values: ["Bug"],
						isNegation: false,
					},
					{
						columnName: "priority",
						columnType: "radio",
						values: ["High"],
						isNegation: false,
					},
				],
				matchType: "any",
			},
		},
	],
	// The task to perform
	// - TODO: Replace with your LLM call
	task: async (input) => {
		return getFiltersFromQuery(input);
	},
	// The scoring methods for the eval
	scorers: [filtersEqual],
});
