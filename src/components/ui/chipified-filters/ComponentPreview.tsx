import { useMemo, useState } from "react";
import { useFilters } from "@/App";
import { ChipFilterInput } from "./ChipFilterInput";
import type { TFilterChip } from "./types";
import { convertFilterOptionsToFilterConfig } from "./utils";
export const ComponentPreview = () => {
	const { filterCategories } = useFilters();
	const [githubFilters, setGithubFilters] = useState<TFilterChip[]>([]);
	const filterConfig = useMemo(
		() => convertFilterOptionsToFilterConfig(filterCategories),
		[filterCategories],
	);
	return (
		<div className="max-w-4xl mx-auto space-y-12">
			{/* GitHub-style Example */}
			<section>
				<ChipFilterInput
					filters={githubFilters}
					onFiltersChange={setGithubFilters}
					filterConfig={filterConfig}
					placeholder="Filter issues by status, author, label..."
				/>
			</section>
		</div>
	);
};
