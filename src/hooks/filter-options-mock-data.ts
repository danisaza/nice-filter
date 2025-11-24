import { v4 as uuidv4 } from "uuid";
import type {
	ComboboxOption,
	FilterOption,
} from "@/hooks/useFilters/constants";
import { RELATIONSHIP_TYPES } from "@/hooks/useFilters/constants";
import type { MyRow } from "@/mock-data/grid-data";

// Generate many options for stress testing
function generateOptions(prefix: string, count: number): ComboboxOption[] {
	return Array.from({ length: count }, (_, i) => ({
		label: `${prefix} ${i + 1}`,
		value: `${prefix} ${i + 1}`,
		id: uuidv4(),
	}));
}

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

// Additional categories for performance testing
const CATEGORY_OPTIONS = generateOptions("Category", 50);
const DEPARTMENT_OPTIONS = generateOptions("Department", 30);
const TEAM_OPTIONS = generateOptions("Team", 40);
const PROJECT_OPTIONS = generateOptions("Project", 100);
const LABEL_OPTIONS = generateOptions("Label", 75);
const MILESTONE_OPTIONS = generateOptions("Milestone", 25);
const EPIC_OPTIONS = generateOptions("Epic", 60);
const COMPONENT_OPTIONS = generateOptions("Component", 80);
const VERSION_OPTIONS = generateOptions("Version", 45);
const SPRINT_OPTIONS = generateOptions("Sprint", 35);
const CUSTOMER_OPTIONS = generateOptions("Customer", 200);
const REGION_OPTIONS = generateOptions("Region", 50);
const PRODUCT_OPTIONS = generateOptions("Product", 90);
const PLATFORM_OPTIONS = generateOptions("Platform", 20);
const ENVIRONMENT_OPTIONS = generateOptions("Environment", 15);

export const FILTER_CATEGORIES: FilterOption<MyRow>[] = [
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
	// Additional categories for stress testing
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.CHECKBOXES,
		propertyNameSingular: "category",
		propertyNamePlural: "tags",
		options: CATEGORY_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "department",
		propertyNamePlural: "status",
		options: DEPARTMENT_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.CHECKBOXES,
		propertyNameSingular: "team",
		propertyNamePlural: "tags",
		options: TEAM_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "project",
		propertyNamePlural: "priority",
		options: PROJECT_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.CHECKBOXES,
		propertyNameSingular: "label",
		propertyNamePlural: "tags",
		options: LABEL_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "milestone",
		propertyNamePlural: "assignee",
		options: MILESTONE_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.CHECKBOXES,
		propertyNameSingular: "epic",
		propertyNamePlural: "tags",
		options: EPIC_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "component",
		propertyNamePlural: "status",
		options: COMPONENT_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "version",
		propertyNamePlural: "priority",
		options: VERSION_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.CHECKBOXES,
		propertyNameSingular: "sprint",
		propertyNamePlural: "tags",
		options: SPRINT_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "customer",
		propertyNamePlural: "assignee",
		options: CUSTOMER_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.CHECKBOXES,
		propertyNameSingular: "region",
		propertyNamePlural: "tags",
		options: REGION_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "product",
		propertyNamePlural: "status",
		options: PRODUCT_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.CHECKBOXES,
		propertyNameSingular: "platform",
		propertyNamePlural: "tags",
		options: PLATFORM_OPTIONS,
	},
	{
		id: uuidv4(),
		selectionType: RELATIONSHIP_TYPES.RADIO,
		propertyNameSingular: "environment",
		propertyNamePlural: "priority",
		options: ENVIRONMENT_OPTIONS,
	},
];
