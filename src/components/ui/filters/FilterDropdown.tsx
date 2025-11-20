import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ListFilter } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import FilterDropdownCategory from "@/components/ui/filters/FilterDropdownCategory";
import { Input } from "@/components/ui/input";
import { type ComboboxOption, RELATIONSHIP_TYPES } from "@/hooks/constants";
import useFilters from "@/hooks/useFilters";
import type { UseStateSetter } from "@/utils";
import AppliedFilters from "./AppliedFilters";

type SubItem = {
	text: string;
};

const SUB_ITEMS: SubItem[] = [
	{ text: "More Tools" },
	{ text: "Save Page As…" },
	{ text: "Create Shortcut…" },
	{ text: "Name Window…" },
];

const FilterDropdown = (props: {
	lastOpen: number;
	setLastOpen: UseStateSetter<number>;
}) => {
	const firstSubTriggerRef = React.useRef<HTMLDivElement>(null);
	const lastSubTriggerRef = React.useRef<HTMLDivElement>(null);
	const [searchText, setSearchText] = React.useState("");

	const { filterCategories } = useFilters();
	const formattedFilterCategories: ComboboxOption[] = filterCategories.map(
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

	const focusSearchInput = () => {
		const searchInput = document.getElementById("search-input");
		if (searchInput) {
			console.log("focusing search input");
			searchInput.focus();
		}
	};

	const subItemsToRender = formattedFilterCategories.filter((filterCategory) =>
		filterCategory.label.toLowerCase().includes(searchText.toLowerCase()),
	);

	return (
		<DropdownMenu.Root
			onOpenChange={() => {
				props.setLastOpen(Date.now());
			}}
		>
			<div
				id="new-filters-popover-anchor"
				className="relative flex gap-2 items-center"
			>
				<DropdownMenu.Trigger asChild>
					<div className="flex gap-2 items-center">
						<AppliedFilters after={props.lastOpen} />
						<div>
							<Button
								variant="ghost"
								className="group cursor-default data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
							>
								<ListFilter className="w-4 h-4 group-hover:text-accent-foreground text-muted-foreground group-data-[state=open]:text-accent-foreground" />{" "}
								Filter
							</Button>
						</div>
					</div>
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="start"
						className="border border-gray-300 w-[260px] rounded bg-white shadow-md data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=top]:animate-slideDownAndFade"
						sideOffset={5}
					>
						<Input
							id="search-input"
							onKeyDown={(keyDownEvent) => {
								if (keyDownEvent.key === "ArrowDown") {
									keyDownEvent.preventDefault();
									firstSubTriggerRef.current?.focus();
								} else if (keyDownEvent.key === "ArrowUp") {
									keyDownEvent.preventDefault();
									lastSubTriggerRef.current?.focus();
								}
								keyDownEvent.stopPropagation();
							}}
							onChange={(e) => setSearchText(e.target.value)}
							value={searchText}
							placeholder="Search..."
							className="border-l-0 focus-visible:ring-offset-0 ring-offset-0 focus-visible:ring-0 border-r-0 border-t-0 rounded-none focus-visible:ring-0 flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
						/>
						{subItemsToRender.map((subItem, index) => (
							<FilterDropdownCategory
								after={props.lastOpen}
								key={subItem.value}
								category={subItem}
								triggerText={subItem.label}
								onKeyDown={
									index === 0
										? (e) => {
												if (e.key === "ArrowUp") {
													focusSearchInput();
												}
											}
										: index === SUB_ITEMS.length - 1
											? (e) => {
													if (e.key === "ArrowDown") {
														focusSearchInput();
													}
												}
											: undefined
								}
								ref={
									index === 0
										? firstSubTriggerRef
										: index === SUB_ITEMS.length - 1
											? lastSubTriggerRef
											: undefined
								}
							/>
						))}
						{subItemsToRender.length === 0 ? (
							<div className="p-4 text-sm text-muted-foreground grid place-items-center">
								No results found.
							</div>
						) : null}
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</div>
		</DropdownMenu.Root>
	);
};

export default FilterDropdown;
