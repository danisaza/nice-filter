import { v4 as uuidv4 } from "uuid";
import type { ComboboxOption, FilterOption } from "./constants";
import { RELATIONSHIP_TYPES } from "./constants";

const STATUS_OPTIONS: ComboboxOption[] = [
	{ label: "Not Started", value: "Not Started", id: "1" },
	{ label: "In Progress", value: "In Progress", id: "2" },
	{ label: "Completed", value: "Completed", id: "3" },
	{ label: "Cancelled", value: "Cancelled", id: "4" },
];

const PRIORITY_OPTIONS: ComboboxOption[] = [
	{ label: "Low", value: "Low", id: uuidv4() },
	{ label: "Medium", value: "Medium", id: uuidv4() },
	{ label: "High", value: "High", id: uuidv4() },
];

const TAGS: ComboboxOption[] = [
	{ label: "Bug", value: "Bug", id: uuidv4() },
	{ label: "Feature", value: "Feature", id: uuidv4() },
	{ label: "Documentation", value: "Documentation", id: uuidv4() },
	{ label: "Refactoring", value: "Refactoring", id: uuidv4() },
	{ label: "Testing", value: "Testing", id: uuidv4() },
	{ label: "Other", value: "Other", id: uuidv4() },
];

const ASSIGNEE_OPTIONS: ComboboxOption[] = [
	{ label: "John Doe", value: "John Doe", id: uuidv4() },
	{ label: "Jane Smith", value: "Jane Smith", id: uuidv4() },
	{ label: "Alice Johnson", value: "Alice Johnson", id: uuidv4() },
	{ label: "Bob Brown", value: "Bob Brown", id: uuidv4() },
];

export const FILTER_CATEGORIES: FilterOption[] = [
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "status",
		propertyNamePlural: "statuses",
		options: STATUS_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "priority",
		propertyNamePlural: "priorities",
		options: PRIORITY_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.CHECKBOXES,
		propertyNameSingular: "tag",
		propertyNamePlural: "tags",
		options: TAGS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "assignee",
		propertyNamePlural: "assignees",
		options: ASSIGNEE_OPTIONS,
	},
];
