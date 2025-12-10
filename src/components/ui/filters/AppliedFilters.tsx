import * as Toolbar from "@radix-ui/react-toolbar";
import { memo, type ReactNode, type RefObject, useMemo } from "react";
import { useFilters } from "@/App.tsx";
import AppliedFilter from "./AppliedFilter";

type AppliedFiltersProps =
	| {
			after?: undefined;
			before: number;
			renderPrefixElement?: undefined;
			nextFocusRef?: RefObject<HTMLElement | null>;
			toolbarRef?: RefObject<HTMLDivElement | null>;
	  }
	| {
			after: number;
			before?: undefined;
			renderPrefixElement: () => ReactNode;
			nextFocusRef: RefObject<HTMLElement | null>;
			toolbarRef?: RefObject<HTMLDivElement | null>;
	  };

const AppliedFilters = memo(
	({
		after,
		before,
		renderPrefixElement,
		nextFocusRef,
		toolbarRef,
	}: AppliedFiltersProps) => {
		const { filters } = useFilters();

		const sortedFilters = useMemo(() => {
			return filters
				.filter((filter) => {
					if (before) {
						return filter.createdAt < before;
					}
					// check against undefined in case someone uses `after={0}` to render all filters
					if (after !== undefined) {
						return filter.createdAt > after;
					}
					return true;
				})
				.sort((a, b) => a.createdAt - b.createdAt);
		}, [filters, before, after]);

		if (sortedFilters.length === 0) {
			return null;
		}

		const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "ArrowRight" && nextFocusRef?.current) {
				// Check if we're on the last toolbar item
				const toolbar = e.currentTarget;
				const items = toolbar.querySelectorAll("[data-radix-collection-item]");
				const lastItem = items[items.length - 1];
				if (document.activeElement === lastItem) {
					nextFocusRef.current.focus();
				}
			}
		};

		return (
			<Toolbar.Root
				ref={toolbarRef as React.RefObject<HTMLDivElement>}
				className="contents"
				aria-label="Applied filters"
				orientation="horizontal"
				loop={false}
				onKeyDown={handleKeyDown}
			>
				{sortedFilters.map((filter, index) => {
					if (index === 0 && renderPrefixElement) {
						return (
							<div key={filter.id} className="relative">
								{renderPrefixElement()}
								<AppliedFilter filter={filter} isFirst />
							</div>
						);
					}
					return (
						<AppliedFilter
							key={filter.id}
							filter={filter}
							isFirst={index === 0}
						/>
					);
				})}
			</Toolbar.Root>
		);
	},
);

export default AppliedFilters;
