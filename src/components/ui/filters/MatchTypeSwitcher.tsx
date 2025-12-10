import { forwardRef, type KeyboardEvent, type RefObject } from "react";
import { useFilters } from "@/App.tsx";
import { Button } from "@/components/ui/button";
import { MATCH_TYPES } from "@/hooks/useFilters/constants";

type MatchTypeSwitcherProps = {
	prevFocusRef?: RefObject<HTMLButtonElement | null>;
};

const MatchTypeSwitcher = forwardRef<HTMLButtonElement, MatchTypeSwitcherProps>(
	({ prevFocusRef }, ref) => {
		const { filters, matchType, setMatchType } = useFilters();
		const numAppliedFilters = filters.length;

		const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
			if (e.key === "ArrowLeft") {
				prevFocusRef?.current?.focus();
			}
		};

		return (
			<>
				{numAppliedFilters > 1 ? (
					<Button
						ref={ref}
						variant="outline"
						onKeyDown={handleKeyDown}
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
	},
);

export default MatchTypeSwitcher;
