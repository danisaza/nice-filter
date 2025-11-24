import {
	CHECKBOX_SELECTION_OPERATORS,
	OPERATORS,
	RADIO_SELECTION_OPERATORS,
	SELECTION_TYPES,
} from "./constants";
import type { ComboboxOption, Operator, TAppliedFilter } from "./types";

export function updateFilterValueAndRelationship(
	filter: TAppliedFilter,
	newValues: ComboboxOption[],
): TAppliedFilter {
	if (filter.values.length === newValues.length) {
		return {
			...filter,
			values: newValues,
		};
	}

	const newFilter = filter.values.length === 0;

	if (newFilter) {
		if (filter.selectionType === SELECTION_TYPES.CHECKBOXES) {
			if (!filter.propertyNamePlural) {
				throw new Error("propertyNamePlural is required for checkbox filters");
			}
			const newRelationship =
				newValues.length === 1
					? CHECKBOX_SELECTION_OPERATORS.ONE[0]
					: CHECKBOX_SELECTION_OPERATORS.MANY[0];
			return {
				...filter,
				// have to be explicit here for the typescript compiler
				propertyNamePlural: filter.propertyNamePlural,
				relationship: newRelationship,
				values: newValues,
			};
		} else if (filter.selectionType === SELECTION_TYPES.RADIO) {
			if (!filter.propertyNameSingular) {
				throw new Error("propertyNameSingular is required for radio filters");
			}
			const newRelationship =
				newValues.length === 1
					? RADIO_SELECTION_OPERATORS.ONE[0]
					: RADIO_SELECTION_OPERATORS.MANY[0];
			return {
				...filter,
				// have to be explicit here for the typescript compiler
				propertyNameSingular: filter.propertyNameSingular,
				relationship: newRelationship,
				values: newValues,
			};
		}
		// typescript correctly thinks that it's impossible to reach this branch, so this type-casting is required,
		// but I think it's still worth having an error thrown here so that we can see early if it happens
		throw new Error(
			`Got invalid selection type: ${(filter as unknown as { selectionType: string }).selectionType}`,
		);
	}

	if (newValues.length === 0) {
		return {
			...filter,
			values: newValues,
		};
	}

	if (newValues.length === 1) {
		// Finds the new relationship based on the previous relationship when downsizing from N to 1 selected value
		const downsizingMap = {
			[OPERATORS.INCLUDE_ALL_OF]: OPERATORS.INCLUDE,
			[OPERATORS.INCLUDE_ANY_OF]: OPERATORS.INCLUDE,
			[OPERATORS.EXCLUDE_IF_ANY_OF]: OPERATORS.DO_NOT_INCLUDE,
			[OPERATORS.EXCLUDE_IF_ALL]: OPERATORS.DO_NOT_INCLUDE,
			[OPERATORS.IS_ANY_OF]: OPERATORS.IS,
			[OPERATORS.IS_NOT]: OPERATORS.IS_NOT,
			// -----------------
			// We don't expect these cases to happen, but just coding defensively here...
			[OPERATORS.IS]: OPERATORS.IS,
			[OPERATORS.INCLUDE]: OPERATORS.INCLUDE,
			[OPERATORS.DO_NOT_INCLUDE]: OPERATORS.IS_NOT,
		};
		const newRelationship = downsizingMap[filter.relationship];
		if (filter.selectionType === SELECTION_TYPES.RADIO) {
			if (!filter.propertyNameSingular) {
				throw new Error("propertyNameSingular is required for radio filters");
			}
			if (
				!RADIO_SELECTION_OPERATORS.ONE.includes(
					newRelationship as (typeof RADIO_SELECTION_OPERATORS.ONE)[number],
				)
			) {
				throw new Error(`Invalid relationship: ${newRelationship}`);
			}
			const updatedFilter = {
				...filter,
				propertyNameSingular: filter.propertyNameSingular,
				relationship:
					newRelationship as (typeof RADIO_SELECTION_OPERATORS.ONE)[number],
				values: newValues,
			};
			return updatedFilter;
		}
		if (filter.selectionType === SELECTION_TYPES.CHECKBOXES) {
			if (!filter.propertyNamePlural) {
				throw new Error("propertyNamePlural is required for checkbox filters");
			}
			if (
				!CHECKBOX_SELECTION_OPERATORS.ONE.includes(
					newRelationship as (typeof CHECKBOX_SELECTION_OPERATORS.ONE)[number],
				)
			) {
				throw new Error(`Invalid relationship: ${newRelationship}`);
			}
			const updatedFilter = {
				...filter,
				relationship: downsizingMap[
					filter.relationship
				] as (typeof CHECKBOX_SELECTION_OPERATORS)[keyof typeof CHECKBOX_SELECTION_OPERATORS][number],
				values: newValues,
			};
			return updatedFilter;
		}
		throw new Error(
			`Got invalid selection type: ${(filter as unknown as { selectionType: string }).selectionType}`,
		);
	}

	if (newValues.length > 1) {
		// Finds the new relationship based on the previous relationship when upsizing from 1 to N selected values
		const upsizingMap: Record<Operator, Operator> = {
			[OPERATORS.IS]: OPERATORS.IS_ANY_OF,
			[OPERATORS.IS_NOT]: OPERATORS.IS_NOT,
			[OPERATORS.INCLUDE]: OPERATORS.INCLUDE_ALL_OF,
			[OPERATORS.DO_NOT_INCLUDE]: OPERATORS.EXCLUDE_IF_ANY_OF,
			// -----------------
			// We don't expect these cases to happen, but just coding defensively here...
			[OPERATORS.IS_ANY_OF]: OPERATORS.IS_ANY_OF,
			[OPERATORS.EXCLUDE_IF_ANY_OF]: OPERATORS.EXCLUDE_IF_ANY_OF,
			[OPERATORS.INCLUDE_ALL_OF]: OPERATORS.INCLUDE_ALL_OF,
			[OPERATORS.INCLUDE_ANY_OF]: OPERATORS.INCLUDE_ANY_OF,
			[OPERATORS.EXCLUDE_IF_ALL]: OPERATORS.EXCLUDE_IF_ALL,
		};
		const newRelationship = upsizingMap[filter.relationship];
		if (filter.selectionType === SELECTION_TYPES.RADIO) {
			if (!filter.propertyNameSingular) {
				throw new Error("propertyNameSingular is required for radio filters");
			}
			if (
				!RADIO_SELECTION_OPERATORS.MANY.includes(
					newRelationship as (typeof RADIO_SELECTION_OPERATORS.MANY)[number],
				)
			) {
				throw new Error(`Invalid relationship: ${newRelationship}`);
			}
			const updatedFilter = {
				...filter,
				propertyNameSingular: filter.propertyNameSingular,
				relationship:
					newRelationship as (typeof RADIO_SELECTION_OPERATORS.MANY)[number],
				values: newValues,
			};
			return updatedFilter;
		}

		if (filter.selectionType === SELECTION_TYPES.CHECKBOXES) {
			if (!filter.propertyNamePlural) {
				throw new Error("propertyNamePlural is required for checkbox filters");
			}
			if (
				!CHECKBOX_SELECTION_OPERATORS.MANY.includes(
					newRelationship as (typeof CHECKBOX_SELECTION_OPERATORS.MANY)[number],
				)
			) {
				throw new Error(`Invalid relationship: ${newRelationship}`);
			}
			const updatedFilter = {
				...filter,
				propertyNamePlural: filter.propertyNamePlural,
				relationship:
					newRelationship as (typeof CHECKBOX_SELECTION_OPERATORS.MANY)[number],
				values: newValues,
			};
			return updatedFilter;
		}
		throw new Error(
			`Got invalid selection type: ${(filter as unknown as { selectionType: string }).selectionType}`,
		);
	}
	// throw an error here just to appease the typescript compiler... this is unreachable code
	console.error(
		"[updateFilterValueAndRelationship] Hit an unhandled number of values case",
		{
			filterId: filter.id,
			filter,
			newValuesLength: newValues.length,
			currentValuesLength: filter.values.length,
		},
	);
	throw new Error(
		"updateFilterRelationship: hit an unhandled number of values case",
	);
}
