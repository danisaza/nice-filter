export interface ChipFilterInputProps {
	placeholder?: string;
	freeTextAllowed?: boolean;
	className?: string;
	"data-id"?: string;
}

export interface AutocompleteDropdownProps {
	suggestions: TAutocompleteSuggestion[];
	selectedIndex: number;
	onSelect: (suggestion: TAutocompleteSuggestion) => void;
	onToggleSelection?: (suggestion: TAutocompleteSuggestion) => void;
	pendingSelections?: Set<string>; // optionIds that are currently selected
	position: {
		top: number;
		left: number;
	};
	visible: boolean;
}

export interface TAutocompleteSuggestion {
	type: "key" | "value";
	text: string;
	filterKey?: string;
	icon?: React.ReactNode;
	categoryId?: string; // for direct lookup
	optionId?: string; // for value suggestions
	selectionType?: "radio" | "checkboxes" | "text"; // for multi-select behavior
}
