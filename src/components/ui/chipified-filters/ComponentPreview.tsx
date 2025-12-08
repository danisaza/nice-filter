import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { useFilters } from "@/App";
import { FILTER_CATEGORIES } from "@/hooks/filter-categories.mock";
import { MATCH_TYPES } from "@/hooks/useFilters/constants";
import type { MatchType } from "@/hooks/useFilters/types";
import { ChipFilterInput } from "./ChipFilterInput";

const MATCH_TYPE_LABELS: Record<MatchType, { short: string; full: string }> = {
	[MATCH_TYPES.ALL]: { short: "all", full: "all filters must match" },
	[MATCH_TYPES.ANY]: { short: "any", full: "any filter must match" },
};

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

interface MatchTypeDropdownProps {
	matchType: MatchType;
	setMatchType: (matchType: MatchType) => void;
}

const MatchTypeDropdown = ({
	matchType,
	setMatchType,
}: MatchTypeDropdownProps) => {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button
					type="button"
					className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
					aria-label="Filter match mode"
				>
					{MATCH_TYPE_LABELS[matchType].short}
					<ChevronDown className="w-4 h-4 text-gray-500" />
				</button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
					sideOffset={5}
					align="end"
				>
					<DropdownMenu.RadioGroup
						value={matchType}
						onValueChange={(value) => setMatchType(value as MatchType)}
					>
						{Object.entries(MATCH_TYPE_LABELS).map(([value, labels]) => (
							<DropdownMenu.RadioItem
								key={value}
								value={value}
								className="relative flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-700 rounded-md outline-none cursor-pointer transition-colors hover:bg-gray-100 focus:bg-gray-100"
							>
								{labels.full}
								<DropdownMenu.ItemIndicator>
									<Check className="w-4 h-4 text-blue-600" />
								</DropdownMenu.ItemIndicator>
							</DropdownMenu.RadioItem>
						))}
					</DropdownMenu.RadioGroup>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
};
