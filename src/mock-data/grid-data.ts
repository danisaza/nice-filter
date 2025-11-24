import { v4 as uuidv4 } from "uuid";

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

export function generateRows(numRows: number): MyRow[] {
	const data: MyRow[] = [];
	for (let i = 0; i < numRows; i++) {
		data.push({
			id: uuidv4(),
			text: `${randomItem(TASK_PREFIXES)} ${randomItem(TASK_SUBJECTS)} ${i + 1}`,
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
	text: string;
	status: Status;
	tags: Tag[];
	assignee: Assignee;
	priority: Priority;
};

// Generate 10,000 rows for performance profiling
export const ROWS: MyRow[] = generateRows(100);
