import * as Toolbar from "@radix-ui/react-toolbar";
import { Search } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useFilters } from "@/App";
import AppliedFilter from "@/components/ui/filters/AppliedFilter";
import { SELECTION_TYPES } from "@/hooks/useFilters/constants";
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import { DraftTextFilter } from "./DraftTextFilter";
import type { ChipFilterInputProps, TAutocompleteSuggestion } from "./types";
import {
	findComboboxOptionByValue,
	findFilterOptionByKey,
	getAutocompleteSuggestions,
	type ParsedFilterEntry,
	parseFilterText,
	wouldSpaceBeValidPrefix,
} from "./utils";

/** Represents a draft text filter being created (not yet committed to context) */
export interface DraftTextFilterState {
	id: string;
	categoryId: string;
	propertyNameSingular: string;
	textValue: string;
	operator: "contains" | "does not contain";
}

export const ChipFilterInput: React.FC<ChipFilterInputProps> = ({
	placeholder = "Filter by typing key:value...",
	className = "",
	"data-id": dataId,
}) => {
	const { addFilter, filterCategories, filters, removeFilter } = useFilters();
	const [inputValue, setInputValue] = useState("");
	const [showAutocomplete, setShowAutocomplete] = useState(false);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
	const [autocompletePosition, setAutocompletePosition] = useState({
		top: 0,
		left: 0,
	});
	const [isInputFocused, setIsInputFocused] = useState(false);
	// Track pending selections for multi-select filters (before Enter is pressed)
	const [pendingSelections, setPendingSelections] = useState<Set<string>>(
		new Set(),
	);
	// Track the current category being filtered for multi-select context
	const [currentMultiSelectCategoryId, setCurrentMultiSelectCategoryId] =
		useState<string | null>(null);
	// Track draft text filter being created (not yet committed)
	const [draftTextFilter, setDraftTextFilter] =
		useState<DraftTextFilterState | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	// Track whether position has been captured for the current typing session
	const positionCapturedRef = useRef(false);
	// Track refs to X (remove) buttons for focus management
	const removeButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

	// Sort filters by createdAt for consistent ordering
	const sortedFilters = useMemo(
		() => [...filters].sort((a, b) => a.createdAt - b.createdAt),
		[filters],
	);

	// Get autocomplete suggestions using filterCategories directly
	const suggestions = getAutocompleteSuggestions(inputValue, filterCategories);

	useEffect(() => {
		// Show autocomplete when input is focused and has suggestions
		setShowAutocomplete(isInputFocused && suggestions.length > 0);
		setSelectedSuggestionIndex(0);
	}, [suggestions.length, isInputFocused]);

	// Reset position capture flag when filters change (input element moves due to chip add/remove)
	// biome-ignore lint/correctness/useExhaustiveDependencies: filters.length triggers reset when filters are added/removed
	useEffect(() => {
		positionCapturedRef.current = false;
	}, [filters.length]);

	// Capture dropdown position when autocomplete shows and we haven't captured for this session
	// biome-ignore lint/correctness/useExhaustiveDependencies: filters.length triggers recapture when input position changes
	useEffect(() => {
		if (showAutocomplete && !positionCapturedRef.current) {
			if (containerRef.current && inputRef.current) {
				const containerRect = containerRef.current.getBoundingClientRect();
				const inputRect = inputRef.current.getBoundingClientRect();
				setAutocompletePosition({
					top: inputRect.bottom - containerRect.top,
					left: inputRect.left - containerRect.left,
				});
			}
			positionCapturedRef.current = true;
		}
	}, [showAutocomplete, filters.length]);

	// Reset selected index when dropdown closes
	useEffect(() => {
		if (!showAutocomplete) {
			setSelectedSuggestionIndex(0);
		}
	}, [showAutocomplete]);

	// Clear pending selections when input changes to a different category or clears
	useEffect(() => {
		if (!inputValue.includes(":")) {
			// No category selected, clear multi-select state
			if (pendingSelections.size > 0) {
				setPendingSelections(new Set());
			}
			if (currentMultiSelectCategoryId !== null) {
				setCurrentMultiSelectCategoryId(null);
			}
		}
	}, [inputValue, pendingSelections.size, currentMultiSelectCategoryId]);

	/**
	 * Creates a new distinct filter with the given value.
	 * Always creates a new filter - never merges with existing filters for the same category.
	 * This allows users to create multiple independent filters for the same category
	 * (e.g., status IS "Open" AND status IS NOT "Closed").
	 */
	const createNewFilter = useCallback(
		(
			categoryId: string,
			comboboxOption: { id: string; label: string; value: string },
		) => {
			const filterOption = filterCategories.find((c) => c.id === categoryId);
			if (!filterOption) {
				return;
			}

			// Always create a new distinct filter
			const newFilter = {
				id: uuidv4(),
				categoryId: filterOption.id,
				selectionType: filterOption.selectionType,
				propertyNameSingular: filterOption.propertyNameSingular,
				propertyNamePlural: filterOption.propertyNamePlural,
				options: filterOption.options,
				values: [comboboxOption],
			};
			addFilter(newFilter);
		},
		[filterCategories, addFilter],
	);

	/**
	 * Commits all pending selections for a multi-select filter.
	 * Creates a SINGLE new filter with all selected values.
	 * Does NOT merge with existing filters - each multi-select session creates a distinct filter.
	 *
	 * @param highlightedSuggestion - Optional suggestion that was highlighted when Enter was pressed.
	 *                                If provided and not already in pending selections, it will be included.
	 */
	const commitPendingSelections = useCallback(
		(highlightedSuggestion?: TAutocompleteSuggestion) => {
			if (pendingSelections.size === 0 || !currentMultiSelectCategoryId) {
				return;
			}

			const category = filterCategories.find(
				(c) => c.id === currentMultiSelectCategoryId,
			);
			if (!category) {
				return;
			}

			// Collect all selected options into a single array
			const selectedOptions: { id: string; label: string; value: string }[] =
				[];
			for (const optionId of pendingSelections) {
				const option = category.options.find((o) => o.id === optionId);
				if (option) {
					selectedOptions.push(option);
				}
			}

			// Also include the highlighted suggestion if provided and not already in pending selections
			if (
				highlightedSuggestion?.optionId &&
				highlightedSuggestion.categoryId === currentMultiSelectCategoryId &&
				!pendingSelections.has(highlightedSuggestion.optionId)
			) {
				const option = category.options.find(
					(o) => o.id === highlightedSuggestion.optionId,
				);
				if (option) {
					selectedOptions.push(option);
				}
			}

			if (selectedOptions.length === 0) {
				return;
			}

			// Create a SINGLE new filter with ALL selected values
			// This is intentionally independent of any existing filters for the same category
			const newFilter = {
				id: uuidv4(),
				categoryId: category.id,
				selectionType: category.selectionType,
				propertyNameSingular: category.propertyNameSingular,
				propertyNamePlural: category.propertyNamePlural,
				options: category.options,
				values: selectedOptions,
			};
			addFilter(newFilter);

			// Clear state
			setPendingSelections(new Set());
			setCurrentMultiSelectCategoryId(null);
			setInputValue("");
			setShowAutocomplete(false);
		},
		[
			pendingSelections,
			currentMultiSelectCategoryId,
			filterCategories,
			addFilter,
		],
	);

	/**
	 * Toggles selection of an option for multi-select filters.
	 */
	const handleToggleSelection = useCallback(
		(suggestion: TAutocompleteSuggestion) => {
			const { optionId, categoryId } = suggestion;
			if (!optionId || !categoryId) {
				return;
			}

			setPendingSelections((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(optionId)) {
					newSet.delete(optionId);
				} else {
					newSet.add(optionId);
				}
				return newSet;
			});

			// Track which category we're selecting from
			if (currentMultiSelectCategoryId !== categoryId) {
				setCurrentMultiSelectCategoryId(categoryId);
			}
		},
		[currentMultiSelectCategoryId],
	);

	/**
	 * Creates a ref callback for a filter's remove button.
	 * Registers/unregisters the button ref in the map for focus management.
	 */
	const createRemoveButtonRef = useCallback(
		(filterId: string) => (el: HTMLButtonElement | null) => {
			if (el) {
				removeButtonRefs.current.set(filterId, el);
			} else {
				removeButtonRefs.current.delete(filterId);
			}
		},
		[],
	);

	/**
	 * Handles filter removal with focus management.
	 * After removing a filter, focuses the previous filter's X button or the input.
	 */
	const handleFilterRemove = useCallback(
		(filterId: string) => {
			// Find the index of the filter being removed
			const filterIndex = sortedFilters.findIndex((f) => f.id === filterId);

			// Determine what to focus after removal
			let elementToFocus: HTMLElement | null = null;

			if (filterIndex > 0) {
				// Focus the previous filter's X button
				const previousFilter = sortedFilters[filterIndex - 1];
				elementToFocus =
					removeButtonRefs.current.get(previousFilter.id) ?? null;
			} else {
				// No previous filter, focus the input
				elementToFocus = inputRef.current;
			}

			// Remove the filter
			removeFilter(filterId);

			// Focus the appropriate element after removal
			// Using setTimeout(0) to ensure React has finished its state updates
			// This works better than requestAnimationFrame in test environments
			setTimeout(() => {
				elementToFocus?.focus();
			}, 0);
		},
		[sortedFilters, removeFilter],
	);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleInputFocus = () => {
		setIsInputFocused(true);
	};

	const handleInputBlur = () => {
		// Commit any pending selections before closing
		if (pendingSelections.size > 0) {
			commitPendingSelections();
		}
		setIsInputFocused(false);
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Autocomplete navigation
		if (showAutocomplete && suggestions.length > 0) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedSuggestionIndex((prev) =>
					prev < suggestions.length - 1 ? prev + 1 : 0,
				);
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedSuggestionIndex((prev) =>
					prev > 0 ? prev - 1 : suggestions.length - 1,
				);
				return;
			}
			if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
				e.preventDefault();
				// If we have pending selections (multi-select mode), commit them
				// Include the currently highlighted option as well
				if (pendingSelections.size > 0) {
					commitPendingSelections(suggestions[selectedSuggestionIndex]);
					return;
				}
				handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				// Clear pending selections on escape
				setPendingSelections(new Set());
				setCurrentMultiSelectCategoryId(null);
				setShowAutocomplete(false);
				return;
			}
		}
		// Handle space key intelligently:
		// - If typing a value and space would be a valid prefix, let the space be typed
		// - Otherwise, toggle selection for multi-select (available for all column types)
		// - For key suggestions, select them immediately
		if (e.key === " ") {
			const highlightedSuggestion = suggestions[selectedSuggestionIndex];

			// If input has content after the colon, check if space would be a valid prefix
			// This allows typing values with spaces like "Not Started"
			if (
				inputValue.trim() &&
				wouldSpaceBeValidPrefix(inputValue, filterCategories)
			) {
				// Let the space be typed normally
				return;
			}

			// For key suggestions, select them immediately (no multi-select for keys)
			if (highlightedSuggestion?.type === "key") {
				e.preventDefault();
				handleSuggestionSelect(highlightedSuggestion);
				return;
			}

			// Multi-select is available for all value suggestions (both radio and checkbox column types)
			// Space toggles selection, Enter commits
			if (highlightedSuggestion?.type === "value") {
				e.preventDefault();
				handleToggleSelection(highlightedSuggestion);
				return;
			}
		}

		// Create chip on Enter (for manual typing)
		if (e.key === "Enter" && inputValue.trim()) {
			// If we have pending selections (multi-select mode), commit them
			if (pendingSelections.size > 0) {
				e.preventDefault();
				commitPendingSelections();
				return;
			}
			const { entries } = parseFilterText(inputValue);
			if (entries.length > 0) {
				e.preventDefault();
				handleCreateChipsFromText(entries);
				setInputValue("");
				setShowAutocomplete(false);
				return;
			}
		}
		// Backspace with empty input focuses the last filter's X button
		if (
			e.key === "Backspace" &&
			inputValue === "" &&
			sortedFilters.length > 0
		) {
			e.preventDefault();
			// Focus the X button of the most recent filter
			const lastFilter = sortedFilters[sortedFilters.length - 1];
			const removeButton = removeButtonRefs.current.get(lastFilter.id);
			removeButton?.focus();
			return;
		}
	};

	/**
	 * Creates filters from manually typed text entries.
	 * Uses string matching to find the corresponding filter options.
	 */
	const handleCreateChipsFromText = (entries: ParsedFilterEntry[]) => {
		for (const entry of entries) {
			const filterOption = findFilterOptionByKey(filterCategories, entry.key);
			if (!filterOption) {
				continue;
			}

			const comboboxOption = findComboboxOptionByValue(
				filterOption.options,
				entry.value,
			);
			if (!comboboxOption) {
				continue;
			}

			createNewFilter(filterOption.id, comboboxOption);
		}
	};

	/**
	 * Handles autocomplete suggestion selection.
	 * For value suggestions, uses IDs directly instead of parsing.
	 * For text columns, creates a draft filter immediately.
	 */
	const handleSuggestionSelect = (suggestion: TAutocompleteSuggestion) => {
		if (suggestion.type === "key") {
			// For text columns, create a draft filter immediately
			if (suggestion.selectionType === "text" && suggestion.categoryId) {
				createDraftTextFilter(suggestion.categoryId);
				return;
			}
			// Key selected - update input to show key: and keep dropdown open for values
			setInputValue(suggestion.text);
			// Don't hide autocomplete - let useEffect show value suggestions
		} else {
			// Value selected - use IDs directly if available
			if (suggestion.categoryId && suggestion.optionId) {
				// Find the full combobox option by ID
				const category = filterCategories.find(
					(c) => c.id === suggestion.categoryId,
				);
				const option = category?.options.find(
					(o) => o.id === suggestion.optionId,
				);

				if (option && category) {
					// For filters with pending selections, include all pending + clicked option
					// Multi-select is available for all column types (both radio and checkbox)
					if (pendingSelections.size > 0) {
						// Collect all pending options plus the clicked one
						const allOptionIds = new Set(pendingSelections);
						allOptionIds.add(suggestion.optionId);

						const allOptions: { id: string; label: string; value: string }[] =
							[];
						for (const optionId of allOptionIds) {
							const opt = category.options.find((o) => o.id === optionId);
							if (opt) {
								allOptions.push(opt);
							}
						}

						// Create a single filter with all values
						const newFilter = {
							id: uuidv4(),
							categoryId: category.id,
							selectionType: category.selectionType,
							propertyNameSingular: category.propertyNameSingular,
							propertyNamePlural: category.propertyNamePlural,
							options: category.options,
							values: allOptions,
						};
						addFilter(newFilter);

						// Clear state
						setPendingSelections(new Set());
						setCurrentMultiSelectCategoryId(null);
					} else {
						createNewFilter(suggestion.categoryId, option);
					}
					setInputValue("");
				}
			} else {
				// Fallback to text parsing if IDs aren't available
				const keyMatch = inputValue.match(/(\w+):(.*)$/);
				if (keyMatch) {
					const [, key] = keyMatch;
					// Use quotes for values with spaces
					const valueText = suggestion.text.includes(" ")
						? `"${suggestion.text}"`
						: suggestion.text;
					const completedFilter = `${key}:${valueText}`;
					const { entries } = parseFilterText(completedFilter);
					if (entries.length > 0) {
						handleCreateChipsFromText(entries);
						setInputValue("");
					}
				}
			}
			// Don't hide autocomplete - let the useEffect manage visibility
			// based on isInputFocused and suggestions.length
		}
		inputRef.current?.focus();
	};

	const handleContainerClick = (e: React.MouseEvent) => {
		// Only focus input if clicking on the container itself, not on chips
		if (e.target === e.currentTarget) {
			inputRef.current?.focus();
		}
	};

	/**
	 * Creates a draft text filter when a text column is selected.
	 * The draft is displayed as a chip with an inline editable input.
	 */
	const createDraftTextFilter = useCallback(
		(categoryId: string) => {
			const category = filterCategories.find((c) => c.id === categoryId);
			if (!category || category.selectionType !== SELECTION_TYPES.TEXT) {
				return;
			}

			setDraftTextFilter({
				id: uuidv4(),
				categoryId: category.id,
				propertyNameSingular: String(category.propertyNameSingular),
				textValue: "",
				operator: "contains",
			});
			setInputValue("");
			setShowAutocomplete(false);
		},
		[filterCategories],
	);

	/**
	 * Commits the draft text filter to the context.
	 * Called when user presses Enter or blurs the draft input.
	 */
	const commitDraftTextFilter = useCallback(() => {
		if (!draftTextFilter) return;

		const category = filterCategories.find(
			(c) => c.id === draftTextFilter.categoryId,
		);
		if (!category) return;

		// Only commit if there's actual text content
		if (draftTextFilter.textValue.trim()) {
			addFilter({
				id: draftTextFilter.id,
				categoryId: category.id,
				selectionType: SELECTION_TYPES.TEXT,
				propertyNameSingular: draftTextFilter.propertyNameSingular,
				propertyNamePlural: category.propertyNamePlural,
				options: [],
				values: [],
				textValue: draftTextFilter.textValue.trim(),
				relationship: draftTextFilter.operator,
			});
		}

		setDraftTextFilter(null);
		// Focus the main input after committing
		inputRef.current?.focus();
	}, [draftTextFilter, filterCategories, addFilter]);

	/**
	 * Cancels the draft text filter without committing.
	 */
	const cancelDraftTextFilter = useCallback(() => {
		setDraftTextFilter(null);
		inputRef.current?.focus();
	}, []);

	/**
	 * Updates the text value of the draft text filter.
	 */
	const updateDraftTextValue = useCallback((value: string) => {
		setDraftTextFilter((prev) => (prev ? { ...prev, textValue: value } : null));
	}, []);

	/**
	 * Updates the operator of the draft text filter.
	 */
	const updateDraftOperator = useCallback(
		(operator: "contains" | "does not contain") => {
			setDraftTextFilter((prev) => (prev ? { ...prev, operator } : null));
		},
		[],
	);

	return (
		<div
			ref={containerRef}
			className={`relative ${className}`}
			data-id={dataId}
		>
			<button
				type="button"
				id="chip-filter-container"
				onClick={handleContainerClick}
				className="flex items-center flex-wrap w-full gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20 transition-all cursor-text min-h-[42px]"
			>
				<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />

				{sortedFilters.length > 0 || draftTextFilter ? (
					<Toolbar.Root aria-label="Applied filters" className="contents">
						{sortedFilters.map((filter, index) => (
							<AppliedFilter
								key={filter.id}
								filter={filter}
								removeButtonRef={createRemoveButtonRef(filter.id)}
								onRemove={() => handleFilterRemove(filter.id)}
								onRemoveButtonRightArrow={
									index === sortedFilters.length - 1
										? () => inputRef.current?.focus()
										: undefined
								}
								preventOperatorLeftWrap={index === 0}
							/>
						))}
						{draftTextFilter ? (
							<DraftTextFilter
								draft={draftTextFilter}
								onCommit={commitDraftTextFilter}
								onCancel={cancelDraftTextFilter}
								onTextChange={updateDraftTextValue}
								onOperatorChange={updateDraftOperator}
							/>
						) : null}
					</Toolbar.Root>
				) : null}

				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleInputKeyDown}
					onFocus={handleInputFocus}
					onBlur={handleInputBlur}
					placeholder={sortedFilters.length === 0 ? placeholder : ""}
					className="flex-1 min-w-[120px] outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent dark:bg-transparent"
					role="combobox"
					aria-label="Filter input"
					aria-autocomplete="list"
					aria-controls="autocomplete-dropdown"
					aria-expanded={showAutocomplete}
				/>
			</button>

			<AutocompleteDropdown
				suggestions={suggestions}
				selectedIndex={selectedSuggestionIndex}
				onSelect={handleSuggestionSelect}
				onToggleSelection={handleToggleSelection}
				pendingSelections={pendingSelections}
				position={autocompletePosition}
				visible={showAutocomplete}
			/>
		</div>
	);
};
