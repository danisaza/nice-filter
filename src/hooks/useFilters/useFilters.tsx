import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { UseStateSetter } from "@/utils";
import {
	CHECKBOX_SELECTION_OPERATORS,
	MATCH_TYPES,
	OPERATORS,
	RADIO_SELECTION_OPERATORS,
	SELECTION_TYPES,
	TEXT_SELECTION_OPERATORS,
} from "./constants";
import { filterRowByMatchType } from "./filtering-functions";
import { MemoizedFilterSystem } from "./filtering-functions-memoized";
import type {
	CheckboxOperator,
	ComboboxOption,
	FilterOption,
	MatchType,
	Operator,
	RadioOperator,
	Row,
	TAppliedFilter,
	TextOperator,
} from "./types";
import { updateFilterValueAndRelationship } from "./utils";

type FilterValueUpdate =
	| ComboboxOption[]
	| ((values: ComboboxOption[]) => ComboboxOption[]);

type FiltersContextType<T extends Row> = {
	addFilter: (
		filter: Omit<
			TAppliedFilter,
			"relationship" | "createdAt" | "_cacheVersion"
		> & { textValue?: string; isNegation?: boolean },
	) => void;
	filters: TAppliedFilter[];
	// TODO: Consider updating filterCategories here to include a second type parameter for the property key
	filterCategories: FilterOption<T>[];
	filteredRows: T[];
	getFilter: (filterId: string) => TAppliedFilter | undefined;
	getFilterOrThrow: (filterId: string) => TAppliedFilter;
	getOptionsForFilterCategory: (filterCategoryId: string) => ComboboxOption[];
	getPropertyNameToDisplay: (filterId: string) => string;
	hiddenRowCount: number;
	matchType: MatchType;
	removeAllFilters: () => void;
	removeFilter: (filterId: string) => void;
	setFilterCategories: UseStateSetter<FilterOption<T>[]>;
	setMatchType: UseStateSetter<MatchType>;
	totalRowCount: number;
	updateFilterRelationship: (filterId: string, relationship: Operator) => void;
	updateFilterValues: (
		filterId: string,
		filterValueUpdate: FilterValueUpdate,
	) => void;
	updateTextFilterValue: (filterId: string, textValue: string) => void;
};

type FiltersProviderProps<T extends Row> = {
	children: ReactNode;
	rows: T[];
	context: React.Context<FiltersContextType<T> | null>;
	filteredRowsContext: React.Context<T[] | null>;
	enableCaching?: boolean;
	/**
	 * A function that returns a stable cache key for a row.
	 * The key must change whenever the row's data changes, and remain the same
	 * when the row's data is unchanged. This is required when caching is enabled.
	 */
	getRowCacheKey: (row: T) => string;
};

export function FiltersProvider<T extends Row>({
	children,
	rows,
	context,
	filteredRowsContext,
	enableCaching = true,
	getRowCacheKey,
}: FiltersProviderProps<T>) {
	const [filters, setFilters] = useState<TAppliedFilter[]>([]);
	//              ^?
	const [matchType, setMatchType] = useState<MatchType>(MATCH_TYPES.ANY);
	const [filterCategories, setFilterCategories] = useState<FilterOption<T>[]>(
		[],
	);

	// Memoized filter system instance (only created if caching is enabled)
	const filterSystemRef = useRef<MemoizedFilterSystem<T> | null>(null);
	if (enableCaching && !filterSystemRef.current) {
		filterSystemRef.current = new MemoizedFilterSystem(getRowCacheKey);
	}
	if (!enableCaching && filterSystemRef.current) {
		filterSystemRef.current.clearCache();
		filterSystemRef.current = null;
	}

	// Clear cache when rows change (if caching is enabled)
	// biome-ignore lint/correctness/useExhaustiveDependencies: we actually *do* want `rows` here so we can clear the cache when it changes
	useEffect(() => {
		if (enableCaching && filterSystemRef.current) {
			filterSystemRef.current.clearCache();
		}
	}, [rows, enableCaching]);

	const filteredRows = useMemo(() => {
		if (enableCaching && filterSystemRef.current) {
			return rows.filter((row) =>
				// biome-ignore lint/style/noNonNullAssertion: we just checked that it's not null
				filterSystemRef.current!.filterRowByMatchType(row, filters, matchType),
			);
		}
		return rows.filter((row) => filterRowByMatchType(row, filters, matchType));
	}, [filters, matchType, rows, enableCaching]);

	const addFilter = useCallback(
		({
			id,
			categoryId,
			options,
			propertyNameSingular,
			propertyNamePlural,
			selectionType,
			values,
			textValue,
			isNegation = false,
		}: Omit<
			TAppliedFilter,
			"createdAt" | "relationship" | "_cacheVersion"
		> & { textValue?: string; isNegation?: boolean }) => {
			const newFilter = {
				id,
				createdAt: Date.now(),
				categoryId,
				options,
				values,
				_cacheVersion: 0,
			};

			if (selectionType === SELECTION_TYPES.RADIO) {
				if (!propertyNameSingular) {
					throw new Error("propertyNameSingular is required for radio filters");
				}
				const computedRelationship = isNegation
					? OPERATORS.IS_NOT
					: values.length > 1
						? OPERATORS.IS_ANY_OF
						: OPERATORS.IS;
				const radioValues = {
					propertyNameSingular: propertyNameSingular,
					propertyNamePlural: undefined,
					selectionType: SELECTION_TYPES.RADIO,
					relationship: computedRelationship,
				};
				setFilters((prev) => [...prev, { ...newFilter, ...radioValues }]);
				return;
			}

			if (selectionType === SELECTION_TYPES.CHECKBOXES) {
				if (!propertyNamePlural) {
					throw new Error(
						"propertyNamePlural is required for checkbox filters",
					);
				}
				const computedRelationship = isNegation
					? values.length > 1
						? OPERATORS.EXCLUDE_IF_ANY_OF
						: OPERATORS.DO_NOT_INCLUDE
					: values.length > 1
						? OPERATORS.INCLUDE_ALL_OF
						: OPERATORS.INCLUDE;
				const checkboxValues = {
					propertyNameSingular: undefined,
					propertyNamePlural: propertyNamePlural,
					selectionType: SELECTION_TYPES.CHECKBOXES,
					relationship: computedRelationship,
				};
				setFilters((prev) => [...prev, { ...newFilter, ...checkboxValues }]);
				return;
			}

			if (selectionType === SELECTION_TYPES.TEXT) {
				if (!propertyNameSingular) {
					throw new Error("propertyNameSingular is required for text filters");
				}
				const computedRelationship = isNegation
					? OPERATORS.DOES_NOT_CONTAIN
					: OPERATORS.CONTAINS;
				const textValues = {
					propertyNameSingular: propertyNameSingular,
					propertyNamePlural: undefined,
					selectionType: SELECTION_TYPES.TEXT,
					relationship: computedRelationship,
					textValue: textValue ?? "",
				};
				setFilters((prev) => [...prev, { ...newFilter, ...textValues }]);
				return;
			}

			throw new Error(`Got invalid selection type: ${selectionType}`);
		},
		[],
	);

	const removeFilter = useCallback(
		(filterId: string) => {
			if (enableCaching && filterSystemRef.current) {
				filterSystemRef.current.clearFilterCache(filterId);
			}
			setFilters((prev) => prev.filter((f) => f.id !== filterId));
		},
		[enableCaching],
	);

	const removeAllFilters = useCallback(() => {
		setFilters([]);
	}, []);

	const updateFilterValues = useCallback(
		(filterId: string, filterValueUpdate: FilterValueUpdate) => {
			setFilters((prev) =>
				prev.map((f) => {
					if (f.id !== filterId) return f;

					const newValues =
						typeof filterValueUpdate === "function"
							? filterValueUpdate(f.values)
							: filterValueUpdate;

					return {
						...updateFilterValueAndRelationship(f, newValues),
						_cacheVersion: f._cacheVersion + 1,
					};
				}),
			);
		},
		[],
	);

	const updateTextFilterValue = useCallback(
		(filterId: string, textValue: string) => {
			setFilters((prev) =>
				prev.map((f) => {
					if (f.id !== filterId) return f;
					if (f.selectionType !== SELECTION_TYPES.TEXT) {
						throw new Error(
							`Cannot update text value on non-text filter: ${f.selectionType}`,
						);
					}
					return {
						...f,
						textValue,
						_cacheVersion: f._cacheVersion + 1,
					};
				}),
			);
		},
		[],
	);

	// use this for manual relationship updates (e.g. switch from "is" to "is not")
	const updateFilterRelationship = useCallback(
		(filterId: string, relationship: Operator) => {
			setFilters((prev) =>
				prev.map((f) => {
					if (f.id !== filterId) return f;

					// Validate relationship based on selection type
					if (f.selectionType === SELECTION_TYPES.RADIO) {
						const validRadioOperators = [
							...RADIO_SELECTION_OPERATORS.ONE,
							...RADIO_SELECTION_OPERATORS.MANY,
						];
						if (!validRadioOperators.includes(relationship as RadioOperator)) {
							throw new Error(
								`Invalid relationship "${relationship}" for radio filter. Valid relationships are: ${validRadioOperators.join(", ")}`,
							);
						}
						return {
							...f,
							propertyNameSingular: f.propertyNameSingular,
							relationship: relationship as RadioOperator,
							_cacheVersion: f._cacheVersion + 1,
						};
					}

					if (f.selectionType === SELECTION_TYPES.CHECKBOXES) {
						const validCheckboxOperators = [
							...CHECKBOX_SELECTION_OPERATORS.ONE,
							...CHECKBOX_SELECTION_OPERATORS.MANY,
						];
						if (
							!validCheckboxOperators.includes(relationship as CheckboxOperator)
						) {
							throw new Error(
								`Invalid relationship "${relationship}" for checkbox filter. Valid relationships are: ${validCheckboxOperators.join(", ")}`,
							);
						}
						return {
							...f,
							propertyNamePlural: f.propertyNamePlural,
							relationship: relationship as CheckboxOperator,
							_cacheVersion: f._cacheVersion + 1,
						};
					}

					if (f.selectionType === SELECTION_TYPES.TEXT) {
						const validTextOperators = [...TEXT_SELECTION_OPERATORS.ONE];
						if (!validTextOperators.includes(relationship as TextOperator)) {
							throw new Error(
								`Invalid relationship "${relationship}" for text filter. Valid relationships are: ${validTextOperators.join(", ")}`,
							);
						}
						return {
							...f,
							propertyNameSingular: f.propertyNameSingular,
							relationship: relationship as TextOperator,
							_cacheVersion: f._cacheVersion + 1,
						};
					}

					// appeasing the typescript compiler, which correctly identifies that `f` is of type `never` here
					throw new Error(
						`Invalid selection type: ${(f as { selectionType: string }).selectionType}`,
					);
				}),
			);
		},
		[],
	);

	const getFilter = useCallback(
		(filterId: string) => {
			return filters.find((f) => f.id === filterId);
		},
		[filters],
	);

	const getFilterOrThrow = useCallback(
		(filterId: string) => {
			const result = getFilter(filterId);
			if (!result) {
				throw new Error(`Filter not found: ${filterId}`);
			}
			return result;
		},
		[getFilter],
	);

	const optionsByFilterCategoryId = useMemo(
		() =>
			filterCategories.reduce(
				(acc, f) => {
					acc[f.id] = f.options;
					return acc;
				},
				{} as Record<string, ComboboxOption[]>,
			),
		[filterCategories],
	);

	const getOptionsForFilterCategory = useCallback(
		(filterCategoryId: string) => {
			if (!(filterCategoryId in optionsByFilterCategoryId)) {
				throw new Error(
					`The provided id does not match any of the filter categories: ${filterCategoryId}`,
				);
			}
			return optionsByFilterCategoryId[filterCategoryId];
		},
		[optionsByFilterCategoryId],
	);

	const getPropertyNameToDisplay = useCallback(
		(filterId: string) => {
			const filter = getFilterOrThrow(filterId);
			// TEXT and RADIO filters use singular, CHECKBOXES uses plural
			return filter.selectionType === SELECTION_TYPES.CHECKBOXES
				? filter.propertyNamePlural
				: filter.propertyNameSingular;
		},
		[getFilterOrThrow],
	);

	const value: FiltersContextType<T> = useMemo(
		() => ({
			addFilter,
			filterCategories,
			filteredRows,
			filters,
			getFilter,
			getFilterOrThrow,
			getPropertyNameToDisplay,
			getOptionsForFilterCategory,
			hiddenRowCount: rows.length - filteredRows.length,
			matchType,
			removeFilter,
			removeAllFilters,
			setFilterCategories,
			setMatchType,
			totalRowCount: rows.length,
			updateFilterRelationship,
			updateFilterValues,
			updateTextFilterValue,
		}),
		[
			addFilter,
			filterCategories,
			filteredRows,
			filters,
			getFilter,
			getFilterOrThrow,
			getPropertyNameToDisplay,
			getOptionsForFilterCategory,
			matchType,
			removeFilter,
			removeAllFilters,
			rows.length,
			updateFilterRelationship,
			updateFilterValues,
			updateTextFilterValue,
		],
	);

	return (
		<context.Provider value={value}>
			<filteredRowsContext.Provider value={filteredRows}>
				{children}
			</filteredRowsContext.Provider>
		</context.Provider>
	);
}

/**
 * Note: We don't have the user's data at instantiation time, so we can't instantiate the context with the right type.
 *
 * To get around this, we instantiate it with a less specific type and keep a reference to it by capturing it in a closure.
 *
 * We give the caller a reference to the context, and we use validation logic inside of `useFilters` to confirm that
 * they have, in fact, provided a non-null value.
 *
 * This way, we have a guarantee that `useFilters` will return the correct type, even though we don't know the shape of
 * the user's data upfront.
 */
const createFiltersContext = <T extends Row>() => {
	const filtersContext = createContext<FiltersContextType<T> | null>(null);
	const filteredRowsContext = createContext<T[] | null>(null);

	const useFilters = (): FiltersContextType<T> => {
		// `context` is caught in the closure of `useFilters`, so we keep a reference to it,
		// allowing us to not specify its final type at instantiation time and let the user
		const contextValue = useContext(filtersContext);

		if (!contextValue) {
			throw new Error("useFilters must be used within a FiltersProvider");
		}

		return contextValue;
	};

	const useFilteredRows = (): T[] => {
		const filteredRows = useContext(filteredRowsContext);
		if (!filteredRows) {
			throw new Error("useFilteredRows must be used within a FiltersProvider");
		}
		return filteredRows;
	};

	return {
		useFilters,
		useFilteredRows,
		filtersContext,
		filteredRowsContext,
	} as const;
};

export default createFiltersContext;
