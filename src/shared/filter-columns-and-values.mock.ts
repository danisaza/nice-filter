/**
 * Single source of truth for filter configuration.
 *
 * In a production setting, this would all be data that's stored in the database.
 */

// Canonical option values
export const STATUSES = [
	"Not Started",
	"In Progress",
	"Completed",
	"Cancelled",
] as const;

export const PRIORITIES = ["Low", "Medium", "High"] as const;

export const TAGS = [
	"Bug",
	"Feature",
	"Documentation",
	"Refactoring",
	"Testing",
	"Other",
] as const;

export const ASSIGNEES = [
	"John Doe",
	"Jane Smith",
	"Alice Johnson",
	"Bob Brown",
] as const;

// TypeScript types derived from the canonical arrays
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Tag = (typeof TAGS)[number];
export type Assignee = (typeof ASSIGNEES)[number];

// Selection types for filter columns
export type FilterColumnType = "radio" | "checkboxes" | "text";

// Column configuration with selection type and property names
export const FILTER_COLUMNS = {
	status: {
		type: "radio" as const,
		options: STATUSES,
		singular: "status",
		plural: "statuses",
	},
	priority: {
		type: "radio" as const,
		options: PRIORITIES,
		singular: "priority",
		plural: "priorities",
	},
	tags: {
		type: "checkboxes" as const,
		options: TAGS,
		singular: "tag",
		plural: "tags",
	},
	assignee: {
		type: "radio" as const,
		options: ASSIGNEES,
		singular: "assignee",
		plural: "assignees",
	},
	text: {
		type: "text" as const,
		options: [] as const,
		singular: "text",
		plural: "text",
	},
} as const;

export type FilterColumnName = keyof typeof FILTER_COLUMNS;
