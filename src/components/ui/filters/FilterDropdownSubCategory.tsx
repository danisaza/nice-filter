import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { forwardRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";
import type { ComboboxOption, TAppliedFilter } from "@/hooks/constants";
import useFilters from "@/hooks/useFilters";

// NOTE: standalone indicates that the subcategory is NOT being displayed in the filter-builder
//       (i.e. the user is updating an existing filter from an AppliedFilter dropdown)
type FilterDropdownSubCategoryProps = {
	categoryId: string;
} & (
	| { standalone: true; after?: undefined; filterId: string }
	| { standalone?: false; after: number; filterId?: undefined }
);

/**
 * Note that the user can use the FilterDropdown to create multiple filters at once (by selecting options in multiple
 * sub-categories). This means that there can be multiple new filters that are being created at once.
 *
 * This function can be used to fetch an "under construction" filter by its categoryId.
 *
 * To determine which filters are "under construction", we look at their `createdAt` timestamp relative to the `after`
 * cutoff, which is reset when the user opens or closes the FilterDropdown.
 */
function getNewFilterByCategoryId(
	after: number,
	categoryId: string,
	filters: TAppliedFilter[],
) {
	return filters.find(
		(f) => f.createdAt > after && f.categoryId === categoryId,
	);
}

const FilterDropdownSubCategory = forwardRef<
	HTMLDivElement,
	FilterDropdownSubCategoryProps
>(function FilterDropdownSubCategory(
	props: FilterDropdownSubCategoryProps,
	forwardedRef,
) {
	const { after, categoryId, filterId, standalone } = props;
	const {
		addFilter,
		filterCategories,
		filters,
		getFilter,
		getOptionsForFilterCategory,
		updateFilterValues,
	} = useFilters();
	if (!after && !standalone) {
		throw new Error("`after` prop is required when `standalone` is false");
	}
	console.log("[exp] standalone", standalone);
	const relevantFilter = standalone
		? getFilter(filterId)
		: getNewFilterByCategoryId(after, categoryId, filters);
	console.log("[exp] relevantFilter", relevantFilter);

	if (
		standalone &&
		relevantFilter &&
		relevantFilter.categoryId !== categoryId
	) {
		throw new Error(
			"Filter category and provided categoryId must match in standalone mode.",
		);
	}
	const handleValueSelected = (value: ComboboxOption) => {
		if (relevantFilter) {
			updateFilterValues(relevantFilter.id, (prevValues) => {
				const alreadySelected = prevValues.includes(value);
				return alreadySelected
					? prevValues.filter((v) => v !== value)
					: [...prevValues, value];
			});
			return;
		}
		if (!categoryId) {
			console.error("Selected category is null");
			return;
		}
		const filterOption = filterCategories.find((c) => c.id === categoryId);
		if (!filterOption) {
			console.error("Filter option not found");
			return;
		}
		const newFilter = {
			id: uuidv4(),
			categoryId,
			selectionType: filterOption.selectionType,
			propertyNameSingular: filterOption.propertyNameSingular,
			propertyNamePlural: filterOption.propertyNamePlural,
			options: filterOption.options,
			values: [value],
		};
		addFilter(newFilter);
	};
	const options = getOptionsForFilterCategory(categoryId);
	return (
		<div ref={forwardedRef}>
			{options.map((option) => {
				const isSelected =
					relevantFilter?.values?.some((o) => o.id === option.id) ?? false;
				return (
					<DropdownMenu.CheckboxItem
						key={option.id}
						checked={isSelected}
						textValue={option.label}
						onSelect={(e) => {
							e.preventDefault();
						}}
						onCheckedChange={() => {
							handleValueSelected(option);
						}}
						className="relative flex flex-col bg-white cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[highlighted]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 data-[highlighted]:text-accent-foreground data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
					>
						<div className="flex items-center gap-2 px-2 py-1 w-full">
							<Checkbox
								id={option.id}
								checked={isSelected}
								className="cursor-default pointer-events-none"
								aria-hidden="true"
							/>
							<span className="select-none flex-1">{option.label}</span>
						</div>
					</DropdownMenu.CheckboxItem>
				);
			})}
		</div>
	);
});

export default FilterDropdownSubCategory;
