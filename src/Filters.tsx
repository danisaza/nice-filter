import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Toolbar from "@radix-ui/react-toolbar";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFilters } from "@/App.tsx";
import useNewFilterCreatedAtCutoff from "@/hooks/useNewFilterCreatedAtCutoff";
import AppliedFilters from "./components/ui/filters/AppliedFilters";
import FilterDropdown from "./components/ui/filters/FilterDropdown";
import MatchTypeSwitcher from "./components/ui/filters/MatchTypeSwitcher";
import { FILTER_CATEGORIES } from "./hooks/filter-options-mock-data";

export default function Filters() {
	const [open, setOpen] = useState(false);
	const { filterCategories, setFilterCategories } = useFilters();
	const { newFilterCreatedAtCutoff, setNewFilterCreatedAtCutoff } =
		useNewFilterCreatedAtCutoff();
	const filterButtonRef = useRef<HTMLButtonElement>(null);

	// NOTE: This `useEffect` is populating the filter categories, which usually would involve fetching data from the
	//       server.
	//
	//       A future improvement to consider for the `useFilters` hook could be to take in a data-fetching function and
	//       do the data-fetching on behalf of the user, using something like react-query under the hood. (see
	//       `useFilters.tsx` for more notes on future improvements)
	// biome-ignore lint/correctness/useExhaustiveDependencies: intended to only run on mount
	useEffect(() => {
		if (filterCategories.length > 0) return;
		setFilterCategories(FILTER_CATEGORIES);
	}, []);

	const renderTrigger = useCallback(
		() => (
			<DropdownMenu.Trigger asChild>
				<div className="absolute w-0 h-0 left-0 inset-y-1/2"></div>
			</DropdownMenu.Trigger>
		),
		[],
	);

	return (
		<DropdownMenu.Root
			open={open}
			onOpenChange={(open) => {
				setNewFilterCreatedAtCutoff(Date.now());
				setOpen(open);
			}}
		>
			<Toolbar.Root
				className="flex gap-2 items-center flex-wrap mr-2 relative"
				aria-label="Applied filters"
				orientation="horizontal"
				loop={false}
			>
				<AppliedFilters before={newFilterCreatedAtCutoff} />
				<AppliedFilters
					after={newFilterCreatedAtCutoff}
					renderPrefixElement={renderTrigger}
				/>
				<FilterDropdown
					filterButtonRef={filterButtonRef}
					renderTrigger={renderTrigger}
					dropdownMenuOpen={open}
					setDropdownMenuOpen={setOpen}
				/>
				<MatchTypeSwitcher />
			</Toolbar.Root>
		</DropdownMenu.Root>
	);
}
