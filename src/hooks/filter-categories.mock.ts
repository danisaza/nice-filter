import { v4 as uuidv4 } from "uuid";
import { SELECTION_TYPES } from "@/hooks/useFilters/constants";
import type { ComboboxOption, FilterOption } from "@/hooks/useFilters/types";
import type { MyRow } from "@/mock-data/grid-data";
import { FILTER_COLUMNS } from "@/shared/filter-columns-and-values.mock";

// Generate many options for stress testing
// function generateOptions(prefix: string, count: number): ComboboxOption[] {
// 	return Array.from({ length: count }, (_, i) => ({
// 		label: `${prefix} ${i + 1}`,
// 		value: `${prefix} ${i + 1}`,
// 		id: uuidv4(),
// 	}));
// }

/**
 * Converts an array of string values to ComboboxOption format.
 */
function toComboboxOptions(values: readonly string[]): ComboboxOption[] {
	return values.map((v) => ({ label: v, value: v, id: uuidv4() }));
}

// Additional categories for performance testing
// const CATEGORY_OPTIONS = generateOptions("Category", 50);
// const DEPARTMENT_OPTIONS = generateOptions("Department", 30);
// const TEAM_OPTIONS = generateOptions("Team", 40);
// const PROJECT_OPTIONS = generateOptions("Project", 100);
// const LABEL_OPTIONS = generateOptions("Label", 75);
// const MILESTONE_OPTIONS = generateOptions("Milestone", 25);
// const EPIC_OPTIONS = generateOptions("Epic", 60);
// const COMPONENT_OPTIONS = generateOptions("Component", 80);
// const VERSION_OPTIONS = generateOptions("Version", 45);
// const SPRINT_OPTIONS = generateOptions("Sprint", 35);
// const CUSTOMER_OPTIONS = generateOptions("Customer", 200);
// const REGION_OPTIONS = generateOptions("Region", 50);
// const PRODUCT_OPTIONS = generateOptions("Product", 90);
// const PLATFORM_OPTIONS = generateOptions("Platform", 20);
// const ENVIRONMENT_OPTIONS = generateOptions("Environment", 15);

/**
 * Maps the shared filter column type to the frontend selection type.
 */
function mapSelectionType(
	type: "radio" | "checkboxes" | "text",
): (typeof SELECTION_TYPES)[keyof typeof SELECTION_TYPES] {
	return SELECTION_TYPES[type.toUpperCase() as keyof typeof SELECTION_TYPES];
}

/**
 * Filter categories derived from the shared filter configuration.
 *
 * Note: Type assertion is needed because TypeScript can't verify the
 * AtLeastOnePropertyKey constraint when mapping over Object.entries().
 * The constraint is satisfied because each column's singular or plural
 * name matches a key in MyRow.
 */
export const FILTER_CATEGORIES = Object.entries(FILTER_COLUMNS).map(
	([_key, column]) => ({
		id: uuidv4(),
		selectionType: mapSelectionType(column.type),
		propertyNameSingular: column.singular,
		propertyNamePlural: column.plural,
		options: toComboboxOptions(column.options),
	}),
) as FilterOption<MyRow>[];
