import { expect, test } from "vitest";
import { MATCH_TYPES, OPERATORS, SELECTION_TYPES } from "./constants";
import { filterRowByMatchType } from "./filtering-functions";
import type { Row, TAppliedFilter } from "./types";

// Helper function to create a mock filter
function createMockFilter(
	overrides: Partial<TAppliedFilter> = {},
): TAppliedFilter {
	// defining this here so that we get type safety on it
	const filterDefaults: TAppliedFilter = {
		id: "test-filter-1",
		createdAt: Date.now(),
		categoryId: "test-category",
		options: [],
		values: [{ id: "1", label: "Value 1", value: "value1" }],
		selectionType: SELECTION_TYPES.RADIO,
		propertyNameSingular: "status",
		relationship: OPERATORS.IS,
	};
	return {
		...filterDefaults,
		...overrides,
	} as TAppliedFilter;
}

test("returns row when filters array is empty", () => {
	const row: Row = { status: "value1" };
	const filters: TAppliedFilter[] = [];
	const result = filterRowByMatchType(row, filters, MATCH_TYPES.ALL);

	expect(result).toBe(row);
});

test("filters with MATCH_TYPES.ALL - all filters must match", () => {
	const row: Row = { status: "value1" };
	const filters: TAppliedFilter[] = [
		createMockFilter({
			values: [{ id: "1", label: "Value 1", value: "value1" }],
			relationship: OPERATORS.IS,
		}),
		createMockFilter({
			values: [{ id: "2", label: "Value 2", value: "value2" }],
			propertyNameSingular: "type",
			relationship: OPERATORS.IS,
		}),
	];

	// Row matches first filter but not second - should return false
	const result = filterRowByMatchType(row, filters, MATCH_TYPES.ALL);
	expect(result).toBe(false);
});

test("filters with MATCH_TYPES.ALL - all filters match", () => {
	const row: Row = { status: "value1", type: "value2" };
	const filters: TAppliedFilter[] = [
		createMockFilter({
			values: [{ id: "1", label: "Value 1", value: "value1" }],
			relationship: OPERATORS.IS,
		}),
		createMockFilter({
			values: [{ id: "2", label: "Value 2", value: "value2" }],
			propertyNameSingular: "type",
			relationship: OPERATORS.IS,
		}),
	];

	// Row matches both filters - should return true
	const result = filterRowByMatchType(row, filters, MATCH_TYPES.ALL);
	expect(result).toBe(true);
});

test("filters with MATCH_TYPES.ANY - any filter can match", () => {
	const row: Row = { status: "value1" };
	const filters: TAppliedFilter[] = [
		createMockFilter({
			values: [{ id: "1", label: "Value 1", value: "value1" }],
			relationship: OPERATORS.IS,
		}),
		createMockFilter({
			values: [{ id: "2", label: "Value 2", value: "value2" }],
			propertyNameSingular: "type",
			relationship: OPERATORS.IS,
		}),
	];

	// Row matches first filter - should return true even though second doesn't match
	const result = filterRowByMatchType(row, filters, MATCH_TYPES.ANY);
	expect(result).toBe(true);
});

test("filters with MATCH_TYPES.ANY - no filters match", () => {
	const row: Row = { status: "value3" };
	const filters: TAppliedFilter[] = [
		createMockFilter({
			values: [{ id: "1", label: "Value 1", value: "value1" }],
			relationship: OPERATORS.IS,
		}),
		createMockFilter({
			values: [{ id: "2", label: "Value 2", value: "value2" }],
			propertyNameSingular: "type",
			relationship: OPERATORS.IS,
		}),
	];

	// Row doesn't match any filter - should return false
	const result = filterRowByMatchType(row, filters, MATCH_TYPES.ANY);
	expect(result).toBe(false);
});
