import "@/App.css";
import FiltersFooterSection from "@/components/ui/filters/FilterFooterSection";
import Filters from "@/Filters";
import Grid from "@/Grid";
import createFiltersContext, {
	FiltersProvider,
} from "@/hooks/useFilters/useFilters";
import { NewFilterCreatedAtCutoffProvider } from "@/hooks/useNewFilterCreatedAtCutoff";
import { type MyRow, ROWS } from "@/mock-data/grid-data";

const { useFilters, useFilteredRows, filtersContext, filteredRowsContext } =
	createFiltersContext<MyRow>();

export { useFilters, useFilteredRows };

export default function App() {
	return (
		<FiltersProvider
			context={filtersContext}
			filteredRowsContext={filteredRowsContext}
			rows={ROWS}
		>
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
