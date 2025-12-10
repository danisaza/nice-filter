import * as Toolbar from "@radix-ui/react-toolbar";
import { useFilters } from "@/App.tsx";
import { Button } from "@/components/ui/button";
import { MATCH_TYPES } from "@/hooks/useFilters/constants";

const MatchTypeSwitcher = () => {
	const { filters, matchType, setMatchType } = useFilters();
	const numAppliedFilters = filters.length;

	if (numAppliedFilters <= 1) {
		return null;
	}

	return (
		<Toolbar.Button asChild>
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
		</Toolbar.Button>
	);
};

export default MatchTypeSwitcher;
