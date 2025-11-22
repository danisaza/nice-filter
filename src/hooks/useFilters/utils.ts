import { RELATIONSHIPS } from "./constants";
import type { ComboboxOption, Relationship, TAppliedFilter } from "./types";

export function getNewRelationship(
	filter: TAppliedFilter,
	newValues: ComboboxOption[],
): Relationship {
	if (filter.values.length === newValues.length) {
		return filter.relationship;
	}

	const newlyAppliedFilter = filter.values.length === 0;

	if (newlyAppliedFilter) {
		return newValues.length === 1 ? RELATIONSHIPS.IS : RELATIONSHIPS.IS_ANY_OF;
	}

	if (newValues.length === 1) {
		// Finds the new relationship based on the previous relationship when downsizing from N to 1 selected value
		const downsizingMap = {
			[RELATIONSHIPS.INCLUDE_ALL_OF]: RELATIONSHIPS.INCLUDE,
			[RELATIONSHIPS.INCLUDE_ANY_OF]: RELATIONSHIPS.INCLUDE,
			[RELATIONSHIPS.EXCLUDE_IF_ANY_OF]: RELATIONSHIPS.DO_NOT_INCLUDE,
			[RELATIONSHIPS.EXCLUDE_IF_ALL]: RELATIONSHIPS.DO_NOT_INCLUDE,
			[RELATIONSHIPS.IS_ANY_OF]: RELATIONSHIPS.IS,
			[RELATIONSHIPS.IS_NOT]: RELATIONSHIPS.IS_NOT,
			// -----------------
			// We don't expect these cases to happen, but just coding defensively here...
			[RELATIONSHIPS.IS]: RELATIONSHIPS.IS,
			[RELATIONSHIPS.INCLUDE]: RELATIONSHIPS.INCLUDE,
			[RELATIONSHIPS.DO_NOT_INCLUDE]: RELATIONSHIPS.IS_NOT,
		};
		return downsizingMap[filter.relationship];
	}

	if (newValues.length > 1) {
		// Finds the new relationship based on the previous relationship when upsizing from 1 to N selected values
		const upsizingMap: Record<Relationship, Relationship> = {
			[RELATIONSHIPS.IS]: RELATIONSHIPS.IS_ANY_OF,
			[RELATIONSHIPS.IS_NOT]: RELATIONSHIPS.IS_NOT,
			[RELATIONSHIPS.INCLUDE]: RELATIONSHIPS.INCLUDE_ALL_OF,
			[RELATIONSHIPS.DO_NOT_INCLUDE]: RELATIONSHIPS.EXCLUDE_IF_ANY_OF,
			// -----------------
			// We don't expect these cases to happen, but just coding defensively here...
			[RELATIONSHIPS.IS_ANY_OF]: RELATIONSHIPS.IS_ANY_OF,
			[RELATIONSHIPS.EXCLUDE_IF_ANY_OF]: RELATIONSHIPS.EXCLUDE_IF_ANY_OF,
			[RELATIONSHIPS.INCLUDE_ALL_OF]: RELATIONSHIPS.INCLUDE_ALL_OF,
			[RELATIONSHIPS.INCLUDE_ANY_OF]: RELATIONSHIPS.INCLUDE_ANY_OF,
			[RELATIONSHIPS.EXCLUDE_IF_ALL]: RELATIONSHIPS.EXCLUDE_IF_ALL,
		};
		return upsizingMap[filter.relationship];
	}

	return filter.relationship;
}
