import type { ComboboxOption, FilterOption } from "./constants";
import { RELATIONSHIP_TYPES } from "./constants";

const STATUS_OPTIONS: ComboboxOption[] = [
	{ label: "Not Started", value: "Not Started", id: "1" },
	{ label: "In Progress", value: "In Progress", id: "2" },
	{ label: "Completed", value: "Completed", id: "3" },
	{ label: "Cancelled", value: "Cancelled", id: "4" },
];

const PRIORITY_OPTIONS: ComboboxOption[] = [
	{ label: "Low", value: "Low", id: "1" },
	{ label: "Medium", value: "Medium", id: "2" },
	{ label: "High", value: "High", id: "3" },
];

const TAGS: ComboboxOption[] = [
	{ label: "Bug", value: "Bug", id: "1" },
	{ label: "Feature", value: "Feature", id: "2" },
	{ label: "Documentation", value: "Documentation", id: "3" },
	{ label: "Refactoring", value: "Refactoring", id: "4" },
	{ label: "Testing", value: "Testing", id: "5" },
	{ label: "Other", value: "Other", id: "6" },
];

const ASSIGNEE_OPTIONS: ComboboxOption[] = [
	{ label: "John Doe", value: "John Doe", id: "1" },
	{ label: "Jane Smith", value: "Jane Smith", id: "2" },
	{ label: "Alice Johnson", value: "Alice Johnson", id: "3" },
	{ label: "Bob Brown", value: "Bob Brown", id: "4" },
];

export const FILTER_CATEGORIES: FilterOption[] = [
	{
		id: "status",
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "status",
		propertyNamePlural: "statuses",
		options: STATUS_OPTIONS,
	},
	{
		id: "priority",
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "priority",
		propertyNamePlural: "priorities",
		options: PRIORITY_OPTIONS,
	},
	{
		id: "tags",
		selectionType: RELATIONSHIP_TYPES.CHECKBOXES,
		propertyNameSingular: "tag",
		propertyNamePlural: "tags",
		options: TAGS,
	},
	{
		id: "assignee",
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "assignee",
		propertyNamePlural: "assignees",
		options: ASSIGNEE_OPTIONS,
	},
];
