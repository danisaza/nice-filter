import "./App.css";
import TestDropdown from "./components/ui/test-dropdown";
import Filters, { type FilterOption } from "./Filters";
import Grid from "./Grid";
import {
	FiltersProvider,
	type Option,
	RELATIONSHIP_TYPES,
} from "./hooks/useFilters";

type Status = "Not Started" | "In Progress" | "Completed" | "Cancelled";
type Priority = "Low" | "Medium" | "High";
type Tag =
	| "Bug"
	| "Feature"
	| "Documentation"
	| "Refactoring"
	| "Testing"
	| "Other";
type Assignee = "John Doe" | "Jane Smith" | "Alice Johnson" | "Bob Brown";

export type Row = {
	id: string;
	text: string;
	status: Status;
	tags: Tag[];
	assignee: Assignee;
	priority: Priority;
};

const ROWS: Row[] = [
	{
		id: "1",
		text: "Add polish to this page",
		status: "Not Started",
		tags: ["Bug", "Documentation"],
		assignee: "John Doe",
		priority: "Low",
	},
	{
		id: "2",
		text: "Add dark mode",
		status: "In Progress",
		tags: ["Feature", "Refactoring"],
		assignee: "Jane Smith",
		priority: "Medium",
	},
	{
		id: "3",
		text: "Do performance tuning",
		status: "Completed",
		tags: ["Documentation"],
		assignee: "Alice Johnson",
		priority: "High",
	},
	{
		id: "4",
		text: "Refactor the code",
		status: "Cancelled",
		tags: ["Refactoring"],
		assignee: "Bob Brown",
		priority: "Low",
	},
	{
		id: "5",
		text: "Fix the login page bug",
		status: "Not Started",
		tags: ["Bug", "Documentation"],
		assignee: "John Doe",
		priority: "Low",
	},
	{
		id: "6",
		text: "Add user impersonation",
		status: "In Progress",
		tags: ["Feature", "Refactoring"],
		assignee: "Jane Smith",
		priority: "Medium",
	},
	{
		id: "7",
		text: "Write API documentation",
		status: "Completed",
		tags: ["Documentation"],
		assignee: "Alice Johnson",
		priority: "High",
	},
	{
		id: "8",
		text: "Refactor authentication code",
		status: "Cancelled",
		tags: ["Refactoring"],
		assignee: "Bob Brown",
		priority: "Low",
	},
	{
		id: "9",
		text: "Fix performance bug",
		status: "Not Started",
		tags: ["Bug", "Documentation"],
		assignee: "John Doe",
		priority: "Low",
	},
	{
		id: "10",
		text: "Add export functionality",
		status: "In Progress",
		tags: ["Feature", "Refactoring"],
		assignee: "Jane Smith",
		priority: "Medium",
	},
	{
		id: "11",
		text: "Write user guide",
		status: "Completed",
		tags: ["Documentation"],
		assignee: "Alice Johnson",
		priority: "High",
	},
	{
		id: "12",
		text: "Refactor database queries",
		status: "Cancelled",
		tags: ["Refactoring"],
		assignee: "Bob Brown",
		priority: "Low",
	},
	{
		id: "13",
		text: "Fix mobile layout bug",
		status: "Not Started",
		tags: ["Bug", "Documentation"],
		assignee: "John Doe",
		priority: "Low",
	},
	{
		id: "14",
		text: "Add search feature",
		status: "In Progress",
		tags: ["Feature", "Refactoring"],
		assignee: "Jane Smith",
		priority: "Medium",
	},
	{
		id: "15",
		text: "Write release notes",
		status: "Completed",
		tags: ["Documentation"],
		assignee: "Alice Johnson",
		priority: "High",
	},
	{
		id: "16",
		text: "Clean up styling",
		status: "Cancelled",
		tags: ["Refactoring"],
		assignee: "Bob Brown",
		priority: "Low",
	},
	{
		id: "17",
		text: "Another one!",
		status: "Completed",
		tags: ["Bug", "Feature"],
		assignee: "Bob Brown",
		priority: "Low",
	},
];

export default function App() {
	return (
		<FiltersProvider>
			<TestDropdown />
			<Filters />
			<Grid rows={ROWS} />
		</FiltersProvider>
	);
}
