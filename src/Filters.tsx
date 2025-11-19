import * as HoverCard from "@radix-ui/react-hover-card";
import { TriangleRightIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { Check, ListFilter } from "lucide-react";
import { forwardRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import useFilters from "@/hooks/useFilters";
import { cn } from "@/lib/utils";
import AppliedFilter from "./components/ui/filters/AppliedFilter";
import AppliedFilters from "./components/ui/filters/AppliedFilters";
import type { ComboboxOption } from "./hooks/constants";
import { MATCH_TYPES, RELATIONSHIP_TYPES } from "./hooks/constants";
import { FILTER_CATEGORIES } from "./hooks/filter-options-mock-data";
// import { FILTER_CATEGORIES } from "./hooks/filter-options-mock-data";

export default function Filters() {
	console.log("Filters was rendered");
	// const { filterCategories, setFilterCategories } = useFilters();

	// NOTE: This `useEffect` is populating the filter categories, which usually would involve fetching data from the
	//       server.
	//
	//       Also, a future improvement for the `useFilters` hook could be to take in a data-fetching function and do
	//       the data-fetching on behalf of the user, using something like react-query
	//       under the hood. (see `useFilter.tsx` for more notes on future improvements)
	// useEffect(() => {
	// 	if (filterCategories.length > 0) return;
	// 	setFilterCategories(FILTER_CATEGORIES);
	// });

	return (
		<div className="flex gap-2 items-center flex-wrap w-fit">
			<AppliedFilters />
			<NewFilter />
			<MatchTypeSwitcher />
		</div>
	);
}

function NewFilter() {
	console.log("NewFilter was rendered");
	const { nextFilterId, rotateNextFilterId } = useFilters();
	console.log("nextFilterId", nextFilterId);
	// const { filterCategories } = useFilters();
	const formattedFilterCategories: ComboboxOption[] = FILTER_CATEGORIES.map(
		(f) => {
			const name =
				f.selectionType === RELATIONSHIP_TYPES.RADIO
					? f.propertyNameSingular
					: f.propertyNamePlural;
			const titleCaseName = name
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ");
			return {
				id: f.id,
				label: titleCaseName,
				value: name,
			};
		},
	);
	return (
		<Popover.Root
			onOpenChange={(open) => {
				if (!open) {
					console.log("calling rotateNextFilterId");
					rotateNextFilterId();
				}
			}}
		>
			<Popover.Portal>
				<Popover.Content
					align="start"
					className="border border-gray-300 w-[260px] rounded bg-white shadow-md focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.violet7)] data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=top]:animate-slideDownAndFade"
					sideOffset={5}
				>
					<Command shouldFilter={true}>
						<CommandInput placeholder="Filter..." className="[&_svg]:hidden" />
						<CommandList>
							<CommandEmpty>{"No results found."}</CommandEmpty>
							<CommandGroup>
								{formattedFilterCategories.map((category) => (
									<FilterCategoryItem key={category.id} category={category} />
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</Popover.Content>
			</Popover.Portal>
			<Popover.Trigger asChild>
				<div className="flex gap-2 items-center">
					<AppliedFilter id={nextFilterId} />
					<Button
						variant="ghost"
						className="group cursor-default data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
					>
						<ListFilter className="w-4 h-4 group-hover:text-accent-foreground text-muted-foreground group-data-[state=open]:text-accent-foreground" />{" "}
						Filter
					</Button>
				</div>
			</Popover.Trigger>
		</Popover.Root>
	);
}

function MatchTypeSwitcher() {
	const { filters, matchType, setMatchType } = useFilters();
	const numAppliedFilters = filters.length;
	return (
		<>
			{numAppliedFilters > 1 ? (
				<Button
					variant="outline"
					onClick={() => {
						setMatchType((currMatchType) =>
							currMatchType === MATCH_TYPES.ANY
								? MATCH_TYPES.ALL
								: MATCH_TYPES.ANY,
						);
					}}
				>
					{matchType === MATCH_TYPES.ANY
						? "Match any filter"
						: "Match all filters"}
				</Button>
			) : null}
		</>
	);
}

type FilterCategoryItemProps = {
	category: ComboboxOption;
};

function FilterCategoryItem({ category }: FilterCategoryItemProps) {
	return (
		<HoverCard.Root openDelay={0} closeDelay={0}>
			<HoverCard.Trigger asChild>
				<FilterCategoryItemBody category={category} />
			</HoverCard.Trigger>
			<HoverCard.Portal>
				<HoverCard.Content side="right" sideOffset={-6} className="">
					<HoverCardContent categoryId={category.id} useNextFilterId={true} />
				</HoverCard.Content>
			</HoverCard.Portal>
		</HoverCard.Root>
	);
}

type FilterCategoryItemBodyProps = FilterCategoryItemProps;
// type FilterCategoryItemBodyProps = Pick<FilterCategoryItemProps, "category">;

const FilterCategoryItemBody = forwardRef<
	HTMLDivElement,
	FilterCategoryItemBodyProps
>(function FilterCategoryItemBody(
	props: FilterCategoryItemBodyProps,
	forwardedRef,
) {
	return (
		<CommandItem
			ref={forwardedRef}
			{...props}
			value={props.category.label}
			className="flex justify-between group items-center w-full"
		>
			<span className="truncate">{props.category.label}</span>
			<TriangleRightIcon className="text-muted-foreground group-hover:text-accent-foreground" />
		</CommandItem>
	);
});

export function HoverCardContent({
	categoryId,
	filterId,
	useNextFilterId,
	// handleValueSelected,
}: {
	categoryId: string;
	filterId?: string;
	useNextFilterId: boolean;
	// handleValueSelected: (value: ComboboxOption) => void;
}) {
	const {
		addFilter,
		filterCategories,
		filters,
		getOptionsForFilterCategory,
		nextFilterId,
		updateFilterValues,
	} = useFilters();
	const relevantFilterId = useNextFilterId ? nextFilterId : filterId;
	const relevantFilter = filters.find((f) => f.id === relevantFilterId);
	console.log("relevantFilter", relevantFilter);
	const handleValueSelected = (value: ComboboxOption) => {
		// Is there already a filter for this value?
		if (relevantFilter) {
			const prevValues = relevantFilter.values;
			const newValues = prevValues.includes(value)
				? prevValues.filter((v) => v !== value)
				: [...prevValues, value];
			updateFilterValues(relevantFilter.id, newValues);
		} else {
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
				id: nextFilterId,
				categoryId: categoryId,
				selectionType: filterOption.selectionType,
				propertyNameSingular: filterOption.propertyNameSingular,
				propertyNamePlural: filterOption.propertyNamePlural,
				options: filterOption.options,
				values: [value],
			};
			addFilter(newFilter);
		}
	};
	return (
		<div className="pl-2">
			<div className="flex flex-col bg-white shadow-md border border-gray-300 p-1 rounded">
				{getOptionsForFilterCategory(categoryId).map((option) => (
					<button
						type="button"
						key={option.id}
						value={option.label}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleValueSelected(option);
						}}
						className="cursor-default hover:bg-accent rounded"
					>
						<div className="flex items-center gap-2 px-2 py-1">
							<Checkbox
								id={option.id}
								checked={relevantFilter?.values?.some(
									(o) => o.id === option.id,
								)}
								className="cursor-default"
							/>
							<label className="select-none" htmlFor={option.id}>
								{option.label}
							</label>
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
