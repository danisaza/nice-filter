import "@/App.css";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import FiltersFooterSection from "@/components/ui/filters/FilterFooterSection";
import { Input } from "@/components/ui/input";
import Filters from "@/Filters";
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
	const [rowCount, setRowCount] = useState(100);
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
						<div className="flex items-center justify-between gap-4 flex-wrap mb-4">
							<Filters />
							<RowCountControl rowCount={rowCount} setRowCount={setRowCount} />
						</div>
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

const MIN_ROW_COUNT = 1;
const MAX_ROW_COUNT = 10000000;

function RowCountControl({
	rowCount,
	setRowCount,
}: {
	rowCount: number;
	setRowCount: (count: number) => void;
}) {
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState(rowCount.toString());

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (isOpen) {
			setInputValue(rowCount.toString());
		}
	};

	const validation = useMemo(() => {
		if (inputValue === "") {
			return { isValid: false, error: null };
		}
		const num = parseInt(inputValue, 10);
		if (Number.isNaN(num) || num < MIN_ROW_COUNT || num > MAX_ROW_COUNT) {
			return {
				isValid: false,
				error: `Row count must be between ${MIN_ROW_COUNT.toLocaleString()} and ${MAX_ROW_COUNT.toLocaleString()}`,
			};
		}
		return { isValid: true, error: null };
	}, [inputValue]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validation.isValid) {
			const num = parseInt(inputValue, 10);
			setRowCount(num);
			setOpen(false);
		} else {
			setInputValue(rowCount.toString());
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<Button variant="outline" onClick={() => setOpen(true)}>
				Change row count
			</Button>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Row Count</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="row-count-input" className="text-sm font-medium">
								Number of rows
							</label>
							<Input
								id="row-count-input"
								type="number"
								min={MIN_ROW_COUNT}
								max={MAX_ROW_COUNT}
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
							/>
							{validation.error && (
								<p className="text-sm text-destructive">{validation.error}</p>
							)}
						</div>
						<DialogFooter>
							<Button type="submit" disabled={!validation.isValid}>
								Update row count
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
