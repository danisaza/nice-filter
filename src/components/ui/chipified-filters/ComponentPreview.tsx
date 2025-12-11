import { useEffect } from "react";
import { useFilters } from "@/App";
import { FILTER_CATEGORIES } from "@/hooks/filter-categories.mock";
import { ChipFilterInput } from "./ChipFilterInput";
import { MatchTypeDropdown } from "./MatchTypeDropdown";

export const ComponentPreview = () => {
	const { filterCategories, setFilterCategories, matchType, setMatchType } =
		useFilters();

	// Initialize filter categories if not already set
	// biome-ignore lint/correctness/useExhaustiveDependencies: intended to only run on mount
	useEffect(() => {
		if (filterCategories.length > 0) return;
		setFilterCategories(FILTER_CATEGORIES);
	}, []);

	return (
		<div className="max-w-4xl mx-auto space-y-12">
			{/* GitHub-style Example */}
			<section>
				<div className="flex items-center gap-3">
					<div className="flex-1">
						<ChipFilterInput placeholder="Filter issues by status, author, label..." />
					</div>
					<MatchTypeDropdown
						matchType={matchType}
						setMatchType={setMatchType}
					/>
				</div>
			</section>
		</div>
	);
};
