import { useFilters } from "@/App";
import GridItem from "./GridItem";

const Grid = () => {
	const { filteredRows } = useFilters();
	return (
		<div className="w-full">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredRows.map((row) => (
					<GridItem key={row.id} row={row} />
				))}
			</div>
		</div>
	);
};

export default Grid;
