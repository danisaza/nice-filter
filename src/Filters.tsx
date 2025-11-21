import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import useFilters from "@/hooks/useFilters";
import useNewFilterCreatedAtCutoff from "@/hooks/useNewFilterCreatedAtCutoff";
import AppliedFilters from "./components/ui/filters/AppliedFilters";
import FilterDropdown from "./components/ui/filters/FilterDropdown";
import MatchTypeSwitcher from "./components/ui/filters/MatchTypeSwitcher";
import { FILTER_CATEGORIES } from "./hooks/filter-options-mock-data";

export default function Filters() {
	const [open, setOpen] = useState(false);
	const { filterCategories, setFilterCategories, filters } = useFilters();
	const { newFilterCreatedAtCutoff, setNewFilterCreatedAtCutoff } =
		useNewFilterCreatedAtCutoff();

	// NOTE: This `useEffect` is populating the filter categories, which usually would involve fetching data from the
	//       server.
	//
	//       A future improvement to consider for the `useFilters` hook could be to take in a data-fetching function and
	//       do the data-fetching on behalf of the user, using something like react-query under the hood. (see
	//       `useFilters.tsx` for more notes on future improvements)
	useEffect(() => {
		if (filterCategories.length > 0) return;
		setFilterCategories(FILTER_CATEGORIES);
	});

	const renderSuffixElement = (position: "left" | "right") => (
		<DropdownMenu.Trigger id="foobar" asChild>
			<div
				// NOTE: string interpolation with tailwind classes is not recommended because many
				//       tools don't play nicely with it. (e.g. tailwind-intellisense plugins)
				className={twMerge(
					"absolute w-0 h-0",
					position === "left" ? "left-0 bottom-0" : "-right-2 bottom-0",
				)}
			></div>
		</DropdownMenu.Trigger>
	);

	return (
		<DropdownMenu.Root
			open={open}
			onOpenChange={(open) => {
				setNewFilterCreatedAtCutoff(Date.now());
				setOpen(open);
			}}
		>
			<div
				className={twMerge("flex gap-2 items-center flex-wrap mr-2 relative")}
			>
				{filters.length === 0 ? renderSuffixElement("left") : null}
				<AppliedFilters
					before={newFilterCreatedAtCutoff}
					renderSuffixElement={() => renderSuffixElement("right")}
				/>
				<FilterDropdown dropdownMenuOpen={open} setDropdownMenuOpen={setOpen} />
				<MatchTypeSwitcher />
			</div>
		</DropdownMenu.Root>
	);
}
