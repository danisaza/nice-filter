import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ListFilter } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import useFilters, { Option, RELATIONSHIP_TYPES, RelationshipType, MATCH_TYPES } from "@/hooks/useFilters";
import { cn } from "@/lib/utils";
import AppliedFilter from "@/components/ui/filters/AppliedFilter";

export type FilterOption = {
    id: string;
    selectionType: RelationshipType;
    propertyNameSingular: string;               // e.g. "status"
    propertyNamePlural: string;                 // e.g. "statuses"
    options: Option[];
}

export default function Filters({ filterCategories }: { filterCategories: FilterOption[] }) {
    const { filters, addFilter, updateFilterValues, matchType, setMatchType } = useFilters();
    const [selectedCategory, setSelectedCategory] = useState<Option | null>(null);
    const [open, setOpen] = useState(false);

    const selectedFilter = filters.find(f => f.id === selectedCategory?.id);

    const numAppliedFilters = filters.length;

    const availableFilterCategories = filterCategories
        .filter(f => !filters.some(filter => filter.id === f.id))
        .map(f => {
            const name = f.selectionType === RELATIONSHIP_TYPES.RADIO ? f.propertyNameSingular : f.propertyNamePlural;
            const titleCaseName = name.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
            return {
                id: f.id,
                label: titleCaseName,
                value: name,
            }
        });
    const filterOptions = filterCategories.reduce((acc, f) => ({
        ...acc,
        [f.id]: f.options,
    }), {} as Record<string, Option[]>);

    const handleCategorySelect = (category: Option) => {
        setSelectedCategory(category);
    };

    const getFilterOptions = (category: Option) => {
        return filterOptions[category.id as keyof typeof filterOptions];
    };

    const handleValueSelect = (value: Option) => {
        // Is there already a filter for this value?
        const activeFilter = filters.find(f => f.id === selectedCategory?.id);
        if (activeFilter) {
            const prevValues = activeFilter.values;
            const newValues = prevValues.includes(value)
                ? prevValues.filter(v => v !== value)
                : [...prevValues, value];
            updateFilterValues(activeFilter.id, newValues);
        } else {
            if (!selectedCategory) {
                console.error("Selected category is null");
                return;
            }
            const filterOption = filterCategories.find(f => f.id === selectedCategory.id);
            if (!filterOption) {
                console.error("Filter option not found");
                return;
            }
            const newFilter = {
                id: selectedCategory.id,
                selectionType: filterOption.selectionType,
                propertyNameSingular: filterOption.propertyNameSingular,
                propertyNamePlural: filterOption.propertyNamePlural,
                options: filterOption.options,
                values: [value],
            }
            addFilter(newFilter);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        setSelectedCategory(null);
    };

    return (
        <div className="flex gap-2 items-center flex-wrap">
            {filters.map((filter) => {
                return (
                    <AppliedFilter
                        key={filter.id}
                        id={filter.id}
                    />
                )
            })}
            <Popover.Root open={open} onOpenChange={handleOpenChange}>
                <Popover.Portal>
                    <Popover.Content
                        className="w-[260px] rounded bg-white p-5 shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] will-change-[transform,opacity] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.violet7)] data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=top]:animate-slideDownAndFade"
                        sideOffset={5}
                    >
                        <Command shouldFilter={true}>
                            <CommandInput
                                placeholder={selectedCategory ? `Search ${selectedCategory.label}...` : "Search categories..."}
                                className="[&_svg]:hidden"
                            />
                            <CommandList>
                                <CommandEmpty>{availableFilterCategories.length === 0 ? "All possible filters are already applied." : "No results found."}</CommandEmpty>
                                <CommandGroup>
                                    {!selectedCategory ? availableFilterCategories.map((category) => (
                                        <CommandItem
                                            key={category.value}
                                            value={category.label}
                                            onSelect={() => handleCategorySelect(category)}
                                            className="cursor-pointer"
                                        >
                                            {category.label}
                                        </CommandItem>
                                    )) : (
                                        getFilterOptions(selectedCategory).map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                onSelect={() => handleValueSelect(option)}
                                            >
                                                <div className="flex items-center">
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            (selectedFilter?.values ?? []).includes(option) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {option.label}
                                                </div>
                                            </CommandItem>
                                        ))
                                    )}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                        <Popover.Arrow className="fill-white" />
                    </Popover.Content>
                </Popover.Portal>
                <Popover.Trigger asChild>
                    <Button variant="ghost">
                        <ListFilter className="w-4 h-4" /> Filter
                    </Button>
                </Popover.Trigger>
            </Popover.Root>
            {numAppliedFilters > 1 ? <Button variant="outline" onClick={() => {
                setMatchType(currMatchType => currMatchType === MATCH_TYPES.ANY ? MATCH_TYPES.ALL : MATCH_TYPES.ANY);
            }}>
                {matchType === MATCH_TYPES.ANY ? "Match any filter" : "Match all filters"}
            </Button>
                : null}
        </div>
    );
}
