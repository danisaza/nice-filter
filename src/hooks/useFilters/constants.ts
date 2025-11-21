/**
 * This is the type that the Combobox component expects for its options.
 */
export type ComboboxOption = {
	id: string;
	label: string;
	value: string;
};

export const RELATIONSHIPS = {
	IS: "is",
	IS_NOT: "is not",
	INCLUDE: "include",
	IS_ANY_OF: "is any of",
	EXCLUDE_IF_ANY_OF: "exclude if any of",
	INCLUDE_ALL_OF: "include all of",
	DO_NOT_INCLUDE: "do not include",
	INCLUDE_ANY_OF: "include any of",
	EXCLUDE_IF_ALL: "exclude if all",
} as const;

export const RELATIONSHIP_TYPES = {
	RADIO: "radio",
	CHECKBOXES: "checkboxes",
} as const;

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

// For fields like "tags" where a row can have multiple values
export const CHECKBOX_SELECTION_RELATIONSHIPS = {
	ONE: [RELATIONSHIPS.INCLUDE, RELATIONSHIPS.DO_NOT_INCLUDE], // MANY TO ONE
	MANY: [
		// MANY TO MANY
		RELATIONSHIPS.INCLUDE_ALL_OF,
		RELATIONSHIPS.INCLUDE_ANY_OF,
		RELATIONSHIPS.EXCLUDE_IF_ANY_OF,
		RELATIONSHIPS.EXCLUDE_IF_ALL,
	],
} as const;

export type Relationship = (typeof RELATIONSHIPS)[keyof typeof RELATIONSHIPS];

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

export const MATCH_TYPES = {
	ANY: "any",
	ALL: "all",
} as const;

export type MatchType = (typeof MATCH_TYPES)[keyof typeof MATCH_TYPES];
