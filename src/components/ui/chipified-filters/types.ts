export interface TFilterChip {
	id: string;
	categoryId: string; // links to FilterOption.id
	valueId: string; // links to ComboboxOption.id
	key: string; // display key (propertyNameSingular/Plural)
	value: string; // display value (ComboboxOption.value)
	label: string; // display label (ComboboxOption.label)
	raw: string; // for edit functionality
}

export interface ChipFilterInputProps {
	placeholder?: string;
	freeTextAllowed?: boolean;
	className?: string;
	"data-id"?: string;
}

export interface FilterChipProps {
	chip: TFilterChip;
	onRemove: () => void;
	onEdit: () => void;
	isEditing: boolean;
	isFocused: boolean;
	onFocus: () => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
}

export interface AutocompleteDropdownProps {
	suggestions: TAutocompleteSuggestion[];
	selectedIndex: number;
	onSelect: (suggestion: TAutocompleteSuggestion) => void;
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
}
