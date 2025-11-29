import { describe, expect, test, vi } from "vitest";
import { OPERATORS, SELECTION_TYPES } from "./constants";
import { MemoizedFilterSystem } from "./filtering-functions-memoized";
import type { Row, TAppliedFilter } from "./types";

// Helper to create a test row
function createRow({ id, status }: { id: string; status: string }): Row {
	return { id, status };
}

// Helper to create a test filter
function createFilter({
	id,
	values,
	cacheVersion = 0,
}: {
	id: string;
	values: string[];
	cacheVersion?: number;
}): TAppliedFilter {
	return {
		id,
		createdAt: Date.now(),
		categoryId: "status-category",
		options: values.map((v) => ({ id: v, label: v, value: v })),
		values: values.map((v) => ({ id: v, label: v, value: v })),
		relationship: OPERATORS.IS,
		selectionType: SELECTION_TYPES.RADIO,
		propertyNameSingular: "status",
		propertyNamePlural: undefined,
		_cacheVersion: cacheVersion,
	};
}

describe("MemoizedFilterSystem", () => {
	describe("constructor and getRowCacheKey", () => {
		test("uses provided getRowCacheKey function", () => {
			const getRowCacheKey = vi.fn((row: Row) => row.id as string);
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row = createRow({ id: "row-1", status: "active" });
			const filter = createFilter({ id: "filter-1", values: ["active"] });

			system.filterRowByMatchType(row, [filter], "any");

			expect(getRowCacheKey).toHaveBeenCalledWith(row);
		});

		test("getRowCacheKey is called for each row evaluation", () => {
			const getRowCacheKey = vi.fn((row: Row) => row.id as string);
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row1 = createRow({ id: "row-1", status: "active" });
			const row2 = createRow({ id: "row-2", status: "inactive" });
			const filter = createFilter({ id: "filter-1", values: ["active"] });

			system.filterRowByMatchType(row1, [filter], "any");
			system.filterRowByMatchType(row2, [filter], "any");

			expect(getRowCacheKey).toHaveBeenCalledTimes(2);
			expect(getRowCacheKey).toHaveBeenCalledWith(row1);
			expect(getRowCacheKey).toHaveBeenCalledWith(row2);
		});
	});

	describe("caching behavior", () => {
		test("caches filter results per row cache key", () => {
			const getRowCacheKey = (row: Row) => row.id as string;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row = createRow({ id: "row-1", status: "active" });
			const filter = createFilter({ id: "filter-1", values: ["active"] });

			// First call should compute and cache
			const result1 = system.filterRowByMatchType(row, [filter], "any");
			// Second call should use cache
			const result2 = system.filterRowByMatchType(row, [filter], "any");

			expect(result1).toBe(true);
			expect(result2).toBe(true);

			const stats = system.getCacheStats();
			expect(stats.rowCacheEntries).toBe(1);
			expect(stats.totalFilterEntries).toBe(1);
		});

		test("different cache keys create separate cache entries", () => {
			const getRowCacheKey = (row: Row) => `${row.id}:${row.status}`;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row1 = createRow({ id: "row-1", status: "active" });
			const row2 = createRow({ id: "row-1", status: "inactive" }); // Same id, different status
			const filter = createFilter({ id: "filter-1", values: ["active"] });

			system.filterRowByMatchType(row1, [filter], "any");
			system.filterRowByMatchType(row2, [filter], "any");

			const stats = system.getCacheStats();
			// Two separate cache entries because cache keys are different
			expect(stats.rowCacheEntries).toBe(2);
		});

		test("same cache key reuses cached result", () => {
			const getRowCacheKey = vi.fn((row: Row) => row.id as string);
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row = createRow({ id: "row-1", status: "active" });
			const filter = createFilter({ id: "filter-1", values: ["active"] });

			// Multiple calls with same row
			system.filterRowByMatchType(row, [filter], "any");
			system.filterRowByMatchType(row, [filter], "any");
			system.filterRowByMatchType(row, [filter], "any");

			// getRowCacheKey is called each time to get the cache key
			expect(getRowCacheKey).toHaveBeenCalledTimes(3);
			// But only one cache entry exists
			const stats = system.getCacheStats();
			expect(stats.rowCacheEntries).toBe(1);
			expect(stats.totalFilterEntries).toBe(1);
		});
	});

	describe("filter cache versioning", () => {
		test("filter version change cleans up old cache entry", () => {
			const getRowCacheKey = (row: Row) => row.id as string;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row = createRow({ id: "row-1", status: "active" });
			const filterV0 = createFilter({
				id: "filter-1",
				values: ["active"],
				cacheVersion: 0,
			});
			const filterV1 = createFilter({
				id: "filter-1",
				values: ["inactive"],
				cacheVersion: 1,
			});

			// First version
			const result1 = system.filterRowByMatchType(row, [filterV0], "any");
			expect(result1).toBe(true);
			expect(system.getCacheStats().totalFilterEntries).toBe(1);

			// After filter update (new version) - old entry should be cleaned up
			const result2 = system.filterRowByMatchType(row, [filterV1], "any");
			expect(result2).toBe(false);

			const stats = system.getCacheStats();
			// Old filter entry was cleaned up, only new one remains
			expect(stats.rowCacheEntries).toBe(1);
			expect(stats.totalFilterEntries).toBe(1);
		});
	});

	describe("clearCache", () => {
		test("clears all caches", () => {
			const getRowCacheKey = (row: Row) => row.id as string;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row1 = createRow({ id: "row-1", status: "active" });
			const row2 = createRow({ id: "row-2", status: "inactive" });
			const filter = createFilter({ id: "filter-1", values: ["active"] });

			system.filterRowByMatchType(row1, [filter], "any");
			system.filterRowByMatchType(row2, [filter], "any");

			expect(system.getCacheStats().rowCacheEntries).toBe(2);

			system.clearCache();

			const stats = system.getCacheStats();
			expect(stats.rowCacheEntries).toBe(0);
			expect(stats.filterSignatures).toBe(0);
			expect(stats.totalFilterEntries).toBe(0);
		});
	});

	describe("clearFilterCache", () => {
		test("clears cache entries for specific filter", () => {
			const getRowCacheKey = (row: Row) => row.id as string;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row = createRow({ id: "row-1", status: "active" });
			// Both filters match the row, so with "all" both will be evaluated
			const filter1 = createFilter({ id: "filter-1", values: ["active"] });
			const filter2 = createFilter({ id: "filter-2", values: ["active"] });

			// Use "all" match type - both filters match, so both are evaluated
			system.filterRowByMatchType(row, [filter1, filter2], "all");

			expect(system.getCacheStats().totalFilterEntries).toBe(2);

			system.clearFilterCache("filter-1");

			const stats = system.getCacheStats();
			expect(stats.rowCacheEntries).toBe(1);
			expect(stats.totalFilterEntries).toBe(1);
		});
	});

	describe("clearRowCache", () => {
		test("clears cache for specific row by cache key", () => {
			const getRowCacheKey = (row: Row) => row.id as string;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row1 = createRow({ id: "row-1", status: "active" });
			const row2 = createRow({ id: "row-2", status: "inactive" });
			const filter = createFilter({ id: "filter-1", values: ["active"] });

			system.filterRowByMatchType(row1, [filter], "any");
			system.filterRowByMatchType(row2, [filter], "any");

			expect(system.getCacheStats().rowCacheEntries).toBe(2);

			system.clearRowCache("row-1");

			const stats = system.getCacheStats();
			expect(stats.rowCacheEntries).toBe(1);
		});
	});

	describe("getCacheStats", () => {
		test("returns accurate statistics", () => {
			const getRowCacheKey = (row: Row) => row.id as string;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row1 = createRow({ id: "row-1", status: "active" });
			const row2 = createRow({ id: "row-2", status: "inactive" });
			const filter1 = createFilter({ id: "filter-1", values: ["active"] });
			const filter2 = createFilter({ id: "filter-2", values: ["inactive"] });

			// Evaluate each filter separately to avoid short-circuit behavior
			system.filterRowByMatchType(row1, [filter1], "any");
			system.filterRowByMatchType(row1, [filter2], "any");
			system.filterRowByMatchType(row2, [filter1], "any");
			system.filterRowByMatchType(row2, [filter2], "any");

			const stats = system.getCacheStats();
			expect(stats.rowCacheEntries).toBe(2);
			expect(stats.filterSignatures).toBe(2);
			expect(stats.totalFilterEntries).toBe(4); // 2 rows * 2 filters
		});
	});

	describe("match types", () => {
		test("works with 'any' match type", () => {
			const getRowCacheKey = (row: Row) => row.id as string;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row = createRow({ id: "row-1", status: "active" });
			const filter1 = createFilter({ id: "filter-1", values: ["active"] });
			const filter2 = createFilter({ id: "filter-2", values: ["inactive"] });

			// Row matches filter1 but not filter2, should pass with "any"
			const result = system.filterRowByMatchType(
				row,
				[filter1, filter2],
				"any",
			);
			expect(result).toBe(true);
		});

		test("works with 'all' match type", () => {
			const getRowCacheKey = (row: Row) => row.id as string;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row = createRow({ id: "row-1", status: "active" });
			const filter1 = createFilter({ id: "filter-1", values: ["active"] });
			const filter2 = createFilter({ id: "filter-2", values: ["inactive"] });

			// Row matches filter1 but not filter2, should fail with "all"
			const result = system.filterRowByMatchType(
				row,
				[filter1, filter2],
				"all",
			);
			expect(result).toBe(false);
		});
	});

	describe("caller-provided stable ID contract", () => {
		test("changing cache key with same row object creates new cache entry", () => {
			// Simulate a scenario where the caller's key changes for the "same" logical row
			let version = 0;
			const getRowCacheKey = (row: Row) => `${row.id}:v${version}`;
			const system = new MemoizedFilterSystem(getRowCacheKey);

			const row = createRow({ id: "row-1", status: "active" });
			const filter = createFilter({ id: "filter-1", values: ["active"] });

			// First call with version 0
			system.filterRowByMatchType(row, [filter], "any");
			expect(system.getCacheStats().rowCacheEntries).toBe(1);

			// Change version (simulating row data changed)
			version = 1;
			system.filterRowByMatchType(row, [filter], "any");

			// Now we have 2 cache entries (the old one becomes orphaned)
			expect(system.getCacheStats().rowCacheEntries).toBe(2);
		});
	});
});
