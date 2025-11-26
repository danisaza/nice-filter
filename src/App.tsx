import "@/App.css";
import { useMemo } from "react";
import FiltersFooterSection from "@/components/ui/filters/FilterFooterSection";
import Filters from "@/Filters";
import Grid from "@/Grid";
import createFiltersContext, {
	FiltersProvider,
} from "@/hooks/useFilters/useFilters";
import { NewFilterCreatedAtCutoffProvider } from "@/hooks/useNewFilterCreatedAtCutoff";
import { generateRows, type MyRow } from "@/mock-data/grid-data";

const {
	useFilters,
	useFilteredRows,
	context: filtersContext,
} = createFiltersContext<MyRow>();

export { useFilters, useFilteredRows };
const ROW_COUNT = 100;

export default function App() {
	const rows = useMemo(() => generateRows(ROW_COUNT), []);
	return (
		<FiltersProvider context={filtersContext} rows={rows}>
			<NewFilterCreatedAtCutoffProvider>
				<div className="grid grid-rows-[auto_1fr_auto] h-screen">
					<header className="p-4 border-b">
						<Filters />
					</header>
					<main className="overflow-auto p-4">
						<Grid />
					</main>
					<footer className="border-t">
						<FiltersFooterSection />
					</footer>
				</div>
			</NewFilterCreatedAtCutoffProvider>
		</FiltersProvider>
	);
}
