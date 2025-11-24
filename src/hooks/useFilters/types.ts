import {
	type CHECKBOX_SELECTION_OPERATORS,
	type MATCH_TYPES,
	OPERATORS,
	type RADIO_SELECTION_OPERATORS,
	type SELECTION_TYPES,
} from "./constants";

// NOTE: The set of supported types can expand over time
export type SupportedValue = string | string[];

export type Row = Record<string, SupportedValue>;

/**
 * This is the type that the Combobox component expects for its options.
 */
export type ComboboxOption = {
	id: string;
	label: string;
	value: string;
};

export type RelationshipType =
	(typeof SELECTION_TYPES)[keyof typeof SELECTION_TYPES];

/**
 * Type helper that ensures at least one of `propertyNameSingular` or `propertyNamePlural`
 * must be a key of type T.
 */
type AtLeastOnePropertyKey<T extends Row, K extends keyof T = keyof T> =
	| { propertyNameSingular: K; propertyNamePlural: K | string }
	| { propertyNamePlural: K; propertyNameSingular: K | string };

export type FilterOption<T extends Row, K extends keyof T = keyof T> = {
	id: string;
	selectionType: RelationshipType;
	propertyNameSingular: K | string; // e.g. "status"
	propertyNamePlural: K | string; // e.g. "statuses"
	options: ComboboxOption[];
} & AtLeastOnePropertyKey<T, K>;

// For fields like "status" where a row can only have one value
export const RADIO_SELECTION_RELATIONSHIPS = {
	ONE: [OPERATORS.IS, OPERATORS.IS_NOT], // ONE TO ONE
	MANY: [OPERATORS.IS_ANY_OF, OPERATORS.IS_NOT], // ONE TO MANY
} as const;

export type RadioOperator =
	(typeof RADIO_SELECTION_OPERATORS)[keyof typeof RADIO_SELECTION_OPERATORS][number];

export type CheckboxOperator =
	(typeof CHECKBOX_SELECTION_OPERATORS)[keyof typeof CHECKBOX_SELECTION_OPERATORS][number];

export type RadioSelectionOperators =
	(typeof RADIO_SELECTION_RELATIONSHIPS)[keyof typeof RADIO_SELECTION_RELATIONSHIPS][number];

export type Operator = (typeof OPERATORS)[keyof typeof OPERATORS];

/**
 * The discriminated union part of TAppliedFilter that varies between filter types.
 * This is extracted as a separate type so VariableKeys can automatically derive
 * the varying keys without duplication.
 */
export type FilterDiscriminatedUnionVariant =
	| {
			selectionType: typeof SELECTION_TYPES.RADIO;
			propertyNameSingular: string;
			propertyNamePlural?: string | undefined;
			relationship: RadioOperator;
	  }
	| {
			selectionType: typeof SELECTION_TYPES.CHECKBOXES;
			propertyNameSingular?: string | undefined;
			propertyNamePlural: string;
			relationship: CheckboxOperator;
	  };

export type TAppliedFilter = {
	id: string;
	createdAt: number; // ms since unix epoch (i.e. `Date.now()`)
	categoryId: string;
	options: ComboboxOption[];
	values: ComboboxOption[];
	relationship: Operator;
} & FilterDiscriminatedUnionVariant;

/**
 * Extracts the keys that vary across union members of TAppliedFilter.
 *
 * This type automatically derives the keys from the discriminated union variants,
 * ensuring it stays in sync if the union structure changes.
 */
export type VariableKeys = keyof FilterDiscriminatedUnionVariant;

export type MatchType = (typeof MATCH_TYPES)[keyof typeof MATCH_TYPES];
