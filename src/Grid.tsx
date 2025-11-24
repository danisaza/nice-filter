import { X } from "lucide-react";
import { useFilters } from "@/App";
import { Button } from "./components/ui/button";
import GridItem from "./GridItem";

const Grid = () => {
	const { removeAllFilters, filteredRows, hiddenRowCount } = useFilters();
	return (
		<div className="w-full">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
				{filteredRows.map((row) => (
					<GridItem key={row.id} row={row} />
				))}
			</div>
			{hiddenRowCount > 0 ? (
				<div className="flex justify-center items-center gap-4 mt-4">
					<div className="text-sm text-gray-500">
						<span className="font-bold">
							{hiddenRowCount} {hiddenRowCount === 1 ? "item" : "items"}
						</span>{" "}
						hidden by filters
					</div>
					<Button
						variant="outline"
						onClick={() => {
							removeAllFilters();
						}}
					>
						Clear filters <X />
					</Button>
				</div>
			) : null}
		</div>
	);
});

export default Grid;
