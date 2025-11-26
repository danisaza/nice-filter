import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type { UseStateSetter } from "@/utils";
import {
	CHECKBOX_SELECTION_OPERATORS,
	MATCH_TYPES,
	OPERATORS,
	RADIO_SELECTION_OPERATORS,
	SELECTION_TYPES,
} from "./constants";
import { filterRowByMatchType } from "./filtering-functions";
import type {
	CheckboxOperator,
	ComboboxOption,
	FilterOption,
	MatchType,
	Operator,
	RadioOperator,
	Row,
	TAppliedFilter,
} from "./types";
import { updateFilterValueAndRelationship } from "./utils";

type FilterValueUpdate =
	| ComboboxOption[]
	| ((values: ComboboxOption[]) => ComboboxOption[]);

type FiltersContextType<T extends Row> = {
	addFilter: (
		filter: Omit<TAppliedFilter, "relationship" | "createdAt">,
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
};

type FiltersProviderProps<T extends Row> = {
	children: ReactNode;
	rows: T[];
	context: React.Context<FiltersContextType<T> | null>;
	filteredRowsContext: React.Context<T[]>;
};

export function FiltersProvider<T extends Row>({
	children,
	rows,
	context,
	filteredRowsContext,
}: FiltersProviderProps<T>) {
	const [filters, setFilters] = useState<TAppliedFilter[]>([]);
	//              ^?
	const [matchType, setMatchType] = useState<MatchType>(MATCH_TYPES.ANY);
	const [filterCategories, setFilterCategories] = useState<FilterOption<T>[]>(
		[],
	);

	// TODO: There are a ton of performance improvements you could make around memoizing these checks
	const filteredRows = useMemo(() => {
		return rows.filter((row) => filterRowByMatchType(row, filters, matchType));
	}, [filters, matchType, rows]);

	const addFilter = useCallback(
		({
			id,
			categoryId,
			options,
			propertyNameSingular,
			propertyNamePlural,
			selectionType,
			values,
		}: Omit<TAppliedFilter, "createdAt" | "relationship">) => {
			const newFilter = {
				id,
				createdAt: Date.now(),
				categoryId,
				options,
				values,
			};

			if (selectionType === SELECTION_TYPES.RADIO) {
				if (!propertyNameSingular) {
					throw new Error("propertyNameSingular is required for radio filters");
				}
				const radioValues = {
					propertyNameSingular: propertyNameSingular,
					propertyNamePlural: undefined,
					selectionType: SELECTION_TYPES.RADIO,
					relationship: OPERATORS.IS,
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
				const checkboxValues = {
					propertyNameSingular: undefined,
					propertyNamePlural: propertyNamePlural,
					selectionType: SELECTION_TYPES.CHECKBOXES,
					relationship: OPERATORS.INCLUDE,
				};
				setFilters((prev) => [...prev, { ...newFilter, ...checkboxValues }]);
				return;
			}

			throw new Error(`Got invalid selection type: ${selectionType}`);
		},
		[],
	);

	const removeFilter = useCallback((filterId: string) => {
		setFilters((prev) => prev.filter((f) => f.id !== filterId));
	}, []);

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

					return updateFilterValueAndRelationship(f, newValues);
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
			if (!Object.keys(optionsByFilterCategoryId).includes(filterCategoryId)) {
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
			return filter.selectionType === SELECTION_TYPES.RADIO
				? filter.propertyNameSingular
				: filter.propertyNamePlural;
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
