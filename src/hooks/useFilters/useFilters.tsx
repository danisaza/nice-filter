import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type { UseStateSetter } from "@/utils";
import { MATCH_TYPES, RELATIONSHIP_TYPES, RELATIONSHIPS } from "./constants";
import { filterRowByMatchType } from "./filtering-functions";
import type {
	ComboboxOption,
	FilterOption,
	MatchType,
	Predicate,
	Relationship,
	TAppliedFilter,
} from "./types";
import { getNewRelationship } from "./utils";

type FilterValueUpdate =
	| ComboboxOption[]
	| ((values: ComboboxOption[]) => ComboboxOption[]);

type FiltersContextType<T> = {
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
	updateFilterRelationship: (
		filterId: string,
		relationship: Relationship,
	) => void;
	updateFilterValues: (
		filterId: string,
		filterValueUpdate: FilterValueUpdate,
	) => void;
};

type FiltersProviderProps<T> = {
	children: ReactNode;
	predicate: Predicate<T>;
	rows: T[];
	context: React.Context<FiltersContextType<T> | null>;
};

export function FiltersProvider<T>({
	children,
	predicate,
	rows,
	context,
}: FiltersProviderProps<T>) {
	const [filters, setFilters] = useState<TAppliedFilter[]>([]);
	const [matchType, setMatchType] = useState<MatchType>(MATCH_TYPES.ANY);
	const [filterCategories, setFilterCategories] = useState<FilterOption<T>[]>(
		[],
	);

	const filteredRows = useMemo(() => {
		return rows.filter((row) =>
			filterRowByMatchType(row, filters, predicate, matchType),
		);
	}, [filters, predicate, matchType, rows]);

	const addFilter = useCallback(
		({
			id,
			categoryId,
			options,
			propertyNameSingular,
			propertyNamePlural,
			selectionType,
			values,
		}: Omit<TAppliedFilter, "relationship" | "createdAt">) => {
			const newFilter: TAppliedFilter = {
				id,
				createdAt: Date.now(),
				categoryId,
				options,
				propertyNameSingular,
				propertyNamePlural,
				selectionType,
				values,
				relationship:
					selectionType === RELATIONSHIP_TYPES.RADIO
						? RELATIONSHIPS.IS
						: RELATIONSHIPS.INCLUDE,
			};
			setFilters((prev) => [...prev, newFilter]);
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

					return {
						...f,
						values: newValues,
						relationship: getNewRelationship(f, newValues),
					};
				}),
			);
		},
		[],
	);

	// use this for manual relationship updates (e.g. switch from "is" to "is not")
	const updateFilterRelationship = useCallback(
		(filterId: string, relationship: Relationship) => {
			setFilters((prev) =>
				prev.map((f) =>
					f.id !== filterId
						? f
						: {
								...f,
								relationship,
							},
				),
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
			return filter.selectionType === RELATIONSHIP_TYPES.RADIO
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

	return <context.Provider value={value}>{children}</context.Provider>;
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
const createFiltersContext = <T,>() => {
	const context = createContext<FiltersContextType<T> | null>(null);

	const useFilters = (): FiltersContextType<T> => {
		// `context` is caught in the closure of `useFilters`, so we keep a reference to it,
		// allowing us to not specify its final type at instantiation time and let the user
		const contextValue = useContext(context);

		if (!contextValue) {
			throw new Error("useFilters must be used within a FiltersProvider");
		}

		return contextValue;
	};

	return [useFilters, context] as const;
};

export default createFiltersContext;
