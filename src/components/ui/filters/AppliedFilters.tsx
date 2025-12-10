import { memo, type ReactNode, useMemo } from "react";
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
			/**
			 * When true, indicates that filters exist before this component's filters
			 * in the toolbar, so this component's first filter should NOT receive
			 * isFirst={true} (to maintain proper roving tabindex with only one tabIndex=0).
			 */
			hasFiltersBeforeThis?: boolean;
	  };

const AppliedFilters = memo((props: AppliedFiltersProps) => {
	const { after, before, renderPrefixElement } = props;
	const hasFiltersBeforeThis =
		"hasFiltersBeforeThis" in props ? props.hasFiltersBeforeThis : false;

	const { filters } = useFilters();

	const sortedFilters = useMemo(() => {
		return filters
			.filter((filter) => {
				if (before) {
					return filter.createdAt < before;
				}
				// check against undefined, rather than 0, in case someone uses `after={0}` to render all filters
				if (after !== undefined) {
					return filter.createdAt >= after;
				}
				return true;
			})
			.sort((a, b) => a.createdAt - b.createdAt);
	}, [filters, before, after]);

	if (sortedFilters.length === 0) {
		return null;
	}

	// Only the globally first filter in the toolbar should have isFirst={true}
	// to maintain proper roving tabindex (i.e. only one element should have tabIndex=0)
	const canBeGloballyFirst = !hasFiltersBeforeThis;

	return (
		<>
			{sortedFilters.map((filter, index) => {
				const isFirst = index === 0 && canBeGloballyFirst;
				if (index === 0 && renderPrefixElement) {
					return (
						<div key={filter.id} className="relative">
							{renderPrefixElement()}
							<AppliedFilter filter={filter} isFirst={isFirst} />
						</div>
					);
				}
				return (
					<AppliedFilter key={filter.id} filter={filter} isFirst={isFirst} />
				);
			})}
		</>
	);
});

export default AppliedFilters;
