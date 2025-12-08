/**
 * Mock database layer for filter configuration.
 *
 * In production, replace with actual database queries.
 * The backend owns filter configuration - frontend only sends natural language queries.
 */

import {
	FILTER_COLUMNS,
	type FilterColumnType,
} from "@/shared/filter-columns-and-values.mock";

// Re-export the type for consumers
export type { FilterColumnType };

export interface FilterColumnConfig {
	type: FilterColumnType;
	options: string[];
}

/**
 * Filter configuration derived from the shared source of truth.
 * Maps column names to their types and available options.
 */
export const FILTER_CONFIG: Record<string, FilterColumnConfig> =
	Object.fromEntries(
		Object.entries(FILTER_COLUMNS).map(([key, column]) => [
			key,
			{
				type: column.type,
				options: [...column.options], // Spread to convert readonly array to mutable
			},
		]),
	);

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
