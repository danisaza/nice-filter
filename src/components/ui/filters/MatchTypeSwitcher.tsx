import { useFilters } from "@/App.tsx";
import { Button } from "@/components/ui/button";
import { MATCH_TYPES } from "@/hooks/useFilters/constants";

export default function MatchTypeSwitcher() {
	const { filters, matchType, setMatchType } = useFilters();
	const numAppliedFilters = filters.length;
	return (
		<>
			{numAppliedFilters > 1 ? (
				<Button
					variant="outline"
					onClick={() => {
						setMatchType((currMatchType) =>
							currMatchType === MATCH_TYPES.ANY
								? MATCH_TYPES.ALL
								: MATCH_TYPES.ANY,
						);
					}}
				>
					{matchType === MATCH_TYPES.ANY
						? "Match any filter"
						: "Match all filters"}
				</Button>
			) : null}
		</>
	);
}
