import {
	filterRowByMatchType as baseFilterRowByMatchType,
	filterRow,
} from "./filtering-functions";
import type { MatchType, Row, TAppliedFilter } from "./types";

/**
 * Delimiters used in cache key signatures.
 */
const DELIMITERS = {
	/** Used to separate array elements within a single value */
	ARRAY_ELEMENT: ",",
	/** Used to separate different values in a row signature */
	VALUE_SEPARATOR: "|",
} as const;

/**
 * Escapes a specific delimiter in a string to prevent collisions.
 * Uses backslash as the escape character.
 *
 * @param str - The string to escape
 * @param delimiter - The delimiter character to escape
 * @returns The escaped string
 */
export function escapeDelimiter(str: string, delimiter: string): string {
	// First pass: escape backslashes
	// Second pass: escape the delimiter
	// We do this in two passes to ensure backslashes are escaped first,
	// so that delimiter escaping doesn't interfere with backslash escaping.

	// Note: "\\" is a single backslash character (the backslash is escaped in the string literal)
	const BACKSLASH = "\\";
	const ESCAPED_BACKSLASH = "\\\\";

	let firstPassResult = "";

	// First pass: escape backslashes
	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		if (char === BACKSLASH) {
			firstPassResult += ESCAPED_BACKSLASH;
		} else {
			firstPassResult += char;
		}
	}

	// Second pass: escape delimiters
	let finalResult = "";
	for (let i = 0; i < firstPassResult.length; i++) {
		const char = firstPassResult[i];
		if (char === delimiter) {
			finalResult += `\\${delimiter}`;
		} else {
			finalResult += char;
		}
	}

	return finalResult;
}

/**
 * Creates a stable signature for a filter based on its relevant properties.
 * This allows us to detect when a filter has changed.
 *
 * Uses comma (,) to separate filter values. Escapes commas in user data to prevent collisions.
 */
function getFilterSignature(filter: TAppliedFilter): string {
	// Sort values by id to ensure consistent signature even if order changes
	const sortedValues = [...filter.values]
		.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
		.map((v) => escapeDelimiter(v.value, DELIMITERS.ARRAY_ELEMENT))
		.join(DELIMITERS.ARRAY_ELEMENT);

	return `${filter.id}:${filter.relationship}:${sortedValues}`;
}

/**
 * Creates a stable signature for a row based on its data.
 * This allows us to detect when a row's data has changed even if it has the same ID.
 *
 * Uses comma (,) to separate array elements and pipe (|) to separate values.
 * Escapes delimiters in user data to prevent collisions.
 */
function getRowDataSignature<T extends Row>(row: T): string {
	const keys = Object.keys(row).sort();
	const values = keys.map((key) => {
		const value = row[key];
		if (Array.isArray(value)) {
			// Sort arrays for deterministic signature, escape each element, then join with comma
			return [...value]
				.sort()
				.map((item) => escapeDelimiter(String(item), DELIMITERS.ARRAY_ELEMENT))
				.join(DELIMITERS.ARRAY_ELEMENT);
		}
		// Escape both delimiters since this value could contain either
		return escapeDelimiter(
			escapeDelimiter(String(value), DELIMITERS.ARRAY_ELEMENT),
			DELIMITERS.VALUE_SEPARATOR,
		);
	});
	return values.join(DELIMITERS.VALUE_SEPARATOR);
}

/**
 * Cache for storing filter evaluation results per row.
 * Outer Map key: `${rowId}:${rowDataHash}` (combines row ID and data signature)
 * Inner Map key: filterSignature (string)
 * Inner Map value: boolean (whether the row matches the filter)
 */
type RowCache = Map<string, Map<string, boolean>>;

/**
 * Memoized filtering system that caches per-filter evaluation results.
 *
 * When a filter changes, only that filter's cache entries are invalidated.
 * When a row's data changes, old cache entries for that row are automatically removed.
 * This works in conjunction with React's useMemo - useMemo handles memoizing
 * the final filteredRows array, while this handles memoizing individual
 * filter evaluations within that computation.
 */
export class MemoizedFilterSystem {
	// Map keyed by `${rowId}:${rowDataHash}` - allows iteration and precise clearing
	private rowCache: RowCache = new Map();
	// Tracks current rowDataHash for each rowId to detect changes
	private rowDataHashes: Map<string, string> = new Map();
	private filterSignatures: Map<string, string> = new Map();

	/**
	 * Gets a stable identifier for a row.
	 * Assumes rows have an `id` property of type string.
	 */
	private getRowId<T extends Row>(row: T): string {
		if ("id" in row && typeof row.id === "string") {
			return row.id;
		}
		throw new Error(
			"Row must have an 'id' property of type string for memoization to work",
		);
	}

	/**
	 * Gets or creates a cache for a specific row, handling row data changes.
	 * Returns a Map keyed by filter signature.
	 * Automatically removes old cache entries if the row's data has changed.
	 */
	private getRowCache<T extends Row>(row: T): Map<string, boolean> {
		const rowId = this.getRowId(row);
		const rowDataHash = getRowDataSignature(row);
		const cacheKey = `${rowId}:${rowDataHash}`;

		// Check if row data has changed
		const oldRowDataHash = this.rowDataHashes.get(rowId);
		if (oldRowDataHash && oldRowDataHash !== rowDataHash) {
			// Row data changed - remove old cache entry
			const oldCacheKey = `${rowId}:${oldRowDataHash}`;
			this.rowCache.delete(oldCacheKey);
		}

		// Update or set the current hash for this rowId
		// In other words: record the last-known value for this rowId
		this.rowDataHashes.set(rowId, rowDataHash);

		// Get or create cache for this rowId:rowDataHash combination
		let cache = this.rowCache.get(cacheKey);
		if (!cache) {
			cache = new Map(); // <-- should we specify a type here?
			this.rowCache.set(cacheKey, cache);
		}
		return cache;
	}

	/**
	 * Gets the current signature for a filter, or creates a new one.
	 * If the filter has changed, old entries will naturally expire as they're
	 * not accessed (since new signature is used going forward).
	 */
	private getFilterSignature(filter: TAppliedFilter): string {
		const signature = getFilterSignature(filter);
		this.filterSignatures.set(filter.id, signature);
		return signature;
	}

	/**
	 * Evaluates a single filter against a row, using cache if available.
	 */
	private evaluateFilter<T extends Row>(
		row: T,
		filter: TAppliedFilter,
	): boolean {
		const filterSignature = this.getFilterSignature(filter);
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
	filterRowByMatchType<T extends Row>(
		row: T,
		filters: TAppliedFilter[],
		matchType: MatchType,
	): boolean {
		// Delegate to the base function with a memoized evaluator
		return baseFilterRowByMatchType(row, filters, matchType, (row, filter) =>
			this.evaluateFilter(row, filter),
		);
	}

	/**
	 * Clears all caches. Useful when rows change or for memory management.
	 */
	clearCache(): void {
		this.rowCache.clear();
		this.rowDataHashes.clear();
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

		// Remove the filter signature tracking
		this.filterSignatures.delete(filterId);
	}

	/**
	 * Clears cache for a row. Useful for when a row is no longer in use.
	 */
	clearRowCache(rowId: string): void {
		// first, get the last known value from the rowDataHash map
		const rowDataHash = this.rowDataHashes.get(rowId);
		if (!rowDataHash) {
			// no last-known value for this row, so we're all good
			return;
		}

		// now get the rowCache entry for that rowId:rowDataHash combination
		const cacheKey = `${rowId}:${rowDataHash}`;
		const cache = this.rowCache.get(cacheKey);
		if (!cache) {
			return;
		}

		cache.clear();
		this.rowCache.delete(cacheKey);
		this.rowDataHashes.delete(rowId);
	}

	/**
	 * Gets cache statistics for debugging/monitoring.
	 */
	getCacheStats(): {
		rowCacheEntries: number;
		rowDataHashes: number;
		filterSignatures: number;
		totalFilterEntries: number;
	} {
		let totalFilterEntries = 0;
		for (const cache of this.rowCache.values()) {
			totalFilterEntries += cache.size;
		}
		return {
			rowCacheEntries: this.rowCache.size,
			rowDataHashes: this.rowDataHashes.size,
			filterSignatures: this.filterSignatures.size,
			totalFilterEntries,
		};
	}
}
