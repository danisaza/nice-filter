import {
	CHECKBOX_SELECTION_OPERATORS,
	MATCH_TYPES,
	OPERATORS,
	RADIO_SELECTION_OPERATORS,
	SELECTION_TYPES,
} from "./constants";
import type {
	MatchType,
	Operator,
	RelationshipType,
	Row,
	TAppliedFilter,
} from "./types";

export function filterRowByMatchType<T extends Row>(
	row: T,
	filters: TAppliedFilter[],
	matchType: MatchType,
) {
	if (filters.length === 0) {
		return row;
	}
	if (matchType === MATCH_TYPES.ALL) {
		return filterRowByAll(row, filters);
	} else if (matchType === MATCH_TYPES.ANY) {
		return filterRowByAny(row, filters);
	} else {
		console.error(`Invalid match type: ${matchType}`);
		return true; // default to true so that at least the user can see their data
	}
}

function filterRowByAll<T extends Row>(row: T, filters: TAppliedFilter[]) {
	return filters.every((filter) => {
		return filterRow(row, filter);
	});
}

function filterRowByAny<T extends Row>(row: T, filters: TAppliedFilter[]) {
	return filters.some((filter) => {
		return filterRow(row, filter);
	});
}

/** Returns `true` if the row should be displayed, according to the filter.
 *
 *  If an error is encountered, it returns `true` so that the row is still displayed */
function filterRow<T extends Row>(row: T, filter: TAppliedFilter) {
	const selectionType: RelationshipType = filter.selectionType;
	if (
		selectionType !== SELECTION_TYPES.RADIO &&
		selectionType !== SELECTION_TYPES.CHECKBOXES
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

	if (selectionType === SELECTION_TYPES.RADIO) {
		return filterByRadio(row, filter);
	} else if (selectionType === SELECTION_TYPES.CHECKBOXES) {
		return filterByCheckbox(row, filter);
	} else {
		console.error(`Invalid selection type: ${selectionType}`);
		return true;
	}
}

function filterByRadio<T extends Row>(row: T, filter: TAppliedFilter) {
	if (!filter.propertyNameSingular) {
		console.error("propertyNameSingular is required for radio filters");
		return true; // default to true so that at least the user can see the row
	}
	const propertyNameSingular = filter.propertyNameSingular;
	const relationshipOptions: readonly Operator[] =
		filter.values.length <= 1
			? RADIO_SELECTION_OPERATORS.ONE
			: RADIO_SELECTION_OPERATORS.MANY;
	const isRelationshipValid = relationshipOptions.includes(filter.relationship);
	if (!isRelationshipValid) {
		console.error(`Invalid relationship: ${filter.relationship}`);
		return true; // default to true so that at least the user can see the row
	}

	if (filter.relationship === OPERATORS.IS) {
		if (filter.values.length !== 1) {
			throw new Error(
				`Invalid number of values for relationship ${filter.relationship}: ${filter.values.length}`,
			);
		}
		return row[propertyNameSingular] === filter.values[0].value;
	}

	if (filter.relationship === OPERATORS.IS_ANY_OF) {
		return filter.values.some(
			(value) => row[propertyNameSingular] === value.value,
		);
	}

	if (filter.relationship === OPERATORS.IS_NOT) {
		return !filter.values.some(
			(value) => row[propertyNameSingular] === value.value,
		);
	}

	console.error(`Invalid relationship: $filter.relationship`);
	return true;
}

function filterByCheckbox<T extends Row>(row: T, filter: TAppliedFilter) {
	if (!filter.propertyNamePlural) {
		console.error("propertyNamePlural is required for checkbox filters");
		return true; // default to true so that at least the user can see the row
	}
	const propertyNamePlural = filter.propertyNamePlural;
	const relationshipOptions: readonly Operator[] =
		filter.values.length === 1
			? CHECKBOX_SELECTION_OPERATORS.ONE
			: CHECKBOX_SELECTION_OPERATORS.MANY;
	const isRelationshipValid = relationshipOptions.includes(filter.relationship);
	if (!isRelationshipValid) {
		console.error(
			`Invalid relationship: ${filter.relationship} for ${filter.values.length} value(s). Valid relationships for ${filter.values.length} value(s) are: ${relationshipOptions.join(", ")}`,
		);
		return true; // default to true so that at least the user can see the row
	}

	if (filter.values.length === 0) {
		return true; // equivalent to not having the filter applied
	}

	if (filter.values.length === 1) {
		const rowPropertyValue = row[propertyNamePlural];
		if (!rowPropertyValue || !Array.isArray(rowPropertyValue)) {
			console.error(
				`Expected an array of values for property ${propertyNamePlural}, but got ${rowPropertyValue}`,
			);
			return true; // default to true so that at least the user can see the row
		}
		const rowValue = rowPropertyValue[0];
		if (filter.relationship === OPERATORS.INCLUDE) {
			return filter.values.some((value) => value.value === rowValue);
		}
		if (filter.relationship === OPERATORS.DO_NOT_INCLUDE) {
			return !filter.values.some((value) => value.value === rowValue);
		}
		throw new Error(
			`Invalid relationship: ${filter.relationship} with 1 value`,
		);
	}

	const rowValues = row[propertyNamePlural];
	if (!rowValues || !Array.isArray(rowValues)) {
		console.error(
			`Expected an array of values for property ${propertyNamePlural}, but got ${rowValues}`,
		);
		return true; // default to true so that at least the user can see the row
	}

	if (filter.relationship === OPERATORS.INCLUDE_ALL_OF) {
		return filter.values.every((value) => rowValues.includes(value.value));
	}

	if (filter.relationship === OPERATORS.INCLUDE_ANY_OF) {
		return filter.values.some((value) => rowValues.includes(value.value));
	}

	if (filter.relationship === OPERATORS.EXCLUDE_IF_ALL) {
		return !filter.values.every((value) => rowValues.includes(value.value));
	}

	if (filter.relationship === OPERATORS.EXCLUDE_IF_ANY_OF) {
		return !filter.values.some((value) => rowValues.includes(value.value));
	}

	console.error(`Invalid relationship: $filter.relationship`);
	return true;
}
