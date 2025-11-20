import { useEffect } from "react";
import useFilters from "@/hooks/useFilters";
import useNewFilterCreatedAtCutoff from "@/hooks/useNewFilterCreatedAtCutoff";
import AppliedFilters from "./components/ui/filters/AppliedFilters";
import FilterDropdown from "./components/ui/filters/FilterDropdown";
import MatchTypeSwitcher from "./components/ui/filters/MatchTypeSwitcher";
import { FILTER_CATEGORIES } from "./hooks/filter-options-mock-data";

export default function Filters() {
	const { filterCategories, setFilterCategories } = useFilters();
	const { newFilterCreatedAtCutoff } = useNewFilterCreatedAtCutoff();

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

	return (
		<div className="flex gap-2 items-center flex-wrap w-fit">
			<AppliedFilters before={newFilterCreatedAtCutoff} />
			<FilterDropdown />
			<MatchTypeSwitcher />
		</div>
	);
}
