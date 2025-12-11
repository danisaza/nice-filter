export const OPERATORS = {
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

export const SELECTION_TYPES = {
	RADIO: "radio",
	CHECKBOXES: "checkboxes",
} as const;

// For fields like "status" where a row can only have one value
export const RADIO_SELECTION_OPERATORS = {
	ONE: [OPERATORS.IS, OPERATORS.IS_NOT], // ONE TO ONE
	MANY: [OPERATORS.IS_ANY_OF, OPERATORS.IS_NOT], // ONE TO MANY
} as const;

// For fields like "tags" where a row can have multiple values
export const CHECKBOX_SELECTION_OPERATORS = {
	ONE: [OPERATORS.INCLUDE, OPERATORS.DO_NOT_INCLUDE], // MANY TO ONE
	MANY: [
		// MANY TO MANY
		OPERATORS.INCLUDE_ALL_OF,
		OPERATORS.INCLUDE_ANY_OF,
		OPERATORS.EXCLUDE_IF_ANY_OF,
		OPERATORS.EXCLUDE_IF_ALL,
	],
} as const;

export const MATCH_TYPES = {
	ANY: "any",
	ALL: "all",
} as const;
