import type { FilterOption, Row } from "@/hooks/useFilters/types";
import type { FilterConfig, TFilterChip } from "./types";
export function convertFilterOptionsToFilterConfig<T extends Row>(
	filterOptions: FilterOption<T>[],
): FilterConfig[] {
	return filterOptions.map((option) => ({
		key: String(option.propertyNameSingular),
		values: option.options.map((opt) => opt.value),
	}));
}
export function parseFilterText(text: string): {
	chips: TFilterChip[];
	remainingText: string;
} {
	const chips: TFilterChip[] = [];
	const filterPattern = /(\w+):(\S+)/g;
	let lastIndex = 0;
	let match = filterPattern.exec(text);
	while (match !== null) {
		const [fullMatch, key, value] = match;
		chips.push({
			id: `${key}-${value}-${Date.now()}-${Math.random()}`,
			key,
			value,
			raw: fullMatch,
		});
		lastIndex = match.index + fullMatch.length;
		match = filterPattern.exec(text);
	}
	const remainingText = text.slice(lastIndex).trim();
	return {
		chips,
		remainingText,
	};
}
export function getAutocompleteSuggestions(
	input: string,
	filterConfig: FilterConfig[],
	currentFilters: TFilterChip[],
): Array<{
	type: "key" | "value";
	text: string;
	filterKey?: string;
	icon?: React.ReactNode;
}> {
	const suggestions: Array<{
		type: "key" | "value";
		text: string;
		filterKey?: string;
		icon?: React.ReactNode;
	}> = [];

	// If input is empty, show all available filter keys
	if (!input || input.trim() === "") {
		filterConfig.forEach((config) => {
			suggestions.push({
				type: "key",
				text: `${config.key}:`,
				icon: config.icon,
			});
		});
		return suggestions;
	}

	// Check if we're typing a filter key
	const keyMatch = input.match(/(\w+)$/);
	if (keyMatch && !input.includes(":")) {
		const partial = keyMatch[1].toLowerCase();
		filterConfig.forEach((config) => {
			if (config.key.toLowerCase().startsWith(partial)) {
				suggestions.push({
					type: "key",
					text: `${config.key}:`,
					icon: config.icon,
				});
			}
		});
		return suggestions;
	}

	// Check if we're typing a filter value
	const valueMatch = input.match(/(\w+):(\w*)$/);
	if (valueMatch) {
		const [, key, partial] = valueMatch;
		const config = filterConfig.find(
			(c) => c.key.toLowerCase() === key.toLowerCase(),
		);
		if (config && Array.isArray(config.values)) {
			const partialLower = partial.toLowerCase();
			config.values.forEach((value) => {
				if (value.toLowerCase().startsWith(partialLower)) {
					suggestions.push({
						type: "value",
						text: value,
						filterKey: key,
						icon: config.icon,
					});
				}
			});
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
