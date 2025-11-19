import * as HoverCard from "@radix-ui/react-hover-card";
import { TriangleRightIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { ListFilter } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import AppliedFilter from "./components/ui/filters/AppliedFilter";
import AppliedFilters from "./components/ui/filters/AppliedFilters";
import type { ComboboxOption } from "./hooks/constants";
import { MATCH_TYPES, RELATIONSHIP_TYPES } from "./hooks/constants";
import { FILTER_CATEGORIES } from "./hooks/filter-options-mock-data";
// import { FILTER_CATEGORIES } from "./hooks/filter-options-mock-data";

export default function Filters() {
	console.log("Filters was rendered");
	const { filterCategories, setFilterCategories } = useFilters();

	// NOTE: This `useEffect` is populating the filter categories, which usually would involve fetching data from the
	//       server.
	//
	//       Also, a future improvement for the `useFilters` hook could be to take in a data-fetching function and do
	//       the data-fetching on behalf of the user, using something like react-query
	//       under the hood. (see `useFilter.tsx` for more notes on future improvements)
	useEffect(() => {
		if (filterCategories.length > 0) return;
		setFilterCategories(FILTER_CATEGORIES);
	});

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
					className="border border-gray-300 w-[260px] rounded bg-white shadow-md data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=top]:animate-slideDownAndFade"
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
	const [open, setOpen] = useState(false);
	const [focusFirstElement, setFocusFirstElement] = useState(false);
	const internalRef = useRef<HTMLDivElement | null>(null);
	const observerRef = useRef<MutationObserver | null>(null);
	const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Set up MutationObserver to watch for aria-selected changes
	useEffect(() => {
		const element = internalRef.current;
		if (!element) return;

		observerRef.current = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (
					mutation.type !== "attributes" ||
					mutation.attributeName !== "aria-selected"
				) {
					return;
				}
				const newValue = element.getAttribute("aria-selected");
				if (newValue === "true") {
					// Clear any existing timeout
					if (openTimeoutRef.current) {
						clearTimeout(openTimeoutRef.current);
					}
					// Set open to true after delay (e.g., 300ms)
					openTimeoutRef.current = setTimeout(() => {
						setOpen(true);
					}, 300);
				} else {
					// Clear any pending timeout for opening
					if (openTimeoutRef.current) {
						clearTimeout(openTimeoutRef.current);
						openTimeoutRef.current = null;
					}
					// Set open to false immediately
					setOpen(false);
				}
				console.log(
					"[aria-selected] changed to",
					newValue,
					"for",
					category.label,
				);
				// You can add your custom logic here
			});
		});

		observerRef.current.observe(element, {
			attributes: true,
			attributeFilter: ["aria-selected"],
		});

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
			if (openTimeoutRef.current) {
				clearTimeout(openTimeoutRef.current);
			}
		};
	}, [category.label]);

	// Combine forwarded ref with internal ref
	const setRefs = useCallback((node: HTMLDivElement | null) => {
		internalRef.current = node;
	}, []);

	return (
		<HoverCard.Root open={open} openDelay={0} closeDelay={0}>
			<HoverCard.Trigger asChild>
				<CommandItem
					ref={setRefs}
					value={category.label}
					className="flex justify-between group items-center w-full"
					onFocus={() => {
						console.log("[focus] focus gained by", category.label);
					}}
					onSelect={() => {
						console.log("[select] select gained by", category.label);
					}}
					onKeyDown={(e) => {
						if (e.key === "ArrowRight") {
							e.preventDefault();
							e.stopPropagation();
							setOpen(true);
							setFocusFirstElement(true);
						}
					}}
				>
					<span className="truncate">{category.label}</span>
					<TriangleRightIcon className="text-muted-foreground group-hover:text-accent-foreground" />
				</CommandItem>
			</HoverCard.Trigger>
			<HoverCard.Portal>
				<HoverCard.Content side="right" sideOffset={-6} className="">
					<HoverCardContent
						focusFirstElement={focusFirstElement}
						categoryId={category.id}
						useNextFilterId={true}
					/>
				</HoverCard.Content>
			</HoverCard.Portal>
		</HoverCard.Root>
	);
}

// TODO: Refactor this to make it more DRY
type HoverCardContentProps =
	| {
			categoryId: string;
			filterId: string;
			useNextFilterId: false;
			focusFirstElement: boolean;
			// handleValueSelected: (value: ComboboxOption) => void;
	  }
	| {
			categoryId: string;
			filterId?: undefined;
			useNextFilterId: true;
			focusFirstElement: boolean;
			// handleValueSelected: (value: ComboboxOption) => void;
	  };

type FilterOptionItemProps = {
	option: ComboboxOption;
	isSelected: boolean;
	onSelect: (option: ComboboxOption) => void;
	shouldAutoFocus?: boolean;
};

function FilterOptionItem({
	option,
	isSelected,
	onSelect,
	shouldAutoFocus = false,
}: FilterOptionItemProps) {
	const itemRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (shouldAutoFocus && itemRef.current) {
			itemRef.current.focus();
		}
	}, [shouldAutoFocus]);

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onSelect(option);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			e.stopPropagation();
			onSelect(option);
		}
	};

	return (
		<li>
			<button
				ref={itemRef}
				type="button"
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				className="cursor-default hover:bg-accent rounded w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				aria-label={`${option.label}, ${isSelected ? "selected" : "not selected"}`}
			>
				<div className="flex items-center gap-2 px-2 py-1">
					<Checkbox
						id={option.id}
						checked={isSelected}
						className="cursor-default pointer-events-none"
						aria-hidden="true"
					/>
					<span className="select-none flex-1">{option.label}</span>
				</div>
			</button>
		</li>
	);
}

export function HoverCardContent({
	categoryId,
	filterId,
	useNextFilterId,
	focusFirstElement,
	// handleValueSelected,
}: HoverCardContentProps) {
	const {
		addFilter,
		filterCategories,
		getFilter,
		getOptionsForFilterCategory,
		nextFilterId,
		updateFilterValues,
	} = useFilters();
	const relevantFilterId = useNextFilterId ? nextFilterId : filterId;
	const relevantFilter = getFilter(relevantFilterId);
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
	const options = getOptionsForFilterCategory(categoryId);
	return (
		<div className="pl-2">
			<fieldset className="flex flex-col bg-white shadow-md border border-gray-300 p-1 rounded m-0 border-0">
				<legend className="sr-only">Filter options</legend>
				<ul className="flex flex-col list-none m-0 p-0">
					{options.map((option, index) => {
						const isSelected =
							relevantFilter?.values?.some((o) => o.id === option.id) ?? false;
						return (
							<FilterOptionItem
								key={option.id}
								option={option}
								isSelected={isSelected}
								onSelect={handleValueSelected}
								shouldAutoFocus={index === 0 && focusFirstElement}
							/>
						);
					})}
				</ul>
			</fieldset>
		</div>
	);
}
