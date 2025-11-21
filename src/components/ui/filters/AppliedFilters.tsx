import type { ReactNode } from "react";
import useFilters from "@/hooks/useFilters";
import AppliedFilter from "./AppliedFilter";

const AppliedFilters = ({
	before,
	after,
	renderSuffixElement,
}: { renderSuffixElement?: () => ReactNode } & (
	| {
			before: number;
			after?: undefined;
			renderSuffixElement?: () => ReactNode;
	  }
	| {
			before?: undefined;
			after: number;
			renderSuffixElement?: undefined;
	  }
)) => {
	const { filters } = useFilters();

	console.log("[exp] after", after);

	console.log("[exp] filters", filters);

	const filtersToDisplay = filters.filter((filter) => {
		if (before) {
			return filter.createdAt < before;
		}
		if (after) {
			return filter.createdAt > after;
		}
		return true;
	});

	// if (
	// 	renderSuffixElement &&
	// 	filtersToDisplay.length === 0 &&
	// 	filters.length > 0
	// ) {
	// 	console.log("checkpoint A");
	// 	return renderSuffixElement();
	// }

	console.log("checkpoint B");
	return (
		<div className="contents">
			{filtersToDisplay
				.sort((a, b) => a.createdAt - b.createdAt)
				.map((filter, index) => {
					if (index === filtersToDisplay.length - 1 && renderSuffixElement) {
						return (
							<div className="relative bg-purple-500">
								<AppliedFilter key={filter.id} id={filter.id} />
								{renderSuffixElement()}
							</div>
						);
					}
					return <AppliedFilter key={filter.id} id={filter.id} />;
				})}
		</div>
	);
};

export default AppliedFilters;
