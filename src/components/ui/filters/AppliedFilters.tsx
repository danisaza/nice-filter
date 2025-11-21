import type { ReactNode } from "react";
import useFilters from "@/hooks/useFilters";
import AppliedFilter from "./AppliedFilter";

const AppliedFilters = ({
	before,
	after,
	renderPrefixElement,
}: { renderPrefixElement?: () => ReactNode } & (
	| {
			before: number;
			after?: undefined;
			renderPrefixElement?: undefined;
	  }
	| {
			before?: undefined;
			after: number;
			renderPrefixElement: () => ReactNode;
	  }
)) => {
	const { filters } = useFilters();

	const filtersToDisplay = filters.filter((filter) => {
		if (before) {
			return filter.createdAt < before;
		}
		if (after) {
			return filter.createdAt > after;
		}
		return true;
	});

	return (
		<div className="contents">
			{filtersToDisplay
				.sort((a, b) => a.createdAt - b.createdAt)
				.map((filter, index) => {
					if (index === 0 && renderPrefixElement) {
						return (
							<div className="relative">
								{renderPrefixElement()}
								<AppliedFilter key={filter.id} id={filter.id} />
							</div>
						);
					}
					return <AppliedFilter key={filter.id} id={filter.id} />;
				})}
		</div>
	);
};

export default AppliedFilters;
