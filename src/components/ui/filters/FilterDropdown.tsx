import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Toolbar from "@radix-ui/react-toolbar";
import { ListFilter } from "lucide-react";
import {
	type KeyboardEvent,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { twMerge } from "tailwind-merge";
import { useFilters } from "@/App.tsx";
import { Button } from "@/components/ui/button";
import FilterDropdownCategory from "@/components/ui/filters/FilterDropdownCategory";
import { Input } from "@/components/ui/input";
import { SELECTION_TYPES } from "@/hooks/useFilters/constants";
import type { ComboboxOption } from "@/hooks/useFilters/types";
import useNewFilterCreatedAtCutoff from "@/hooks/useNewFilterCreatedAtCutoff";
import type { UseStateSetter } from "@/utils";

const FilterDropdown = ({
	dropdownMenuOpen,
	setDropdownMenuOpen,
	renderTrigger,
	filterButtonRef: externalButtonRef,
}: {
	dropdownMenuOpen: boolean;
	setDropdownMenuOpen: UseStateSetter<boolean>;
	renderTrigger: () => ReactNode;
	filterButtonRef?: RefObject<HTMLButtonElement | null>;
}) => {
	const { newFilterCreatedAtCutoff } = useNewFilterCreatedAtCutoff();
	const { filters } = useFilters();
	const internalButtonRef = useRef<HTMLButtonElement>(null);
	const buttonRef = externalButtonRef ?? internalButtonRef;
	const firstSubTriggerRef = useRef<HTMLDivElement>(null);
	const lastSubTriggerRef = useRef<HTMLDivElement>(null);
	const [searchText, setSearchText] = useState("");

	const { filterCategories } = useFilters();
	const formattedFilterCategories: ComboboxOption[] = useMemo(
		() =>
			filterCategories.map((f) => {
				const name =
					f.selectionType === SELECTION_TYPES.RADIO
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
			}),
		[filterCategories],
	);

	const focusSearchInput = useCallback(() => {
		const searchInput = document.getElementById("search-input");
		if (searchInput) {
			searchInput.focus();
		}
	}, []);

	// Focus the search input when the dropdown opens
	useEffect(() => {
		if (dropdownMenuOpen) {
			// Small delay to ensure the dropdown content is rendered
			requestAnimationFrame(() => {
				focusSearchInput();
			});
		} else {
			setSearchText("");
		}
	}, [dropdownMenuOpen, focusSearchInput]);

	const subItemsToRender = useMemo(
		() =>
			formattedFilterCategories.filter((filterCategory) =>
				filterCategory.label.toLowerCase().includes(searchText.toLowerCase()),
			),
		[formattedFilterCategories, searchText],
	);

	// render the trigger if there are no "under-construction" filters
	const shouldRenderTrigger = filters.every(
		(filter) => filter.createdAt < newFilterCreatedAtCutoff,
	);

	const firstCategoryOnKeyDown = useCallback(
		(e: KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "ArrowUp") {
				focusSearchInput();
			}
		},
		[focusSearchInput],
	);

	const lastCategoryOnKeyDown = useCallback(
		(e: KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "ArrowDown") {
				focusSearchInput();
			}
		},
		[focusSearchInput],
	);

	return (
		<>
			<Toolbar.Button asChild>
				<Button
					ref={buttonRef as React.RefObject<HTMLButtonElement>}
					onClick={() => setDropdownMenuOpen((prev) => !prev)}
					aria-haspopup="menu"
					aria-expanded={dropdownMenuOpen}
					variant="ghost"
					className={twMerge(
						"group cursor-default data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
						dropdownMenuOpen ? "relative bg-accent text-accent-foreground" : "",
					)}
				>
					{shouldRenderTrigger ? renderTrigger() : null}
					<ListFilter className="w-4 h-4 group-hover:text-accent-foreground text-muted-foreground group-data-[state=open]:text-accent-foreground" />{" "}
					Filter
				</Button>
			</Toolbar.Button>
			<DropdownMenu.Content
				align="start"
				className="border border-gray-300 w-[260px] rounded bg-white shadow-md data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=top]:animate-slideDownAndFade"
				sideOffset={25}
				alignOffset={0}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					buttonRef.current?.focus();
				}}
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
					className="border-l-0 focus-visible:ring-offset-0 ring-offset-0 border-r-0 border-t-0 rounded-none focus-visible:ring-0 flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
				/>
				{subItemsToRender.map((subItem, index) => (
					<FilterDropdownCategory
						after={newFilterCreatedAtCutoff}
						key={subItem.id}
						category={subItem}
						triggerText={subItem.label}
						onKeyDown={
							index === 0
								? firstCategoryOnKeyDown
								: index === subItemsToRender.length - 1
									? lastCategoryOnKeyDown
									: undefined
						}
						ref={
							index === 0
								? firstSubTriggerRef
								: index === subItemsToRender.length - 1
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
		</>
	);
};

export default FilterDropdown;
