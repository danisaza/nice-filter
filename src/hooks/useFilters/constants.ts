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

export const MATCH_TYPES = {
	ANY: "any",
	ALL: "all",
} as const;
