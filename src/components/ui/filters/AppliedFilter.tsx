import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { X } from "lucide-react";
import { memo } from "react";
import { useFilters } from "@/App.tsx";
import FilterDropdownSubCategory from "@/components/ui/filters/FilterDropdownSubCategory";
import {
	CHECKBOX_SELECTION_OPERATORS,
	RADIO_SELECTION_OPERATORS,
	SELECTION_TYPES,
} from "@/hooks/useFilters/constants";
import type { Operator, TAppliedFilter } from "@/hooks/useFilters/types";

const dropdownMenuContentClassNames =
	"border border-slate-300 min-w-[220px] bg-white rounded-md p-1 shadow-lg animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2";

const AppliedFilter = memo(({ filter }: { filter: TAppliedFilter }) => {
	const { getPropertyNameToDisplay } = useFilters();
	const propertyNameToDisplay = getPropertyNameToDisplay(filter.id);

	return (
		<fieldset
			name={`${propertyNameToDisplay} filter`}
			className="border border-slate-300 text-slate-900 rounded inline-flex items-center h-9"
		>
			<Left propertyNameToDisplay={propertyNameToDisplay} />
			<Middle filter={filter} />
			<Right filter={filter} />
			<Remove filterId={filter.id} />
		</fieldset>
	);
});

const Left = ({ propertyNameToDisplay }: { propertyNameToDisplay: string }) => {
	return (
		<span className="px-2 rounded-tl rounded-bl border-r border-slate-200 h-full flex items-center">
			{propertyNameToDisplay}
		</span>
	);
};

const Middle = ({ filter }: { filter: TAppliedFilter }) => {
	const { updateFilterRelationship } = useFilters();

	const { selectionType, values } = filter;

	// Get the relationship options based on the number of values
	let relationshipOptions: readonly Operator[];
	const relationshipOptionsByNumValues =
		selectionType === SELECTION_TYPES.RADIO
			? RADIO_SELECTION_OPERATORS
			: CHECKBOX_SELECTION_OPERATORS;
	if (values.length === 1) {
		relationshipOptions = relationshipOptionsByNumValues.ONE;
	} else {
		relationshipOptions = relationshipOptionsByNumValues.MANY;
	}
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button
					type="button"
					className="h-full px-2 whitespace-nowrap border-r border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
					aria-label={`Filter relationship`}
				>
					{filter.relationship}
				</button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className={dropdownMenuContentClassNames}
					sideOffset={5}
				>
					<DropdownMenu.RadioGroup
						value={filter.relationship}
						onValueChange={(option) => {
							// validate that this is a valid relationship option
							if (!relationshipOptions.includes(option as Operator)) {
								console.error(`Invalid relationship option: ${option}`);
								return;
							}
							updateFilterRelationship(filter.id, option as Operator);
						}}
					>
						{relationshipOptions.map((relationshipOption) => (
							<DropdownMenu.RadioItem
								className="text-nowrap relative flex items-center px-2 py-1.5 outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
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
	);
};

const Right = ({ filter }: { filter: TAppliedFilter }) => {
	const { filterCategories } = useFilters();
	const { selectionType, propertyNameSingular, propertyNamePlural, values } =
		filter;
	const category = filterCategories.find((c) => c.id === filter.categoryId);
	if (!category) {
		console.error("Category not found");
		return null;
	}
	const propertyNameToDisplay =
		selectionType === SELECTION_TYPES.RADIO
			? propertyNameSingular
			: propertyNamePlural;

	const selectedOptionsLabel =
		values.length > 0 ? values.map((v) => v.label).join(", ") : "...";

	return (
		<DropdownMenu.Root modal={false}>
			<DropdownMenu.Trigger asChild>
				<button
					type="button"
					className="h-full px-2 whitespace-nowrap cursor-pointer border-r border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
					aria-label={`Filter by ${propertyNameToDisplay}`}
				>
					{selectedOptionsLabel}
				</button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					align="start"
					sideOffset={5}
					className="border shadow-md border-gray-300 min-w-[220px] rounded-md bg-white p-[5px] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
				>
					<FilterDropdownSubCategory
						standalone
						key={`applied-filter-subcategory-${filter.id}`}
						categoryId={category.id}
						filterId={filter.id}
					/>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
};

// not memoizing this component because it's already so cheap to render
const Remove = ({ filterId }: { filterId: string }) => {
	const { removeFilter } = useFilters();
	return (
		<button
			type="button"
			className="h-full px-2 rounded-tr rounded-br text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
			onClick={() => removeFilter(filterId)}
			aria-label={`Remove filter`}
		>
			<X className="w-4 h-4" aria-hidden="true" />
		</button>
	);
};

export default AppliedFilter;
