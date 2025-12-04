import { SELECTION_TYPES } from "@/hooks/useFilters/constants";
import type {
	ComboboxOption,
	FilterOption,
	Row,
	TAppliedFilter,
} from "@/hooks/useFilters/types";
import type { TAutocompleteSuggestion, TFilterChip } from "./types";

/**
 * Represents a parsed filter entry from text input.
 * This is an intermediate type used before looking up full IDs.
 */
export interface ParsedFilterEntry {
	key: string;
	value: string;
	raw: string;
}

/**
 * Parses filter text and extracts key:value pairs.
 * Supports values with spaces - stops before the next key: pattern or end of string.
 * Also supports quoted values like status:"In Progress".
 */
export function parseFilterText(text: string): {
	entries: ParsedFilterEntry[];
	remainingText: string;
} {
	const entries: ParsedFilterEntry[] = [];

	// Pattern explanation:
	// (\w+): - capture the key followed by colon
	// "([^"]+)" - quoted value (captures content without quotes)
	// (.+?) - non-greedy match for unquoted values (can include spaces)
	// (?=\s+\w+:|$) - lookahead for next key: or end of string
	const quotedPattern = /(\w+):"([^"]+)"/g;
	// Allow spaces in values - stop only at next key: pattern or end of string
	const unquotedPattern = /(\w+):(.+?)(?=\s+\w+:|$)/g;

	// First pass: extract quoted values
	let processedText = text;
	let quotedMatch = quotedPattern.exec(text);
	while (quotedMatch !== null) {
		const [fullMatch, key, value] = quotedMatch;
		entries.push({
			key,
			value: value.trim(),
			raw: fullMatch,
		});
		// Remove matched portion from text for remaining text calculation
		processedText = processedText.replace(fullMatch, "");
		quotedMatch = quotedPattern.exec(text);
	}

	// Second pass: extract unquoted values from remaining text
	// But we need to re-check original text for unquoted patterns that weren't quoted
	let unquotedMatch = unquotedPattern.exec(text);
	while (unquotedMatch !== null) {
		const [fullMatch, key, value] = unquotedMatch;
		const matchIndex = unquotedMatch.index;
		// Check if this key:value was already captured as quoted
		const alreadyCaptured = entries.some(
			(e) => e.key === key && text.indexOf(e.raw) <= matchIndex,
		);
		if (!alreadyCaptured) {
			entries.push({
				key,
				value: value.trim(),
				raw: fullMatch,
			});
			processedText = processedText.replace(fullMatch, "");
		}
		unquotedMatch = unquotedPattern.exec(text);
	}

	const remainingText = processedText.trim();
	return {
		entries,
		remainingText,
	};
}

/**
 * Gets autocomplete suggestions based on input and available filter categories.
 * Returns suggestions with IDs for direct lookup.
 */
export function getAutocompleteSuggestions<T extends Row>(
	input: string,
	filterCategories: FilterOption<T>[],
): TAutocompleteSuggestion[] {
	const suggestions: TAutocompleteSuggestion[] = [];

	// If input is empty, show all available filter keys
	if (!input || input.trim() === "") {
		for (const category of filterCategories) {
			suggestions.push({
				type: "key",
				// NOTE: in future we could have a property for "defaultDisplayText" or something,
				// or make an intelligent selection based on the type of column
				text: `${String(category.propertyNameSingular)}:`,
				categoryId: category.id,
			});
		}
		return suggestions;
	}

	// Check if we're typing a filter key (no colon yet)
	const keyMatch = input.match(/(\w+)$/);
	if (keyMatch && !input.includes(":")) {
		const partial = keyMatch[1].toLowerCase();
		for (const category of filterCategories) {
			const singular = String(category.propertyNameSingular);
			const plural = String(category.propertyNamePlural);
			if (
				singular.toLowerCase().startsWith(partial) ||
				plural.toLowerCase().startsWith(partial)
			) {
				suggestions.push({
					type: "key",
					text: `${singular}:`,
					categoryId: category.id,
				});
			}
		}
		return suggestions;
	}

	// Check if we're typing a filter value (has colon)
	// Match everything after the colon to support values with spaces
	const valueMatch = input.match(/(\w+):(.*)$/);
	if (valueMatch) {
		const [, key, partial] = valueMatch;
		const category = findFilterOptionByKey(filterCategories, key);
		if (category) {
			const partialLower = partial.toLowerCase().trim();
			for (const option of category.options) {
				// Match against both label and value
				if (
					option.value.toLowerCase().startsWith(partialLower) ||
					option.label.toLowerCase().startsWith(partialLower)
				) {
					suggestions.push({
						type: "value",
						text: option.value,
						filterKey: key,
						categoryId: category.id,
						optionId: option.id,
					});
				}
			}
		}
	}
	return suggestions;
}

export function serializeFilters(
	chips: TFilterChip[],
	freeText: string,
): string {
	const chipText = chips.map((c) => c.raw).join(" ");
	return freeText ? `${chipText} ${freeText}`.trim() : chipText;
}

/**
 * Checks if the current input value + a space would be a valid prefix for any option.
 * This is used to determine whether pressing space should add to the input or trigger selection.
 *
 * @example
 * - Input: "status:not" → true (because "not " is a prefix of "Not Started")
 * - Input: "status:Low" → false (because "Low " is not a prefix of any option)
 */
export function wouldSpaceBeValidPrefix<T extends Row>(
	input: string,
	filterCategories: FilterOption<T>[],
): boolean {
	// Check if we're typing a filter value (has colon)
	const valueMatch = input.match(/(\w+):(.+)$/);
	if (!valueMatch) {
		return false;
	}

	const [, key, partial] = valueMatch;
	const category = findFilterOptionByKey(filterCategories, key);
	if (!category) {
		return false;
	}

	// Check if partial + space is a valid prefix for any option
	// biome-ignore lint/style/useTemplate: this syntax is clearer
	const partialWithSpace = (partial + " ").toLowerCase();

	for (const option of category.options) {
		const valueLower = option.value.toLowerCase();
		const labelLower = option.label.toLowerCase();

		// Check if the option value/label starts with the partial + space
		if (
			valueLower.startsWith(partialWithSpace) ||
			labelLower.startsWith(partialWithSpace)
		) {
			return true;
		}
	}

	return false;
}

/**
 * Finds a FilterOption matching a given key string.
 * Checks both propertyNameSingular and propertyNamePlural.
 */
export function findFilterOptionByKey<T extends Row>(
	filterCategories: FilterOption<T>[],
	key: string,
): FilterOption<T> | undefined {
	const keyLower = key.toLowerCase();
	return filterCategories.find((category) => {
		const singular = String(category.propertyNameSingular).toLowerCase();
		const plural = String(category.propertyNamePlural).toLowerCase();
		return singular === keyLower || plural === keyLower;
	});
}

/**
 * Finds a ComboboxOption matching a given value string within a category's options.
 * Matches against both value and label fields.
 */
export function findComboboxOptionByValue(
	options: ComboboxOption[],
	value: string,
): ComboboxOption | undefined {
	const valueLower = value.toLowerCase();
	return options.find(
		(option) =>
			option.value.toLowerCase() === valueLower ||
			option.label.toLowerCase() === valueLower,
	);
}

/**
 * Converts TAppliedFilter[] to TFilterChip[] for display purposes.
 * Creates one chip per value in each filter, including IDs for direct lookup.
 */
export function convertTAppliedFilterToChips<T extends Row>(
	filters: TAppliedFilter[],
	filterCategories: FilterOption<T>[],
): TFilterChip[] {
	const chips: TFilterChip[] = [];

	for (const filter of filters) {
		const category = filterCategories.find((c) => c.id === filter.categoryId);
		if (!category) {
			continue;
		}

		// Determine the key to use for the chip
		const key =
			filter.selectionType === SELECTION_TYPES.RADIO
				? filter.propertyNameSingular
				: filter.propertyNamePlural;

		// Create one chip per value with full ID information
		for (const valueOption of filter.values) {
			// Use quotes in raw if value contains spaces
			const rawValue = valueOption.value.includes(" ")
				? `"${valueOption.value}"`
				: valueOption.value;

			chips.push({
				id: `${filter.id}-${valueOption.id}`,
				categoryId: filter.categoryId,
				valueId: valueOption.id,
				key,
				value: valueOption.value,
				label: valueOption.label,
				raw: `${key}:${rawValue}`,
			});
		}
	}

	return chips;
}
