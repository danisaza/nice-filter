import {
	type MATCH_TYPES,
	type RELATIONSHIP_TYPES,
	RELATIONSHIPS,
} from "./constants";

/**
 * This is the type that the Combobox component expects for its options.
 */
export type ComboboxOption = {
	id: string;
	label: string;
	value: string;
};

export type RelationshipType =
	(typeof RELATIONSHIP_TYPES)[keyof typeof RELATIONSHIP_TYPES];

/**
 * Type helper that ensures at least one of `propertyNameSingular` or `propertyNamePlural`
 * must be a key of type T.
 */
type AtLeastOnePropertyKey<T, K extends keyof T = keyof T> =
	| { propertyNameSingular: K; propertyNamePlural: K | string }
	| { propertyNamePlural: K; propertyNameSingular: K | string };

export type FilterOption<T, K extends keyof T = keyof T> = {
	id: string;
	selectionType: RelationshipType;
	propertyNameSingular: K | string; // e.g. "status"
	propertyNamePlural: K | string; // e.g. "statuses"
	options: ComboboxOption[];
} & AtLeastOnePropertyKey<T, K>;

// For fields like "status" where a row can only have one value
export const RADIO_SELECTION_RELATIONSHIPS = {
	ONE: [RELATIONSHIPS.IS, RELATIONSHIPS.IS_NOT], // ONE TO ONE
	MANY: [RELATIONSHIPS.IS_ANY_OF, RELATIONSHIPS.IS_NOT], // ONE TO MANY
} as const;

export type Relationship = (typeof RELATIONSHIPS)[keyof typeof RELATIONSHIPS];

/**
 * This is the predicate function that you can use to define whether a particular row should be
 * shown when a particular filter is present. Return `true` to show the row and `false` to hide it.
 */
export type Predicate<T> = (
	row: T,
	filter: TAppliedFilter,
	filterValue: TAppliedFilter["values"][number],
) => boolean;

export type TAppliedFilter = {
	id: string;
	createdAt: number; // ms since unix epoch (i.e. `Date.now()`)
	categoryId: string;
	selectionType: RelationshipType;
	propertyNameSingular: string;
	propertyNamePlural: string;
	options: ComboboxOption[];
	values: ComboboxOption[];
	relationship: Relationship;
};

export type MatchType = (typeof MATCH_TYPES)[keyof typeof MATCH_TYPES];
