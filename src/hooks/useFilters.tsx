import { createContext, type ReactNode, useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { UseStateSetter } from "@/utils";
import type {
	ComboboxOption,
	FilterOption,
	MatchType,
	Relationship,
	RelationshipType,
	TAppliedFilter,
} from "./constants";
import {
	CHECKBOX_SELECTION_RELATIONSHIPS,
	MATCH_TYPES,
	RADIO_SELECTION_RELATIONSHIPS,
	RELATIONSHIP_TYPES,
	RELATIONSHIPS,
} from "./constants";

export function getRelationshipOptions(selectionType: RelationshipType) {
	return selectionType === RELATIONSHIP_TYPES.RADIO
		? RADIO_SELECTION_RELATIONSHIPS
		: CHECKBOX_SELECTION_RELATIONSHIPS;
}

type FilterValueUpdate =
	| ComboboxOption[]
	| ((values: ComboboxOption[]) => ComboboxOption[]);

type FiltersContextType = {
	addFilter: (filter: Omit<TAppliedFilter, "relationship">) => void;
	filters: TAppliedFilter[];
	filterCategories: FilterOption[];
	getFilter: (filterId: string) => TAppliedFilter | undefined;
	getFilterOrThrow: (filterId: string) => TAppliedFilter;
	getOptionsForFilterCategory: (filterCategoryId: string) => ComboboxOption[];
	matchType: MatchType;
	nextFilterId: string;
	removeAllFilters: () => void;
	removeFilter: (filterId: string) => void;
	rotateNextFilterId: () => void;
	setFilterCategories: UseStateSetter<FilterOption[]>;
	setMatchType: UseStateSetter<MatchType>;
	updateFilterRelationship: (
		filterId: string,
		relationship: Relationship,
	) => void;
	updateFilterValues: (
		filterId: string,
		filterValueUpdate: FilterValueUpdate,
	) => void;
};

const FiltersContext = createContext<FiltersContextType | null>(null);

function getNewRelationship(
	filter: TAppliedFilter,
	newValues: ComboboxOption[],
): Relationship {
	if (filter.values.length === newValues.length) {
		return filter.relationship;
	}

	const newlyAppliedFilter = filter.values.length === 0;

	if (newlyAppliedFilter) {
		return newValues.length === 1 ? RELATIONSHIPS.IS : RELATIONSHIPS.IS_ANY_OF;
	}

	if (newValues.length === 1) {
		// Finds the new relationship based on the previous relationship when downsizing from N to 1 selected value
		const downsizingMap = {
			[RELATIONSHIPS.INCLUDE_ALL_OF]: RELATIONSHIPS.INCLUDE,
			[RELATIONSHIPS.INCLUDE_ANY_OF]: RELATIONSHIPS.INCLUDE,
			[RELATIONSHIPS.EXCLUDE_IF_ANY_OF]: RELATIONSHIPS.DO_NOT_INCLUDE,
			[RELATIONSHIPS.EXCLUDE_IF_ALL]: RELATIONSHIPS.DO_NOT_INCLUDE,
			[RELATIONSHIPS.IS_ANY_OF]: RELATIONSHIPS.IS,
			[RELATIONSHIPS.IS_NOT]: RELATIONSHIPS.IS_NOT,
			// -----------------
			// We don't expect these cases to happen, but just coding defensively here...
			[RELATIONSHIPS.IS]: RELATIONSHIPS.IS,
			[RELATIONSHIPS.INCLUDE]: RELATIONSHIPS.INCLUDE,
			[RELATIONSHIPS.DO_NOT_INCLUDE]: RELATIONSHIPS.IS_NOT,
		};
		return downsizingMap[filter.relationship];
	}

	if (newValues.length > 1) {
		// Finds the new relationship based on the previous relationship when upsizing from 1 to N selected values
		const upsizingMap: Record<Relationship, Relationship> = {
			[RELATIONSHIPS.IS]: RELATIONSHIPS.IS_ANY_OF,
			[RELATIONSHIPS.IS_NOT]: RELATIONSHIPS.IS_NOT,
			[RELATIONSHIPS.INCLUDE]: RELATIONSHIPS.INCLUDE_ALL_OF,
			[RELATIONSHIPS.DO_NOT_INCLUDE]: RELATIONSHIPS.EXCLUDE_IF_ANY_OF,
			// -----------------
			// We don't expect these cases to happen, but just coding defensively here...
			[RELATIONSHIPS.IS_ANY_OF]: RELATIONSHIPS.IS_ANY_OF,
			[RELATIONSHIPS.EXCLUDE_IF_ANY_OF]: RELATIONSHIPS.EXCLUDE_IF_ANY_OF,
			[RELATIONSHIPS.INCLUDE_ALL_OF]: RELATIONSHIPS.INCLUDE_ALL_OF,
			[RELATIONSHIPS.INCLUDE_ANY_OF]: RELATIONSHIPS.INCLUDE_ANY_OF,
			[RELATIONSHIPS.EXCLUDE_IF_ALL]: RELATIONSHIPS.EXCLUDE_IF_ALL,
		};
		return upsizingMap[filter.relationship];
	}

	return filter.relationship;
}

export function FiltersProvider({ children }: { children: ReactNode }) {
	// nextFilterId is the ID for the filter that is "under construction", if any
	const [nextFilterId, setNextFilterId] = useState<string>(() => uuidv4());
	const [filters, setFilters] = useState<TAppliedFilter[]>([]);
	const [matchType, setMatchType] = useState<MatchType>(MATCH_TYPES.ANY);
	const [filterCategories, setFilterCategories] = useState<FilterOption[]>([]);

	const rotateNextFilterId = () => setNextFilterId(uuidv4());

	const addFilter = ({
		id,
		categoryId,
		options,
		propertyNameSingular,
		propertyNamePlural,
		selectionType,
		values,
	}: Omit<TAppliedFilter, "relationship">) => {
		const newFilter: TAppliedFilter = {
			id,
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
	};

	const removeFilter = (filterId: string) => {
		setFilters((prev) => prev.filter((f) => f.id !== filterId));
	};

	const removeAllFilters = () => {
		setFilters([]);
	};

	// TODO: this is a mess; create a separate useEffect to update the relationship
	const updateFilterValues = (
		filterId: string,
		filterValueUpdate: FilterValueUpdate,
	) => {
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
	};

	// We can keep this method for manual relationship updates
	const updateFilterRelationship = (
		filterId: string,
		relationship: Relationship,
	) => {
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
	};

	const getFilter = (filterId: string) => {
		return filters.find((f) => f.id === filterId);
	};

	const getFilterOrThrow = (filterId: string) => {
		const result = getFilter(filterId);
		if (!result) {
			throw new Error(`Filter not found: ${filterId}`);
		}
		return result;
	};

	const optionsByFilterCategoryId = filterCategories.reduce(
		(acc, f) => {
			acc[f.id] = f.options;
			return acc;
		},
		{} as Record<string, ComboboxOption[]>,
	);

	const getOptionsForFilterCategory = (filterCategoryId: string) => {
		if (!Object.keys(optionsByFilterCategoryId).includes(filterCategoryId)) {
			throw new Error(
				`The provided id does not match any of the filter categories: ${filterCategoryId}`,
			);
		}
		return optionsByFilterCategoryId[filterCategoryId];
	};

	const value: FiltersContextType = {
		addFilter,
		filterCategories,
		filters,
		getFilter,
		getFilterOrThrow,
		getOptionsForFilterCategory,
		matchType,
		nextFilterId,
		removeFilter,
		removeAllFilters,
		rotateNextFilterId,
		setFilterCategories,
		setMatchType,
		updateFilterRelationship,
		updateFilterValues,
	};

	return (
		<FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
	);
}

// FUTURE IMPROVEMENTS:
// --------------------
// This hook could eventually take a `fetchFilterCategories` function as an argument and handle the
// data-fetching on behalf of the caller, using something like react-query to handle the caching and state management.
//
// For now, I'll just let the caller handle the data-fetching.
//
// ---
// Also, note that this hook currently assumes that all of the filter categories can be provided at once.
// This assumption may not hold in situations where a filter could take on a large number of values - like a task
// management system with hundreds of possible task owners.
//
// In cases like that, it would be sensible to allow the caller to provide a function that fetches all of the owners
// that the tasks could be filtered by, in a paginated way. (to follow the above example)
export default function useFilters() {
	const context = useContext(FiltersContext);
	if (!context) {
		throw new Error("useFilters must be used within a FiltersProvider");
	}

	return context;
}
