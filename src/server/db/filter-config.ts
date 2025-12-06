/**
 * Mock database layer for filter configuration.
 *
 * In production, replace with actual database queries.
 * The backend owns filter configuration - frontend only sends natural language queries.
 */

export type FilterColumnType = "radio" | "checkboxes" | "text";

export interface FilterColumnConfig {
	type: FilterColumnType;
	options: string[];
}

/**
 * Simulates reading filter schema from database.
 * Maps column names to their types and available options.
 */
export const FILTER_CONFIG: Record<string, FilterColumnConfig> = {
	status: {
		type: "radio",
		options: ["Not Started", "In Progress", "Completed", "Cancelled"],
	},
	priority: {
		type: "radio",
		options: ["Low", "Medium", "High"],
	},
	assignee: {
		type: "radio",
		options: ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"],
	},
	tags: {
		type: "checkboxes",
		options: [
			"Bug",
			"Feature",
			"Documentation",
			"Refactoring",
			"Testing",
			"Other",
		],
	},
	text: {
		type: "text",
		options: [], // Text fields have no predefined options
	},
};

/**
 * Mock async function to simulate DB read.
 * In production, this would query your database.
 */
export async function getFilterConfig(): Promise<
	Record<string, FilterColumnConfig>
> {
	// Simulate async DB call
	return FILTER_CONFIG;
}

/**
 * Formats the filter config for inclusion in an AI prompt.
 * Returns a human-readable description of available columns and values.
 */
export function formatFilterConfigForPrompt(
	config: Record<string, FilterColumnConfig>,
): string {
	const lines: string[] = [];

	for (const [columnName, columnConfig] of Object.entries(config)) {
		if (columnConfig.type === "text") {
			lines.push(`- "${columnName}" (text search): free-form text matching`);
		} else {
			const optionsList = columnConfig.options.join(", ");
			lines.push(`- "${columnName}" (${columnConfig.type}): ${optionsList}`);
		}
	}

	return lines.join("\n");
}
