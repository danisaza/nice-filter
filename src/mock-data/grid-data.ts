import { v4 as uuidv4 } from "uuid";
import { STATIC_ROWS } from "./static-rows";

export type Status = "Not Started" | "In Progress" | "Completed" | "Cancelled";
export type Priority = "Low" | "Medium" | "High";
export type Tag =
	| "Bug"
	| "Feature"
	| "Documentation"
	| "Refactoring"
	| "Testing"
	| "Other";
type Assignee = "John Doe" | "Jane Smith" | "Alice Johnson" | "Bob Brown";

const STATUSES: Status[] = [
	"Not Started",
	"In Progress",
	"Completed",
	"Cancelled",
];
const PRIORITIES: Priority[] = ["Low", "Medium", "High"];
const TAGS: Tag[] = [
	"Bug",
	"Feature",
	"Documentation",
	"Refactoring",
	"Testing",
	"Other",
];
const ASSIGNEES: Assignee[] = [
	"John Doe",
	"Jane Smith",
	"Alice Johnson",
	"Bob Brown",
];

const TASK_PREFIXES = [
	"Implement",
	"Fix",
	"Refactor",
	"Add",
	"Update",
	"Remove",
	"Optimize",
	"Debug",
	"Test",
	"Review",
	"Deploy",
	"Configure",
	"Migrate",
	"Document",
	"Analyze",
	"Design",
	"Build",
	"Integrate",
	"Validate",
	"Audit",
];

const TASK_SUBJECTS = [
	"authentication",
	"database",
	"API",
	"UI",
	"dashboard",
	"reports",
	"notifications",
	"search",
	"filters",
	"export",
	"import",
	"settings",
	"permissions",
	"logging",
	"caching",
	"pagination",
	"validation",
	"error handling",
	"testing",
	"documentation",
	"deployment",
	"monitoring",
	"analytics",
	"performance",
	"security",
	"accessibility",
	"mobile view",
];

function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], min: number, max: number): T[] {
	const count = Math.floor(Math.random() * (max - min + 1)) + min;
	const shuffled = [...arr].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

/**
 * Generates rows for the grid.
 * - If numRows <= 100, returns the first numRows from STATIC_ROWS
 * - If numRows > 100, returns all 100 STATIC_ROWS plus (numRows - 100) randomly generated rows
 */
export function generateRows(numRows: number): MyRow[] {
	if (numRows <= STATIC_ROWS.length) {
		return STATIC_ROWS.slice(0, numRows);
	}

	// Start with all static rows
	const data: MyRow[] = [...STATIC_ROWS];

	// Generate additional random rows for the remainder
	const additionalRowsNeeded = numRows - STATIC_ROWS.length;
	for (let i = 0; i < additionalRowsNeeded; i++) {
		const rowNumber = STATIC_ROWS.length + i + 1;
		data.push({
			id: uuidv4(),
			lastUpdated: String(
				Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 10),
			), // sometime in the last 10 hours
			text: `${randomItem(TASK_PREFIXES)} ${randomItem(TASK_SUBJECTS)} ${rowNumber}`,
			status: randomItem(STATUSES),
			tags: randomItems(TAGS, 1, 3),
			assignee: randomItem(ASSIGNEES),
			priority: randomItem(PRIORITIES),
		});
	}
	return data;
}

// NOTE: I'm calling this `MyRow` to avoid confusion with the `Row` type from `useFilters`, and to stress that this is
//       the shape of the _user's_ data.
export type MyRow = {
	id: string;
	lastUpdated: string; // note that numbers are not supported as values yet
	text: string;
	status: Status;
	tags: Tag[];
	assignee: Assignee;
	priority: Priority;
};

// Generate 10,000 rows for performance profiling
export const ROWS: MyRow[] = generateRows(10_000);
