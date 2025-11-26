import { X } from "lucide-react";
import { useFilters } from "@/App";
import { Button } from "@/components/ui/button";

const FilterFooterSection = () => {
	const { removeAllFilters, hiddenRowCount, totalRowCount } = useFilters();
	const hasFilters = hiddenRowCount > 0;

	return (
		<div className="w-full p-4">
			<div className="flex justify-center items-center gap-4">
				<div className="text-sm text-gray-500">
					{hasFilters ? (
						<>
							Filtered out{" "}
							<span className="font-bold">
								{hiddenRowCount} of {totalRowCount}
							</span>{" "}
							rows
						</>
					) : (
						<>
							Displaying all{" "}
							<span className="font-bold">{totalRowCount}</span> rows
						</>
					)}
				</div>
				{hasFilters && (
					<Button
						variant="outline"
						onClick={() => {
							removeAllFilters();
						}}
					>
						Clear filters <X />
					</Button>
				)}
			</div>
		</div>
	);
};

export default FilterFooterSection;
