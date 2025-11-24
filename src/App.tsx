import "@/App.css";
import Filters from "@/Filters";
import type { Predicate } from "@/hooks/useFilters/constants";
import createFiltersContext, {
	FiltersProvider,
} from "@/hooks/useFilters/useFilters";
import { NewFilterCreatedAtCutoffProvider } from "@/hooks/useNewFilterCreatedAtCutoff";
import { generateRows, type MyRow } from "@/mock-data/grid-data";
import Grid from "./Grid";

const ROWS = generateRows(10_000);

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
