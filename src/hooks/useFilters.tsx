import { createContext, ReactNode, useContext, useState } from "react";

export type Option = {
    id: string;
    label: string;
    value: string;
}

export const RELATIONSHIPS = {
    IS: "is",
    IS_NOT: "is not",
    INCLUDE: "include",
    IS_ANY_OF: "is any of",
    EXCLUDE_IF_ANY_OF: "exclude if any of",
    INCLUDE_ALL_OF: "include all of",
    DO_NOT_INCLUDE: "do not include",
    INCLUDE_ANY_OF: "include any of",
    EXCLUDE_IF_ALL: "exclude if all",
} as const;

export const RELATIONSHIP_TYPES = {
    RADIO: "radio",
    CHECKBOXES: "checkboxes",
} as const;

export type RelationshipType = typeof RELATIONSHIP_TYPES[keyof typeof RELATIONSHIP_TYPES];

// For fields like "status" where a row can only have one value
export const RADIO_SELECTION_RELATIONSHIPS = {
    ONE: [RELATIONSHIPS.IS, RELATIONSHIPS.IS_NOT],                // ONE TO ONE
    MANY: [RELATIONSHIPS.IS_ANY_OF, RELATIONSHIPS.IS_NOT],        // ONE TO MANY
} as const;

// For fields like "tags" where a row can have multiple values
export const CHECKBOX_SELECTION_RELATIONSHIPS = {
    ONE: [RELATIONSHIPS.INCLUDE, RELATIONSHIPS.DO_NOT_INCLUDE], // MANY TO ONE
    MANY: [                             // MANY TO MANY
        RELATIONSHIPS.INCLUDE_ALL_OF,
        RELATIONSHIPS.INCLUDE_ANY_OF,
        RELATIONSHIPS.EXCLUDE_IF_ANY_OF,
        RELATIONSHIPS.EXCLUDE_IF_ALL,
    ],
} as const;

export type Relationship = typeof RELATIONSHIPS[keyof typeof RELATIONSHIPS];

export type TAppliedFilter = {
    id: string;
    selectionType: RelationshipType;
    propertyNameSingular: string;
    propertyNamePlural: string;
    options: Option[];
    values: Option[];
    relationship: Relationship;
};

export function getRelationshipOptions(selectionType: RelationshipType) {
    return selectionType === RELATIONSHIP_TYPES.RADIO
        ? RADIO_SELECTION_RELATIONSHIPS
        : CHECKBOX_SELECTION_RELATIONSHIPS;
}

type FilterValueUpdate = Option[] | ((values: Option[]) => Option[]);

type FiltersContextType = {
    filters: TAppliedFilter[];
    addFilter: (filter: Omit<TAppliedFilter, "relationship">) => void;
    removeFilter: (filterId: string) => void;
    updateFilterValues: (filterId: string, filterValueUpdate: FilterValueUpdate) => void;
    updateFilterRelationship: (filterId: string, relationship: Relationship) => void;
    getFilter: (filterId: string) => TAppliedFilter | undefined;
    matchType: MatchType;
    setMatchType: React.Dispatch<React.SetStateAction<MatchType>>;
    removeAllFilters: () => void;
}

const FiltersContext = createContext<FiltersContextType | null>(null);

function getNewRelationship(filter: TAppliedFilter, newValues: Option[]): Relationship {
    if (filter.values.length === newValues.length) {
        return filter.relationship;
    }

    const newlyAppliedFilter = filter.values.length === 0;

    if (newlyAppliedFilter) {
        return newValues.length === 1
            ? RELATIONSHIPS.IS
            : RELATIONSHIPS.IS_ANY_OF;
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
        }
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
        }
        return upsizingMap[filter.relationship];
    }

    return filter.relationship;
}

export const MATCH_TYPES = {
    ANY: "any",
    ALL: "all",
} as const;

export type MatchType = typeof MATCH_TYPES[keyof typeof MATCH_TYPES];

export function FiltersProvider({ children }: { children: ReactNode }) {
    const [filters, setFilters] = useState<TAppliedFilter[]>([]);
    const [matchType, setMatchType] = useState<MatchType>(MATCH_TYPES.ANY);

    const addFilter = ({
        id,
        options,
        propertyNameSingular,
        propertyNamePlural,
        selectionType,
        values
    }: Omit<TAppliedFilter, "relationship">) => {
        const newFilter: TAppliedFilter = {
            id,
            options,
            propertyNameSingular,
            propertyNamePlural,
            selectionType,
            values,
            relationship: selectionType === RELATIONSHIP_TYPES.RADIO
                ? RELATIONSHIPS.IS
                : RELATIONSHIPS.INCLUDE
        }
        setFilters(prev => [...prev, newFilter]);
    }

    const removeFilter = (filterId: string) => {
        setFilters(prev => prev.filter(f => f.id !== filterId));
    }

    const removeAllFilters = () => {
        setFilters([]);
    }

    // TODO: this is a mess; create a separate useEffect to update the relationship
    const updateFilterValues = (filterId: string, filterValueUpdate: FilterValueUpdate) => {
        setFilters(prev => prev.map(f => {
            if (f.id !== filterId) return f;

            const newValues = typeof filterValueUpdate === "function"
                ? filterValueUpdate(f.values)
                : filterValueUpdate;

            return {
                ...f,
                values: newValues,
                relationship: getNewRelationship(f, newValues),
            };
        }));
    };

    // We can keep this method for manual relationship updates
    const updateFilterRelationship = (filterId: string, relationship: Relationship) => {
        setFilters(prev => prev.map(f => f.id !== filterId ? f : ({
            ...f,
            relationship
        })));
    };

    const getFilter = (filterId: string) => {
        return filters.find(f => f.id === filterId);
    }

    const value = {
        filters,
        addFilter,
        removeFilter,
        updateFilterValues,
        updateFilterRelationship,
        getFilter,
        matchType,
        setMatchType,
        removeAllFilters,
    };

    return (
        <FiltersContext.Provider value={value}>
            {children}
        </FiltersContext.Provider>
    )
}

export default function useFilters() {
    const context = useContext(FiltersContext);
    if (!context) {
        throw new Error("useFilters must be used within a FiltersProvider");
    }
    return context;
}
