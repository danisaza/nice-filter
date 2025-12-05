import "@/App.css";
import { useMemo, useState } from "react";
import FiltersFooterSection from "@/components/ui/filters/FilterFooterSection";
import Grid from "@/Grid";
import createFiltersContext, {
	FiltersProvider,
} from "@/hooks/useFilters/useFilters";
import { NewFilterCreatedAtCutoffProvider } from "@/hooks/useNewFilterCreatedAtCutoff";
import { generateRows, type MyRow } from "@/mock-data/grid-data";
import { ComponentPreview } from "./components/ui/chipified-filters/ComponentPreview";

const { useFilters, useFilteredRows, filtersContext, filteredRowsContext } =
	createFiltersContext<MyRow>();

export { useFilters, useFilteredRows };

export default function App() {
	const [rowCount] = useState(100);
	const rows = useMemo(() => generateRows(rowCount), [rowCount]);

	return (
		<FiltersProvider
			context={filtersContext}
			filteredRowsContext={filteredRowsContext}
			rows={rows}
			getRowCacheKey={(row) => `${row.id}:${row.lastUpdated}`}
		>
			<NewFilterCreatedAtCutoffProvider>
				<div className="grid grid-rows-[auto_1fr_auto] h-screen">
					<header className="p-4 border-b">
						<ComponentPreview />
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
