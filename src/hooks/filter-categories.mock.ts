import { v4 as uuidv4 } from "uuid";
import { SELECTION_TYPES } from "@/hooks/useFilters/constants";
import type { ComboboxOption, FilterOption } from "@/hooks/useFilters/types";
import type { MyRow } from "@/mock-data/grid-data";
import { FILTER_COLUMNS } from "@/shared/filter-columns-and-values.mock";

function toComboboxOptions(values: readonly string[]): ComboboxOption[] {
	return values.map((v) => ({ label: v, value: v, id: uuidv4() }));
}

function mapSelectionType(type: "radio" | "checkboxes" | "text") {
	return SELECTION_TYPES[type.toUpperCase() as keyof typeof SELECTION_TYPES];
}

export const FILTER_CATEGORIES = Object.entries(FILTER_COLUMNS).map(
	([_key, column]) => ({
		id: uuidv4(),
		selectionType: mapSelectionType(column.type),
		propertyNameSingular: column.singular,
		propertyNamePlural: column.plural,
		options: toComboboxOptions(column.options),
	}),
) as FilterOption<MyRow>[];
