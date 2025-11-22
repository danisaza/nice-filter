import { memo, type ReactNode } from "react";
import { useFilters } from "@/App.tsx";
import AppliedFilter from "./AppliedFilter";

type AppliedFiltersProps =
	| {
			after?: undefined;
			before: number;
			renderPrefixElement?: undefined;
	  }
	| {
			after: number;
			before?: undefined;
			renderPrefixElement: () => ReactNode;
	  };

const AppliedFilters = memo(
	({ after, before, renderPrefixElement }: AppliedFiltersProps) => {
		const { filters } = useFilters();

		const filtersToDisplay = filters.filter((filter) => {
			if (before) {
				return filter.createdAt < before;
			}

			// check against undefined in case someone uses `after={0}` to render all filters
			if (after !== undefined) {
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
								<div key={filter.id} className="relative">
									{renderPrefixElement()}
									<AppliedFilter key={filter.id} filter={filter} />
								</div>
							);
						}
						return <AppliedFilter key={filter.id} filter={filter} />;
					})}
			</div>
		);
	},
);

export default AppliedFilters;
