import "@/App.css";
import Filters from "@/Filters";
import Grid from "@/Grid";
import type { Predicate } from "@/hooks/useFilters/constants";
import createFiltersContext, {
	FiltersProvider,
} from "@/hooks/useFilters/useFilters";
import { NewFilterCreatedAtCutoffProvider } from "@/hooks/useNewFilterCreatedAtCutoff";

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

const ROWS: MyRow[] = [
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

const GETTERS = {
	status: (row: MyRow) => row.status,
	priority: (row: MyRow) => row.priority,
	tag: (row: MyRow) => row.tags,
	assignee: (row: MyRow) => row.assignee,
};

const myPredicate: Predicate<MyRow> = (row, filter, filterValue) => {
	const getter =
		GETTERS[filter.propertyNameSingular as keyof typeof GETTERS] ??
		(() =>
			row[filter.propertyNameSingular as keyof MyRow] ??
			row[filter.propertyNamePlural as keyof MyRow]);

	const rowValue = getter(row);
	return rowValue === filterValue.value;
};

const [useFilters, FiltersContext] = createFiltersContext<MyRow>();

export { useFilters };

export default function App() {
	return (
		<FiltersProvider
			context={FiltersContext}
			predicate={myPredicate}
			rows={ROWS}
		>
			<NewFilterCreatedAtCutoffProvider>
				<Filters />
				<Grid />
			</NewFilterCreatedAtCutoffProvider>
		</FiltersProvider>
	);
}
