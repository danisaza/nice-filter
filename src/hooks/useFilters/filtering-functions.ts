import {
	CHECKBOX_SELECTION_RELATIONSHIPS,
	MATCH_TYPES,
	type MatchType,
	type Predicate,
	RADIO_SELECTION_RELATIONSHIPS,
	RELATIONSHIP_TYPES,
	RELATIONSHIPS,
	type Relationship,
	type RelationshipType,
	type TAppliedFilter,
} from "./constants";

export function filterRowByMatchType<T>(
	row: T,
	filters: TAppliedFilter[],
	predicate: Predicate<T>,
	matchType: MatchType,
) {
	if (filters.length === 0) {
		return row;
	}
	if (matchType === MATCH_TYPES.ALL) {
		return filterRowByAll(row, filters, predicate);
	} else if (matchType === MATCH_TYPES.ANY) {
		return filterRowByAny(row, filters, predicate);
	} else {
		console.error(`Invalid match type: ${matchType}`);
		return true; // default to true so that at least the user can see their data
	}
}

function filterRowByAll<T>(
	row: T,
	filters: TAppliedFilter[],
	predicate: Predicate<T>,
) {
	return filters.every((filter) => {
		return filterRow(row, filter, predicate);
	});
}

function filterRowByAny<T>(
	row: T,
	filters: TAppliedFilter[],
	predicate: Predicate<T>,
) {
	return filters.some((filter) => {
		return filterRow(row, filter, predicate);
	});
}

/** Returns `true` if the row should be displayed, according to the filter.
 *
 *  If an error is encountered, it returns `true` so that the row is still displayed */
function filterRow<T>(row: T, filter: TAppliedFilter, predicate: Predicate<T>) {
	const selectionType: RelationshipType = filter.selectionType;
	if (
		selectionType !== RELATIONSHIP_TYPES.RADIO &&
		selectionType !== RELATIONSHIP_TYPES.CHECKBOXES
	) {
		// NOTE: It's arguably not necessary to have these runtime checks, since typescript gives us guarantees.
		//       But if there ARE things that are slipping past the type-checker, these error logs will make it
		//       much easier to debug.
		//
		//       In other words: If we have robust typescript code and are doing good input validation, we should be good.
		//
		//       This check is the kind of thing that I would consider having for a while, monitoring, and removing if
		//       things are stable.
		console.error(`Invalid selection type: ${selectionType}`);
		return true;
	}

	// if there are zero values selected, it's equivalent to not having the filter applied
	if (filter.values.length === 0) {
		return true;
	}

	if (selectionType === RELATIONSHIP_TYPES.RADIO) {
		return filterByRadio(row, filter, predicate);
	} else if (selectionType === RELATIONSHIP_TYPES.CHECKBOXES) {
		return filterByCheckbox(row, filter, predicate);
	} else {
		console.error(`Invalid selection type: ${selectionType}`);
		return true;
	}
}

function filterByRadio<T>(
	row: T,
	filter: TAppliedFilter,
	predicate: Predicate<T>,
) {
	const relationshipOptions: readonly Relationship[] =
		filter.values.length <= 1
			? RADIO_SELECTION_RELATIONSHIPS.ONE
			: RADIO_SELECTION_RELATIONSHIPS.MANY;
	const isRelationshipValid = relationshipOptions.includes(filter.relationship);
	if (!isRelationshipValid) {
		console.error(`Invalid relationship: ${filter.relationship}`);
		return true; // default to true so that at least the user can see the row
	}

	if (filter.relationship === RELATIONSHIPS.IS) {
		if (filter.values.length !== 1) {
			console.error(
				`Invalid number of values for relationship ${filter.relationship}: ${filter.values.length}`,
			);
			return filter.values.some((value) => predicate(row, filter, value)); // sensible default
		}
		return predicate(row, filter, filter.values[0]);
	}

	if (filter.relationship === RELATIONSHIPS.IS_ANY_OF) {
		return filter.values.some((value) => predicate(row, filter, value));
	}

	if (filter.relationship === RELATIONSHIPS.IS_NOT) {
		return !filter.values.some((value) => predicate(row, filter, value));
	}

	console.error(`Invalid relationship: ${filter.relationship}`);
	return true;
}

function filterByCheckbox<T>(
	row: T,
	filter: TAppliedFilter,
	predicate: Predicate<T>,
) {
	const relationshipOptions: readonly Relationship[] =
		filter.values.length === 1
			? CHECKBOX_SELECTION_RELATIONSHIPS.ONE
			: CHECKBOX_SELECTION_RELATIONSHIPS.MANY;
	const isRelationshipValid = relationshipOptions.includes(filter.relationship);
	if (!isRelationshipValid) {
		console.error(`Invalid relationship: ${filter.relationship}`);
		return true; // default to true so that at least the user can see the row
	}

	if (filter.relationship === RELATIONSHIPS.INCLUDE) {
		return filter.values.some((value) => predicate(row, filter, value));
	}

	if (filter.relationship === RELATIONSHIPS.DO_NOT_INCLUDE) {
		return !filter.values.some((value) => predicate(row, filter, value));
	}

	if (filter.relationship === RELATIONSHIPS.INCLUDE_ALL_OF) {
		return filter.values.every((value) => predicate(row, filter, value));
	}

	if (filter.relationship === RELATIONSHIPS.INCLUDE_ANY_OF) {
		return filter.values.some((value) => predicate(row, filter, value));
	}

	if (filter.relationship === RELATIONSHIPS.EXCLUDE_IF_ALL) {
		return !filter.values.every((value) => predicate(row, filter, value));
	}

	if (filter.relationship === RELATIONSHIPS.EXCLUDE_IF_ANY_OF) {
		return !filter.values.some((value) => predicate(row, filter, value));
	}

	console.error(`Invalid relationship: ${filter.relationship}`);
	return true;
}
