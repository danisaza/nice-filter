import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { MATCH_TYPES } from "@/hooks/useFilters/constants";
import type { MatchType } from "@/hooks/useFilters/types";

const MATCH_TYPE_LABELS: Record<MatchType, { short: string; full: string }> = {
	[MATCH_TYPES.ALL]: { short: "All", full: "All filters must match" },
	[MATCH_TYPES.ANY]: { short: "Any", full: "Any filter must match" },
};

interface MatchTypeDropdownProps {
	matchType: MatchType;
	setMatchType: (matchType: MatchType) => void;
}

export const MatchTypeDropdown = ({
	matchType,
	setMatchType,
}: MatchTypeDropdownProps) => {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button
					type="button"
					className="h-full flex items-center justify-center gap-1 px-4 text-sm font-medium text-gray-600 bg-transparent hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 focus:text-gray-900 focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-r-lg transition-colors"
					aria-label="Filter match mode"
				>
					{MATCH_TYPE_LABELS[matchType].short}
					<ChevronDown className="w-4 h-4" />
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
								<DropdownMenu.ItemIndicator data-testid="checkmark-indicator">
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
