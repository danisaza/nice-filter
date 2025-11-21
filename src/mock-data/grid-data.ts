import { v4 as uuidv4 } from "uuid";

export function generateRows(numRows: number): MyRow[] {
	const data: MyRow[] = [];
	for (let i = 0; i < numRows; i++) {
		data.push({
			id: uuidv4(),
			text: `Task ${i + 1}`,
			status: "Not Started",
			tags: ["Bug", "Documentation"],
			assignee: "John Doe",
			priority: "Low",
		});
	}
	return data;
}

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

export const ROWS: MyRow[] = [
	{
		id: uuidv4(),
		text: "Add polish to this page",
		status: "Not Started",
		tags: ["Bug", "Documentation"],
		assignee: "John Doe",
		priority: "Low",
	},
	{
		id: uuidv4(),
		text: "Add dark mode",
		status: "In Progress",
		tags: ["Feature", "Refactoring"],
		assignee: "Jane Smith",
		priority: "Medium",
	},
	{
		id: uuidv4(),
		text: "Do performance tuning",
		status: "Completed",
		tags: ["Documentation"],
		assignee: "Alice Johnson",
		priority: "High",
	},
	{
		id: uuidv4(),
		text: "Refactor the code",
		status: "Cancelled",
		tags: ["Refactoring"],
		assignee: "Bob Brown",
		priority: "Low",
	},
	{
		id: uuidv4(),
		text: "Fix the login page bug",
		status: "Not Started",
		tags: ["Bug", "Documentation"],
		assignee: "John Doe",
		priority: "Low",
	},
	{
		id: uuidv4(),
		text: "Add user impersonation",
		status: "In Progress",
		tags: ["Feature", "Refactoring"],
		assignee: "Jane Smith",
		priority: "Medium",
	},
	{
		id: uuidv4(),
		text: "Write API documentation",
		status: "Completed",
		tags: ["Documentation"],
		assignee: "Alice Johnson",
		priority: "High",
	},
	{
		id: uuidv4(),
		text: "Refactor authentication code",
		status: "Cancelled",
		tags: ["Refactoring"],
		assignee: "Bob Brown",
		priority: "Low",
	},
	{
		id: uuidv4(),
		text: "Fix performance bug",
		status: "Not Started",
		tags: ["Bug", "Documentation"],
		assignee: "John Doe",
		priority: "Low",
	},
	{
		id: uuidv4(),
		text: "Add export functionality",
		status: "In Progress",
		tags: ["Feature", "Refactoring"],
		assignee: "Jane Smith",
		priority: "Medium",
	},
	{
		id: uuidv4(),
		text: "Write user guide",
		status: "Completed",
		tags: ["Documentation"],
		assignee: "Alice Johnson",
		priority: "High",
	},
	{
		id: uuidv4(),
		text: "Refactor database queries",
		status: "Cancelled",
		tags: ["Refactoring"],
		assignee: "Bob Brown",
		priority: "Low",
	},
	{
		id: uuidv4(),
		text: "Fix mobile layout bug",
		status: "Not Started",
		tags: ["Bug", "Documentation"],
		assignee: "John Doe",
		priority: "Low",
	},
	{
		id: uuidv4(),
		text: "Add search feature",
		status: "In Progress",
		tags: ["Feature", "Refactoring"],
		assignee: "Jane Smith",
		priority: "Medium",
	},
	{
		id: uuidv4(),
		text: "Write release notes",
		status: "Completed",
		tags: ["Documentation"],
		assignee: "Alice Johnson",
		priority: "High",
	},
	{
		id: uuidv4(),
		text: "Clean up styling",
		status: "Cancelled",
		tags: ["Refactoring"],
		assignee: "Bob Brown",
		priority: "Low",
	},
	{
		id: uuidv4(),
		text: "Another one!",
		status: "Completed",
		tags: ["Bug", "Feature"],
		assignee: "Bob Brown",
		priority: "Low",
	},
];
