import { X } from "lucide-react";
import { useFilters } from "@/App";
import { Button } from "@/components/ui/button";

const FilterFooterSection = () => {
	const { removeAllFilters, hiddenRowCount } = useFilters();
	if (hiddenRowCount === 0) return null;
	return (
		<div className="w-full p-4">
			<div className="flex justify-center items-center gap-4">
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
		</div>
	);
};

export default FilterFooterSection;
