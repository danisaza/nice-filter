import { CHECKBOX_SELECTION_RELATIONSHIPS, RADIO_SELECTION_RELATIONSHIPS, Relationship, RELATIONSHIP_TYPES } from "@/hooks/useFilters";

import useFilters from "@/hooks/useFilters";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react";

const dropdownMenuContentClassNames = "border border-slate-300 min-w-[220px] bg-white rounded-md p-1 shadow-lg animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2"

export default function AppliedFilter({ id }: { id: string }) {
    const { getFilter, updateFilterRelationship, updateFilterValues, removeFilter } = useFilters();
    const filter = getFilter(id);
    if (!filter) {
        console.error(`Filter not found: ${id}`);
        return null;
    }
    const { selectionType, propertyNameSingular, propertyNamePlural, options, values } = filter;
    const propertyNameToDisplay = selectionType === RELATIONSHIP_TYPES.RADIO ? propertyNameSingular : propertyNamePlural;

    // Get the relationship options based on the number of values
    let relationshipOptions: readonly Relationship[];
    const relationshipOptionsByNumValues = selectionType === RELATIONSHIP_TYPES.RADIO ? RADIO_SELECTION_RELATIONSHIPS : CHECKBOX_SELECTION_RELATIONSHIPS;
    if (values.length === 1) {
        relationshipOptions = relationshipOptionsByNumValues["ONE"];
    } else {
        relationshipOptions = relationshipOptionsByNumValues["MANY"];
    }

    const handleValueChange = (value: string) => {
        const isAlreadySelected = values.some(v => v.value === value);
        if (isAlreadySelected) {
            updateFilterValues(id, (prevValues) => prevValues.filter(v => v.value !== value));
            return;
        }

        const newValue = options.find(o => o.value === value) ?? null;
        if (!newValue) {
            console.error(`Value not found in options: ${value}`);
            return;
        }
        updateFilterValues(id, (prevValues) => [...prevValues, newValue]);
    }

    const selectedOptionsLabel = values.length > 0 ? values.map(v => v.label).join(", ") : "...";


    return (
        <div className="border border-slate-300 text-slate-900 rounded inline-flex items-center h-9">
            <span className="px-2 rounded-tl rounded-bl border-r border-slate-200 h-full flex items-center">{propertyNameToDisplay}</span>
            <DropdownMenu.Root>
                <div className="h-full border-r border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900">
                    <DropdownMenu.Trigger asChild>
                        <button className="h-full px-2" aria-label={`Filter by ${propertyNameToDisplay}`}>
                            {filter.relationship}
                        </button>
                    </DropdownMenu.Trigger>
                </div>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className={dropdownMenuContentClassNames}
                        sideOffset={5}
                    >
                        <DropdownMenu.RadioGroup value={filter.relationship} onValueChange={(option) => {
                            // validate that x is a valid relationship option
                            if (!relationshipOptions.includes(option as Relationship)) {
                                console.error(`Invalid relationship option: ${option}`);
                                return;
                            }
                            updateFilterRelationship(id, option as Relationship)
                        }}>
                            {relationshipOptions.map(relationshipOption => (
                                <DropdownMenu.RadioItem
                                    className="relative flex items-center px-2 py-1.5 outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                    key={relationshipOption}
                                    value={relationshipOption}
                                >
                                    {relationshipOption}
                                </DropdownMenu.RadioItem>
                            ))}
                        </DropdownMenu.RadioGroup>

                        <DropdownMenu.Arrow className="fill-white" />
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <div className="h-full border-r border-slate-200 hover:bg-slate-100">
                        <button className="h-full px-2" aria-label={`Filter by ${propertyNameToDisplay}`}>
                            {selectedOptionsLabel}
                        </button>
                    </div>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className={dropdownMenuContentClassNames}
                        sideOffset={5}
                    >
                        {options.map(p => (
                            <DropdownMenu.CheckboxItem
                                key={p.value}
                                className="relative flex items-center px-2 py-1.5 outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                checked={values.some(v => v.value === p.value)}
                                onCheckedChange={() => handleValueChange(p.value)}
                            >
                                <div className="flex items-center gap-2">
                                    <Checkbox id={p.value} checked={values.some(v => v.value === p.value)} />
                                    <label htmlFor={p.value} className="text-slate-900">{p.label}</label>
                                </div>
                            </DropdownMenu.CheckboxItem>
                        ))}

                        <DropdownMenu.Arrow className="fill-white" />
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <button className="h-full px-2 rounded-tr rounded-br text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center" onClick={() => removeFilter(id)}>
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
