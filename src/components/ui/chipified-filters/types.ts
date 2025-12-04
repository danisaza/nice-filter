export interface TFilterChip {
	id: string;
	key: string;
	value: string;
	raw: string;
}
export interface FilterConfig {
	key: string;
	values: string[] | "freeform";
	icon?: React.ReactNode;
}
export interface ChipFilterInputProps {
	filters: TFilterChip[];
	onFiltersChange: (filters: TFilterChip[]) => void;
	filterConfig: FilterConfig[];
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
}
