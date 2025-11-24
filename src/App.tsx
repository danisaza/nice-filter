import "@/App.css";
import Filters from "@/Filters";
import Grid from "@/Grid";
import createFiltersContext, {
	FiltersProvider,
} from "@/hooks/useFilters/useFilters";
import { NewFilterCreatedAtCutoffProvider } from "@/hooks/useNewFilterCreatedAtCutoff";
import { type MyRow, ROWS } from "@/mock-data/grid-data";

const [useFilters, FiltersContext] = createFiltersContext<MyRow>();

export { useFilters };

export default function App() {
	return (
		<FiltersProvider
			context={FiltersContext}
			rows={ROWS}
		>
			<NewFilterCreatedAtCutoffProvider>
				<Filters />
				<Grid />
			</NewFilterCreatedAtCutoffProvider>
		</FiltersProvider>
	);
}
