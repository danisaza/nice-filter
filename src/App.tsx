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

const [useFilters, FiltersContext] = createFiltersContext<MyRow>();

export { useFilters };

const ROW_COUNT = 10_000;

export default function App() {
	const rows = useMemo(() => generateRows(ROW_COUNT), []);

	return (
		<FiltersProvider context={FiltersContext} rows={rows}>
			<NewFilterCreatedAtCutoffProvider>
				<div className="grid grid-rows-[auto_auto_auto_1fr_auto] h-screen">
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
