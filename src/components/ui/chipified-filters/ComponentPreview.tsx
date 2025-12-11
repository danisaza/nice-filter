import { useEffect, useRef } from "react";
import { useFilters } from "@/App";
import { FILTER_CATEGORIES } from "@/hooks/filter-categories.mock";
import { ChipFilterInput } from "./ChipFilterInput";
import { MatchTypeDropdown } from "./MatchTypeDropdown";

export const ComponentPreview = () => {
	const { filterCategories, setFilterCategories, matchType, setMatchType } =
		useFilters();
	const inputRef = useRef<HTMLInputElement>(null);
	const matchTypeButtonRef = useRef<HTMLButtonElement>(null);

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
				<div
					className="flex items-stretch bg-gray-100 rounded-lg border border-gray-200 transition-all [&:has([data-focused])]:shadow-[0_0_0_3px_rgba(59,130,246,0.4)]"
					role="toolbar"
					aria-label="Filter toolbar"
				>
					<div className="flex-1">
						<ChipFilterInput
							placeholder="Filter issues by status, author, label..."
							inputRef={inputRef}
							onRightArrowAtEnd={() => matchTypeButtonRef.current?.focus()}
						/>
					</div>
					<div className="border-l border-gray-300" />
					<div className="self-stretch flex">
						<MatchTypeDropdown
							matchType={matchType}
							setMatchType={setMatchType}
							triggerRef={matchTypeButtonRef}
							onLeftArrow={() => inputRef.current?.focus()}
						/>
					</div>
				</div>
			</section>
		</div>
	);
};
