import {
	filterRowByMatchType as baseFilterRowByMatchType,
	filterRow,
} from "./filtering-functions";
import type { MatchType, Row, TAppliedFilter } from "./types";

/**
 * Creates a stable signature for a filter based on its id and cache version.
 *
 * The _cacheVersion is incremented by the state management layer (useFilters)
 * whenever the filter's values or relationship changes. This allows us to use
 * a simple numeric comparison instead of computing expensive signatures by
 * sorting and escaping filter values.
 */
function getFilterSignature(filter: TAppliedFilter): string {
	return `${filter.id}:${filter._cacheVersion}`;
}

/**
 * Cache for storing filter evaluation results per row.
 * Outer Map key: stable row cache key (provided by caller)
 * Inner Map key: filterSignature (string)
 * Inner Map value: boolean (whether the row matches the filter)
 */
type RowCache = Map<string, Map<string, boolean>>;

/**
 * Memoized filtering system that caches per-filter evaluation results.
 *
 * When a filter changes, only that filter's cache entries are invalidated.
 * When a row's data changes (indicated by a change in the stable cache key),
 * the old cache entries become orphaned and are cleaned up on next clearCache().
 *
 * This works in conjunction with React's useMemo - useMemo handles memoizing
 * the final filteredRows array, while this handles memoizing individual
 * filter evaluations within that computation.
 *
 * @param getRowCacheKey - A function that returns a stable cache key for a row.
 *   The key must change whenever the row's data changes, and remain the same
 *   when the row's data is unchanged. This is the caller's responsibility.
 */
export class MemoizedFilterSystem<T extends Row> {
	private rowCache: RowCache = new Map();
	private filterSignatures: Map<string, string> = new Map();

	constructor(private readonly getRowCacheKey: (row: T) => string) {}

	/**
	 * Gets or creates a cache for a specific row.
	 * Returns a Map keyed by filter signature.
	 */
	private getRowCache(row: T): Map<string, boolean> {
		const cacheKey = this.getRowCacheKey(row);

		let cache = this.rowCache.get(cacheKey);
		if (!cache) {
			cache = new Map<string, boolean>();
			this.rowCache.set(cacheKey, cache);
		}
		return cache;
	}

	/**
	 * Gets the current signature for a filter, cleaning up old entries if the version changed.
	 * This prevents orphaned cache entries from accumulating when filters are modified.
	 */
	private getFilterSignatureAndCleanup(filter: TAppliedFilter): string {
		const newSignature = getFilterSignature(filter);
		const oldSignature = this.filterSignatures.get(filter.id);

		// If signature changed, clean up old entries to prevent memory leaks
		if (oldSignature && oldSignature !== newSignature) {
			this.clearFilterSignature(oldSignature);
		}

		this.filterSignatures.set(filter.id, newSignature);
		return newSignature;
	}

	/**
	 * Removes all cache entries for a specific filter signature.
	 */
	private clearFilterSignature(signature: string): void {
		for (const cache of this.rowCache.values()) {
			cache.delete(signature);
		}
	}

	/**
	 * Evaluates a single filter against a row, using cache if available.
	 */
	private evaluateFilter(row: T, filter: TAppliedFilter): boolean {
		const filterSignature = this.getFilterSignatureAndCleanup(filter);
		const cache = this.getRowCache(row);

		if (cache.has(filterSignature)) {
			// biome-ignore lint/style/noNonNullAssertion: we know it's not null because we just checked
			return cache.get(filterSignature)!;
		}

		const result = filterRow(row, filter);
		cache.set(filterSignature, result);
		return result;
	}

	/**
	 * Filters a row based on all filters and match type, using per-filter caching.
	 *
	 * Note: This does NOT cache the final result, as React's useMemo already handles
	 * that. This only caches individual filter evaluations, so when one filter changes,
	 * other filters can reuse their cached results.
	 *
	 * This delegates to the base `filterRowByMatchType` function with a memoized evaluator.
	 */
	filterRowByMatchType(
		row: T,
		filters: TAppliedFilter[],
		matchType: MatchType,
	): boolean {
		// Delegate to the base function with a memoized evaluator
		return baseFilterRowByMatchType(row, filters, matchType, (row, filter) =>
			this.evaluateFilter(row as T, filter),
		);
	}

	/**
	 * Clears all caches. Useful when rows change or for memory management.
	 */
	clearCache(): void {
		this.rowCache.clear();
		this.filterSignatures.clear();
	}

	/**
	 * Clears cache for a specific filter. Useful when that filter is removed.
	 * Iterates through all row cache entries and removes entries with matching filter signatures.
	 */
	clearFilterCache(filterId: string): void {
		// Get the filter signature prefix to match
		const filterSignaturePrefix = `${filterId}:`;

		// Iterate through all row caches and remove matching filter entries
		for (const cache of this.rowCache.values()) {
			for (const [filterSignature] of cache.entries()) {
				if (filterSignature.startsWith(filterSignaturePrefix)) {
					cache.delete(filterSignature);
				}
			}
		}
	}

	/**
	 * Clears cache for a specific row by its cache key.
	 * Useful when a row is removed or no longer in use.
	 */
	clearRowCache(rowCacheKey: string): void {
		this.rowCache.delete(rowCacheKey);
	}

	/**
	 * Gets cache statistics for debugging/monitoring.
	 */
	getCacheStats(): {
		rowCacheEntries: number;
		filterSignatures: number;
		totalFilterEntries: number;
	} {
		let totalFilterEntries = 0;
		for (const cache of this.rowCache.values()) {
			totalFilterEntries += cache.size;
		}
		return {
			rowCacheEntries: this.rowCache.size,
			filterSignatures: this.filterSignatures.size,
			totalFilterEntries,
		};
	}
}
