import { useCallback, useEffect, useMemo, useRef } from "react";
import { MemoizedFilterSystem } from "./filtering-functions-memoized";
import type { MatchType, Row, TAppliedFilter } from "./types";

/**
 * Hook that provides memoized filtering functionality.
 *
 * This hook maintains a MemoizedFilterSystem instance and automatically
 * manages cache invalidation when filters or rows change.
 *
 * @example
 * ```tsx
 * const { filterRow, clearCache } = useMemoizedFiltering(rows);
 * const filteredRows = useMemo(() => {
 *   return rows.filter((row) => filterRow(row, filters, matchType));
 * }, [rows, filters, matchType, filterRow]);
 * ```
 */
export function useMemoizedFiltering<T extends Row>(rows: T[]) {
	const filterSystemRef = useRef<MemoizedFilterSystem>(
		new MemoizedFilterSystem(),
	);

	// Clear cache when rows change (rows array reference changes)
	// This is a simple heuristic - might want more sophisticated logic later
	// biome-ignore lint/correctness/useExhaustiveDependencies: the point is to listen for changes on the rows reference
	useEffect(() => {
		filterSystemRef.current.clearCache();
	}, [rows]);

	const filterRow = useMemo(
		() => (row: T, filters: TAppliedFilter[], matchType: MatchType) => {
			return filterSystemRef.current.filterRowByMatchType(
				row,
				filters,
				matchType,
			);
		},
		[],
	);

	const clearCache = useCallback(() => {
		filterSystemRef.current.clearCache();
	}, []);

	const clearFilterCache = useCallback((filterId: string) => {
		filterSystemRef.current.clearFilterCache(filterId);
	}, []);

	const getCacheStats = useCallback(() => {
		return filterSystemRef.current.getCacheStats();
	}, []);

	return {
		filterRow,
		clearCache,
		clearFilterCache,
		getCacheStats,
	};
}
