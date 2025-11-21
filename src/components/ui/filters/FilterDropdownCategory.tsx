import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import * as React from "react";
import FilterDropdownSubCategory from "@/components/ui/filters/FilterDropdownSubCategory";
import type { ComboboxOption } from "@/hooks/constants";

type FilterDropdownCategoryProps = {
	after: number;
	category: ComboboxOption;
	onKeyDown?: React.KeyboardEventHandler<HTMLDivElement> | undefined;
	triggerText: string;
};

const FilterDropdownCategory = React.forwardRef<
	HTMLDivElement,
	FilterDropdownCategoryProps
>(function FilterDropdownCategory(
	props: FilterDropdownCategoryProps,
	forwardedRef,
) {
	return (
		<DropdownMenu.Sub {...props}>
			<DropdownMenu.SubTrigger
				ref={forwardedRef}
				onKeyDown={props.onKeyDown}
				className="h-10 relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[highlighted]:bg-accent data-highlighted:data-[state=open]:bg-accent data-[state=open]:bg-accent/70 data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 data-[highlighted]:text-accent-foreground data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
			>
				{props.triggerText}
				<div className="ml-auto pl-5 text-mauve11 group-data-[disabled]:text-mauve8 group-data-[highlighted]:text-white">
					<ChevronRightIcon />
				</div>
			</DropdownMenu.SubTrigger>
			<DropdownMenu.Portal>
				<DropdownMenu.SubContent
					className="border shadow-md border-gray-300 min-w-[220px] rounded-md bg-white p-[5px] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
					sideOffset={-3}
					alignOffset={0}
				>
					<FilterDropdownSubCategory
						after={props.after}
						key={`filter-builder-subcategory-${props.category.id}`}
						categoryId={props.category.id}
						standalone={false}
					/>
				</DropdownMenu.SubContent>
			</DropdownMenu.Portal>
		</DropdownMenu.Sub>
	);
});

export default FilterDropdownCategory;
